import { pool, testConnection } from './src/db.js';

const verificarUsuario = async () => {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await testConnection();

    console.log('🔍 Buscando usuario "admin"...');
    const result = await pool.query(
      "SELECT id, usuario, email, rol FROM usuarios WHERE usuario = $1",
      ['admin']
    );

    if (result.rows && result.rows.length > 0) {
      console.log('✅ Usuario encontrado:');
      console.log('   ID:', result.rows[0].id);
      console.log('   Usuario:', result.rows[0].usuario);
      console.log('   Email:', result.rows[0].email || 'N/A');
      console.log('   Rol:', result.rows[0].rol || 'N/A');
    } else {
      console.log('❌ Usuario "admin" NO encontrado en la base de datos');
    }

    // Listar todos los usuarios
    console.log('\n📋 Todos los usuarios en la base de datos:');
    const allUsers = await pool.query(
      "SELECT id, usuario, email, rol FROM usuarios ORDER BY id"
    );
    
    if (allUsers.rows && allUsers.rows.length > 0) {
      allUsers.rows.forEach(user => {
        console.log(`   - ID: ${user.id}, Usuario: ${user.usuario}, Rol: ${user.rol || 'N/A'}`);
      });
    } else {
      console.log('   No hay usuarios en la base de datos');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

verificarUsuario();






