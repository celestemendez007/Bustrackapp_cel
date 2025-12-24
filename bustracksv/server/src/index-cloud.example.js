/**
 * EJEMPLO DE INTEGRACIÓN CLOUD
 * 
 * Este archivo muestra cómo integrar todas las mejoras cloud en tu index.js
 * 
 * PASOS:
 * 1. Copia las importaciones y configuraciones de este archivo
 * 2. Pega en tu index.js existente
 * 3. Reemplaza las secciones correspondientes
 */

// ============================================================================
// IMPORTS CLOUD
// ============================================================================
import { pool, testConnection, checkPostGIS, ensureIndexes } from './db-cloud.js';
import { initRedis, routeCache, stopCache, searchCache } from './cache/redis.js';
import {
  corsConfig,
  helmetConfig,
  rateLimiters,
  requestIdMiddleware,
  requestLogger,
  validateContentType,
  sanitizeInput
} from './middleware/security.js';

// ============================================================================
// INICIALIZACIÓN CLOUD
// ============================================================================

// Inicializar Redis (opcional, la app funciona sin él)
let redisReady = false;
try {
  await initRedis();
  redisReady = true;
  console.log('✅ Redis inicializado');
} catch (error) {
  console.warn('⚠️ Redis no disponible, continuando sin caché');
}

// Verificar conexión a PostgreSQL
const dbConnected = await testConnection();
if (!dbConnected) {
  console.error('❌ No se pudo conectar a PostgreSQL');
  process.exit(1);
}

// Verificar PostGIS (opcional)
await checkPostGIS();

// Crear índices optimizados
await ensureIndexes();

// ============================================================================
// MIDDLEWARE DE SEGURIDAD (Reemplazar en tu app.use())
// ============================================================================

// ANTES:
// app.use(cors());
// app.use(express.json({ limit: '50mb' }));

// DESPUÉS:
app.use(requestIdMiddleware); // Agregar request ID
app.use(requestLogger); // Logging estructurado
app.use(corsConfig); // CORS configurado
app.use(helmetConfig); // Headers de seguridad
app.use(validateContentType); // Validar Content-Type
app.use(sanitizeInput); // Sanitizar inputs
app.use(express.json({ limit: '50mb' }));

// Rate limiting por tipo de endpoint
app.use('/api/', rateLimiters.general);
app.use('/login', rateLimiters.auth);
app.use('/register', rateLimiters.auth);
app.use('/api/buscar-mejor-ruta', rateLimiters.search);
app.use('/api/recomendar-ruta', rateLimiters.search);

// ============================================================================
// EJEMPLO: ENDPOINT CON CACHÉ
// ============================================================================

// ANTES (sin caché):
app.get("/api/rutas", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nombre, descripcion, color, numero_ruta, empresa, tipo, tarifa, geometry
      FROM rutas
      WHERE activa = 1
      ORDER BY numero_ruta
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener rutas:", err);
    res.json([]);
  }
});

// DESPUÉS (con caché Redis):
app.get("/api/rutas", async (req, res) => {
  try {
    // Intentar obtener del caché
    if (redisReady) {
      const cached = await routeCache.getRoutes();
      if (cached) {
        console.log('📦 Rutas desde caché');
        return res.json(cached);
      }
    }
    
    // Si no está en caché, obtener de DB
    const result = await pool.query(`
      SELECT id, nombre, descripcion, color, numero_ruta, empresa, tipo, tarifa, geometry
      FROM rutas
      WHERE activa = 1
      ORDER BY numero_ruta
    `);
    
    const routes = result.rows.map(r => {
      // Procesar geometry si es necesario
      let geom = r.geometry;
      if (typeof geom === 'string' && geom.trim().length > 0) {
        if (geom.trim().startsWith('[')) {
          try {
            geom = JSON.parse(geom);
          } catch (e) {
            geom = [];
          }
        }
      } else if (!geom) {
        geom = [];
      }
      return { ...r, geometry: geom };
    });
    
    // Guardar en caché
    if (redisReady) {
      await routeCache.setRoutes(routes);
      console.log('💾 Rutas guardadas en caché');
    }
    
    res.json(routes);
  } catch (err) {
    console.error("Error al obtener rutas:", err);
    res.status(500).json({ error: "Error al obtener rutas" });
  }
});

// ============================================================================
// EJEMPLO: ENDPOINT DE BÚSQUEDA CON CACHÉ
// ============================================================================

app.post('/api/buscar-mejor-ruta', async (req, res) => {
  const { latOrigen, lngOrigen, latDestino, lngDestino } = req.body;
  
  if (!latOrigen || !lngOrigen || !latDestino || !lngDestino) {
    return res.status(400).json({ error: "Coordenadas inválidas" });
  }
  
  try {
    // Intentar obtener del caché
    if (redisReady) {
      const cached = await searchCache.getRouteSearch(
        latOrigen, lngOrigen, latDestino, lngDestino
      );
      if (cached) {
        console.log('📦 Búsqueda desde caché');
        return res.json(cached);
      }
    }
    
    // Realizar búsqueda (tu lógica existente)
    const result = await GraphRouteService.findBestRoute(
      latOrigen, lngOrigen, latDestino, lngDestino
    );
    
    if (!result) {
      return res.json({ success: true, recomendaciones: [] });
    }
    
    const response = {
      success: true,
      recomendaciones: [result.recomendacion]
    };
    
    // Guardar en caché
    if (redisReady) {
      await searchCache.setRouteSearch(
        latOrigen, lngOrigen, latDestino, lngDestino,
        response
      );
      console.log('💾 Búsqueda guardada en caché');
    }
    
    res.json(response);
  } catch (err) {
    console.error("Error en búsqueda:", err);
    res.status(500).json({ error: "Error interno en algoritmo de rutas" });
  }
});

// ============================================================================
// INVALIDAR CACHÉ AL ACTUALIZAR DATOS
// ============================================================================

// Ejemplo: Al actualizar una ruta, invalidar caché
app.put("/admin/rutas/:id", authenticateToken, requireAdmin, async (req, res) => {
  // ... tu lógica de actualización ...
  
  // Después de actualizar exitosamente:
  if (redisReady) {
    await routeCache.invalidate();
    console.log('🗑️ Caché de rutas invalidado');
  }
  
  res.json({ success: true, data: result.rows[0] });
});

// ============================================================================
// INICIO DEL SERVIDOR
// ============================================================================

const startServer = async () => {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos.');
      process.exit(1);
    }
    
    // En Vercel, el puerto viene de process.env.PORT automáticamente
    const PORT = process.env.PORT || 4000;
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor BusTrackSV Cloud corriendo en puerto ${PORT}`);
      console.log(`📊 Entorno: ${process.env.NODE_ENV || "development"}`);
      console.log(`💾 Base de datos: PostgreSQL (Cloud)`);
      console.log(`📦 Caché: ${redisReady ? 'Redis activo' : 'Sin caché'}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();


