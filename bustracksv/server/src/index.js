// CRITICAL: Load environment variables FIRST, before any other imports
import "dotenv/config";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file explicitly from server directory
dotenv.config({ path: join(__dirname, "..", ".env") });

// Verify GOOGLE_MAPS_API_KEY is loaded (for debugging)
if (!process.env.GOOGLE_MAPS_API_KEY) {
  console.warn("⚠️ WARNING: GOOGLE_MAPS_API_KEY not found in environment variables.");
  console.warn("   Make sure you have a .env file in the server/ directory with:");
  console.warn("   GOOGLE_MAPS_API_KEY=your_key_here");
} else {
  console.log("✅ GOOGLE_MAPS_API_KEY loaded successfully");
}

import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Detectar si usar cloud o local (prioridad: DATABASE_URL > DB_HOST > local)
const useCloud = !!(process.env.DATABASE_URL || process.env.DB_HOST);

// Importar base de datos según el modo (PostgreSQL para cloud, SQLite para local)
let pool, testConnection, ensureIndexes = null;

if (useCloud) {
  // Modo Cloud: Usar PostgreSQL
  const dbCloud = await import("./db-cloud.js");
  pool = dbCloud.pool;
  testConnection = dbCloud.testConnection;
  ensureIndexes = dbCloud.ensureIndexes;
  const ensureSchema = dbCloud.ensureSchema;
  console.log('☁️ Modo Cloud: Usando PostgreSQL');
  
  // Asegurar que el esquema existe
  if (ensureSchema) {
    await ensureSchema();
  }
} else {
  // Modo Local: Usar SQLite
  const dbLocal = await import("./db.js");
  pool = dbLocal.pool;
  testConnection = dbLocal.testConnection;
  console.log('💾 Modo Local: Usando SQLite');
}

import { Client } from "@googlemaps/google-maps-services-js";
import RouteFinderService from "./services/RouteFinderService.js";
import RouteGenerationService from "./services/RouteGenerationService.js";
import GraphRouteService from "./services/GraphRouteService.js";

// Importar middleware de seguridad (opcional, funciona sin él)
let securityMiddleware = null;
let redisCache = null;

// Cargar middleware de seguridad de forma asíncrona (no bloquea)
import("./middleware/security.js").then(security => {
  securityMiddleware = security;
}).catch(() => {
  // Middleware no disponible, usar configuración básica
});

// Intentar cargar Redis (opcional, no bloquea)
import("./cache/redis.js").then(redis => {
  redisCache = redis;
  // Inicializar Redis de forma asíncrona
  redis.initRedis().catch(() => {
    // Redis no disponible, continuar sin él
  });
}).catch(() => {
  // Redis no disponible, continuar sin caché
});

// Para Node.js < 18, usar node-fetch si es necesario
let fetch;
if (typeof globalThis.fetch !== 'undefined') {
  fetch = globalThis.fetch;
} else {
  try {
    fetch = require('node-fetch');
  } catch (e) {
    // Si node-fetch no está disponible, usar una alternativa básica
    const https = require('https');
    const http = require('http');
    fetch = async (url, options) => {
      return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        const req = lib.get(url, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve({
                json: () => Promise.resolve(JSON.parse(data)),
                ok: res.statusCode >= 200 && res.statusCode < 300
              });
            } catch (e) {
              reject(e);
            }
          });
        });
        req.on('error', reject);
      });
    };
  }
}

// Configuración de variables de entorno
// dotenv.config(); // Removed redundant call

const app = express();
const PORT = process.env.PORT || 4000;

// Google Maps Client
const googleMapsClient = new Client({});

// --- 3.1 & 7: Función Haversine (Cálculo de distancia en metros) ---
function getDistanciaMetros(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radio tierra en metros
  const toRad = v => v * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper para decodificar polylines
const decodePolyline = (encoded) => {
  if (!encoded) return [];
  const poly = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    poly.push([lat / 1e5, lng / 1e5]);
  }
  return poly;
};

// ===============================
// 🔹 MIDDLEWARE
// ===============================

// Request ID y logging (si está disponible)
if (securityMiddleware?.requestIdMiddleware) {
  app.use(securityMiddleware.requestIdMiddleware);
  app.use(securityMiddleware.requestLogger);
}

// CORS mejorado (si está disponible, sino usar básico)
if (securityMiddleware?.corsConfig) {
  app.use(securityMiddleware.corsConfig);
} else {
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
  }));
}

// Helmet para headers de seguridad (si está disponible)
if (securityMiddleware?.helmetConfig) {
  app.use(securityMiddleware.helmetConfig);
}

// Validación de Content-Type (si está disponible)
if (securityMiddleware?.validateContentType) {
  app.use(securityMiddleware.validateContentType);
}

app.use(express.json({ limit: '50mb' }));

// Rate limiting (si está disponible)
if (securityMiddleware?.rateLimiters) {
  app.use('/api/', securityMiddleware.rateLimiters.general);
  app.use('/login', securityMiddleware.rateLimiters.auth);
  app.use('/register', securityMiddleware.rateLimiters.auth);
  app.use('/api/buscar-mejor-ruta', securityMiddleware.rateLimiters.search);
  app.use('/api/recomendar-ruta', securityMiddleware.rateLimiters.search);
}

// Middleware para validar JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET || "secret_key_default", (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Token inválido o expirado" });
    }
    req.user = user;
    next();
  });
};

// Middleware para verificar si el usuario es administrador
const requireAdmin = async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT rol FROM usuarios WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (result.rows[0].rol !== 'admin' && result.rows[0].rol !== 'gobierno') {
      return res.status(403).json({ message: "Acceso denegado. Se requieren permisos de administrador." });
    }

    next();
  } catch (err) {
    console.error("Error al verificar rol:", err);
    res.status(500).json({ message: "Error al verificar permisos" });
  }
};

// ===============================
// 🔹 RUTAS DE AUTENTICACIÓN
// ===============================

