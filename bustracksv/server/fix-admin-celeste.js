// Script para crear/corregir el usuario admin_celeste en PostgreSQL
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pkg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '.env') });

const { Pool } = pkg;

// Crear pool de conexión
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') 
    ? { rejectUnauthorized: false } 
    : false,
});

const fixAdminUser = async () => {
  try {
    console.log('🔄 Conectando a PostgreSQL...');
    
    // Probar conexión
    const testResult = await pool.query('SELECT NOW()');
    console.log('✅ Conectado a PostgreSQL:', testResult.rows[0].now);

    const usuario = 'admin_celeste';
    const password = '123456';
    const email = 'celeste.mendez007@gmail.com';
    const nombre_completo = 'Celeste Mendez';

    console.log(`\n🔍 Verificando usuario: ${usuario}`);

    // Verificar si existe la columna 'rol'
    try {
      await pool.query(`
        ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'usuario'
      `);
      console.log('✅ Columna "rol" verificada/creada');
    } catch (err) {
      if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
        throw err;
      }
      console.log('✅ Columna "rol" ya existe');
    }

    // Verificar si el usuario existe
    const existingUser = await pool.query(
      "SELECT id, usuario, email, rol FROM usuarios WHERE usuario = $1",
      [usuario]
    );

    // Generar hash de la contraseña
    console.log('🔐 Generando hash de la contraseña...');
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser.rows.length > 0) {
      console.log('✅ Usuario encontrado, actualizando...');
      
      // Actualizar usuario existente
      await pool.query(
        `UPDATE usuarios 
         SET password = $1, 
             rol = $2, 
             email = $3,
             nombre_completo = $4,
             activo = true
         WHERE usuario = $5`,
        [hashedPassword, 'admin', email, nombre_completo, usuario]
      );
      
      console.log('✅ Usuario actualizado exitosamente');
    } else {
      console.log('➕ Usuario no existe, creando nuevo usuario...');
      
      // Crear nuevo usuario
      await pool.query(
        `INSERT INTO usuarios (usuario, password, email, nombre_completo, activo, rol) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [usuario, hashedPassword, email, nombre_completo, true, 'admin']
      );
      
      console.log('✅ Usuario creado exitosamente');
    }

    // Verificar resultado final
    const finalCheck = await pool.query(
      "SELECT usuario, email, rol, activo FROM usuarios WHERE usuario = $1",
      [usuario]
    );

    console.log('\n✅ Usuario configurado correctamente:');
    console.log('   Usuario:', finalCheck.rows[0].usuario);
    console.log('   Email:', finalCheck.rows[0].email);
    console.log('   Rol:', finalCheck.rows[0].rol);
    console.log('   Activo:', finalCheck.rows[0].activo);

    console.log('\n🔑 Credenciales de acceso:');
    console.log('   Usuario: admin_celeste');
    console.log('   Contraseña: 123456');
    console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer acceso!');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.code === '42P01') {
      console.error('\n💡 La tabla "usuarios" no existe. Necesitas ejecutar init.sql primero.');
    }
    
    await pool.end();
    process.exit(1);
  }
};

fixAdminUser();





