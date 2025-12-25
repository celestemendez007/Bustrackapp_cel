// Script de prueba para verificar conexión a PostgreSQL
import dotenv from 'dotenv';
import pkg from 'pg';
const { Client } = pkg;

// Cargar variables de entorno
dotenv.config();

console.log('📋 Verificando configuración...\n');

// Priorizar DATABASE_URL (formato usado en Render, Heroku, etc.)
const useDatabaseURL = !!process.env.DATABASE_URL;

if (useDatabaseURL) {
  console.log('✅ DATABASE_URL encontrada (formato de conexión completa)');
  // Ocultar contraseña en el log por seguridad
  const urlForLog = process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':***@');
  console.log('   URL:', urlForLog);
} else {
  console.log('📋 Usando variables individuales:');
  console.log('   DB_HOST:', process.env.DB_HOST || 'NO DEFINIDA');
  console.log('   DB_PORT:', process.env.DB_PORT || 'NO DEFINIDA');
  console.log('   DB_NAME:', process.env.DB_NAME || 'NO DEFINIDA');
  console.log('   DB_USER:', process.env.DB_USER || 'NO DEFINIDA');
  console.log('   DB_PASSWORD:', process.env.DB_PASSWORD ? '***' + process.env.DB_PASSWORD.slice(-3) : 'NO DEFINIDA');
}

console.log('\n🔄 Intentando conectar...\n');

// Crear cliente con DATABASE_URL o variables individuales
const client = useDatabaseURL
  ? new Client({ connectionString: process.env.DATABASE_URL })
  : new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'bustracksv',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    });

try {
  await client.connect();
  console.log('✅ ¡CONEXIÓN EXITOSA!');
  
  const versionResult = await client.query('SELECT version()');
  console.log('📊 PostgreSQL version:', versionResult.rows[0].version.split(' ')[0] + ' ' + versionResult.rows[0].version.split(' ')[1]);
  
  const timeResult = await client.query('SELECT NOW() as now, current_database() as database');
  console.log('🕐 Hora del servidor:', timeResult.rows[0].now);
  console.log('💾 Base de datos:', timeResult.rows[0].database);
  
  // Verificar tablas existentes
  try {
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('\n📋 Tablas existentes:');
      tablesResult.rows.forEach(row => {
        console.log('   -', row.table_name);
      });
    } else {
      console.log('\n⚠️  No se encontraron tablas. Puede que necesites ejecutar init.sql');
    }
  } catch (err) {
    console.log('\n⚠️  No se pudieron listar las tablas:', err.message);
  }
  
  await client.end();
  console.log('\n✅ Conexión cerrada correctamente');
  process.exit(0);
} catch (error) {
  console.log('❌ ERROR DE CONEXIÓN:');
  console.log('   Código:', error.code);
  console.log('   Mensaje:', error.message);
  console.log('\n🔍 Posibles causas:');
  
  if (error.code === '28P01') {
    console.log('   - ❌ La contraseña es incorrecta');
    console.log('   - Verifica que no haya espacios antes o después');
    console.log('   - Verifica que no tenga comillas ("contraseña" está mal, debe ser: contraseña)');
  } else if (error.code === 'ECONNREFUSED') {
    console.log('   - ❌ PostgreSQL no está corriendo o el host/puerto es incorrecto');
    console.log('   - Verifica que el servicio esté activo en Render');
  } else if (error.code === '3D000') {
    console.log('   - ❌ La base de datos no existe');
    console.log('   - Verifica el nombre de la base de datos en DATABASE_URL');
  } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
    console.log('   - ❌ No se puede resolver el host');
    console.log('   - Verifica que la URL del host sea correcta');
  } else if (error.code === 'ETIMEDOUT') {
    console.log('   - ❌ Timeout al conectar');
    console.log('   - Verifica tu conexión a internet');
    console.log('   - Verifica que la base de datos permita conexiones externas (si estás conectando desde fuera de Render)');
  }
  
  console.log('\n💡 Consejos:');
  console.log('   - Si usas DATABASE_URL, verifica que sea una URL válida que empiece con postgresql://');
  console.log('   - Si la base de datos está en Render, usa la "Internal Database URL" para servicios en Render');
  console.log('   - Si quieres conectarte desde fuera de Render, usa la "External Connection String"');
  
  process.exit(1);
}




