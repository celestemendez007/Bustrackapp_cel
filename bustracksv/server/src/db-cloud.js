/**
 * CONFIGURACIÓN DE BASE DE DATOS PARA PRODUCCIÓN EN LA NUBE
 * Compatible con Supabase, AWS RDS PostgreSQL, o cualquier PostgreSQL
 * 
 * Optimizado para escalar a +1,000,000 de usuarios
 */

import pkg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pkg;

// Configuración optimizada para producción con connection pooling
const poolConfig = {
  // Usar DATABASE_URL si está disponible (Supabase, Heroku, etc.)
  connectionString: process.env.DATABASE_URL,
  
  // O usar configuración individual
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 5432,
  
  // Configuración de pool para alta concurrencia
  max: parseInt(process.env.DB_POOL_MAX) || 20, // Máximo de conexiones
  idleTimeoutMillis: 30000, // 30 seg para cerrar conexiones inactivas
  connectionTimeoutMillis: 10000, // 10 seg para conectarse
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  
  // SSL para conexiones seguras (requerido en Supabase y AWS RDS)
  ssl: process.env.DB_SSL === 'true' || process.env.DATABASE_URL?.includes('sslmode=require') 
    ? { rejectUnauthorized: false } 
    : false,
};

// Crear pool de conexiones
export const pool = new Pool(poolConfig);

// Manejo de errores mejorado
pool.on('error', (err, client) => {
  console.error('❌ Error inesperado en cliente de base de datos:', err);
  console.error('Cliente:', client);
  // En producción, podrías enviar esto a un servicio de monitoreo
});

// Función para probar la conexión
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as now, version() as version');
    console.log('✅ Conexión a PostgreSQL exitosa');
    console.log('   Hora del servidor:', result.rows[0].now);
    console.log('   Versión:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Error al conectar con PostgreSQL:', err.message);
    return false;
  }
};

// Función para verificar extensiones PostGIS
export const checkPostGIS = async () => {
  try {
    const result = await pool.query(`
      SELECT 
        PostGIS_version() as postgis_version,
        PostGIS_full_version() as full_version
    `);
    console.log('✅ PostGIS disponible:', result.rows[0].postgis_version);
    return true;
  } catch (err) {
    console.warn('⚠️ PostGIS no está disponible. Funciones geoespaciales limitadas.');
    return false;
  }
};

