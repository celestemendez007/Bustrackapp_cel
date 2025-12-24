import { pool, testConnection } from './src/db.js';
import bcrypt from 'bcrypt';

const testLogin = async () => {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await testConnection();

    const usuario = 'admin';
    const password = 'admin123';

    console.log(`\n🔍 Probando login para usuario: ${usuario}`);
    
    // Buscar usuario
    const result = await pool.query(
      "SELECT * FROM usuarios WHERE usuario = $1",
      [usuario]
    );

    console.log(`📊 Resultado de la consulta:`);
    console.log(`   Filas encontradas: ${result.rows ? result.rows.length : 0}`);

    if (result.rows && result.rows.length > 0) {
      const user = result.rows[0];
      console.log(`\n✅ Usuario encontrado:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Usuario: ${user.usuario}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Rol: ${user.rol || 'N/A'}`);
      console.log(`   Password hash: ${user.password ? user.password.substring(0, 20) + '...' : 'N/A'}`);

      // Verificar contraseña
      if (user.password) {
        console.log(`\n🔐 Verificando contraseña...`);
        const validPassword = await bcrypt.compare(password, user.password);
        console.log(`   Contraseña válida: ${validPassword ? '✅ SÍ' : '❌ NO'}`);
        
        if (validPassword) {
          console.log(`\n✅ Login exitoso!`);
          console.log(`   El usuario puede iniciar sesión correctamente.`);
        } else {
          console.log(`\n❌ La contraseña no coincide.`);
          console.log(`   Contraseña ingresada: ${password}`);
          console.log(`   Hash en BD: ${user.password}`);
        }
      } else {
        console.log(`\n❌ El usuario no tiene contraseña en la base de datos.`);
      }
    } else {
      console.log(`\n❌ Usuario "${usuario}" NO encontrado en la base de datos.`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

testLogin();






