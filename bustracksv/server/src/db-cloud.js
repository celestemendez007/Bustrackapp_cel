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