// Función para inicializar el esquema de la base de datos
export const ensureSchema = async () => {
  try {
    console.log('🔍 Verificando esquema de base de datos...');
    
    // Crear tabla usuarios si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        usuario VARCHAR(100) NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email VARCHAR(255) UNIQUE,
        nombre_completo VARCHAR(255),
        telefono VARCHAR(50),
        foto_perfil TEXT,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ultimo_acceso TIMESTAMP,
        activo BOOLEAN DEFAULT TRUE,
        preferencias JSONB DEFAULT '{}'::jsonb,
        rol VARCHAR(50) DEFAULT 'usuario'
      );
    `);
    
    // Asegurar que todas las columnas necesarias existan (migraciones)
    try {
      // Verificar y agregar columna ultimo_acceso si no existe
      await pool.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'usuarios' AND column_name = 'ultimo_acceso'
          ) THEN
            ALTER TABLE usuarios ADD COLUMN ultimo_acceso TIMESTAMP;
          END IF;
        END $$;
      `);
    } catch (colError) {
      // Ignorar error si la columna ya existe
      console.log('ℹ️ Columna ultimo_acceso ya existe o no se pudo verificar');
    }
    
    try {
      // Verificar y agregar columna rol si no existe
      await pool.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'usuarios' AND column_name = 'rol'
          ) THEN
            ALTER TABLE usuarios ADD COLUMN rol VARCHAR(50) DEFAULT 'usuario';
          END IF;
        END $$;
      `);
    } catch (colError) {
      console.log('ℹ️ Columna rol ya existe o no se pudo verificar');
    }
    
    // Crear índices para usuarios
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_usuarios_usuario ON usuarios(usuario);
      CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
      CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
    `);
    
    // Crear tabla rutas si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rutas (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        color VARCHAR(7) DEFAULT '#0066CC',
        numero_ruta VARCHAR(50) NOT NULL UNIQUE,
        empresa VARCHAR(255),
        tipo VARCHAR(50) DEFAULT 'Bus',
        tarifa DECIMAL(10, 2) DEFAULT 0.25,
        horario_inicio TIME DEFAULT '05:00:00',
        horario_fin TIME DEFAULT '21:00:00',
        frecuencia_minutos INTEGER DEFAULT 15,
        activa BOOLEAN DEFAULT TRUE,
        geometry TEXT,
        longitud_km DECIMAL(10, 2),
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Crear tabla paradas si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS paradas (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(50) UNIQUE,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        direccion VARCHAR(255),
        latitud DECIMAL(10, 8) NOT NULL,
        longitud DECIMAL(11, 8) NOT NULL,
        zona VARCHAR(100),
        tipo VARCHAR(50) DEFAULT 'Regular',
        tiene_techo BOOLEAN DEFAULT FALSE,
        tiene_asientos BOOLEAN DEFAULT FALSE,
        accesible BOOLEAN DEFAULT FALSE,
        activa BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Crear tabla parada_ruta si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS parada_ruta (
        id SERIAL PRIMARY KEY,
        id_parada INTEGER REFERENCES paradas(id) ON DELETE CASCADE,
        id_ruta INTEGER REFERENCES rutas(id) ON DELETE CASCADE,
        orden INTEGER NOT NULL,
        direccion VARCHAR(50) DEFAULT 'ida',
        distancia_km DECIMAL(10, 2),
        tiempo_estimado_minutos INTEGER,
        UNIQUE(id_parada, id_ruta, direccion, orden)
      );
    `);
    
    // Crear tabla historial_busquedas si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS historial_busquedas (
        id SERIAL PRIMARY KEY,
        id_usuario INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        ruta VARCHAR(200),
        numero_ruta VARCHAR(50),
        parada VARCHAR(200),
        fecha_busqueda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        latitud_origen DECIMAL(10, 8),
        longitud_origen DECIMAL(11, 8),
        latitud_destino DECIMAL(10, 8),
        longitud_destino DECIMAL(11, 8),
        tipo_busqueda VARCHAR(50) DEFAULT 'general',
        metadata JSONB DEFAULT '{}'::jsonb
      );
    `);
    
    // Crear índices para rutas
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_rutas_numero ON rutas(numero_ruta);
      CREATE INDEX IF NOT EXISTS idx_rutas_activa ON rutas(activa) WHERE activa = TRUE;
    `);
    
    // Crear índices para paradas
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_paradas_codigo ON paradas(codigo);
      CREATE INDEX IF NOT EXISTS idx_paradas_activa ON paradas(activa) WHERE activa = TRUE;
    `);
    
    // Crear índices para parada_ruta
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_parada_ruta_parada ON parada_ruta(id_parada);
      CREATE INDEX IF NOT EXISTS idx_parada_ruta_ruta ON parada_ruta(id_ruta);
    `);
    
    console.log('✅ Esquema completo verificado/creado');
    return true;
  } catch (err) {
    console.error('❌ Error al crear esquema:', err);
    console.error('Detalles del error:', err.message);
    return false;
  }
};

// Función para crear índices optimizados si no existen
export const ensureIndexes = async () => {
  try {
    console.log('🔍 Verificando índices optimizados...');
    
    // Índices para usuarios (búsquedas frecuentes)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_usuarios_usuario ON usuarios(usuario);
      CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
      CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
    `);
    
    // Índices para historial (búsquedas por usuario y fecha)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_historial_usuario ON historial_busquedas(id_usuario);
      CREATE INDEX IF NOT EXISTS idx_historial_fecha ON historial_busquedas(fecha_busqueda DESC);
      CREATE INDEX IF NOT EXISTS idx_historial_coords ON historial_busquedas 
        USING GIST(ST_MakePoint(longitud_origen, latitud_origen));
    `);
    
    // Índices geoespaciales para rutas (crítico para rendimiento)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_rutas_numero ON rutas(numero_ruta);
      CREATE INDEX IF NOT EXISTS idx_rutas_activa ON rutas(activa) WHERE activa = TRUE;
      CREATE INDEX IF NOT EXISTS idx_rutas_geometry ON rutas USING GIST(geometry);
      CREATE INDEX IF NOT EXISTS idx_rutas_empresa ON rutas(empresa);
    `);
    
    // Índices geoespaciales para paradas (crítico para búsquedas cercanas)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_paradas_codigo ON paradas(codigo);
      CREATE INDEX IF NOT EXISTS idx_paradas_activa ON paradas(activa) WHERE activa = TRUE;
      CREATE INDEX IF NOT EXISTS idx_paradas_ubicacion ON paradas USING GIST(ubicacion);
      CREATE INDEX IF NOT EXISTS idx_paradas_zona ON paradas(zona);
      CREATE INDEX IF NOT EXISTS idx_paradas_nombre ON paradas USING gin(to_tsvector('spanish', nombre));
    `);
    
    // Índices para relaciones parada-ruta
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_parada_ruta_parada ON parada_ruta(id_parada);
      CREATE INDEX IF NOT EXISTS idx_parada_ruta_ruta ON parada_ruta(id_ruta);
      CREATE INDEX IF NOT EXISTS idx_parada_ruta_orden ON parada_ruta(id_ruta, orden);
    `);
    
    console.log('✅ Índices verificados/creados exitosamente');
    return true;
  } catch (err) {
    console.error('❌ Error al crear índices:', err);
    return false;
  }
};

// Función para obtener estadísticas de la base de datos
export const getDatabaseStats = async () => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM usuarios) as total_usuarios,
        (SELECT COUNT(*) FROM rutas WHERE activa = TRUE) as rutas_activas,
        (SELECT COUNT(*) FROM paradas WHERE activa = TRUE) as paradas_activas,
        (SELECT COUNT(*) FROM historial_busquedas) as total_busquedas,
        pg_size_pretty(pg_database_size(current_database())) as db_size
    `);
    return stats.rows[0];
  } catch (err) {
    console.error('Error al obtener estadísticas:', err);
    return null;
  }
};

// Exportar por defecto para compatibilidad
export default pool;


