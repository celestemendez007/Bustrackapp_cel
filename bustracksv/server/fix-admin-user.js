// Script para corregir el usuario admin que fue creado con contraseña en texto plano
import bcrypt from 'bcrypt';
import { pool, testConnection } from './src/db-cloud.js';

const fixAdminUser = async () => {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await testConnection();

    const usuario = 'admin_celeste';
    const password = '123456';

    // Verificar si el usuario existe
    const existingUser = await pool.query(
      "SELECT id, usuario FROM usuarios WHERE usuario = $1",
      [usuario]
    );

    if (existingUser.rows.length === 0) {
      console.log(`❌ Usuario "${usuario}" no encontrado`);
      console.log('Primero crea el usuario con el INSERT SQL');
      process.exit(1);
    }

    console.log(`✅ Usuario encontrado: ${usuario}`);

    // Agregar columna rol si no existe
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

    // Generar hash de la contraseña
    console.log('🔐 Generando hash de la contraseña...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Actualizar el usuario con el hash y el rol admin
    await pool.query(
      `UPDATE usuarios 
       SET password = $1, rol = $2 
       WHERE usuario = $3`,
      [hashedPassword, 'admin', usuario]
    );

    console.log('\n✅ Usuario corregido exitosamente!');
    console.log(`   Usuario: ${usuario}`);
    console.log(`   Contraseña: ${password}`);
    console.log(`   Rol: admin`);
    console.log('\n🔑 Credenciales de acceso:');
    console.log(`   Usuario: ${usuario}`);
    console.log(`   Contraseña: ${password}`);
    console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer acceso!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixAdminUser();





