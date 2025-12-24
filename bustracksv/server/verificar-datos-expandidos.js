/**
 * Script de Verificación de Datos Expandidos
 * Confirma que la importación fue exitosa y muestra estadísticas
 */

import { pool } from './src/db.js';

console.log('🔍 BusTrackSV - Verificación de Datos Expandidos\n');

async function verificarDatos() {
  try {
    console.log('📊 Consultando base de datos...\n');

    // Verificar rutas
    const rutasResult = await pool.query('SELECT COUNT(*) as total FROM rutas WHERE activa = 1');
    const totalRutas = parseInt(rutasResult.rows[0].total);
    
    // Verificar paradas
    const paradasResult = await pool.query('SELECT COUNT(*) as total FROM paradas WHERE activa = 1');
    const totalParadas = parseInt(paradasResult.rows[0].total);
    
    // Verificar relaciones
    const relacionesResult = await pool.query('SELECT COUNT(*) as total FROM parada_ruta');
    const totalRelaciones = parseInt(relacionesResult.rows[0].total);
    
    // Estadísticas por empresa
    const empresasResult = await pool.query(`
      SELECT empresa, COUNT(*) as total 
      FROM rutas 
      WHERE activa = 1 
      GROUP BY empresa 
      ORDER BY total DESC
    `);
    
    // Estadísticas por tipo
    const tiposResult = await pool.query(`
      SELECT tipo, COUNT(*) as total 
      FROM rutas 
      WHERE activa = 1 
      GROUP BY tipo 
      ORDER BY total DESC
    `);
    
    // Estadísticas de paradas por zona
    const zonasResult = await pool.query(`
      SELECT zona, COUNT(*) as total 
      FROM paradas 
      WHERE activa = 1 
      GROUP BY zona 
      ORDER BY total DESC 
      LIMIT 10
    `);
    
    // Rutas más largas
    const rutasLargasResult = await pool.query(`
      SELECT r.numero_ruta, r.nombre, COUNT(pr.id) as num_paradas
      FROM rutas r
      LEFT JOIN parada_ruta pr ON r.id = pr.id_ruta
      WHERE r.activa = 1
      GROUP BY r.id, r.numero_ruta, r.nombre
      ORDER BY num_paradas DESC
      LIMIT 5
    `);
    
    // Paradas más concurridas (más rutas pasan por ahí)
    const paradasConcurridasResult = await pool.query(`
      SELECT p.codigo, p.nombre, p.zona, COUNT(pr.id_ruta) as num_rutas
      FROM paradas p
      LEFT JOIN parada_ruta pr ON p.id = pr.id_parada
      WHERE p.activa = 1
      GROUP BY p.id, p.codigo, p.nombre, p.zona
      ORDER BY num_rutas DESC
      LIMIT 5
    `);

    // Mostrar resultados
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN GENERAL');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`🚌 Total de Rutas: ${totalRutas}`);
    console.log(`📍 Total de Paradas: ${totalParadas}`);
    console.log(`🔗 Total de Conexiones: ${totalRelaciones}`);
    console.log('');

    // Validación
    let errores = 0;
    
    if (totalRutas < 80) {
      console.log(`⚠️  ADVERTENCIA: Se esperaban al menos 80 rutas, pero solo hay ${totalRutas}`);
      errores++;
    } else {
      console.log(`✅ Rutas OK (${totalRutas} >= 80)`);
    }
    
    if (totalParadas < 150) {
      console.log(`⚠️  ADVERTENCIA: Se esperaban al menos 150 paradas, pero solo hay ${totalParadas}`);
      errores++;
    } else {
      console.log(`✅ Paradas OK (${totalParadas} >= 150)`);
    }
    
    if (totalRelaciones < 100) {
      console.log(`⚠️  ADVERTENCIA: Se esperaban al menos 100 conexiones, pero solo hay ${totalRelaciones}`);
      errores++;
    } else {
      console.log(`✅ Conexiones OK (${totalRelaciones} >= 100)`);
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🏢 ESTADÍSTICAS POR EMPRESA');
    console.log('═══════════════════════════════════════════════════════════');
    empresasResult.rows.forEach(row => {
      console.log(`  ${row.empresa.padEnd(40)} ${row.total} rutas`);
    });
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚍 ESTADÍSTICAS POR TIPO');
    console.log('═══════════════════════════════════════════════════════════');
    tiposResult.rows.forEach(row => {
      console.log(`  ${row.tipo.padEnd(20)} ${row.total} rutas`);
    });
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🗺️  TOP 10 ZONAS CON MÁS PARADAS');
    console.log('═══════════════════════════════════════════════════════════');
    zonasResult.rows.forEach((row, index) => {
      console.log(`  ${(index + 1).toString().padStart(2)}. ${row.zona.padEnd(30)} ${row.total} paradas`);
    });
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🛣️  TOP 5 RUTAS MÁS LARGAS (más paradas)');
    console.log('═══════════════════════════════════════════════════════════');
    rutasLargasResult.rows.forEach((row, index) => {
      console.log(`  ${(index + 1).toString().padStart(2)}. Ruta ${row.numero_ruta.padEnd(8)} - ${row.nombre.substring(0, 40).padEnd(40)} ${row.num_paradas} paradas`);
    });
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔥 TOP 5 PARADAS MÁS CONCURRIDAS (más rutas)');
    console.log('═══════════════════════════════════════════════════════════');
    paradasConcurridasResult.rows.forEach((row, index) => {
      console.log(`  ${(index + 1).toString().padStart(2)}. ${row.nombre.padEnd(35)} (${row.zona.padEnd(20)}) ${row.num_rutas} rutas`);
    });
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    
    if (errores === 0) {
      console.log('✅ VERIFICACIÓN COMPLETA - TODO OK');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');
      console.log('🎉 ¡La base de datos expandida está funcionando correctamente!');
      console.log('');
      console.log('📝 Próximos pasos:');
      console.log('   1. Reinicia el servidor: cd server && npm start');
      console.log('   2. Abre la aplicación: http://localhost:5173');
      console.log('   3. Prueba buscar rutas entre diferentes puntos');
      console.log('');
    } else {
      console.log(`⚠️  VERIFICACIÓN CON ADVERTENCIAS (${errores} problema${errores > 1 ? 's' : ''})`);
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');
      console.log('💡 Sugerencia: Ejecuta nuevamente el script de importación:');
      console.log('   node import-expanded-data.js');
      console.log('');
    }
    
    // Probar algunas consultas de ejemplo
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🧪 PRUEBAS DE FUNCIONALIDAD');
    console.log('═══════════════════════════════════════════════════════════');
    
    // Prueba 1: Buscar rutas que pasen por una parada específica
    console.log('\n🔍 Prueba 1: Rutas que pasan por Metrocentro');
    const metrocentroTest = await pool.query(`
      SELECT DISTINCT r.numero_ruta, r.nombre
      FROM rutas r
      JOIN parada_ruta pr ON r.id = pr.id_ruta
      JOIN paradas p ON pr.id_parada = p.id
      WHERE p.codigo = 'METRO-001'
      LIMIT 5
    `);
    
    if (metrocentroTest.rows.length > 0) {
      console.log('✅ OK - Encontradas rutas:');
      metrocentroTest.rows.forEach(row => {
        console.log(`   - Ruta ${row.numero_ruta}: ${row.nombre}`);
      });
    } else {
      console.log('⚠️  No se encontraron rutas para Metrocentro');
    }
    
    // Prueba 2: Buscar paradas cercanas (simulación)
    console.log('\n🔍 Prueba 2: Paradas en zona Centro');
    const centroTest = await pool.query(`
      SELECT codigo, nombre, direccion
      FROM paradas
      WHERE zona = 'Centro'
      LIMIT 5
    `);
    
    if (centroTest.rows.length > 0) {
      console.log('✅ OK - Encontradas paradas:');
      centroTest.rows.forEach(row => {
        console.log(`   - ${row.codigo}: ${row.nombre}`);
      });
    } else {
      console.log('⚠️  No se encontraron paradas en el Centro');
    }
    
    // Prueba 3: Verificar rutas VMT
    console.log('\n🔍 Prueba 3: Rutas VMT (sistema moderno)');
    const vmtTest = await pool.query(`
      SELECT numero_ruta, nombre
      FROM rutas
      WHERE empresa = 'VMT'
      LIMIT 5
    `);
    
    if (vmtTest.rows.length > 0) {
      console.log('✅ OK - Encontradas rutas VMT:');
      vmtTest.rows.forEach(row => {
        console.log(`   - Ruta ${row.numero_ruta}: ${row.nombre}`);
      });
    } else {
      console.log('⚠️  No se encontraron rutas VMT');
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    
    process.exit(errores > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\n❌ Error durante la verificación:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar verificación
verificarDatos();








