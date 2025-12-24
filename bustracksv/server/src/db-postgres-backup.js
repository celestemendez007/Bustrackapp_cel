import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

// Configuración mejorada de la conexión
export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 5432,
  max: 20, // máximo de conexiones
  idleTimeoutMillis: 30000, // 30 seg para cerrar conexiones inactivas
  connectionTimeoutMillis: 10000, // 10 seg para conectarse
  acquireTimeoutMillis: 10000, // 10 seg para adquirir conexión
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
});

// Manejo de errores mejorado
pool.on('error', (err, client) => {
  console.error('Error inesperado en cliente idle:', err);
  console.error('Cliente:', client);
});

// Función para probar la conexión
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Conexión a la base de datos exitosa:', result.rows[0]);
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Error al conectar con la base de datos:', err);
    return false;
  }
};
