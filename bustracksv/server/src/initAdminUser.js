import bcrypt from 'bcrypt';
import { pool } from './db.js';

/**
 * Función para inicializar el usuario admin_celeste si no existe
 * Se ejecuta al iniciar el servidor
 */
export async function initAdminCeleste() {
  try {
    const usuario = 'admin_celeste';
    const password = '123456';
    const email = 'celeste.mendez007@gmail.com';
    const nombre_completo = 'Celeste Mendez';
    const rol = 'gobierno';

    // Verificar si el usuario ya existe
    const existingUser = await pool.query(
      "SELECT id FROM usuarios WHERE usuario = $1",
      [usuario]
    );

    if (existingUser.rows.length > 0) {
      console.log('✅ Usuario admin_celeste ya existe en la base de datos');
      return;
    }

    // Crear el usuario si no existe
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO usuarios (usuario, password, email, nombre_completo, rol, activo) VALUES ($1, $2, $3, $4, $5, 1) RETURNING id",
      [usuario, hashedPassword, email, nombre_completo, rol]
    );

    console.log('✅ Usuario admin_celeste creado automáticamente');
    console.log(`   ID: ${result.rows[0].id}`);
    console.log(`   Usuario: ${usuario}`);
    console.log(`   Contraseña: ${password}`);
    console.log(`   Rol: ${rol}`);
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer acceso!');
  } catch (error) {
    // No fallar si hay error, solo loggear
    console.error('⚠️  Advertencia: No se pudo inicializar admin_celeste:', error.message);
  }
}

