import { pool } from './src/db.js';

console.log('📝 Insertando datos de prueba...\n');

async function insertarDatos() {
  try {
    // Insertar rutas de prueba
    console.log('🚌 Insertando rutas...');
    
    const rutas = [
      { numero: '101', nombre: 'Terminal Centro - Soyapango', empresa: 'TransBus SA', tarifa: 0.25 },
      { numero: '102', nombre: 'Terminal Centro - Mejicanos', empresa: 'TransBus SA', tarifa: 0.25 },
      { numero: '52', nombre: 'Metrocentro - Universidad', empresa: 'Rapiditos', tarifa: 0.30 },
      { numero: '30', nombre: 'Terminal Oriente - Santa Tecla', empresa: 'Expreso del Sur', tarifa: 0.35 },
      { numero: '44', nombre: 'Centro - Cuscatancingo', empresa: 'Microbus Express', tarifa: 0.25 }
    ];
    
    for (const ruta of rutas) {
      await pool.query(
        `INSERT INTO rutas (numero_ruta, nombre, empresa, tarifa, tipo, activa) 
         VALUES ($1, $2, $3, $4, 'Bus', 1)`,
        [ruta.numero, ruta.nombre, ruta.empresa, ruta.tarifa]
      );
      console.log(`  ✅ Ruta ${ruta.numero}: ${ruta.nombre}`);
    }
    
    // Insertar paradas de prueba
    console.log('\n📍 Insertando paradas...');
    
    const paradas = [
      { codigo: 'TC-001', nombre: 'Terminal Centro', lat: 13.6929, lng: -89.2182, zona: 'Centro' },
      { codigo: 'MT-001', nombre: 'Metrocentro', lat: 13.6980, lng: -89.2262, zona: 'San Salvador' },
      { codigo: 'UES-001', nombre: 'Universidad de El Salvador', lat: 13.7162, lng: -89.2040, zona: 'San Salvador' },
      { codigo: 'HR-001', nombre: 'Hospital Rosales', lat: 13.7080, lng: -89.2140, zona: 'Centro' },
      { codigo: 'SP-001', nombre: 'Soyapango Plaza', lat: 13.7100, lng: -89.1400, zona: 'Soyapango' },
      { codigo: 'TO-001', nombre: 'Terminal de Oriente', lat: 13.7150, lng: -89.1600, zona: 'San Salvador' },
      { codigo: 'ST-001', nombre: 'Santa Tecla Centro', lat: 13.6770, lng: -89.2797, zona: 'Santa Tecla' },
      { codigo: 'MJ-001', nombre: 'Mejicanos Plaza', lat: 13.7400, lng: -89.2100, zona: 'Mejicanos' },
      { codigo: 'CU-001', nombre: 'Cuscatancingo', lat: 13.7360, lng: -89.1810, zona: 'Cuscatancingo' },
      { codigo: 'AG-001', nombre: 'Plaza Aguilares', lat: 13.9550, lng: -89.1900, zona: 'Aguilares' }
    ];
    
    for (const parada of paradas) {
      await pool.query(
        `INSERT INTO paradas (codigo, nombre, latitud, longitud, zona, tipo, activa) 
         VALUES ($1, $2, $3, $4, $5, 'Regular', 1)`,
        [parada.codigo, parada.nombre, parada.lat, parada.lng, parada.zona]
      );
      console.log(`  ✅ ${parada.nombre} (${parada.codigo})`);
    }
    
    // Relacionar rutas con paradas
    console.log('\n🔗 Relacionando rutas con paradas...');
    
    // Ruta 101: Terminal Centro - Soyapango
    const ruta101 = await pool.query("SELECT id FROM rutas WHERE numero_ruta = '101'");
    const paradaTC = await pool.query("SELECT id FROM paradas WHERE codigo = 'TC-001'");
    const paradaSP = await pool.query("SELECT id FROM paradas WHERE codigo = 'SP-001'");
    const paradaMT = await pool.query("SELECT id FROM paradas WHERE codigo = 'MT-001'");
    
    if (ruta101.rows[0] && paradaTC.rows[0] && paradaSP.rows[0]) {
      await pool.query(
        `INSERT INTO parada_ruta (id_ruta, id_parada, orden, tiempo_estimado_minutos) 
         VALUES ($1, $2, 1, 0)`,
        [ruta101.rows[0].id, paradaTC.rows[0].id]
      );
      await pool.query(
        `INSERT INTO parada_ruta (id_ruta, id_parada, orden, tiempo_estimado_minutos) 
         VALUES ($1, $2, 2, 15)`,
        [ruta101.rows[0].id, paradaMT.rows[0].id]
      );
      await pool.query(
        `INSERT INTO parada_ruta (id_ruta, id_parada, orden, tiempo_estimado_minutos) 
         VALUES ($1, $2, 3, 30)`,
        [ruta101.rows[0].id, paradaSP.rows[0].id]
      );
      console.log('  ✅ Ruta 101 conectada');
    }
    
    // Ruta 52: Metrocentro - Universidad
    const ruta52 = await pool.query("SELECT id FROM rutas WHERE numero_ruta = '52'");
    const paradaUES = await pool.query("SELECT id FROM paradas WHERE codigo = 'UES-001'");
    
    if (ruta52.rows[0] && paradaMT.rows[0] && paradaUES.rows[0]) {
      await pool.query(
        `INSERT INTO parada_ruta (id_ruta, id_parada, orden, tiempo_estimado_minutos) 
         VALUES ($1, $2, 1, 0)`,
        [ruta52.rows[0].id, paradaMT.rows[0].id]
      );
      await pool.query(
        `INSERT INTO parada_ruta (id_ruta, id_parada, orden, tiempo_estimado_minutos) 
         VALUES ($1, $2, 2, 20)`,
        [ruta52.rows[0].id, paradaUES.rows[0].id]
      );
      console.log('  ✅ Ruta 52 conectada');
    }
    
    console.log('\n✅ Datos de prueba insertados correctamente!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error al insertar datos:', error);
    process.exit(1);
  }
}

insertarDatos();



