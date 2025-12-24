// Script de prueba para verificar conexión a PostgreSQL
import dotenv from 'dotenv';
import pkg from 'pg';
const { Client } = pkg;

// Cargar variables de entorno
dotenv.config();

console.log('📋 Configuración leída del .env:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' + process.env.DB_PASSWORD.slice(-3) : 'NO DEFINIDA');
console.log('Longitud de password:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);
console.log('');

// Intentar conexión
const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bustracksv',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

console.log('🔄 Intentando conectar...\n');

try {
  await client.connect();
  console.log('✅ ¡CONEXIÓN EXITOSA!');
  
  const result = await client.query('SELECT version()');
  console.log('📊 PostgreSQL version:', result.rows[0].version);
  
  await client.end();
  process.exit(0);
} catch (error) {
  console.log('❌ ERROR DE CONEXIÓN:');
  console.log('Código:', error.code);
  console.log('Mensaje:', error.message);
  console.log('\n🔍 Posibles causas:');
  
  if (error.code === '28P01') {
    console.log('- ❌ La contraseña es incorrecta');
    console.log('- Verifica que no haya espacios antes o después');
    console.log('- Verifica que no tenga comillas ("contraseña" está mal, debe ser: contraseña)');
  } else if (error.code === 'ECONNREFUSED') {
    console.log('- ❌ PostgreSQL no está corriendo');
  } else if (error.code === '3D000') {
    console.log('- ❌ La base de datos no existe');
  }
  
  process.exit(1);
}




