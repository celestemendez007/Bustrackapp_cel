// Script para encontrar la contraseña correcta de PostgreSQL
import pkg from 'pg';
const { Client } = pkg;

const passwordsToTest = [
  '',           // Sin contraseña
  'postgres',   // Contraseña por defecto
  'admin',      
  '1234',
  'password',
  'postgres123',
  'admin123',
  '12345678',
  'root',
  'Postgres',
  'Admin',
  '123456',
  'qwerty',
  'asdf1234',
];

console.log('🔍 Buscando la contraseña correcta de PostgreSQL...\n');
console.log('Probando con:');
console.log('- Host: localhost');
console.log('- Puerto: 5432');
console.log('- Base de datos: postgres (base de datos por defecto)');
console.log('- Usuario: postgres\n');

async function testPassword(password) {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'postgres', // Intentar con la base de datos por defecto
    user: 'postgres',
    password: password,
  });

  try {
    await client.connect();
    await client.end();
    return true;
  } catch (error) {
    return false;
  }
}

async function findPassword() {
  for (let i = 0; i < passwordsToTest.length; i++) {
    const password = passwordsToTest[i];
    const displayPassword = password === '' ? '(vacía)' : password;
    
    process.stdout.write(`🔄 Probando: ${displayPassword}...`);
    
    const result = await testPassword(password);
    
    if (result) {
      console.log(' ✅ ¡FUNCIONA!\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ ¡CONTRASEÑA ENCONTRADA!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('La contraseña de PostgreSQL es:', password === '' ? '(vacía)' : password);
      console.log('\n📝 Actualiza tu archivo .env con:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`DB_PASSWORD=${password}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return password;
    } else {
      console.log(' ❌');
    }
  }
  
  console.log('\n❌ No se encontró la contraseña en la lista de contraseñas comunes.');
  console.log('\n🔧 Opciones:');
  console.log('1. Resetea la contraseña siguiendo: RESETEAR_PASSWORD_POSTGRES.md');
  console.log('2. Verifica la contraseña en pgAdmin');
  
  return null;
}

findPassword();




