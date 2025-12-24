import bcrypt from 'bcrypt';
import { pool, testConnection } from './src/db.js';

const createAdminUser = async () => {
  try {
    console.log('Conectando a la base de datos...');
    await testConnection();

    const usuario = 'admin';
    const password = 'admin123';
    const email = 'admin@gobierno.sv';
    const nombre_completo = 'Administrador Sistema';
    const rol = 'admin';

    // Verificar si el usuario ya existe
    const existingUser = await pool.query(
      "SELECT id FROM usuarios WHERE usuario = $1",
      [usuario]
    );

    if (existingUser.rows.length > 0) {
      // Actualizar el usuario existente a admin
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        "UPDATE usuarios SET password = $1, rol = $2 WHERE usuario = $3",
        [hashedPassword, rol, usuario]
      );
      console.log('Usuario administrador actualizado exitosamente');
      console.log(`   Usuario: ${usuario}`);
      console.log(`   Contraseña: ${password}`);
      console.log(`   Rol: ${rol}`);
    } else {
      // Crear nuevo usuario admin
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        "INSERT INTO usuarios (usuario, password, email, nombre_completo, rol) VALUES ($1, $2, $3, $4, $5)",
        [usuario, hashedPassword, email, nombre_completo, rol]
      );
      console.log('Usuario administrador creado exitosamente');
      console.log(`   Usuario: ${usuario}`);
      console.log(`   Contraseña: ${password}`);
      console.log(`   Rol: ${rol}`);
    }

    console.log('\nCredenciales de acceso:');
    console.log(`   URL: http://localhost:5173/admin/login`);
    console.log(`   Usuario: ${usuario}`);
    console.log(`   Contraseña: ${password}`);
    console.log('\nIMPORTANTE: Cambia la contraseña después del primer acceso!');

    process.exit(0);
  } catch (error) {
    console.error('Error al crear usuario administrador:', error);
    process.exit(1);
  }
};

createAdminUser();



