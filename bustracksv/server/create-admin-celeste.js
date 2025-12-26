import bcrypt from 'bcrypt';
import { pool, testConnection } from './src/db.js';

const createAdminCeleste = async () => {
  try {
    console.log('Conectando a la base de datos...');
    await testConnection();

    const usuario = 'admin_celeste';
    const password = '123456';
    const email = 'admin_celeste@gobierno.sv';
    const nombre_completo = 'Administrador Celeste';
    const rol = 'gobierno';

    // Verificar si el usuario ya existe
    const existingUser = await pool.query(
      "SELECT id FROM usuarios WHERE usuario = $1",
      [usuario]
    );

    if (existingUser.rows.length > 0) {
      // Actualizar el usuario existente
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        "UPDATE usuarios SET password = $1, rol = $2, email = $3, nombre_completo = $4 WHERE usuario = $5",
        [hashedPassword, rol, email, nombre_completo, usuario]
      );
      console.log('✅ Usuario admin_celeste actualizado exitosamente');
      console.log(`   Usuario: ${usuario}`);
      console.log(`   Contraseña: ${password}`);
      console.log(`   Rol: ${rol}`);
    } else {
      // Crear nuevo usuario admin
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        "INSERT INTO usuarios (usuario, password, email, nombre_completo, rol, activo) VALUES ($1, $2, $3, $4, $5, 1) RETURNING id",
        [usuario, hashedPassword, email, nombre_completo, rol]
      );
      console.log('✅ Usuario admin_celeste creado exitosamente');
      console.log(`   ID: ${result.rows[0].id}`);
      console.log(`   Usuario: ${usuario}`);
      console.log(`   Contraseña: ${password}`);
      console.log(`   Rol: ${rol}`);
    }

    console.log('\n📋 Credenciales de acceso:');
    console.log(`   URL: https://bustracksv-frontend-tyf3.onrender.com/admin/login`);
    console.log(`   Usuario: ${usuario}`);
    console.log(`   Contraseña: ${password}`);
    console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer acceso!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear usuario admin_celeste:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

createAdminCeleste();

