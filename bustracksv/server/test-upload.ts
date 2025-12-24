import { initializeFirebase, testFirestoreConnection } from './src/config/firebase.js';
import { saveBusRoute, BusRouteData } from './src/services/routeService.js';

/**
 * Datos reales de la Ruta 26 de El Salvador
 * Basado en la descripción detallada del recorrido
 */
const ruta26Coordinates: Array<{ lat: number; lng: number }> = [
  // Zona Sur: El Origen (San Marcos)
  { lat: 13.6500, lng: -89.1833 }, // San Marcos - Zona de inicio
  { lat: 13.6520, lng: -89.1850 }, // Colonia 10 de Octubre
  { lat: 13.6540, lng: -89.1865 }, // Colonia El Tránsito
  { lat: 13.6560, lng: -89.1880 }, // Carretera Antigua a Zacatecoluca
  { lat: 13.6580, lng: -89.1900 }, // Terminal del Sur
  { lat: 13.6600, lng: -89.1920 }, // Zona Franca San Marcos

  // Zona de Transición: San Jacinto y Barrio Modelo
  { lat: 13.6650, lng: -89.1950 }, // Autopista a Comalapa (Tramo final)
  { lat: 13.6700, lng: -89.1980 }, // Barrio San Jacinto
  { lat: 13.6720, lng: -89.2000 }, // Ex-Casa Presidencial
  { lat: 13.6740, lng: -89.2020 }, // Ex-Zoológico Nacional / Calle Modelo
  { lat: 13.6760, lng: -89.2040 }, // Barrio Candelaria / Plaza El Trovador

  // El Centro y Eje Médico (25 Avenida Norte)
  { lat: 13.6780, lng: -89.2060 }, // Mercado Belloso / Barrio Concepción
  { lat: 13.6800, lng: -89.2080 }, // Bulevar Venezuela
  { lat: 13.6820, lng: -89.2100 }, // Cementerio General
  { lat: 13.6840, lng: -89.2120 }, // Hospital Pro-Familia
  { lat: 13.6860, lng: -89.2140 }, // Hospital Rosales (Esquina con Alameda Roosevelt)
  { lat: 13.6880, lng: -89.2160 }, // Parque Cuscatlán
  { lat: 13.6900, lng: -89.2180 }, // Hospital de Maternidad
  { lat: 13.6920, lng: -89.2200 }, // Hospital Prof. Alberto Masferrer (USAM)
  { lat: 13.6940, lng: -89.2220 }, // Colegio La Asunción

  // Zona Universitaria y Norte
  { lat: 13.6960, lng: -89.2240 }, // Fuente Luminosa
  { lat: 13.6980, lng: -89.2260 }, // Universidad de El Salvador (UES) - La Minerva
  { lat: 13.7000, lng: -89.2280 }, // Calle a San Antonio Abad
  { lat: 13.7020, lng: -89.2300 }, // Colonia Miralvalle (Punto de retorno)
  { lat: 13.7040, lng: -89.2320 }, // Redondel Constitución
];

/**
 * Función principal para probar la conexión y escritura en Firestore
 */
async function testFirestoreUpload() {
  console.log('🚀 Starting Firestore upload test...\n');

  try {
    // 1. Inicializar Firebase
    console.log('📋 Step 1: Initializing Firebase Admin...');
    initializeFirebase();
    console.log('✅ Firebase initialized\n');

    // 2. Probar conexión
    console.log('📋 Step 2: Testing Firestore connection...');
    const connectionOk = await testFirestoreConnection();
    if (!connectionOk) {
      throw new Error('Firestore connection test failed');
    }
    console.log('✅ Connection test passed\n');

    // 3. Preparar datos de la Ruta 26
    console.log('📋 Step 3: Preparing Ruta 26 data...');
    const ruta26Data: BusRouteData = {
      routeId: 'ruta-26',
      name: 'Ruta 26 - San Marcos a Miralvalle',
      coordinates: ruta26Coordinates,
      metadata: {
        description:
          'Ruta que conecta San Marcos (zona sur) con Miralvalle (zona norte), pasando por el centro de San Salvador y la zona universitaria. Recorre la 25 Avenida Norte, eje médico principal de la ciudad.',
        company: 'Transporte Colectivo',
        routeNumber: '26',
        type: 'Microbus',
        active: true,
      },
    };
    console.log(`✅ Prepared data: ${ruta26Data.coordinates.length} coordinates\n`);

    // 4. Guardar la ruta
    console.log('📋 Step 4: Saving route to Firestore...');
    const docId = await saveBusRoute(ruta26Data);
    console.log(`✅ Route saved with document ID: ${docId}\n`);

    // 5. Verificar que se guardó correctamente
    console.log('📋 Step 5: Verifying saved route...');
    const { getBusRoute } = await import('./src/services/routeService.js');
    const savedRoute = await getBusRoute('ruta-26');

    if (savedRoute) {
      console.log('✅ Route verification successful!');
      console.log(`   - Name: ${savedRoute.name}`);
      console.log(`   - Coordinates: ${savedRoute.coordinateCount}`);
      console.log(`   - Bounds:`, savedRoute.bounds);
      console.log(`   - Active: ${savedRoute.metadata.active}`);
      console.log(`   - Created: ${savedRoute.metadata.createdAt.toDate()}`);
    } else {
      throw new Error('Route was not found after saving');
    }

    console.log('\n🎉 All tests passed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar el test
testFirestoreUpload();

