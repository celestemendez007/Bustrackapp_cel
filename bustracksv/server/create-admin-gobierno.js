import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '.env') });

// Detectar si usar cloud o local (prioridad: DATABASE_URL > DB_HOST > local)
const useCloud = !!(process.env.DATABASE_URL || process.env.DB_HOST);

const createAdminGobierno = async () => {
  try {
    console.log('🔐 Creando usuario administrador de gobierno...\n');
    
    // Importar base de datos según el modo
    let pool, testConnection;
    
    if (useCloud) {
      console.log('☁️ Modo Cloud: Usando PostgreSQL');
      const dbCloud = await import('./src/db-cloud.js');
      pool = dbCloud.pool;
      testConnection = dbCloud.testConnection;
      
      // Asegurar que el esquema existe
      if (dbCloud.ensureSchema) {
        await dbCloud.ensureSchema();
      }
    } else {
      console.log('💾 Modo Local: Usando SQLite');
      const dbLocal = await import('./src/db.js');
      pool = dbLocal.pool;
      testConnection = dbLocal.testConnection;
    }
    
    console.log('Conectando a la base de datos...');
    await testConnection();

    // Credenciales del usuario admin de gobierno
    const usuario = 'admin_gobierno';
    const password = 'Gobierno2025!';
    const email = 'admin@gobierno.sv';
    const nombre_completo = 'Administrador de Gobierno';
    const rol = 'admin';

    // Verificar si el usuario ya existe (por usuario o email)
    const existingUser = await pool.query(
      "SELECT id, usuario, email FROM usuarios WHERE usuario = $1 OR email = $2",
      [usuario, email]
    );

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser.rows.length > 0) {
      // Actualizar el usuario existente a gobierno
      const existing = existingUser.rows[0];
      await pool.query(
        "UPDATE usuarios SET password = $1, rol = $2, email = $3, nombre_completo = $4, usuario = $5 WHERE id = $6",
        [hashedPassword, rol, email, nombre_completo, usuario, existing.id]
      );
      console.log('✅ Usuario administrador de gobierno actualizado exitosamente');
      console.log(`   Usuario: ${usuario}`);
      console.log(`   Contraseña: ${password}`);
      console.log(`   Rol: ${rol}`);
      console.log(`   (Usuario existente actualizado)`);
    } else {
      // Crear nuevo usuario admin de gobierno
      await pool.query(
        "INSERT INTO usuarios (usuario, password, email, nombre_completo, rol, activo) VALUES ($1, $2, $3, $4, $5, $6)",
        [usuario, hashedPassword, email, nombre_completo, rol, true]
      );
      console.log('✅ Usuario administrador de gobierno creado exitosamente');
      console.log(`   Usuario: ${usuario}`);
      console.log(`   Contraseña: ${password}`);
      console.log(`   Rol: ${rol}`);
    }

    console.log('\n📋 Credenciales de acceso:');
    if (useCloud) {
      console.log(`   URL: https://bustrackapp-cel.onrender.com/admin/login`);
    } else {
      console.log(`   URL: http://localhost:5173/admin/login`);
    }
    console.log(`   Usuario: ${usuario}`);
    console.log(`   Contraseña: ${password}`);
    console.log(`   Rol: ${rol}`);
    console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer acceso!');
    console.log('   Usa una contraseña segura y única.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear usuario administrador de gobierno:', error);
    console.error('Detalles:', error.message);
    process.exit(1);
  }
};

createAdminGobierno();