// Endpoint temporal para listar usuarios admin (solo para debugging)
app.get("/setup/list-admins", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, usuario, email, rol, activo FROM usuarios WHERE rol IN ('admin', 'gobierno') ORDER BY fecha_creacion"
    );
    return res.json({
      success: true,
      count: result.rows.length,
      usuarios: result.rows.map(u => ({
        id: u.id,
        usuario: u.usuario,
        email: u.email,
        rol: u.rol,
        activo: u.activo
      }))
    });
  } catch (error) {
    console.error("Error al listar admins:", error);
    return res.status(500).json({ 
      success: false,
      message: "Error al listar usuarios admin",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Endpoint temporal para verificar/crear esquema completo (solo para setup inicial)
app.post("/setup/ensure-schema", async (req, res) => {
  try {
    if (useCloud) {
      const dbCloud = await import("./db-cloud.js");
      if (dbCloud.ensureSchema) {
        const result = await dbCloud.ensureSchema();
        return res.json({
          success: result,
          message: result ? "Esquema verificado/creado exitosamente" : "Error al crear esquema"
        });
      }
      return res.status(500).json({ success: false, message: "ensureSchema no disponible" });
    } else {
      return res.json({ success: false, message: "Este endpoint solo funciona en modo cloud" });
    }
  } catch (error) {
    console.error("Error en ensure-schema:", error);
    return res.status(500).json({
      success: false,
      message: "Error al crear esquema",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Endpoint temporal para resetear contraseña de un usuario admin (solo para setup inicial)
app.post("/setup/reset-admin-password", async (req, res) => {
  try {
    const { usuario } = req.body;
    
    if (!usuario) {
      return res.status(400).json({
        success: false,
        message: "Se requiere el nombre de usuario"
      });
    }

    // Verificar que el usuario existe y es admin
    const userResult = await pool.query(
      "SELECT id, usuario, rol FROM usuarios WHERE usuario = $1 AND rol IN ('admin', 'gobierno')",
      [usuario]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario admin no encontrado"
      });
    }

    // Nueva contraseña: Gobierno2025!
    const newPassword = 'Gobierno2025!';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await pool.query(
      "UPDATE usuarios SET password = $1 WHERE id = $2",
      [hashedPassword, userResult.rows[0].id]
    );

    return res.json({
      success: true,
      message: "Contraseña reseteada exitosamente",
      usuario: userResult.rows[0].usuario,
      password: newPassword,
      rol: userResult.rows[0].rol
    });
  } catch (error) {
    console.error("Error al resetear contraseña:", error);
    return res.status(500).json({ 
      success: false,
      message: "Error al resetear contraseña",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Endpoint temporal para crear el primer usuario admin (solo si no existe ningún admin)
app.post("/setup/admin", async (req, res) => {
  try {
    // Verificar si ya existe algún usuario admin
    const existingAdmins = await pool.query(
      "SELECT id FROM usuarios WHERE rol IN ('admin', 'gobierno')"
    );

    if (existingAdmins.rows.length > 0) {
      return res.status(403).json({ 
        message: "Ya existen usuarios administradores. Use el panel de administración para crear más usuarios.",
        success: false 
      });
    }

    // Credenciales del primer admin
    const usuario = 'admin_gobierno';
    const password = 'Gobierno2025!';
    const email = 'admin@gobierno.sv';
    const nombre_completo = 'Administrador de Gobierno';
    const rol = 'admin';

    // Verificar si el usuario ya existe
    const existingUser = await pool.query(
      "SELECT id FROM usuarios WHERE usuario = $1 OR email = $2",
      [usuario, email]
    );

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser.rows.length > 0) {
      // Actualizar el usuario existente a admin
      const existing = existingUser.rows[0];
      await pool.query(
        "UPDATE usuarios SET password = $1, rol = $2, email = $3, nombre_completo = $4, usuario = $5 WHERE id = $6",
        [hashedPassword, rol, email, nombre_completo, usuario, existing.id]
      );
      return res.json({
        success: true,
        message: "Usuario administrador actualizado exitosamente",
        usuario: usuario,
        password: password,
        rol: rol
      });
    } else {
      // Crear nuevo usuario admin
      await pool.query(
        "INSERT INTO usuarios (usuario, password, email, nombre_completo, rol, activo) VALUES ($1, $2, $3, $4, $5, $6)",
        [usuario, hashedPassword, email, nombre_completo, rol, true]
      );
      return res.json({
        success: true,
        message: "Usuario administrador creado exitosamente",
        usuario: usuario,
        password: password,
        rol: rol,
        url: "/admin/login"
      });
    }
  } catch (error) {
    console.error("Error al crear usuario administrador:", error);
    return res.status(500).json({ 
      success: false,
      message: "Error al crear usuario administrador",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Registrar usuario
app.post("/register", async (req, res) => {
  const { usuario, password, email, nombre_completo, telefono } = req.body;

  try {
    console.log('Intentando registrar usuario:', { usuario, email });

    // Validar datos requeridos
    if (!usuario || !password) {
      console.log('Datos requeridos faltantes');
      return res.status(400).json({ message: "Usuario y contraseña son requeridos" });
    }

    // Verificar que el usuario no exista
    console.log('Verificando si el usuario ya existe...');
    const existingUser = await pool.query(
      "SELECT id FROM usuarios WHERE usuario = $1 OR email = $2",
      [usuario, email]
    );

    if (existingUser.rows.length > 0) {
      console.log('Usuario o email ya existe');
      return res.status(409).json({ message: "El usuario o email ya existe" });
    }

    // Hashear password y crear usuario
    console.log('Hasheando contraseña...');
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Insertando usuario en la base de datos...');
    const result = await pool.query(
      "INSERT INTO usuarios (usuario, password, email, nombre_completo, telefono, rol) VALUES ($1, $2, $3, $4, $5, 'usuario') RETURNING id",
      [usuario, hashedPassword, email, nombre_completo, telefono]
    );

    console.log('Usuario registrado exitosamente con ID:', result.rows[0].id);
    res.status(201).json({
      message: "Usuario registrado con éxito",
      id: result.rows[0].id
    });
  } catch (err) {
    console.error("Error al registrar usuario:", err);
    res.status(500).json({
      message: "Error al registrar usuario",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { usuario, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM usuarios WHERE usuario = $1",
      [usuario]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // Actualizar último acceso (compatible con PostgreSQL y SQLite)
    const updateQuery = useCloud 
      ? "UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1"
      : "UPDATE usuarios SET ultimo_acceso = datetime('now') WHERE id = $1";
    await pool.query(updateQuery, [user.id]);

    const token = jwt.sign(
      { id: user.id, usuario: user.usuario, rol: user.rol || 'usuario' },
      process.env.JWT_SECRET || "secret_key_default",
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login exitoso",
      token,
      usuario: user.usuario,
      id: user.id,
      rol: user.rol || 'usuario'
    });
  } catch (err) {
    console.error("Error en login:", err);
    console.error("Stack trace:", err.stack);
    res.status(500).json({ 
      message: "Error en el servidor",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Validar token y obtener info del usuario
app.get("/validate", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, usuario FROM usuarios WHERE id = $1",
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const user = result.rows[0];
    res.json({
      message: "Token válido",
      usuario: user.usuario,
      id: user.id,
    });
  } catch (err) {
    console.error("Error al validar token:", err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// ===============================
// 🔹 RUTAS BÁSICAS DE USUARIO
// ===============================

// Obtener perfil del usuario autenticado (SIMPLIFICADO)
app.get("/perfil", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, usuario, email, nombre_completo, telefono, foto_perfil, fecha_creacion, ultimo_acceso FROM usuarios WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error al obtener perfil:", err);
    res.status(500).json({ message: "Error al obtener perfil" });
  }
});

// Actualizar perfil del usuario autenticado (SIMPLIFICADO)
app.put("/perfil", authenticateToken, async (req, res) => {
  const { usuario, nombre_completo, email, telefono, foto_perfil } = req.body;

  try {
    // Validar que el usuario no esté en uso por otro usuario
    if (usuario) {
      const existingUsuario = await pool.query(
        "SELECT id FROM usuarios WHERE usuario = $1 AND id != $2",
        [usuario, req.user.id]
      );

      if (existingUsuario.rows.length > 0) {
        return res.status(409).json({ message: "El nombre de usuario ya está en uso" });
      }
    }

    // Validar que el email no esté en uso por otro usuario
    if (email) {
      const existingUser = await pool.query(
        "SELECT id FROM usuarios WHERE email = $1 AND id != $2",
        [email, req.user.id]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({ message: "El email ya está en uso por otro usuario" });
      }
    }

    // Construir la consulta de actualización dinámicamente
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (usuario !== undefined) {
      updates.push(`usuario = $${paramCount}`);
      values.push(usuario);
      paramCount++;
    }

    if (nombre_completo !== undefined) {
      updates.push(`nombre_completo = $${paramCount}`);
      values.push(nombre_completo);
      paramCount++;
    }

    if (email !== undefined) {
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    if (telefono !== undefined) {
      updates.push(`telefono = $${paramCount}`);
      values.push(telefono);
      paramCount++;
    }

    if (foto_perfil !== undefined) {
      updates.push(`foto_perfil = $${paramCount}`);
      values.push(foto_perfil);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No hay campos para actualizar" });
    }

    // Agregar el ID del usuario al final
    values.push(req.user.id);

    // Primero hacer el UPDATE
    const updateQuery = `
      UPDATE usuarios 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
    `;

    try {
      await pool.query(updateQuery, values);
    } catch (updateErr) {
      console.error("Error en UPDATE:", updateErr);
      throw updateErr;
    }

    // Luego obtener el usuario actualizado
    const selectQuery = `
      SELECT id, usuario, email, nombre_completo, telefono, foto_perfil, fecha_creacion, ultimo_acceso 
      FROM usuarios 
      WHERE id = $1
    `;

    const selectResult = await pool.query(selectQuery, [req.user.id]);

    if (selectResult.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado después de actualizar" });
    }

    res.json({
      message: "Perfil actualizado exitosamente",
      usuario: selectResult.rows[0]
    });
  } catch (err) {
    console.error("Error al actualizar perfil:", err);
    res.status(500).json({
      message: "Error al actualizar perfil: " + (err.message || "Error desconocido"),
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Cambiar contraseña
app.put("/perfil/password", authenticateToken, async (req, res) => {
  const { password_actual, password_nueva } = req.body;

  if (!password_actual || !password_nueva) {
    return res.status(400).json({ message: "Se requiere la contraseña actual y la nueva" });
  }

  if (password_nueva.length < 6) {
    return res.status(400).json({ message: "La nueva contraseña debe tener al menos 6 caracteres" });
  }

  try {
    const userResult = await pool.query(
      "SELECT password FROM usuarios WHERE id = $1",
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const validPassword = await bcrypt.compare(password_actual, userResult.rows[0].password);

    if (!validPassword) {
      return res.status(401).json({ message: "Contraseña actual incorrecta" });
    }

    const hashedPassword = await bcrypt.hash(password_nueva, 10);
    await pool.query(
      "UPDATE usuarios SET password = $1 WHERE id = $2",
      [hashedPassword, req.user.id]
    );

    res.json({ message: "Contraseña actualizada exitosamente" });
  } catch (err) {
    console.error("Error al cambiar contraseña:", err);
    res.status(500).json({ message: "Error al cambiar contraseña" });
  }
});

// ===============================
// 🔹 RUTAS BÁSICAS (SIN POSTGIS)
// ===============================

// Obtener todas las rutas (simplificado) - CON CACHÉ
app.get("/api/rutas", async (req, res) => {
  try {
    // Intentar obtener del caché Redis (si está disponible)
    if (redisCache?.routeCache) {
      try {
        const cached = await redisCache.routeCache.getRoutes();
        if (cached) {
          console.log('📦 Rutas desde caché Redis');
          return res.json(cached);
        }
      } catch (cacheErr) {
        console.warn('Error al obtener de caché:', cacheErr.message);
      }
    }

    const result = await pool.query(`
      SELECT id, nombre, descripcion, color, numero_ruta, empresa, tipo, tarifa, geometry
      FROM rutas
      WHERE activa = 1
      ORDER BY numero_ruta
    `);

    const processed = result.rows.map(r => {
      let geom = r.geometry;
      if (typeof geom === 'string' && geom.trim().length > 0) {
        if (geom.trim().startsWith('[')) {
          try {
            geom = JSON.parse(geom);
          } catch (e) {
            console.warn(`Error parsing JSON geometry for route ${r.id}`, e);
            geom = [];
          }
        } else {
          // Assume encoded polyline
          try {
            // decodePolyline returns [[lat, lng], ...] which is compatible with LeafletTripMap
            geom = decodePolyline(geom);
          } catch (e) {
            console.warn(`Error decoding polyline for route ${r.id}`, e);
            geom = [];
          }
        }
      } else if (!geom) {
        geom = [];
      }
      return { ...r, geometry: geom };
    });

    // Guardar en caché Redis (si está disponible)
    if (redisCache?.routeCache) {
      try {
        await redisCache.routeCache.setRoutes(processed);
        console.log('💾 Rutas guardadas en caché Redis');
      } catch (cacheErr) {
        console.warn('Error al guardar en caché:', cacheErr.message);
      }
    }

    res.json(processed);
  } catch (err) {
    console.error("Error al obtener rutas:", err);
    res.json([]);
  }
});

// Función auxiliar para calcular distancia (Fórmula de Haversine) - Versión PRO
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radio de la tierra en metros
  const Rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * Rad;
  const dLon = (lon2 - lon1) * Rad;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Rad) * Math.cos(lat2 * Rad) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Retorna metros
}

// --- ALGORITMO PRINCIPAL DE BÚSQUEDA --- CON CACHÉ
app.post('/api/buscar-mejor-ruta', async (req, res) => {
  // Aceptamos tanto formato anidado (cliente viejo) como plano (cliente nuevo)
  const { origen, destino, latOrigen, lngOrigen, latDestino, lngDestino } = req.body;

  // Normalizar coords
  const latA = latOrigen || (origen ? origen.lat : null);
  const lngA = lngOrigen || (origen ? origen.lng : null);
  const latB = latDestino || (destino ? destino.lat : null);
  const lngB = lngDestino || (destino ? destino.lng : null);

  if (!latA || !lngA || !latB || !lngB) {
    return res.status(400).json({ error: "Coordenadas inválidas" });
  }

  try {
    // Intentar obtener del caché Redis (si está disponible)
    if (redisCache?.searchCache) {
      try {
        const cached = await redisCache.searchCache.getRouteSearch(latA, lngA, latB, lngB);
        if (cached) {
          console.log('📦 Búsqueda desde caché Redis');
          return res.json(cached);
        }
      } catch (cacheErr) {
        console.warn('Error al obtener de caché:', cacheErr.message);
      }
    }

    // Usar el nuevo servicio de Grafos (Dijkstra)
    const result = await GraphRouteService.findBestRoute(latA, lngA, latB, lngB);

    if (!result) {
      const emptyResult = { success: true, recomendaciones: [] };
      // Guardar en caché incluso si no hay resultados
      if (redisCache?.searchCache) {
        try {
          await redisCache.searchCache.setRouteSearch(latA, lngA, latB, lngB, emptyResult);
        } catch (cacheErr) {
          // Ignorar errores de caché
        }
      }
      return res.json(emptyResult);
    }

    // Devolver array con la mejor ruta encontrada
    // El frontend espera 'recomendaciones' array
    console.log("Ruta encontrada por Grafo:", result.recomendacion.resumen);
    const response = {
      success: true,
      recomendaciones: [result.recomendacion]
    };

    // Guardar en caché Redis (si está disponible)
    if (redisCache?.searchCache) {
      try {
        await redisCache.searchCache.setRouteSearch(latA, lngA, latB, lngB, response);
        console.log('💾 Búsqueda guardada en caché Redis');
      } catch (cacheErr) {
        console.warn('Error al guardar en caché:', cacheErr.message);
      }
    }

    res.json(response);

  } catch (err) {
    console.error("Error en búsqueda por grafo:", err);
    res.status(500).json({ error: "Error interno en algoritmo de rutas" });
  }
});

// Obtener paradas de una ruta específica
app.get("/api/rutas/:id/paradas", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT 
        p.id, p.codigo, p.nombre, p.descripcion, p.direccion, 
        p.latitud, p.longitud, p.zona, p.tipo,
        pr.orden, pr.tiempo_estimado_minutos
      FROM paradas p
      JOIN parada_ruta pr ON p.id = pr.id_parada
      WHERE pr.id_ruta = $1 AND p.activa = 1
      ORDER BY pr.orden ASC
    `, [id]);

    res.json(result.rows.map(p => ({
      ...p,
      latitud: parseFloat(p.latitud),
      longitud: parseFloat(p.longitud),
      orden: parseInt(p.orden)
    })));
  } catch (err) {
    console.error(`Error al obtener paradas de ruta ${id}:`, err);
    res.json([]);
  }
});

// Obtener todas las paradas (simplificado)
// Obtener paradas (con filtro de busqueda opcional)
app.get("/api/paradas", async (req, res) => {
  const { q } = req.query;
  try {
    let query = `
      SELECT id, codigo, nombre, descripcion, direccion, latitud, longitud, zona, tipo
      FROM paradas
      WHERE activa = 1
    `;
    const params = [];

    if (q) {
      query += ` AND nombre LIKE $1 `;
      params.push(`%${q}%`);
    }

    query += ` ORDER BY nombre LIMIT 20`; // Limit to avoid overload

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener paradas:", err);
    res.json([]);
  }
});

// Buscar paradas cercanas
app.get("/api/paradas-cercanas", async (req, res) => {
  const { lat, lng, radio = 500, limite = 10 } = req.query;
  if (!lat || !lng) return res.status(400).json({ success: false });

  try {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const result = await pool.query("SELECT * FROM paradas WHERE activa = 1");

    // Filtro simple por distancia (Haversine)
    const filtered = result.rows.map(p => {
      const R = 6371000;
      const dLat = (parseFloat(p.latitud) - latNum) * Math.PI / 180;
      const dLon = (parseFloat(p.longitud) - lngNum) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(latNum * Math.PI / 180) * Math.cos(parseFloat(p.latitud) * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return { ...p, distancia_metros: Math.round(R * c) };
    })
      .filter(p => p.distancia_metros <= parseInt(radio))
      .sort((a, b) => a.distancia_metros - b.distancia_metros)
      .slice(0, parseInt(limite));

    res.json({ success: true, paradas: filtered });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// --- API: GUARDAR RUTA (Para el Panel de Admin) ---
app.post('/admin/guardar-ruta', async (req, res) => {
  // Se asume que desde el Admin envías un JSON así:
  // {
  //   "numero": "26",
  //   "nombre": "San Marcos - Miralvalle",
  //   "puntos": [ {lat: 13.11, lng: -89.22}, {lat: 13.12, lng: -89.22}, ... ]
  // }

  const { numero, nombre, puntos } = req.body;

  // Usamos pool.connect() que devuelve un objeto { query, release } simulando pg
  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Iniciar transacción

    // 1. Insertar la Ruta
    // ADAPTACIÓN DB: numero -> numero_ruta
    const resRuta = await client.query(
      'INSERT INTO rutas (numero_ruta, nombre) VALUES ($1, $2) RETURNING id',
      [numero, nombre]
    );
    const rutaId = resRuta.rows[0].id;

    // 2. Insertar los Puntos (Recorremos el array que enviaste desde el mapa)
    let orden = 1;
    for (const p of puntos) {
      await client.query(
        'INSERT INTO puntos_ruta (ruta_id, lat, lng, orden, tipo) VALUES ($1, $2, $3, $4, $5)',
        [rutaId, p.lat, p.lng, orden, 'ida'] // Asumimos 'ida' por defecto
      );
      orden++;
    }

    await client.query('COMMIT'); // Guardar cambios definitivamente
    res.json({ success: true, message: "Ruta guardada exitosamente", id: rutaId });

  } catch (e) {
    await client.query('ROLLBACK'); // Si algo falla, deshacer todo
    console.error(e);
    res.status(500).json({ error: "Error al guardar la ruta" });
  } finally {
    client.release();
  }
});

// --- API: ACTUALIZAR RUTA (Ida y Regreso) ---
app.put('/admin/rutas/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, puntos_ida, puntos_regreso } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Iniciar transacción segura

    // 1. Actualizar datos básicos
    if (nombre) {
      await client.query('UPDATE rutas SET nombre = $1 WHERE id = $2', [nombre, id]);
    }

    // 2. BORRAR puntos viejos (limpieza para no duplicar líneas)
    await client.query('DELETE FROM puntos_ruta WHERE ruta_id = $1', [id]);

    // 3. INSERTAR PUNTOS DE IDA (Línea Azul) - OPTIMIZADO: BATCH INSERT
    if (puntos_ida && puntos_ida.length > 0) {
      const CHUNK_SIZE = 50;
      let orden = 1;
      for (let i = 0; i < puntos_ida.length; i += CHUNK_SIZE) {
        const chunk = puntos_ida.slice(i, i + CHUNK_SIZE);
        const values = [];
        const placeholders = [];
        chunk.forEach((p, idx) => {
          // ($1, $2, $3, $4, $5), ($6, $7...)
          const offset = idx * 5;
          placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`);
          values.push(id, p.lat, p.lng, orden++, 'ida');
        });

        const sql = `INSERT INTO puntos_ruta (ruta_id, lat, lng, orden, tipo) VALUES ${placeholders.join(', ')}`;
        await client.query(sql, values);
      }
    }

    // 4. INSERTAR PUNTOS DE REGRESO (Línea Roja) - OPTIMIZADO
    if (puntos_regreso && puntos_regreso.length > 0) {
      const CHUNK_SIZE = 50;
      let orden = 1;
      for (let i = 0; i < puntos_regreso.length; i += CHUNK_SIZE) {
        const chunk = puntos_regreso.slice(i, i + CHUNK_SIZE);
        const values = [];
        const placeholders = [];
        chunk.forEach((p, idx) => {
          const offset = idx * 5;
          placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`);
          values.push(id, p.lat, p.lng, orden++, 'regreso');
        });

        const sql = `INSERT INTO puntos_ruta (ruta_id, lat, lng, orden, tipo) VALUES ${placeholders.join(', ')}`;
        await client.query(sql, values);
      }
    }

    await client.query('COMMIT'); // Guardar cambios

    // Guardar en disco explícitamente después de la carga masiva
    await pool.save();

    res.json({ success: true, message: "Trayectoria actualizada" });

  } catch (error) {
    await client.query('ROLLBACK'); // Cancelar si falla
    console.error(error);
    res.status(500).json({ error: "Error al guardar en base de datos" });
  } finally {
    client.release();
  }
});

// Buscar rutas cercanas (Simplificado)
app.get("/api/rutas-cercanas", async (req, res) => {
  const { lat, lng, radio = 500, limite = 10 } = req.query;
  if (!lat || !lng) return res.status(400).json({ success: false });

  // Misma lógica simple: buscar paradas cercanas, luego rutas de esas paradas
  try {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const result = await pool.query("SELECT * FROM paradas WHERE activa = 1");
    const nearbyStops = result.rows.map(p => {
      const R = 6371000;
      const dLat = (parseFloat(p.latitud) - latNum) * Math.PI / 180;
      const dLon = (parseFloat(p.longitud) - lngNum) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(latNum * Math.PI / 180) * Math.cos(parseFloat(p.latitud) * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return { id: p.id, dist: R * c };
    }).filter(p => p.dist <= parseInt(radio)).map(p => p.id);

    if (nearbyStops.length === 0) return res.json({ success: true, rutas: [] });

    const placeholders = nearbyStops.map(() => '?').join(',');
    const rutasResult = await pool.query(`
       SELECT DISTINCT r.* FROM rutas r
       JOIN parada_ruta pr ON r.id = pr.id_ruta
       WHERE pr.id_parada IN (${nearbyStops.join(',')}) AND r.activa = 1
       LIMIT ${parseInt(limite)}
     `);
    res.json({ success: true, rutas: rutasResult.rows });

  } catch (err) { console.error(err); res.status(500).json({ success: false }); }
});

// ===============================
// 🔹 ENRUTAMIENTO AVANZADO (MULTIMODAL)
// ===============================

app.post("/api/recomendar-ruta", async (req, res) => {
  const { inicioLat, inicioLng, destinoLat, destinoLng, preferencia = 'LESS_WALKING' } = req.body;

  if (!inicioLat || !inicioLng || !destinoLat || !destinoLng) {
    return res.status(400).json({
      success: false,
      message: "Se requieren parámetros: inicioLat, inicioLng, destinoLat, destinoLng"
    });
  }

  try {
    const results = await RouteFinderService.findRoutes(
      parseFloat(inicioLat),
      parseFloat(inicioLng),
      parseFloat(destinoLat),
      parseFloat(destinoLng),
      preferencia
    );

    res.json({
      success: true,
      recomendaciones: results.recomendaciones,
      metadata: results.metadata
    });

  } catch (err) {
    console.error("Error al recomendar ruta (Advanced Service):", err);
    res.status(500).json({
      success: false,
      message: "Error al calcular rutas",
      error: err.message
    });
  }
});

// Buscar rutas entre dos paradas (endpoint legacy - mantener por compatibilidad)
app.post("/api/buscar-rutas", async (req, res) => {
  const { paradaOrigenId, paradaDestinoId } = req.body;

  if (!paradaOrigenId || !paradaDestinoId) {
    return res.status(400).json({
      success: false,
      message: "Se requieren los IDs de origen y destino"
    });
  }

  try {
    // Obtener info de las paradas
    const paradaOrigen = await pool.query(
      "SELECT * FROM paradas WHERE id = $1",
      [paradaOrigenId]
    );

    const paradaDestino = await pool.query(
      "SELECT * FROM paradas WHERE id = $1",
      [paradaDestinoId]
    );

    if (paradaOrigen.rows.length === 0 || paradaDestino.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Paradas no encontradas"
      });
    }

    // Buscar rutas directas (una sola ruta que conecte ambas paradas)
    const rutasDirectas = await pool.query(`
      SELECT DISTINCT
        r.id,
        r.numero_ruta,
        r.nombre,
        r.empresa,
        r.tipo,
        r.tarifa,
        pr1.id_parada as parada_origen_id,
        p1.nombre as parada_origen_nombre,
        p1.latitud as parada_origen_lat,
        p1.longitud as parada_origen_lng,
        pr1.orden as orden_origen,
        pr1.tiempo_estimado_minutos as tiempo_origen,
        pr2.id_parada as parada_destino_id,
        p2.nombre as parada_destino_nombre,
        p2.latitud as parada_destino_lat,
        p2.longitud as parada_destino_lng,
        pr2.orden as orden_destino,
        pr2.tiempo_estimado_minutos as tiempo_destino
      FROM rutas r
      JOIN parada_ruta pr1 ON r.id = pr1.id_ruta
      JOIN parada_ruta pr2 ON r.id = pr2.id_ruta
      JOIN paradas p1 ON pr1.id_parada = p1.id
      JOIN paradas p2 ON pr2.id_parada = p2.id
      WHERE r.activa = 1
        AND pr1.id_parada = $1
        AND pr2.id_parada = $2
        AND pr1.orden < pr2.orden
      ORDER BY (pr2.tiempo_estimado_minutos - pr1.tiempo_estimado_minutos) ASC
    `, [paradaOrigenId, paradaDestinoId]);

    // Calcular distancia en línea recta (fórmula de Haversine simplificada)
    const lat1 = parseFloat(paradaOrigen.rows[0].latitud);
    const lon1 = parseFloat(paradaOrigen.rows[0].longitud);
    const lat2 = parseFloat(paradaDestino.rows[0].latitud);
    const lon2 = parseFloat(paradaDestino.rows[0].longitud);

    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanciaKm = R * c;

    // Para cada ruta, obtener las paradas intermedias
    const rutasConParadas = [];
    for (const ruta of rutasDirectas.rows) {
      const paradasIntermedias = await pool.query(`
        SELECT 
          p.id, p.codigo, p.nombre, p.latitud, p.longitud, 
          pr.orden, pr.tiempo_estimado_minutos
        FROM paradas p
        JOIN parada_ruta pr ON p.id = pr.id_parada
        WHERE pr.id_ruta = $1 
          AND pr.orden >= $2 
          AND pr.orden <= $3
        ORDER BY pr.orden
      `, [ruta.id, ruta.orden_origen, ruta.orden_destino]);

      rutasConParadas.push({
        ruta: {
          id: ruta.id,
          numero_ruta: ruta.numero_ruta,
          nombre: ruta.nombre,
          empresa: ruta.empresa,
          tipo: ruta.tipo,
          tarifa: parseFloat(ruta.tarifa)
        },
        paradaOrigen: {
          id: ruta.parada_origen_id,
          nombre: ruta.parada_origen_nombre,
          latitud: parseFloat(ruta.parada_origen_lat),
          longitud: parseFloat(ruta.parada_origen_lng)
        },
        paradaDestino: {
          id: ruta.parada_destino_id,
          nombre: ruta.parada_destino_nombre,
          latitud: parseFloat(ruta.parada_destino_lat),
          longitud: parseFloat(ruta.parada_destino_lng)
        },
        paradasIntermedias: paradasIntermedias.rows.map(p => ({
          id: p.id,
          codigo: p.codigo,
          nombre: p.nombre,
          latitud: parseFloat(p.latitud),
          longitud: parseFloat(p.longitud),
          orden: p.orden
        })),
        tiempoEstimadoMinutos: ruta.tiempo_destino - ruta.tiempo_origen,
        numeroParadas: paradasIntermedias.rows.length
      });
    }

    res.json({
      success: true,
      origen: paradaOrigen.rows[0],
      destino: paradaDestino.rows[0],
      distanciaLineaRecta: distanciaKm.toFixed(2),
      rutasDisponibles: rutasConParadas,
      totalRutas: rutasConParadas.length
    });

  } catch (err) {
    console.error("Error al buscar rutas:", err);
    res.status(500).json({
      success: false,
      message: "Error al buscar rutas",
      error: err.message
    });
  }
});

// ===============================
// 🔹 RUTAS DE HISTORIAL (SIMPLIFICADO)
// ===============================

// Guardar búsqueda en el historial
app.post("/historial", authenticateToken, async (req, res) => {
  const {
    ruta,
    numero_ruta,
    parada,
    parada_destino,
    latitud_origen,
    longitud_origen,
    latitud_destino,
    longitud_destino
  } = req.body;

  // Guardar destino en metadata si está disponible
  const metadata = parada_destino ? JSON.stringify({ parada_destino }) : '{}';

  try {
    const result = await pool.query(
      `INSERT INTO historial_busquedas (
        id_usuario, 
        ruta, 
        numero_ruta, 
        parada, 
        latitud_origen, 
        longitud_origen, 
        latitud_destino, 
        longitud_destino,
        metadata
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, fecha_busqueda`,
      [
        req.user.id,
        ruta || null,
        numero_ruta || null,
        parada || null,
        latitud_origen || null,
        longitud_origen || null,
        latitud_destino || null,
        longitud_destino || null,
        metadata
      ]
    );

    res.status(201).json({
      message: "Búsqueda guardada en el historial",
      id: result.rows[0].id,
      fecha: result.rows[0].fecha_busqueda
    });
  } catch (err) {
    console.error("Error al guardar historial:", err);
    res.status(500).json({ message: "Error al guardar historial" });
  }
});

// Obtener historial de búsquedas del usuario
app.get("/historial", authenticateToken, async (req, res) => {
  try {
    const limite = parseInt(req.query.limite) || 20;
    const result = await pool.query(
      `SELECT 
        id, 
        ruta, 
        numero_ruta, 
        parada, 
        fecha_busqueda,
        latitud_origen,
        longitud_origen,
        latitud_destino,
        longitud_destino,
        metadata
       FROM historial_busquedas
       WHERE id_usuario = $1
       ORDER BY fecha_busqueda DESC
       LIMIT $2`,
      [req.user.id, limite]
    );

    // Parsear metadata para extraer parada_destino
    const historial = result.rows.map(row => {
      let parada_destino = null;
      if (row.metadata) {
        try {
          const meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
          parada_destino = meta.parada_destino || null;
        } catch (e) {
          console.error('Error parsing metadata:', e);
        }
      }
      return {
        ...row,
        parada_destino
      };
    });

    res.json({
      historial: historial,
      total: historial.length
    });
  } catch (err) {
    console.error("Error al obtener historial:", err);
    res.json({ historial: [], total: 0 });
  }
});

// Eliminar una búsqueda del historial
app.delete("/historial/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM historial_busquedas WHERE id = $1 AND id_usuario = $2 RETURNING id",
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Búsqueda no encontrada" });
    }

    res.json({ message: "Búsqueda eliminada del historial" });
  } catch (err) {
    console.error("Error al eliminar del historial:", err);
    res.status(500).json({ message: "Error al eliminar del historial" });
  }
});

// Limpiar todo el historial del usuario
app.delete("/historial", authenticateToken, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM historial_busquedas WHERE id_usuario = $1",
      [req.user.id]
    );

    res.json({ message: "Historial limpiado exitosamente" });
  } catch (err) {
    console.error("Error al limpiar historial:", err);
    res.status(500).json({ message: "Error al limpiar historial" });
  }
});

// ===============================
// 🔹 RUTAS DE PRUEBA
// ===============================

// Endpoint de prueba en la raíz
app.get("/", (req, res) => {
  res.json({
    message: "Backend BusTrackSV funcionando",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    database: "SQLite"
  });
});

// Endpoint de salud del servidor
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ===============================
// 🔹 RUTAS DE ADMINISTRACIÓN (GOBIERNO)
// ===============================

// Obtener todas las rutas (admin - incluye inactivas)
app.get("/admin/rutas", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nombre, descripcion, color, numero_ruta, empresa, tipo, tarifa,
             horario_inicio, horario_fin, frecuencia_minutos, activa, fecha_creacion, fecha_actualizacion, geometry
      FROM rutas
      ORDER BY numero_ruta
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error al obtener rutas (admin):", err);
    res.status(500).json({ success: false, message: "Error al obtener rutas" });
  }
});

// Crear nueva ruta
app.post("/admin/rutas", authenticateToken, requireAdmin, async (req, res) => {
  const { nombre, descripcion, color, numero_ruta, empresa, tipo, tarifa, horario_inicio, horario_fin, frecuencia_minutos, geometry } = req.body;

  if (!nombre || !numero_ruta) {
    return res.status(400).json({ success: false, message: "Nombre y número de ruta son requeridos" });
  }

  // Validar y formatear geometry si se proporciona
  let geometryFormatted = null;
  if (geometry && geometry.trim()) {
    try {
      // Intentar parsear como JSON si es string
      const parsed = typeof geometry === 'string' ? JSON.parse(geometry) : geometry;
      // Convertir a string JSON para guardar
      geometryFormatted = JSON.stringify(parsed);
    } catch (err) {
      return res.status(400).json({ success: false, message: "Formato de coordenadas inválido. Debe ser JSON válido." });
    }
  }

  try {
    const result = await pool.query(`
      INSERT INTO rutas (nombre, descripcion, color, numero_ruta, empresa, tipo, tarifa, 
                        horario_inicio, horario_fin, frecuencia_minutos, activa, geometry)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      nombre, 
      descripcion || null, 
      color || '#0066CC', 
      numero_ruta, 
      empresa || null, 
      tipo || 'Bus',
      tarifa || 0.25, 
      horario_inicio || '05:00:00', 
      horario_fin || '21:00:00', 
      frecuencia_minutos || 15, 
      true, // activa
      geometryFormatted
    ]);

    // Invalidar caché de rutas después de crear
    if (redisCache?.routeCache) {
      try {
        await redisCache.routeCache.invalidate();
      } catch (cacheErr) {
        // Ignorar errores de caché
      }
    }

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Error al crear ruta:", err);
    console.error("Stack trace:", err.stack);
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, message: "El número de ruta ya existe" });
    }
    // Incluir más detalles del error en desarrollo
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Error al crear ruta: ${err.message}` 
      : "Error al crear ruta";
    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Actualizar ruta
app.put("/admin/rutas/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, color, numero_ruta, empresa, tipo, tarifa, horario_inicio, horario_fin, frecuencia_minutos, activa, geometry, stops } = req.body;

  try {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (nombre !== undefined) { updates.push(`nombre = $${paramCount}`); values.push(nombre); paramCount++; }
    if (descripcion !== undefined) { updates.push(`descripcion = $${paramCount}`); values.push(descripcion); paramCount++; }
    if (color !== undefined) { updates.push(`color = $${paramCount}`); values.push(color); paramCount++; }
    if (numero_ruta !== undefined) { updates.push(`numero_ruta = $${paramCount}`); values.push(numero_ruta); paramCount++; }
    if (empresa !== undefined) { updates.push(`empresa = $${paramCount}`); values.push(empresa); paramCount++; }
    if (tipo !== undefined) { updates.push(`tipo = $${paramCount}`); values.push(tipo); paramCount++; }
    if (tarifa !== undefined) { updates.push(`tarifa = $${paramCount}`); values.push(tarifa); paramCount++; }
    if (horario_inicio !== undefined) { updates.push(`horario_inicio = $${paramCount}`); values.push(horario_inicio); paramCount++; }
    if (horario_fin !== undefined) { updates.push(`horario_fin = $${paramCount}`); values.push(horario_fin); paramCount++; }
    if (frecuencia_minutos !== undefined) { updates.push(`frecuencia_minutos = $${paramCount}`); values.push(frecuencia_minutos); paramCount++; }
    if (activa !== undefined) { updates.push(`activa = $${paramCount}`); values.push(activa ? 1 : 0); paramCount++; }
    if (geometry !== undefined) {
      if (geometry && geometry.trim()) {
        try {
          const parsed = typeof geometry === 'string' ? JSON.parse(geometry) : geometry;
          updates.push(`geometry = $${paramCount}`);
          values.push(JSON.stringify(parsed));
          paramCount++;
        } catch (err) {
          return res.status(400).json({ success: false, message: "Formato de coordenadas inválido. Debe ser JSON válido." });
        }
      } else {
        updates.push(`geometry = $${paramCount}`);
        values.push(null);
        paramCount++;
      }
    }

    updates.push(useCloud 
      ? `fecha_actualizacion = NOW()`
      : `fecha_actualizacion = datetime('now')`);
    values.push(id);

    const result = await pool.query(
      `UPDATE rutas SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Ruta no encontrada" });
    }

    // Procesar Paradas si se proporcionan
    if (stops && (stops.ida || stops.regreso)) {
      // 1. Eliminar asociaciones existentes
      await pool.query("DELETE FROM parada_ruta WHERE id_ruta = $1", [id]);

      const processDirection = async (stopList, direction) => {
        if (!stopList || !Array.isArray(stopList)) return;

        for (let i = 0; i < stopList.length; i++) {
          const stop = stopList[i];
          let stopId = stop.id;

          // Si no tiene ID, buscar por proximidad o crear
          if (!stopId) {
            // Buscar parada existente muy cerca (aprox 11 metros)
            const existing = await pool.query(
              "SELECT id FROM paradas WHERE ABS(latitud - $1) < 0.0001 AND ABS(longitud - $2) < 0.0001 LIMIT 1",
              [stop.lat, stop.lng]
            );

            if (existing.rows.length > 0) {
              stopId = existing.rows[0].id;
            } else {
              // Crear nueva parada
              const newStop = await pool.query(
                "INSERT INTO paradas (nombre, latitud, longitud, direccion, activa, tipo) VALUES ($1, $2, $3, $4, 1, 'Virtual') RETURNING id",
                [stop.nombre || stop.address || 'Parada', stop.lat, stop.lng, stop.address || '']
              );
              stopId = newStop.rows[0].id;
            }
          }

          // Asociar a la ruta
          if (stopId) {
            await pool.query(
              "INSERT INTO parada_ruta (id_ruta, id_parada, orden, direccion) VALUES ($1, $2, $3, $4)",
              [id, stopId, i + 1, direction] // Orden 1-based
            );
          }
        }
      };

      await processDirection(stops.ida, 'ida');
      await processDirection(stops.regreso, 'regreso');
    }

    // Invalidar caché de rutas después de actualizar
    if (redisCache?.routeCache) {
      try {
        await redisCache.routeCache.invalidate();
        console.log('🗑️ Caché de rutas invalidado después de actualización');
      } catch (cacheErr) {
        console.warn('Error al invalidar caché:', cacheErr.message);
      }
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Error al actualizar ruta:", err);
    res.status(500).json({ success: false, message: "Error al actualizar ruta" });
  }
});

// Eliminar ruta
app.delete("/admin/rutas/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Primero eliminar las relaciones parada_ruta
    await pool.query("DELETE FROM parada_ruta WHERE id_ruta = $1", [id]);

    // Luego eliminar la ruta
    const result = await pool.query("DELETE FROM rutas WHERE id = $1 RETURNING id", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Ruta no encontrada" });
    }

    // Invalidar caché de rutas después de eliminar
    if (redisCache?.routeCache) {
      try {
        await redisCache.routeCache.invalidate();
      } catch (cacheErr) {
        // Ignorar errores de caché
      }
    }

    res.json({ success: true, message: "Ruta eliminada exitosamente" });
  } catch (err) {
    console.error("Error al eliminar ruta:", err);
    res.status(500).json({ success: false, message: "Error al eliminar ruta" });
  }
});

// Obtener todas las paradas (admin)
app.get("/admin/paradas", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, codigo, nombre, descripcion, direccion, latitud, longitud, zona, tipo,
             tiene_techo, tiene_asientos, accesible, activa, fecha_creacion
      FROM paradas
      ORDER BY nombre
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error al obtener paradas (admin):", err);
    res.status(500).json({ success: false, message: "Error al obtener paradas" });
  }
});

// Crear nueva parada
app.post("/admin/paradas", authenticateToken, requireAdmin, async (req, res) => {
  const { codigo, nombre, descripcion, direccion, latitud, longitud, zona, tipo, tiene_techo, tiene_asientos, accesible } = req.body;

  if (!nombre || latitud === undefined || longitud === undefined) {
    return res.status(400).json({ success: false, message: "Nombre, latitud y longitud son requeridos" });
  }

  try {
    const result = await pool.query(`
      INSERT INTO paradas (codigo, nombre, descripcion, direccion, latitud, longitud, zona, tipo,
                          tiene_techo, tiene_asientos, accesible, activa)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 1)
      RETURNING *
    `, [codigo || null, nombre, descripcion || null, direccion || null, latitud, longitud, zona || null,
    tipo || 'Regular', tiene_techo ? 1 : 0, tiene_asientos ? 1 : 0, accesible ? 1 : 0]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Error al crear parada:", err);
    if (err.message.includes('UNIQUE') && err.message.includes('codigo')) {
      return res.status(409).json({ success: false, message: "El código de la parada ya existe" });
    }
    res.status(500).json({ success: false, message: "Error al crear parada: " + err.message });
  }
});

// Actualizar parada
app.put("/admin/paradas/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { codigo, nombre, descripcion, direccion, latitud, longitud, zona, tipo, tiene_techo, tiene_asientos, accesible, activa } = req.body;

  try {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (codigo !== undefined) { updates.push(`codigo = $${paramCount}`); values.push(codigo); paramCount++; }
    if (nombre !== undefined) { updates.push(`nombre = $${paramCount}`); values.push(nombre); paramCount++; }
    if (descripcion !== undefined) { updates.push(`descripcion = $${paramCount}`); values.push(descripcion); paramCount++; }
    if (direccion !== undefined) { updates.push(`direccion = $${paramCount}`); values.push(direccion); paramCount++; }
    if (latitud !== undefined) { updates.push(`latitud = $${paramCount}`); values.push(latitud); paramCount++; }
    if (longitud !== undefined) { updates.push(`longitud = $${paramCount}`); values.push(longitud); paramCount++; }
    if (zona !== undefined) { updates.push(`zona = $${paramCount}`); values.push(zona); paramCount++; }
    if (tipo !== undefined) { updates.push(`tipo = $${paramCount}`); values.push(tipo); paramCount++; }
    if (tiene_techo !== undefined) { updates.push(`tiene_techo = $${paramCount}`); values.push(tiene_techo ? 1 : 0); paramCount++; }
    if (tiene_asientos !== undefined) { updates.push(`tiene_asientos = $${paramCount}`); values.push(tiene_asientos ? 1 : 0); paramCount++; }
    if (accesible !== undefined) { updates.push(`accesible = $${paramCount}`); values.push(accesible ? 1 : 0); paramCount++; }
    if (activa !== undefined) { updates.push(`activa = $${paramCount}`); values.push(activa ? 1 : 0); paramCount++; }

    values.push(id);

    const result = await pool.query(
      `UPDATE paradas SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Parada no encontrada" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Error al actualizar parada:", err);
    res.status(500).json({ success: false, message: "Error al actualizar parada" });
  }
});

// Eliminar parada
app.delete("/admin/paradas/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM parada_ruta WHERE id_parada = $1", [id]);
    const result = await pool.query("DELETE FROM paradas WHERE id = $1 RETURNING id", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Parada no encontrada" });
    }

    res.json({ success: true, message: "Parada eliminada exitosamente" });
  } catch (err) {
    console.error("Error al eliminar parada:", err);
    res.status(500).json({ success: false, message: "Error al eliminar parada" });
  }
});

// Asociar parada a ruta
app.post("/admin/rutas/:rutaId/paradas", authenticateToken, requireAdmin, async (req, res) => {
  const { rutaId } = req.params;
  const { paradaId, orden, direccion, distancia_km, tiempo_estimado_minutos } = req.body;

  if (!paradaId || orden === undefined) {
    return res.status(400).json({ success: false, message: "Parada ID y orden son requeridos" });
  }

  try {
    const result = await pool.query(`
      INSERT INTO parada_ruta (id_parada, id_ruta, orden, direccion, distancia_km, tiempo_estimado_minutos)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [paradaId, rutaId, orden, direccion || 'ida', distancia_km || null, tiempo_estimado_minutos || null]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Error al asociar parada a ruta:", err);
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, message: "Esta parada ya está asociada a esta ruta en esta dirección y orden" });
    }
    res.status(500).json({ success: false, message: "Error al asociar parada a ruta" });
  }
});

// Eliminar asociación parada-ruta
app.delete("/admin/rutas/:rutaId/paradas/:paradaId", authenticateToken, requireAdmin, async (req, res) => {
  const { rutaId, paradaId } = req.params;
  const { direccion, orden } = req.query;

  try {
    let query = "DELETE FROM parada_ruta WHERE id_ruta = $1 AND id_parada = $2";
    const values = [rutaId, paradaId];

    if (direccion) {
      query += " AND direccion = $3";
      values.push(direccion);
    }
    if (orden) {
      query += " AND orden = $" + (values.length + 1);
      values.push(parseInt(orden));
    }

    const result = await pool.query(query, values);
    res.json({ success: true, message: "Asociación eliminada exitosamente" });
  } catch (err) {
    console.error("Error al eliminar asociación:", err);
    res.status(500).json({ success: false, message: "Error al eliminar asociación" });
  }
});

// ===============================
// 🔹 GESTIÓN DE USUARIOS ADMINISTRADORES
// ===============================

// Obtener todos los usuarios (solo admin puede ver)
app.get("/admin/usuarios", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, usuario, email, nombre_completo, telefono, rol, activo, fecha_creacion, ultimo_acceso
      FROM usuarios
      ORDER BY fecha_creacion DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    res.status(500).json({ success: false, message: "Error al obtener usuarios" });
  }
});

// Crear usuario de gobierno (solo admin puede crear)
app.post("/admin/usuarios", authenticateToken, requireAdmin, async (req, res) => {
  const { usuario, password, email, nombre_completo, telefono, rol } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ success: false, message: "Usuario y contraseña son requeridos" });
  }

  const rolPermitido = rol === 'admin' || rol === 'gobierno' ? rol : 'gobierno';

  try {
    const existingUser = await pool.query(
      "SELECT id FROM usuarios WHERE usuario = $1 OR email = $2",
      [usuario, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ success: false, message: "El usuario o email ya existe" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO usuarios (usuario, password, email, nombre_completo, telefono, rol) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, usuario, email, nombre_completo, rol",
      [usuario, hashedPassword, email || null, nombre_completo || null, telefono || null, rolPermitido]
    );

    res.status(201).json({
      success: true,
      message: "Usuario de gobierno creado exitosamente",
      data: result.rows[0]
    });
  } catch (err) {
    console.error("Error al crear usuario de gobierno:", err);
    res.status(500).json({ success: false, message: "Error al crear usuario de gobierno" });
  }
});

// Actualizar rol de usuario (solo admin puede cambiar roles)
app.put("/admin/usuarios/:id/rol", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { rol } = req.body;

  if (!rol || (rol !== 'usuario' && rol !== 'admin' && rol !== 'gobierno')) {
    return res.status(400).json({ success: false, message: "Rol inválido. Debe ser 'usuario', 'admin' o 'gobierno'" });
  }

  try {
    const result = await pool.query(
      "UPDATE usuarios SET rol = $1 WHERE id = $2 RETURNING id, usuario, rol",
      [rol, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    res.json({
      success: true,
      message: "Rol actualizado exitosamente",
      data: result.rows[0]
    });
  } catch (err) {
    console.error("Error al actualizar rol:", err);
    res.status(500).json({ success: false, message: "Error al actualizar rol" });
  }
});

// Eliminar usuario
app.delete("/admin/usuarios/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ success: false, message: "No puedes eliminar tu propio usuario" });
  }

  try {
    const result = await pool.query("DELETE FROM usuarios WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }
    res.json({ success: true, message: "Usuario eliminado exitosamente" });
  } catch (err) {
    console.error("Error al eliminar usuario:", err);
    res.status(500).json({ success: false, message: "Error al eliminar usuario" });
  }
});

// ===============================
// 🔹 SERVICIOS DE GEOCODING Y ROUTING
// ===============================

// Función auxiliar: Geocodificación con Nominatim (gratis)
// Se mantiene para /admin/geocode
async function geocodeWithNominatim(texto) {
  try {
    const query = encodeURIComponent(`${texto}, El Salvador`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=sv`;

    const response = await fetch(url, { headers: { 'User-Agent': 'BusTrackSV/1.0' } });
    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        direccion: result.display_name
      };
    }
    return null;
  } catch (error) {
    console.error("Error en geocoding Nominatim:", error);
    return null;
  }
}

// Geocoding: convertir texto a coordenadas (Admin)
app.post("/admin/geocode", authenticateToken, requireAdmin, async (req, res) => {
  const { texto } = req.body;
  if (!texto || !texto.trim()) return res.status(400).json({ success: false, message: "Texto requerido" });

  try {
    const result = await geocodeWithNominatim(texto);
    if (result) {
      res.json({
        success: true,
        coordenadas: [[result.lat, result.lng]],
        puntos: [{ nombre: texto, coordenadas: [result.lat, result.lng], direccion: result.direccion }]
      });
    } else {
      res.status(404).json({ success: false, message: "Lugar no encontrado" });
    }
  } catch (err) {
    console.error("Error en geocoding:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===============================
// 🔹 RUTAS DE ADMINISTRADOR (AI ROUTE CREATOR)
// ===============================

// ===============================
// 🔹 RUTAS DE ADMINISTRADOR (AI ROUTE CREATOR)
// ===============================

// Generar previsualización de ruta desde texto (Aliases for different frontend versions)
const generateRouteHandler = async (req, res) => {
  const { text, texto } = req.body;
  const input = text || texto; // Handle both schemas
  if (!input) return res.status(400).json({ message: "Se requiere texto descriptivo" });

  try {
    const result = await RouteGenerationService.generateRouteFromText(input);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Error generando ruta:", err);
    // No devolver 500 si es un error de validación o lógica
    const statusCode = err.message.includes("requiere") || err.message.includes("mínimo") || err.message.includes("No se pudieron")
      ? 400
      : 500;
    res.status(statusCode).json({ success: false, message: err.message });
  }
};

// Endpoint unificado principal - ÚNICO ENDPOINT ESTÁNDAR
app.post("/admin/generate-route-from-text", authenticateToken, requireAdmin, generateRouteHandler);

// Mantener aliases para compatibilidad (deprecated - usar /admin/generate-route-from-text)
app.post("/api/admin/generate-route", authenticateToken, requireAdmin, generateRouteHandler);
app.post("/admin/route-from-text", authenticateToken, requireAdmin, generateRouteHandler);
app.post("/admin/generate-route", authenticateToken, requireAdmin, generateRouteHandler);


// Guardar ruta generada (Aliases)
const saveRouteHandler = async (req, res) => {
  const routeData = req.body;
  if (!routeData.nombre || !routeData.geometry) {
    return res.status(400).json({ message: "Datos incompletos" });
  }

  try {
    const result = await RouteGenerationService.saveRoute(routeData);
    res.json({ success: true, id: result.id });
  } catch (err) {
    console.error("Error guardando ruta:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

app.post("/api/admin/save-route", authenticateToken, requireAdmin, saveRouteHandler);
app.post("/admin/save-route", authenticateToken, requireAdmin, saveRouteHandler); // Alias for consistency

// Endpoint for frontend Task 3
app.get("/api/routes", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nombre, descripcion, color, numero_ruta, empresa, tipo, tarifa, geometry
      FROM rutas
      WHERE activa = 1
      ORDER BY numero_ruta
    `);

    // Parse geometry if it's stored as JSON string, otherwise send as is
    const routes = result.rows.map(r => ({
      ...r,
      geometry: typeof r.geometry === 'string' && r.geometry.startsWith('[')
        ? JSON.parse(r.geometry)
        : r.geometry // If using custom encoding or google polyline
    }));

    res.json(routes);
  } catch (err) {
    console.error("Error retrieving routes:", err);
    res.json([]);
  }
});


// ===============================
// 🔹 INICIAR SERVIDOR
// ===============================
const startServer = async () => {
  try {
    console.log('🔍 Probando conexión a la base de datos...');
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos.');
      process.exit(1);
    }

    // Inicializar índices si está en modo cloud
    if (useCloud && ensureIndexes && typeof ensureIndexes === 'function') {
      try {
        await ensureIndexes();
      } catch (e) {
        console.warn('⚠️ No se pudieron crear índices optimizados:', e.message);
      }
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n🚀 ========================================');
      console.log(`   Servidor BusTrackSV iniciado`);
      console.log(`   http://localhost:${PORT}`);
      console.log(`   ========================================\n`);
      console.log(`📊 Configuración:`);
      console.log(`   Puerto: ${PORT}`);
      console.log(`   Base de datos: ${useCloud ? 'PostgreSQL (Cloud)' : 'SQLite (Local)'}`);
      const redisStatus = redisCache?.isRedisAvailable ? redisCache.isRedisAvailable() : false;
      console.log(`   Caché Redis: ${redisStatus ? '✅ Activo' : '❌ No disponible'}`);
      console.log(`   Seguridad: ${securityMiddleware ? '✅ Activa' : '⚠️ Básica'}`);
      console.log(`   Entorno: ${process.env.NODE_ENV || "development"}`);
      
      if (!useCloud) {
        console.log(`\n📱 Para acceder desde tu teléfono:`);
        console.log(`   1. Asegúrate de que tu teléfono esté en la misma red WiFi`);
        console.log(`   2. Encuentra la IP de tu computadora (ipconfig en Windows)`);
        console.log(`   3. Accede desde el teléfono usando: http://TU_IP:${PORT}`);
      } else {
        console.log(`\n☁️ Modo Cloud activado`);
        console.log(`   La aplicación está lista para producción`);
      }
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();
