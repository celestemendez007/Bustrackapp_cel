import { pool, testConnection } from './src/db.js';

const migrateAddRol = async () => {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await testConnection();

    console.log('📝 Verificando si la columna "rol" existe...');
    
    // Intentar agregar la columna rol si no existe
    try {
      await pool.query(`ALTER TABLE usuarios ADD COLUMN rol TEXT DEFAULT 'usuario'`);
      console.log('✅ Columna "rol" agregada exitosamente a la tabla usuarios');
    } catch (error) {
      if (error.message.includes('duplicate column') || error.message.includes('already exists')) {
        console.log('ℹ️  La columna "rol" ya existe en la tabla usuarios');
      } else {
        throw error;
      }
    }

    // Verificar que la columna existe ahora
    const checkResult = await pool.query(`
      SELECT sql FROM sqlite_master 
      WHERE type='table' AND name='usuarios'
    `);
    
    if (checkResult.rows && checkResult.rows.length > 0) {
      console.log('✅ Tabla usuarios verificada');
    }

    // Actualizar usuarios existentes sin rol a 'usuario'
    try {
      const updateResult = await pool.query(`
        UPDATE usuarios 
        SET rol = 'usuario' 
        WHERE rol IS NULL OR rol = ''
      `);
      console.log(`✅ Usuarios existentes actualizados: ${updateResult.rowsAffected || 0}`);
    } catch (error) {
      console.log('ℹ️  No se pudieron actualizar usuarios existentes (puede ser normal)');
    }

    console.log('\n✅ Migración completada exitosamente!');
    console.log('📝 Ahora puedes ejecutar: npm.cmd run create-admin');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
};

migrateAddRol();






