/**
 * Script para importar RUTAS DE EJEMPLO que conecten las paradas existentes
 * Esto permitirá probar el sistema de recomendación con transbordos
 */

import { pool } from './src/db.js';

console.log('🚌 BusTrackSV - Importador de Rutas de Ejemplo\n');

// Rutas principales de San Salvador
const rutasEjemplo = [
  {
    numero_ruta: '29',
    nombre: 'Terminal Centro - Metrocentro',
    descripcion: 'Conecta el centro histórico con Boulevard de los Héroes',
    empresa: 'Buses Urbanos SV',
    tipo: 'Urbano',
    tarifa: 0.25,
    color: '#FF6B6B',
    paradas: [
      'Terminal Centro',
      'Catedral Metropolitana',
      'Parque Barrios',
      'Hospital Rosales',
      'UES',
      'Boulevard de los Héroes',
      'Metrocentro'
    ]
  },
  {
    numero_ruta: '30A',
    nombre: 'Metrocentro - Soyapango',
    descripcion: 'Ruta que conecta Metrocentro con Soyapango',
    empresa: 'Buses Urbanos SV',
    tipo: 'Urbano',
    tarifa: 0.25,
    color: '#4ECDC4',
    paradas: [
      'Metrocentro',
      'UES',
      'Mejicanos Centro',
      'Soyapango Centro',
      'Plaza Mundo'
    ]
  },
  {
    numero_ruta: '42',
    nombre: 'Terminal Centro - Santa Tecla',
    descripcion: 'Conecta el centro con Santa Tecla',
    empresa: 'Transurbano',
    tipo: 'Urbano',
    tarifa: 0.30,
    color: '#95E1D3',
    paradas: [
      'Terminal Centro',
      'Metrocentro',
      'Galerías Escalón',
      'Multiplaza',
      'Plaza Natívitas'
    ]
  },
  {
    numero_ruta: '52',
    nombre: 'UES - Multiplaza',
    descripcion: 'Conecta la Universidad con zona comercial',
    empresa: 'Buses El Salvador',
    tipo: 'Urbano',
    tarifa: 0.25,
    color: '#F38181',
    paradas: [
      'UES',
      'Metrocentro',
      'Galerías Escalón',
      'UCA',
      'Multiplaza'
    ]
  },
  {
    numero_ruta: '101',
    nombre: 'Soyapango - Antiguo Cuscatlán',
    descripcion: 'Ruta transversal',
    empresa: 'Buses Metropolitanos',
    tipo: 'Urbano',
    tarifa: 0.35,
    color: '#AA96DA',
    paradas: [
      'Soyapango Centro',
      'Mejicanos Centro',
      'Terminal Centro',
      'Metrocentro',
      'Multiplaza',
      'UCA'
    ]
  },
  {
    numero_ruta: 'C1',
    nombre: 'Circular Centro',
    descripcion: 'Ruta circular por el centro histórico',
    empresa: 'VMT',
    tipo: 'BRT',
    tarifa: 0.20,
    color: '#FCBAD3',
    paradas: [
      'Terminal Centro',
      'Catedral Metropolitana',
      'Teatro Nacional',
      'Mercado Central',
      'Hospital Rosales',
      'Terminal Centro'
    ]
  }
];

async function importarRutas() {
  try {
    console.log('🔍 Buscando paradas existentes...');
    const resultParadas = await pool.query('SELECT id, nombre FROM paradas WHERE activa = 1');
    const paradasMap = new Map(resultParadas.rows.map(p => [p.nombre, p.id]));
    console.log(`✅ ${paradasMap.size} paradas encontradas\n`);

    let rutasImportadas = 0;
    let conexionesCreadas = 0;

    for (const ruta of rutasEjemplo) {
      console.log(`\n🚌 Procesando ruta ${ruta.numero_ruta} - ${ruta.nombre}`);
      
      try {
        // 1. Insertar la ruta
        const resultRuta = await pool.query(
          `INSERT INTO rutas (numero_ruta, nombre, descripcion, empresa, tipo, tarifa, color, activa)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)
           RETURNING id`,
          [
            ruta.numero_ruta,
            ruta.nombre,
            ruta.descripcion,
            ruta.empresa,
            ruta.tipo,
            ruta.tarifa,
            ruta.color
          ]
        );

        const rutaId = resultRuta.rows[0].id;
        console.log(`   ✅ Ruta creada con ID: ${rutaId}`);

        // 2. Conectar paradas con la ruta (IDA)
        let orden = 1;
        let tiempoAcumulado = 0;
        let paradasConectadas = 0;

        for (const nombreParada of ruta.paradas) {
          const paradaId = paradasMap.get(nombreParada);
          
          if (paradaId) {
            // Tiempo estimado entre paradas (5-15 minutos)
            const tiempoSegmento = Math.floor(Math.random() * 10) + 5;
            tiempoAcumulado += tiempoSegmento;

            await pool.query(
              `INSERT INTO parada_ruta (id_parada, id_ruta, orden, direccion, tiempo_estimado_minutos)
               VALUES (?, ?, ?, ?, ?)`,
              [paradaId, rutaId, orden, 'ida', tiempoAcumulado]
            );

            paradasConectadas++;
            orden++;
          } else {
            console.log(`   ⚠️  Parada "${nombreParada}" no encontrada, omitiendo`);
          }
        }

        // 3. Conectar paradas en sentido VUELTA (orden inverso)
        orden = 1;
        tiempoAcumulado = 0;
        const paradasVuelta = [...ruta.paradas].reverse();

        for (const nombreParada of paradasVuelta) {
          const paradaId = paradasMap.get(nombreParada);
          
          if (paradaId) {
            const tiempoSegmento = Math.floor(Math.random() * 10) + 5;
            tiempoAcumulado += tiempoSegmento;

            await pool.query(
              `INSERT INTO parada_ruta (id_parada, id_ruta, orden, direccion, tiempo_estimado_minutos)
               VALUES (?, ?, ?, ?, ?)`,
              [paradaId, rutaId, orden, 'vuelta', tiempoAcumulado]
            );

            paradasConectadas++;
            orden++;
          }
        }

        console.log(`   ✅ ${paradasConectadas} paradas conectadas (ida + vuelta)`);
        rutasImportadas++;
        conexionesCreadas += paradasConectadas;

      } catch (error) {
        if (error.message && error.message.includes('UNIQUE')) {
          console.log(`   ⚠️  La ruta ${ruta.numero_ruta} ya existe, omitiendo`);
        } else {
          console.error(`   ❌ Error al importar ruta ${ruta.numero_ruta}:`, error.message);
        }
      }
    }

    // Resumen
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ IMPORTACIÓN DE RUTAS COMPLETADA');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📊 Resumen:`);
    console.log(`   🚌 Rutas importadas: ${rutasImportadas}`);
    console.log(`   🔗 Conexiones creadas: ${conexionesCreadas}`);
    console.log('\n💡 Ahora puedes probar el sistema de recomendación con transbordos!');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Mostrar algunas combinaciones de ejemplo
    console.log('📍 Ejemplos de búsquedas que ahora funcionarán:\n');
    console.log('   🔹 Terminal Centro → Multiplaza (ruta 42)');
    console.log('   🔹 Soyapango → UCA (ruta 101)');
    console.log('   🔹 Hospital Rosales → Metrocentro (ruta 29)');
    console.log('   🔹 UES → Santa Tecla (con transbordo en Metrocentro)');
    console.log('   🔹 Catedral → Multiplaza (con transbordo en Metrocentro)\n');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar
importarRutas()
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });

