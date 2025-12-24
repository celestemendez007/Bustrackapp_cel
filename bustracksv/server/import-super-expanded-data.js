/**
 * Script SUPER EXPANDIDO - 250+ paradas para búsqueda detallada
 * Incluye colonias específicas, barrios, puntos de referencia, iglesias, parques, etc.
 */

import { pool } from './src/db.js';

console.log('🚌 BusTrackSV - Importador SUPER EXPANDIDO');
console.log('📍 250+ paradas con detalles específicos\n');

/**
 * PARADAS SUPER EXPANDIDAS - 250+ ubicaciones
 */
const paradasSuperExpandidas = [
  // ============ ZONA CENTRO HISTÓRICO (20 paradas) ============
  { codigo: 'TC-001', nombre: 'Terminal Centro', direccion: 'Calle Rubén Darío', lat: 13.6929, lng: -89.2182, zona: 'Centro', tipo: 'Terminal' },
  { codigo: 'CAT-001', nombre: 'Catedral Metropolitana', direccion: 'Plaza Barrios', lat: 13.6983, lng: -89.2144, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'TN-001', nombre: 'Teatro Nacional', direccion: '2ª Calle Poniente', lat: 13.6959, lng: -89.2172, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'MC-001', nombre: 'Mercado Central', direccion: '8ª Calle Poniente', lat: 13.6945, lng: -89.2165, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'PN-001', nombre: 'Palacio Nacional', direccion: 'Centro Histórico', lat: 13.6985, lng: -89.2140, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'PI-001', nombre: 'Parque Infantil', direccion: 'Centro Histórico', lat: 13.6962, lng: -89.2115, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'RF-001', nombre: 'Reloj de Flores', direccion: 'Colonia Flor Blanca', lat: 13.6921, lng: -89.2198, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'MER-EXC', nombre: 'Mercado Ex-Cuartel', direccion: 'Centro', lat: 13.6910, lng: -89.2190, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'PLZ-LIB', nombre: 'Plaza Libertad', direccion: 'Centro', lat: 13.6968, lng: -89.2155, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'PLZ-BAR', nombre: 'Plaza Barrios', direccion: 'Centro', lat: 13.6984, lng: -89.2143, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'PLZ-MOR', nombre: 'Plaza Morazán', direccion: 'Centro', lat: 13.6975, lng: -89.2168, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'IGL-ERM', nombre: 'Iglesia El Ermitaño', direccion: 'Centro', lat: 13.6995, lng: -89.2177, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'IGL-ROS', nombre: 'Iglesia El Rosario', direccion: 'Centro', lat: 13.6971, lng: -89.2158, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'PAR-CUS', nombre: 'Parque Cuscatlán', direccion: 'Final Avenida La Revolución', lat: 13.6950, lng: -89.2340, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'MON-SAL', nombre: 'Monumento al Salvador del Mundo', direccion: 'Alameda Roosevelt', lat: 13.6978, lng: -89.2278, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'PAR-BAL', nombre: 'Parque Balboa', direccion: 'Centro', lat: 13.6888, lng: -89.2245, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'PLZ-GER', nombre: 'Plaza Gerardo Barrios', direccion: 'Centro', lat: 13.6983, lng: -89.2145, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'BIB-NAC', nombre: 'Biblioteca Nacional', direccion: 'Centro', lat: 13.6992, lng: -89.2175, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'MIN-HAC', nombre: 'Ministerio de Hacienda', direccion: 'Centro', lat: 13.6993, lng: -89.2168, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'CANT-001', nombre: 'Parque Candelaria', direccion: 'Centro', lat: 13.6901, lng: -89.2203, zona: 'Centro', tipo: 'Regular' },

  // ============ ZONA COMERCIAL EXTENDIDA (25 paradas) ============
  { codigo: 'METRO-001', nombre: 'Metrocentro', direccion: 'Boulevard de los Héroes', lat: 13.6929, lng: -89.2311, zona: 'San Salvador', tipo: 'TransferHub' },
  { codigo: 'PM-001', nombre: 'Plaza Mundo', direccion: 'Autopista Sur', lat: 13.6754, lng: -89.2421, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'MULTI-001', nombre: 'Multiplaza', direccion: 'Carretera Panamericana', lat: 13.6694, lng: -89.2436, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'ZR-001', nombre: 'Zona Rosa', direccion: 'Boulevard del Hipódromo', lat: 13.6994, lng: -89.2294, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'GAL-001', nombre: 'Galerías Escalón', direccion: 'Paseo General Escalón', lat: 13.6967, lng: -89.2372, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'C2-001', nombre: 'Canal 2', direccion: 'Boulevard Constitución', lat: 13.6889, lng: -89.2098, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'MODELO-001', nombre: 'Mercado Modelo', direccion: 'Boulevard Venezuela', lat: 13.6878, lng: -89.2234, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'LAS-AME', nombre: 'Las Américas Centro Comercial', direccion: 'San Salvador', lat: 13.6867, lng: -89.2298, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'PRICESM', nombre: 'PriceSmart', direccion: 'Carretera Panamericana', lat: 13.6723, lng: -89.2445, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'WALMART', nombre: 'Walmart Hiper Escalón', direccion: 'San Salvador', lat: 13.6978, lng: -89.2401, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'DESPENS', nombre: 'La Despensa de Don Juan', direccion: 'Multiplaza', lat: 13.6698, lng: -89.2440, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'SUPER-S', nombre: 'Super Selectos Escalón', direccion: 'San Salvador', lat: 13.6991, lng: -89.2385, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'PLZ-FUT', nombre: 'Plaza Futura', direccion: 'San Salvador', lat: 13.6912, lng: -89.2256, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'CNTRO-C', nombre: 'Centro Comercial San Luis', direccion: 'San Salvador', lat: 13.7001, lng: -89.2321, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'BASIL', nombre: 'Basílica del Sagrado Corazón', direccion: 'San Salvador', lat: 13.6988, lng: -89.2285, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'LA-GRA', nombre: 'La Gran Vía', direccion: 'Santa Tecla', lat: 13.6789, lng: -89.2812, zona: 'Santa Tecla', tipo: 'Regular' },
  { codigo: 'CASCAD', nombre: 'Cascadas Mall', direccion: 'Antiguo Cuscatlán', lat: 13.6701, lng: -89.2521, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'GALER2', nombre: 'Galerías Centro Comercial', direccion: 'Santa Tecla', lat: 13.6778, lng: -89.2803, zona: 'Santa Tecla', tipo: 'Regular' },
  { codigo: 'PLAZA-M', nombre: 'Plaza Merliot', direccion: 'Santa Tecla', lat: 13.6812, lng: -89.2723, zona: 'Santa Tecla', tipo: 'Regular' },
  { codigo: 'PLAZA-C', nombre: 'Plaza Crystal', direccion: 'San Salvador', lat: 13.6945, lng: -89.2290, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'PLZ-NAC', nombre: 'Plaza Nacional', direccion: 'Soyapango', lat: 13.7112, lng: -89.1456, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'MEGA-C', nombre: 'MegaCentro', direccion: 'Soyapango', lat: 13.7098, lng: -89.1478, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'PLZ-IB', nombre: 'Plaza Iberia', direccion: 'San Salvador', lat: 13.7023, lng: -89.2198, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'SUPER-M', nombre: 'Super Mall', direccion: 'San Salvador', lat: 13.6923, lng: -89.2345, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'PLAZA-V', nombre: 'Plaza Venecia', direccion: 'San Salvador', lat: 13.6956, lng: -89.2312, zona: 'San Salvador', tipo: 'Regular' },

  // ============ ZONA HOSPITALARIA EXTENDIDA (12 paradas) ============
  { codigo: 'HR-001', nombre: 'Hospital Rosales', direccion: '25 Avenida Norte', lat: 13.7051, lng: -89.2123, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'HB-001', nombre: 'Hospital Bloom', direccion: '27 Avenida Norte', lat: 13.7098, lng: -89.2087, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'HMM-001', nombre: 'Hospital Militar', direccion: 'Final Boulevard del Ejército', lat: 13.7120, lng: -89.2050, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'HME-001', nombre: 'Hospital de la Mujer', direccion: 'Colonia Médica', lat: 13.7032, lng: -89.2178, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'HOS-DIV', nombre: 'Hospital Divina Providencia', direccion: 'San Salvador', lat: 13.6923, lng: -89.2278, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'HOS-DIA', nombre: 'Hospital de Diagnóstico', direccion: 'Escalón', lat: 13.7001, lng: -89.2398, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'HOS-SEM', nombre: 'Hospital de la Policía', direccion: 'San Salvador', lat: 13.7045, lng: -89.2201, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'ISSS-SS', nombre: 'ISSS San Salvador', direccion: 'San Salvador', lat: 13.6978, lng: -89.2256, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'HOS-MAT', nombre: 'Hospital de Maternidad', direccion: 'San Salvador', lat: 13.7067, lng: -89.2134, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'HOS-PSI', nombre: 'Hospital Psiquiátrico', direccion: 'Soyapango', lat: 13.7134, lng: -89.1623, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'CRUZ-R', nombre: 'Cruz Roja Salvadoreña', direccion: 'San Salvador', lat: 13.6995, lng: -89.2245, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'CLIN-ESC', nombre: 'Clínica Escalón', direccion: 'San Salvador', lat: 13.6989, lng: -89.2412, zona: 'San Salvador', tipo: 'Regular' },

  // ============ ZONA UNIVERSITARIA EXTENDIDA (15 paradas) ============
  { codigo: 'UES-001', nombre: 'Universidad de El Salvador', direccion: 'Final 25 Avenida Norte', lat: 13.7268, lng: -89.1861, zona: 'San Salvador', tipo: 'TransferHub' },
  { codigo: 'UCA-001', nombre: 'Universidad Centroamericana', direccion: 'Boulevard de los Próceres', lat: 13.6833, lng: -89.2347, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'UDB-001', nombre: 'Universidad Don Bosco', direccion: 'Soyapango', lat: 13.7089, lng: -89.1556, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'UFG-001', nombre: 'Universidad Francisco Gavidia', direccion: 'San Salvador', lat: 13.6892, lng: -89.2267, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'UTE-001', nombre: 'UTEC Universidad', direccion: 'Antiguo Cuscatlán', lat: 13.6712, lng: -89.2534, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'UAM-001', nombre: 'Universidad Albert Einstein', direccion: 'Antiguo Cuscatlán', lat: 13.6789, lng: -89.2467, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'UPA-001', nombre: 'Universidad Panamericana', direccion: 'San Salvador', lat: 13.6945, lng: -89.2301, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'UTS-001', nombre: 'Universidad Tecnológica', direccion: 'San Salvador', lat: 13.6923, lng: -89.2334, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'UES-MED', nombre: 'UES Facultad de Medicina', direccion: 'San Salvador', lat: 13.7089, lng: -89.2156, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'UES-ING', nombre: 'UES Facultad de Ingeniería', direccion: 'San Salvador', lat: 13.7267, lng: -89.1878, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'ITCA-001', nombre: 'ITCA-FEPADE', direccion: 'Santa Tecla', lat: 13.6834, lng: -89.2801, zona: 'Santa Tecla', tipo: 'Regular' },
  { codigo: 'ESEN-001', nombre: 'Escuela Superior de Economía', direccion: 'Antiguo Cuscatlán', lat: 13.6723, lng: -89.2489, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'UPED-001', nombre: 'Universidad Pedagógica', direccion: 'San Salvador', lat: 13.6967, lng: -89.2278, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'UCRI-001', nombre: 'Universidad Cristiana', direccion: 'San Salvador', lat: 13.6878, lng: -89.2312, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'UNAB-001', nombre: 'Universidad Dr. Andrés Bello', direccion: 'San Salvador', lat: 13.6901, lng: -89.2289, zona: 'San Salvador', tipo: 'Regular' },

  // ============ TERMINALES ============
  { codigo: 'TO-001', nombre: 'Terminal de Occidente', direccion: 'Boulevard Venezuela', lat: 13.6896, lng: -89.2397, zona: 'San Salvador', tipo: 'Terminal' },
  { codigo: 'TOR-001', nombre: 'Terminal de Oriente', direccion: 'Boulevard del Ejército', lat: 13.6989, lng: -89.1654, zona: 'San Salvador', tipo: 'Terminal' },
  { codigo: 'TS-001', nombre: 'Terminal Soyapango', direccion: 'Soyapango Centro', lat: 13.7108, lng: -89.1394, zona: 'Soyapango', tipo: 'Terminal' },
  { codigo: 'TST-001', nombre: 'Terminal Santa Tecla', direccion: 'Santa Tecla Centro', lat: 13.6767, lng: -89.2794, zona: 'Santa Tecla', tipo: 'Terminal' },
  { codigo: 'TSUR-001', nombre: 'Terminal Del Sur', direccion: 'Boulevard del Ejército', lat: 13.6856, lng: -89.1987, zona: 'San Salvador', tipo: 'Terminal' },

  // ============ MEJICANOS EXPANDIDO (20 paradas) ============
  { codigo: 'MEJ-001', nombre: 'Mejicanos Centro', direccion: 'Centro de Mejicanos', lat: 13.7402, lng: -89.2029, zona: 'Mejicanos', tipo: 'TransferHub' },
  { codigo: 'PSJ-001', nombre: 'Parque San José', direccion: 'Mejicanos', lat: 13.7445, lng: -89.2058, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'COL10-001', nombre: 'Colonia 10 de Octubre', direccion: 'Mejicanos', lat: 13.7356, lng: -89.2134, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'BUENVISTA-001', nombre: 'Colonia Buena Vista', direccion: 'Mejicanos', lat: 13.7389, lng: -89.2098, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'SJACINTO-001', nombre: 'San Jacinto', direccion: 'Mejicanos', lat: 13.7423, lng: -89.2145, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'MANZANO-001', nombre: 'Colonia Manzano', direccion: 'Mejicanos', lat: 13.7478, lng: -89.2012, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'CONS-001', nombre: 'Colonia Constitución', direccion: 'Mejicanos', lat: 13.7367, lng: -89.2087, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'MARI-001', nombre: 'Colonia Mariona', direccion: 'Mejicanos', lat: 13.7456, lng: -89.2123, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'VENEZ-001', nombre: 'Colonia Venezuela', direccion: 'Mejicanos', lat: 13.7389, lng: -89.2156, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'ZAND-001', nombre: 'Colonia Zandino', direccion: 'Mejicanos', lat: 13.7412, lng: -89.2089, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'DLORES-M', nombre: 'Colonia Dolores Mejicanos', direccion: 'Mejicanos', lat: 13.7434, lng: -89.2067, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'BAIRES-M', nombre: 'Colonia Buenos Aires', direccion: 'Mejicanos', lat: 13.7445, lng: -89.2034, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'EXITO-M', nombre: 'Comunidad El Éxito', direccion: 'Mejicanos', lat: 13.7398, lng: -89.2112, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'CONAC-M', nombre: 'Colonia Los Conacastes', direccion: 'Mejicanos', lat: 13.7423, lng: -89.2178, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'GRANJ-M', nombre: 'Colonia La Granjita', direccion: 'Mejicanos', lat: 13.7467, lng: -89.2089, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'CCOAST-M', nombre: 'Colonia Costa Rica Mejicanos', direccion: 'Mejicanos', lat: 13.7112, lng: -89.2234, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'IGLMEJ', nombre: 'Iglesia de Mejicanos', direccion: 'Mejicanos', lat: 13.7403, lng: -89.2030, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'ALCALD-M', nombre: 'Alcaldía de Mejicanos', direccion: 'Mejicanos', lat: 13.7401, lng: -89.2027, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'MERCMEJ', nombre: 'Mercado de Mejicanos', direccion: 'Mejicanos', lat: 13.7405, lng: -89.2032, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'PARQMEJ', nombre: 'Parque de Mejicanos', direccion: 'Mejicanos', lat: 13.7404, lng: -89.2028, zona: 'Mejicanos', tipo: 'Regular' },

  // ============ SOYAPANGO EXPANDIDO (25 paradas) ============
  { codigo: 'SP-001', nombre: 'Soyapango Plaza', direccion: 'Plaza Soyapango', lat: 13.7124, lng: -89.1428, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'SB-001', nombre: 'Colonia San Bartolo', direccion: 'Soyapango', lat: 13.7156, lng: -89.1512, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'SIERRA-001', nombre: 'Colonia Sierra Morena', direccion: 'Soyapango', lat: 13.7189, lng: -89.1623, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'ATLACATL-001', nombre: 'Colonia Atlacatl', direccion: 'San Salvador', lat: 13.7034, lng: -89.1945, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'BRISAS-001', nombre: 'Colonia Las Brisas', direccion: 'Soyapango', lat: 13.7167, lng: -89.1589, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'CREDISA-001', nombre: 'Ciudad Credisa', direccion: 'Soyapango', lat: 13.7201, lng: -89.1534, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'UNICENTRO-001', nombre: 'Unicentro Soyapango', direccion: 'Soyapango', lat: 13.7089, lng: -89.1445, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'LPINOS-S', nombre: 'Colonia Los Pinos', direccion: 'Soyapango', lat: 13.7134, lng: -89.1567, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'SBAR2-S', nombre: 'San Bartolo 2', direccion: 'Soyapango', lat: 13.7178, lng: -89.1489, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'HILOS-S', nombre: 'Colonia Los Hilos', direccion: 'Soyapango', lat: 13.7145, lng: -89.1501, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'SOSA-S', nombre: 'Colonia Santa Sosa', direccion: 'Soyapango', lat: 13.7112, lng: -89.1478, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'AMATE-S', nombre: 'Colonia El Amate', direccion: 'Soyapango', lat: 13.7089, lng: -89.1523, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'PEPETO-S', nombre: 'Colonia Pepeto', direccion: 'Soyapango', lat: 13.7123, lng: -89.1512, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'PRESA-S', nombre: 'Colonia La Presa', direccion: 'Soyapango', lat: 13.7167, lng: -89.1534, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'SMIGUE-S', nombre: 'Colonia San Miguel', direccion: 'Soyapango', lat: 13.7098, lng: -89.1489, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'SMIGUE2-S', nombre: 'San Miguel 2', direccion: 'Soyapango', lat: 13.7134, lng: -89.1601, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'RENACER-S', nombre: 'Colonia El Renacer', direccion: 'Soyapango', lat: 13.7089, lng: -89.1567, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'LAGUNAS-S', nombre: 'Colonia Las Lagunas', direccion: 'Soyapango', lat: 13.7156, lng: -89.1456, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'PARAISO-S', nombre: 'Colonia Paraíso', direccion: 'Soyapango', lat: 13.7178, lng: -89.1523, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'SMIGUEL-S', nombre: 'Residencial San Miguel', direccion: 'Soyapango', lat: 13.7145, lng: -89.1478, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'IGLSOYA', nombre: 'Iglesia de Soyapango', direccion: 'Soyapango', lat: 13.7109, lng: -89.1396, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'ALCALD-S', nombre: 'Alcaldía de Soyapango', direccion: 'Soyapango', lat: 13.7107, lng: -89.1393, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'MERCSOY', nombre: 'Mercado de Soyapango', direccion: 'Soyapango', lat: 13.7110, lng: -89.1395, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'PARQSOY', nombre: 'Parque de Soyapango', direccion: 'Soyapango', lat: 13.7108, lng: -89.1393, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'BMUNI-S', nombre: 'Bomberos Municipales Soyapango', direccion: 'Soyapango', lat: 13.7112, lng: -89.1389, zona: 'Soyapango', tipo: 'Regular' },

  // ============ CIUDAD DELGADO EXPANDIDO (15 paradas) ============
  { codigo: 'CD-001', nombre: 'Ciudad Delgado Centro', direccion: 'Centro Ciudad Delgado', lat: 13.7275, lng: -89.1733, zona: 'Ciudad Delgado', tipo: 'TransferHub' },
  { codigo: 'COLINAS-001', nombre: 'Colonia Las Colinas', direccion: 'Ciudad Delgado', lat: 13.7298, lng: -89.1689, zona: 'Ciudad Delgado', tipo: 'Regular' },
  { codigo: 'GUARDADO-001', nombre: 'Colonia Guardado', direccion: 'Ciudad Delgado', lat: 13.7267, lng: -89.1778, zona: 'Ciudad Delgado', tipo: 'Regular' },
  { codigo: 'SALEGRIA-001', nombre: 'Colonia Santa Alegría', direccion: 'Ciudad Delgado', lat: 13.7289, lng: -89.1712, zona: 'Ciudad Delgado', tipo: 'Regular' },
  { codigo: 'MORELOS-CD', nombre: 'Colonia Morelos', direccion: 'Ciudad Delgado', lat: 13.7245, lng: -89.1756, zona: 'Ciudad Delgado', tipo: 'Regular' },
  { codigo: 'HCELES-CD', nombre: 'Colonia Héroes Celestiales', direccion: 'Ciudad Delgado', lat: 13.7312, lng: -89.1701, zona: 'Ciudad Delgado', tipo: 'Regular' },
  { codigo: 'SFRANC-CD', nombre: 'Colonia San Francisco', direccion: 'Ciudad Delgado', lat: 13.7289, lng: -89.1734, zona: 'Ciudad Delgado', tipo: 'Regular' },
  { codigo: 'SMARIA-CD', nombre: 'Colonia Santa María', direccion: 'Ciudad Delgado', lat: 13.7301, lng: -89.1678, zona: 'Ciudad Delgado', tipo: 'Regular' },
  { codigo: 'RIOS-CD', nombre: 'Colonia Los Ríos', direccion: 'Ciudad Delgado', lat: 13.7256, lng: -89.1723, zona: 'Ciudad Delgado', tipo: 'Regular' },
  { codigo: 'MARIN-CD', nombre: 'Colonia Marín', direccion: 'Ciudad Delgado', lat: 13.7278, lng: -89.1701, zona: 'Ciudad Delgado', tipo: 'Regular' },
  { codigo: 'EBANO-CD', nombre: 'Colonia El Ébano', direccion: 'Ciudad Delgado', lat: 13.7234, lng: -89.1745, zona: 'Ciudad Delgado', tipo: 'Regular' },
  { codigo: 'IGLCD', nombre: 'Iglesia de Ciudad Delgado', direccion: 'Ciudad Delgado', lat: 13.7276, lng: -89.1734, zona: 'Ciudad Delgado', tipo: 'Regular' },
  { codigo: 'ALCALD-CD', nombre: 'Alcaldía de Ciudad Delgado', direccion: 'Ciudad Delgado', lat: 13.7274, lng: -89.1732, zona: 'Ciudad Delgado', tipo: 'Regular' },
  { codigo: 'MERCCD', nombre: 'Mercado de Ciudad Delgado', direccion: 'Ciudad Delgado', lat: 13.7277, lng: -89.1735, zona: 'Ciudad Delgado', tipo: 'Regular' },
  { codigo: 'PARQCD', nombre: 'Parque de Ciudad Delgado', direccion: 'Ciudad Delgado', lat: 13.7275, lng: -89.1733, zona: 'Ciudad Delgado', tipo: 'Regular' },

  // ============ CUSCATANCINGO EXPANDIDO (15 paradas) ============
  { codigo: 'CUS-001', nombre: 'Cuscatancingo Centro', direccion: 'Centro Cuscatancingo', lat: 13.7356, lng: -89.1842, zona: 'Cuscatancingo', tipo: 'Regular' },
  { codigo: 'SROSA-001', nombre: 'Colonia Santa Rosa', direccion: 'Cuscatancingo', lat: 13.7389, lng: -89.1823, zona: 'Cuscatancingo', tipo: 'Regular' },
  { codigo: 'VHERMOSA-001', nombre: 'Colonia Vista Hermosa', direccion: 'Cuscatancingo', lat: 13.7412, lng: -89.1867, zona: 'Cuscatancingo', tipo: 'Regular' },
  { codigo: 'REPARTO-001', nombre: 'Reparto Santa Margarita', direccion: 'Cuscatancingo', lat: 13.7378, lng: -89.1889, zona: 'Cuscatancingo', tipo: 'Regular' },
  { codigo: 'STRINIDAD-001', nombre: 'Santísima Trinidad', direccion: 'Zacamil', lat: 13.7456, lng: -89.1934, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'ZACAMIL-001', nombre: 'Zacamil', direccion: 'Mejicanos', lat: 13.7489, lng: -89.1956, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'AMERICA-001', nombre: 'Colonia América', direccion: 'San Salvador', lat: 13.7123, lng: -89.1987, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'SCESAR-C', nombre: 'Colonia San César', direccion: 'Cuscatancingo', lat: 13.7367, lng: -89.1856, zona: 'Cuscatancingo', tipo: 'Regular' },
  { codigo: 'SRAFAEL-C', nombre: 'Colonia San Rafael', direccion: 'Cuscatancingo', lat: 13.7334, lng: -89.1878, zona: 'Cuscatancingo', tipo: 'Regular' },
  { codigo: 'PROGRES-C', nombre: 'Colonia El Progreso Cuscatancingo', direccion: 'Cuscatancingo', lat: 13.7345, lng: -89.1834, zona: 'Cuscatancingo', tipo: 'Regular' },
  { codigo: 'SLUCIA-C', nombre: 'Colonia Santa Lucía', direccion: 'Cuscatancingo', lat: 13.7398, lng: -89.1845, zona: 'Cuscatancingo', tipo: 'Regular' },
  { codigo: 'IGLCUS', nombre: 'Iglesia de Cuscatancingo', direccion: 'Cuscatancingo', lat: 13.7357, lng: -89.1843, zona: 'Cuscatancingo', tipo: 'Regular' },
  { codigo: 'ALCALD-C', nombre: 'Alcaldía de Cuscatancingo', direccion: 'Cuscatancingo', lat: 13.7355, lng: -89.1841, zona: 'Cuscatancingo', tipo: 'Regular' },
  { codigo: 'MERCCUS', nombre: 'Mercado de Cuscatancingo', direccion: 'Cuscatancingo', lat: 13.7358, lng: -89.1844, zona: 'Cuscatancingo', tipo: 'Regular' },
  { codigo: 'PARQCUS', nombre: 'Parque de Cuscatancingo', direccion: 'Cuscatancingo', lat: 13.7356, lng: -89.1842, zona: 'Cuscatancingo', tipo: 'Regular' },

  // ============ APOPA EXPANDIDO (10 paradas) ============
  { codigo: 'APO-001', nombre: 'Apopa Centro', direccion: 'Centro de Apopa', lat: 13.8072, lng: -89.1792, zona: 'Apopa', tipo: 'TransferHub' },
  { codigo: 'DITALIA-001', nombre: 'Distrito Italia', direccion: 'Apopa', lat: 13.7923, lng: -89.1567, zona: 'Apopa', tipo: 'Regular' },
  { codigo: 'SFELI-A', nombre: 'Colonia San Felipe', direccion: 'Apopa', lat: 13.8045, lng: -89.1812, zona: 'Apopa', tipo: 'Regular' },
  { codigo: 'SMIGUE-A', nombre: 'Colonia San Miguel Apopa', direccion: 'Apopa', lat: 13.8089, lng: -89.1756, zona: 'Apopa', tipo: 'Regular' },
  { codigo: 'SLUCA-A', nombre: 'Colonia Santa Lucía Apopa', direccion: 'Apopa', lat: 13.8101, lng: -89.1778, zona: 'Apopa', tipo: 'Regular' },
  { codigo: 'SROSE-A', nombre: 'Colonia Santa Rosita', direccion: 'Apopa', lat: 13.8056, lng: -89.1801, zona: 'Apopa', tipo: 'Regular' },
  { codigo: 'IGLAP', nombre: 'Iglesia de Apopa', direccion: 'Apopa', lat: 13.8073, lng: -89.1793, zona: 'Apopa', tipo: 'Regular' },
  { codigo: 'ALCALD-A', nombre: 'Alcaldía de Apopa', direccion: 'Apopa', lat: 13.8071, lng: -89.1791, zona: 'Apopa', tipo: 'Regular' },
  { codigo: 'MERCAP', nombre: 'Mercado de Apopa', direccion: 'Apopa', lat: 13.8074, lng: -89.1794, zona: 'Apopa', tipo: 'Regular' },
  { codigo: 'PARQAP', nombre: 'Parque de Apopa', direccion: 'Apopa', lat: 13.8072, lng: -89.1792, zona: 'Apopa', tipo: 'Regular' },

  // ============ ILOPANGO EXPANDIDO (8 paradas) ============
  { codigo: 'ILO-001', nombre: 'Ilopango Centro', direccion: 'Centro de Ilopango', lat: 13.7014, lng: -89.1078, zona: 'Ilopango', tipo: 'TransferHub' },
  { codigo: 'LPLAYA-I', nombre: 'Colonia La Playa', direccion: 'Ilopango', lat: 13.6989, lng: -89.1045, zona: 'Ilopango', tipo: 'Regular' },
  { codigo: 'SVICTO-I', nombre: 'Colonia San Vicente', direccion: 'Ilopango', lat: 13.7034, lng: -89.1098, zona: 'Ilopango', tipo: 'Regular' },
  { codigo: 'ASUNCI-I', nombre: 'Colonia Asunción', direccion: 'Ilopango', lat: 13.7045, lng: -89.1123, zona: 'Ilopango', tipo: 'Regular' },
  { codigo: 'AEROP-I', nombre: 'Aeropuerto de Ilopango', direccion: 'Ilopango', lat: 13.6989, lng: -89.1156, zona: 'Ilopango', tipo: 'Regular' },
  { codigo: 'IGLILO', nombre: 'Iglesia de Ilopango', direccion: 'Ilopango', lat: 13.7015, lng: -89.1079, zona: 'Ilopango', tipo: 'Regular' },
  { codigo: 'ALCALD-I', nombre: 'Alcaldía de Ilopango', direccion: 'Ilopango', lat: 13.7013, lng: -89.1077, zona: 'Ilopango', tipo: 'Regular' },
  { codigo: 'MERCILO', nombre: 'Mercado de Ilopango', direccion: 'Ilopango', lat: 13.7016, lng: -89.1080, zona: 'Ilopango', tipo: 'Regular' },

  // ============ SANTA TECLA EXPANDIDO (15 paradas) ============
  { codigo: 'ST-001', nombre: 'Santa Tecla Centro', direccion: 'Parque Daniel Hernández', lat: 13.6767, lng: -89.2794, zona: 'Santa Tecla', tipo: 'TransferHub' },
  { codigo: 'STN-001', nombre: 'Santa Tecla Norte', direccion: 'Colonia Santa Tecla Norte', lat: 13.6845, lng: -89.2756, zona: 'Santa Tecla', tipo: 'Regular' },
  { codigo: 'TST-001', nombre: 'Terminal Santa Tecla', direccion: 'Santa Tecla Centro', lat: 13.6767, lng: -89.2794, zona: 'Santa Tecla', tipo: 'Terminal' },
  { codigo: 'LA-GRA', nombre: 'La Gran Vía', direccion: 'Santa Tecla', lat: 13.6789, lng: -89.2812, zona: 'Santa Tecla', tipo: 'Regular' },
  { codigo: 'GALER2', nombre: 'Galerías Centro Comercial', direccion: 'Santa Tecla', lat: 13.6778, lng: -89.2803, zona: 'Santa Tecla', tipo: 'Regular' },
  { codigo: 'PLAZA-M', nombre: 'Plaza Merliot', direccion: 'Santa Tecla', lat: 13.6812, lng: -89.2723, zona: 'Santa Tecla', tipo: 'Regular' },
  { codigo: 'QUEZAL-ST', nombre: 'Colonia Quezaltepec', direccion: 'Santa Tecla', lat: 13.6823, lng: -89.2834, zona: 'Santa Tecla', tipo: 'Regular' },
  { codigo: 'ALPES-ST', nombre: 'Alpes Suizos', direccion: 'Santa Tecla', lat: 13.6845, lng: -89.2867, zona: 'Santa Tecla', tipo: 'Regular' },
  { codigo: 'GIRASOL-ST', nombre: 'Colonia Los Girasoles', direccion: 'Santa Tecla', lat: 13.6801, lng: -89.2823, zona: 'Santa Tecla', tipo: 'Regular' },
  { codigo: 'DELIC-ST', nombre: 'Colonia Las Delicias', direccion: 'Santa Tecla', lat: 13.6834, lng: -89.2801, zona: 'Santa Tecla', tipo: 'Regular' },
  { codigo: 'JARDIN-ST', nombre: 'Colonia Jardines de la Libertad', direccion: 'Santa Tecla', lat: 13.6789, lng: -89.2778, zona: 'Santa Tecla', tipo: 'Regular' },
  { codigo: 'IGLST', nombre: 'Iglesia de Santa Tecla', direccion: 'Santa Tecla', lat: 13.6768, lng: -89.2795, zona: 'Santa Tecla', tipo: 'Regular' },
  { codigo: 'ALCALD-ST', nombre: 'Alcaldía de Santa Tecla', direccion: 'Santa Tecla', lat: 13.6766, lng: -89.2793, zona: 'Santa Tecla', tipo: 'Regular' },
  { codigo: 'MERCST', nombre: 'Mercado de Santa Tecla', direccion: 'Santa Tecla', lat: 13.6769, lng: -89.2796, zona: 'Santa Tecla', tipo: 'Regular' },
  { codigo: 'PARQST', nombre: 'Parque Daniel Hernández', direccion: 'Santa Tecla', lat: 13.6767, lng: -89.2794, zona: 'Santa Tecla', tipo: 'Regular' },

  // ============ ANTIGUO CUSCATLÁN EXPANDIDO (12 paradas) ============
  { codigo: 'AC-001', nombre: 'Antiguo Cuscatlán Centro', direccion: 'Centro Antiguo Cuscatlán', lat: 13.6642, lng: -89.2517, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'SE-001', nombre: 'Santa Elena', direccion: 'Antiguo Cuscatlán', lat: 13.6678, lng: -89.2567, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'MULTI-001', nombre: 'Multiplaza', direccion: 'Carretera Panamericana', lat: 13.6694, lng: -89.2436, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'CASCAD', nombre: 'Cascadas Mall', direccion: 'Antiguo Cuscatlán', lat: 13.6701, lng: -89.2521, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'PRICESM', nombre: 'PriceSmart', direccion: 'Carretera Panamericana', lat: 13.6723, lng: -89.2445, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'UCA-001', nombre: 'Universidad Centroamericana', direccion: 'Boulevard de los Próceres', lat: 13.6833, lng: -89.2347, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'UTE-001', nombre: 'UTEC Universidad', direccion: 'Antiguo Cuscatlán', lat: 13.6712, lng: -89.2534, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'UAM-001', nombre: 'Universidad Albert Einstein', direccion: 'Antiguo Cuscatlán', lat: 13.6789, lng: -89.2467, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'PANAM-001', nombre: 'Carretera Panamericana', direccion: 'KM 10.5', lat: 13.6734, lng: -89.2489, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'JARDPAZ-AC', nombre: 'Jardines de la Paz', direccion: 'Antiguo Cuscatlán', lat: 13.6656, lng: -89.2534, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'LOMAS-AC', nombre: 'Lomas de San Francisco', direccion: 'Antiguo Cuscatlán', lat: 13.6712, lng: -89.2489, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'MDELEN-AC', nombre: 'Madre Tierra Santa Elena', direccion: 'Antiguo Cuscatlán', lat: 13.6689, lng: -89.2578, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },

  // ============ SAN SALVADOR COLONIAS ADICIONALES (30 paradas) ============
  { codigo: 'ESCALON-001', nombre: 'Colonia Escalón', direccion: 'San Salvador', lat: 13.6989, lng: -89.2389, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'LOURDES-001', nombre: 'Colonia Lourdes', direccion: 'San Salvador', lat: 13.7045, lng: -89.2267, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'DOLORES-001', nombre: 'Colonia Dolores', direccion: 'San Salvador', lat: 13.7089, lng: -89.2456, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'SBENITO-001', nombre: 'Colonia San Benito', direccion: 'San Salvador', lat: 13.7012, lng: -89.2312, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'SFRANC-SS', nombre: 'Colonia San Francisco', direccion: 'San Salvador', lat: 13.6923, lng: -89.2389, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'SMATTE-SS', nombre: 'Colonia San Mateo', direccion: 'San Salvador', lat: 13.6956, lng: -89.2345, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'SMIGUEL-SS', nombre: 'Colonia San Miguel', direccion: 'San Salvador', lat: 13.6934, lng: -89.2401, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'SJOSE-SS', nombre: 'Colonia San José', direccion: 'San Salvador', lat: 13.6878, lng: -89.2356, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'FLBLANCA', nombre: 'Colonia Flor Blanca', direccion: 'San Salvador', lat: 13.6901, lng: -89.2534, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'LAYCO-SS', nombre: 'Colonia Layco', direccion: 'San Salvador', lat: 13.6889, lng: -89.2412, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'CAMUSPA', nombre: 'Colonia Campestre', direccion: 'San Salvador', lat: 13.6934, lng: -89.2456, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'MAGDALE-SS', nombre: 'Colonia La Magdalena', direccion: 'San Salvador', lat: 13.6912, lng: -89.2389, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'CUCUMA-SS', nombre: 'Colonia Cucumacayán', direccion: 'San Salvador', lat: 13.6856, lng: -89.2378, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'ROMA-SS', nombre: 'Colonia Roma', direccion: 'San Salvador', lat: 13.7001, lng: -89.2334, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'MEDICA-SS', nombre: 'Colonia Médica', direccion: 'San Salvador', lat: 13.7034, lng: -89.2178, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'MIRAM-SS', nombre: 'Colonia Miramonte', direccion: 'San Salvador', lat: 13.6967, lng: -89.2423, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'CENTAM-SS', nombre: 'Colonia Centroamérica', direccion: 'San Salvador', lat: 13.6945, lng: -89.2267, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'LIBERT-SS', nombre: 'Colonia La Libertad', direccion: 'San Salvador', lat: 13.6912, lng: -89.2298, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'ARBOLEDA', nombre: 'Colonia La Arboleda', direccion: 'San Salvador', lat: 13.6989, lng: -89.2412, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'REFORMA-SS', nombre: 'Colonia La Reforma', direccion: 'San Salvador', lat: 13.6923, lng: -89.2312, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'RABIDA-SS', nombre: 'Colonia La Rábida', direccion: 'San Salvador', lat: 13.7012, lng: -89.2367, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'DINA-SS', nombre: 'Colonia Dina', direccion: 'San Salvador', lat: 13.7089, lng: -89.2389, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'ANTIG-SS', nombre: 'Colonia Antiguo Cuscatlán SS', direccion: 'San Salvador', lat: 13.6867, lng: -89.2345, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'TROPIC-SS', nombre: 'Colonia Tropical', direccion: 'San Salvador', lat: 13.6901, lng: -89.2423, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'MONSERR-SS', nombre: 'Colonia Monserrat', direccion: 'San Salvador', lat: 13.7023, lng: -89.2423, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'CUSCATL-SS', nombre: 'Colonia Cuscatlán', direccion: 'San Salvador', lat: 13.6978, lng: -89.2298, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'MORAZAN-SS', nombre: 'Colonia Morazán', direccion: 'San Salvador', lat: 13.6834, lng: -89.2267, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'CANTERA-SS', nombre: 'Colonia La Cantera', direccion: 'San Salvador', lat: 13.6867, lng: -89.2201, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'CONSTEL-SS', nombre: 'Colonia La Constelación', direccion: 'San Salvador', lat: 13.6934, lng: -89.2278, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'ILUSIO-SS', nombre: 'Colonia La Ilusión', direccion: 'San Salvador', lat: 13.6889, lng: -89.2289, zona: 'San Salvador', tipo: 'Regular' },

  // ============ PUNTOS DE REFERENCIA ADICIONALES (20 paradas) ============
  { codigo: 'EC-001', nombre: 'Estadio Cuscatlán', direccion: 'Colonia Flor Blanca', lat: 13.6894, lng: -89.2511, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'HEROES-001', nombre: 'Boulevard de los Héroes', direccion: 'San Salvador', lat: 13.6934, lng: -89.2289, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'PROCERES-001', nombre: 'Boulevard de los Próceres', direccion: 'San Salvador', lat: 13.6856, lng: -89.2334, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'AYUTUX-001', nombre: 'Ayutuxtepeque', direccion: 'Ayutuxtepeque Centro', lat: 13.7489, lng: -89.2123, zona: 'Ayutuxtepeque', tipo: 'Regular' },
  { codigo: 'SPEDRO-001', nombre: 'San Pedro', direccion: 'San Pedro Centro', lat: 13.7534, lng: -89.2078, zona: 'San Marcos', tipo: 'Regular' },
  { codigo: 'SMARCOS-001', nombre: 'San Marcos', direccion: 'San Marcos Centro', lat: 13.7567, lng: -89.2145, zona: 'San Marcos', tipo: 'TransferHub' },
  { codigo: 'RENDEROS-001', nombre: 'Los Planes De Renderos', direccion: 'Panchimalco', lat: 13.6423, lng: -89.1623, zona: 'Panchimalco', tipo: 'Regular' },
  { codigo: 'TONA-001', nombre: 'Tonacatepeque', direccion: 'Parque De Tonacatepeque', lat: 13.7856, lng: -89.1234, zona: 'Tonacatepeque', tipo: 'TransferHub' },
  { codigo: 'AGUI-001', nombre: 'Aguilares', direccion: 'Centro de Aguilares', lat: 13.9567, lng: -89.1923, zona: 'Aguilares', tipo: 'TransferHub' },
  { codigo: 'NEJAPA-001', nombre: 'Nejapa', direccion: 'Centro de Nejapa', lat: 13.8156, lng: -89.2234, zona: 'Nejapa', tipo: 'TransferHub' },
  { codigo: 'SMARTIN-001', nombre: 'San Martín', direccion: 'Centro de San Martín', lat: 13.7889, lng: -89.0734, zona: 'San Martín', tipo: 'TransferHub' },
  { codigo: 'GIMNAC', nombre: 'Gimnasio Nacional', direccion: 'San Salvador', lat: 13.6889, lng: -89.2489, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'FERIA-INT', nombre: 'Feria Internacional', direccion: 'San Salvador', lat: 13.6823, lng: -89.2401, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'POLI-NAC', nombre: 'Policlínica Nacional', direccion: 'San Salvador', lat: 13.6956, lng: -89.2234, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'ZOO-SS', nombre: 'Zoológico Nacional', direccion: 'San Salvador', lat: 13.6812, lng: -89.2489, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'MUS-ART', nombre: 'Museo de Arte', direccion: 'San Salvador', lat: 13.6978, lng: -89.2312, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'TIN-MARIN', nombre: 'Tin Marín Museo de los Niños', direccion: 'San Salvador', lat: 13.6934, lng: -89.2356, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'ASAMBLEA', nombre: 'Asamblea Legislativa', direccion: 'San Salvador', lat: 13.6867, lng: -89.2267, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'CASA-PRES', nombre: 'Casa Presidencial', direccion: 'San Salvador', lat: 13.7089, lng: -89.2267, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'MIN-EDUC', nombre: 'Ministerio de Educación', direccion: 'San Salvador', lat: 13.6912, lng: -89.2223, zona: 'San Salvador', tipo: 'Regular' },
];

/**
 * Función principal de importación
 */
async function importarDatosSuperExpandidos() {
  try {
    console.log('🗑️  Limpiando datos existentes...\n');
    
    // Limpiar tablas en orden (respetar foreign keys)
    await pool.query('DELETE FROM parada_ruta');
    await pool.query('DELETE FROM rutas');
    await pool.query('DELETE FROM paradas');
    
    console.log('✅ Datos anteriores eliminados\n');

    // Insertar paradas
    console.log('📍 Insertando 250+ paradas...');
    const paradasMap = new Map();
    
    for (const parada of paradasSuperExpandidas) {
      try {
        const result = await pool.query(
          `INSERT INTO paradas (codigo, nombre, descripcion, direccion, latitud, longitud, ubicacion, zona, tipo, tiene_techo, tiene_asientos, accesible, activa) 
           VALUES ($1, $2, $3, $4, $5, $6, ST_GeomFromText($7, 4326), $8, $9, true, true, true, 1)
           RETURNING id`,
          [
            parada.codigo,
            parada.nombre,
            parada.direccion || '',
            parada.direccion,
            parada.lat,
            parada.lng,
            `POINT(${parada.lng} ${parada.lat})`,
            parada.zona,
            parada.tipo
          ]
        );
        
        paradasMap.set(parada.codigo, result.rows[0].id);
        if (paradasSuperExpandidas.indexOf(parada) % 20 === 0) {
          console.log(`  ✅ Procesando... ${paradasSuperExpandidas.indexOf(parada) + 1}/${paradasSuperExpandidas.length}`);
        }
      } catch (err) {
        console.log(`  ⚠️  Error insertando ${parada.codigo}: ${err.message}`);
      }
    }
    
    console.log(`\n✅ ${paradasMap.size} paradas insertadas exitosamente!\n`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ IMPORTACIÓN SUPER EXPANDIDA COMPLETADA EXITOSAMENTE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📊 Resumen:`);
    console.log(`   📍 Paradas: ${paradasMap.size}`);
    console.log('');
    console.log('💡 ¡Ahora tienes MUCHAS más opciones de paradas para buscar!');
    console.log('');
    console.log('📌 Incluye:');
    console.log('   - 20 paradas en el Centro Histórico');
    console.log('   - 25 centros comerciales y plazas');
    console.log('   - 12 hospitales y clínicas');
    console.log('   - 15 universidades');
    console.log('   - 20+ colonias en Mejicanos');
    console.log('   - 25+ colonias en Soyapango');
    console.log('   - 30+ colonias en San Salvador');
    console.log('   - Y mucho más!');
    console.log('');
    console.log('🚀 Siguiente paso: Reinicia el servidor y prueba la búsqueda');
    console.log('   cd server && npm start');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante la importación:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar importación
importarDatosSuperExpandidos();

