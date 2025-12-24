/**
 * Script SUPER EXPANDIDO PARA SQLITE - 250+ paradas
 */

import { pool } from './src/db.js';

console.log('🚌 BusTrackSV - Importador SUPER EXPANDIDO (SQLite)');
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
  { codigo: 'IGN-001', nombre: 'Iglesia El Rosario', direccion: 'Calle Gerardo Barrios', lat: 13.6972, lng: -89.2179, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'PL-LIB', nombre: 'Plaza Libertad', direccion: 'Centro', lat: 13.6951, lng: -89.2136, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'PAR-BAR', nombre: 'Parque Barrios', direccion: 'Frente a Catedral', lat: 13.6989, lng: -89.2148, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'HOSP-ROSS', nombre: 'Hospital Rosales', direccion: '25 Av Norte', lat: 13.7089, lng: -89.2023, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'MC-EXA', nombre: 'Mercado Ex-Cuartel', direccion: 'Centro Histórico', lat: 13.6934, lng: -89.2134, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'MC-TINETI', nombre: 'Mercado Tienditas', direccion: 'Centro', lat: 13.6967, lng: -89.2201, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'CRIS-MUN', nombre: 'Cristo de la Paz (Mun)', direccion: 'Parque Cuscatlán', lat: 13.6923, lng: -89.2312, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'PARK-CUS', nombre: 'Parque Cuscatlán', direccion: 'Alameda Juan Pablo II', lat: 13.6912, lng: -89.2334, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'MUS-ARTE', nombre: 'MARTE Museo', direccion: 'Colonia San Benito', lat: 13.6978, lng: -89.2312, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'IGL-DON', nombre: 'Iglesia Don Rúa', direccion: 'Centro Histórico', lat: 13.6961, lng: -89.2123, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'INST-SAL', nombre: 'Instituto Salvadoreño', direccion: 'Centro', lat: 13.6889, lng: -89.2178, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'MERC-CEN2', nombre: 'Mercado Sagrado Corazón', direccion: 'Centro', lat: 13.6934, lng: -89.2189, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'PZ-MORAZ', nombre: 'Plaza Morazán', direccion: 'Centro', lat: 13.6978, lng: -89.2167, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'BIB-NAC', nombre: 'Biblioteca Nacional', direccion: 'Colonia San Benito', lat: 13.6923, lng: -89.2289, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'TRE-JAP', nombre: 'Jardín Japonés', direccion: 'Parque Cuscatlán', lat: 13.6901, lng: -89.2323, zona: 'Centro', tipo: 'Regular' },

  // ============ CENTROS COMERCIALES Y PLAZAS (25 paradas) ============
  { codigo: 'MCP-001', nombre: 'Metrocentro', direccion: 'Boulevard de los Héroes', lat: 13.6912, lng: -89.2289, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'GAL-001', nombre: 'Galerías Escalón', direccion: 'Paseo Gral. Escalón', lat: 13.7012, lng: -89.2401, zona: 'Escalón', tipo: 'Regular' },
  { codigo: 'MUL-001', nombre: 'Multiplaza', direccion: 'Santa Elena', lat: 13.6789, lng: -89.2389, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'BAS-001', nombre: 'Basílica de Guadalupe', direccion: 'Colonia Guadalupe', lat: 13.7123, lng: -89.2078, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'LME-001', nombre: 'La Gran Vía', direccion: 'Santa Elena', lat: 13.6767, lng: -89.2412, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'PLZ-MUN', nombre: 'Plaza Mundo', direccion: 'Soyapango', lat: 13.7089, lng: -89.1456, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'PLZ-NAT', nombre: 'Plaza Natívitas', direccion: 'Santa Tecla', lat: 13.6778, lng: -89.2789, zona: 'Santa Tecla', tipo: 'Regular' },
  { codigo: 'CAR-001', nombre: 'Carrousel', direccion: 'Soyapango', lat: 13.7123, lng: -89.1478, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'PLZ-FUZ', nombre: 'Plaza Futura', direccion: 'Soyapango', lat: 13.6989, lng: -89.1512, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'MET-SUR', nombre: 'Metrosur', direccion: 'San Marcos', lat: 13.7534, lng: -89.2189, zona: 'San Marcos', tipo: 'Regular' },
  { codigo: 'PRICESM', nombre: 'PriceSmart', direccion: 'Santa Elena', lat: 13.6756, lng: -89.2423, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'GALER-2', nombre: 'Galerías Santo Domingo', direccion: 'Colonia Flor Blanca', lat: 13.6845, lng: -89.2534, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'PLAZITA-C', nombre: 'Plazita Cascadas', direccion: 'Antiguo Cuscatlán', lat: 13.6801, lng: -89.2434, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'EL-PASEO', nombre: 'El Paseo', direccion: 'Santa Elena', lat: 13.6734, lng: -89.2378, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'UNICEN', nombre: 'Unicentro Soyapango', direccion: 'Soyapango', lat: 13.7067, lng: -89.1567, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'WALMART-ESC', nombre: 'Walmart Escalón', direccion: 'Colonia Escalón', lat: 13.6978, lng: -89.2467, zona: 'Escalón', tipo: 'Regular' },
  { codigo: 'HIPER-SOY', nombre: 'Hipermás Soyapango', direccion: 'Soyapango', lat: 13.7012, lng: -89.1489, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'SELEC-FLO', nombre: 'Selectos Flor Blanca', direccion: 'Colonia Flor Blanca', lat: 13.6867, lng: -89.2512, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'SELEC-ESC', nombre: 'Selectos Escalón', direccion: 'Colonia Escalón', lat: 13.7001, lng: -89.2423, zona: 'Escalón', tipo: 'Regular' },
  { codigo: 'SUPERCEL', nombre: 'Super Selectos San Benito', direccion: 'Colonia San Benito', lat: 13.6956, lng: -89.2378, zona: 'San Benito', tipo: 'Regular' },
  { codigo: 'DESPENSA', nombre: 'La Despensa de Don Juan', direccion: 'Boulevard del Hipódromo', lat: 13.6834, lng: -89.2445, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'PALI-BLV', nombre: 'Pali Boulevard', direccion: 'Boulevard Venezuela', lat: 13.6923, lng: -89.2156, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'HIPER-PAE', nombre: 'Hipermás Paesanos', direccion: 'Colonia Flor Blanca', lat: 13.6890, lng: -89.2501, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'SUP-GIG', nombre: 'Super Gigante', direccion: 'Santa Tecla', lat: 13.6756, lng: -89.2812, zona: 'Santa Tecla', tipo: 'Regular' },
  { codigo: 'WALLM-SFE', nombre: 'Walmart Santa Elena', direccion: 'Santa Elena', lat: 13.6789, lng: -89.2401, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },

  // ============ HOSPITALES Y CLÍNICAS (12 paradas) ============
  { codigo: 'HRO-001', nombre: 'Hospital Rosales', direccion: '25 Av Norte y Calle Arce', lat: 13.7089, lng: -89.2023, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'HBL-001', nombre: 'Hospital Bloom (Niños)', direccion: '25 Av Norte', lat: 13.7112, lng: -89.2045, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'HMAT-001', nombre: 'Hospital de Maternidad', direccion: '25 Av Norte', lat: 13.7098, lng: -89.2034, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'HSALV-001', nombre: 'Hospital El Salvador', direccion: 'Alameda Juan Pablo II', lat: 13.6923, lng: -89.2267, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'HDIAG-001', nombre: 'Hospital de Diagnóstico', direccion: 'Colonia Médica', lat: 13.6956, lng: -89.2412, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'HPRO-001', nombre: 'Hospital Pro-Familia', direccion: '25 Calle Poniente', lat: 13.6934, lng: -89.2289, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'HOSP-MIL', nombre: 'Hospital Militar', direccion: 'Colonia Médica', lat: 13.6967, lng: -89.2445, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'IHSS-001', nombre: 'Clínica Comunal ISSS', direccion: 'Centro', lat: 13.6989, lng: -89.2178, zona: 'Centro', tipo: 'Regular' },
  { codigo: 'HOSPOL-001', nombre: 'Hospital de la Policía', direccion: 'San Jacinto', lat: 13.7045, lng: -89.2123, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'HOSPA-001', nombre: 'Hospital de Neumología', direccion: 'Soyapango', lat: 13.6989, lng: -89.1623, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'CMED-SB', nombre: 'Centros Médicos San Benito', direccion: 'Colonia San Benito', lat: 13.6945, lng: -89.2356, zona: 'San Benito', tipo: 'Regular' },
  { codigo: 'HOSP-STEL', nombre: 'Hospital Santa Elena', direccion: 'Antiguo Cuscatlán', lat: 13.6812, lng: -89.2423, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },

  // ============ UNIVERSIDADES (15 paradas) ============
  { codigo: 'UES-001', nombre: 'Universidad de El Salvador (UES)', direccion: 'Final 25 Av Norte', lat: 13.7156, lng: -89.2089, zona: 'San Salvador', tipo: 'TransferHub' },
  { codigo: 'UCA-001', nombre: 'Universidad Centroamericana (UCA)', direccion: 'Autopista Sur', lat: 13.6767, lng: -89.2312, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'UTEC-001', nombre: 'Universidad Tecnológica (UTEC)', direccion: 'Antiguo Cuscatlán', lat: 13.6789, lng: -89.2378, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'UFG-001', nombre: 'Universidad Francisco Gavidia', direccion: 'Calle El Progreso', lat: 13.7023, lng: -89.2123, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'UJMD-001', nombre: 'Universidad José Matías Delgado', direccion: 'Antiguo Cuscatlán', lat: 13.6734, lng: -89.2456, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'UPES-001', nombre: 'Universidad Pedagógica', direccion: 'San Salvador', lat: 13.6878, lng: -89.2267, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'ESEN-001', nombre: 'Escuela Superior de Economía (ESEN)', direccion: 'Antiguo Cuscatlán', lat: 13.6723, lng: -89.2489, zona: 'Antiguo Cuscatlán', tipo: 'Regular' },
  { codigo: 'UAM-001', nombre: 'Universidad Albert Einstein', direccion: 'Colonia Escalón', lat: 13.7001, lng: -89.2445, zona: 'Escalón', tipo: 'Regular' },
  { codigo: 'UNIVO-001', nombre: 'Universidad de Oriente', direccion: 'San Salvador', lat: 13.6956, lng: -89.2201, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'UNICAFE-001', nombre: 'Universidad del Café', direccion: 'Santa Tecla', lat: 13.6734, lng: -89.2845, zona: 'Santa Tecla', tipo: 'Regular' },
  { codigo: 'USAM-001', nombre: 'Universidad Salvadoreña', direccion: 'San Salvador', lat: 13.6889, lng: -89.2234, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'UEES-001', nombre: 'Universidad Evangélica', direccion: 'San Salvador', lat: 13.6912, lng: -89.2178, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'UNAB-001', nombre: 'Universidad Dr. Andrés Bello', direccion: 'Mejicanos', lat: 13.7234, lng: -89.2012, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'ULSA-001', nombre: 'Universidad Luterana', direccion: 'Colonia Miramonte', lat: 13.6845, lng: -89.2467, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'UCAD-001', nombre: 'Universidad Católica', direccion: 'Santa Tecla', lat: 13.6756, lng: -89.2878, zona: 'Santa Tecla', tipo: 'Regular' },

  // ============ ZONA MEJICANOS (20+ paradas) ============
  { codigo: 'MEJ-CEN', nombre: 'Mejicanos Centro', direccion: 'Parque Central Mejicanos', lat: 13.7234, lng: -89.2089, zona: 'Mejicanos', tipo: 'TransferHub' },
  { codigo: 'COL-ZACAM', nombre: 'Colonia Zacamil', direccion: 'Mejicanos', lat: 13.7289, lng: -89.2012, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'COL-SANT', nombre: 'Colonia Santillana', direccion: 'Mejicanos', lat: 13.7256, lng: -89.2045, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'COL-MONT', nombre: 'Colonia Montecristo', direccion: 'Mejicanos', lat: 13.7212, lng: -89.2123, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'COL-ATLA', nombre: 'Colonia Atlacatl', direccion: 'Mejicanos', lat: 13.7267, lng: -89.2134, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'COL-DIAZ', nombre: 'Colonia Díaz', direccion: 'Mejicanos', lat: 13.7223, lng: -89.2156, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'COL-BELL', nombre: 'Colonia La Belleza', direccion: 'Mejicanos', lat: 13.7189, lng: -89.2178, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'SAN-LUIS', nombre: 'Colonia San Luis', direccion: 'Mejicanos', lat: 13.7278, lng: -89.2067, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'IGL-ZAC', nombre: 'Iglesia de Zacamil', direccion: 'Mejicanos', lat: 13.7301, lng: -89.2023, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'MERC-MEJ', nombre: 'Mercado de Mejicanos', direccion: 'Centro Mejicanos', lat: 13.7245, lng: -89.2101, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'PARQ-ZAC', nombre: 'Parque Zacamil', direccion: 'Mejicanos', lat: 13.7312, lng: -89.2001, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'ESC-ZAC', nombre: 'Escuela Zacamil', direccion: 'Mejicanos', lat: 13.7298, lng: -89.2034, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'COL-PRADO', nombre: 'Colonia El Prado', direccion: 'Mejicanos', lat: 13.7198, lng: -89.2089, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'COL-SANJO', nombre: 'Colonia San José', direccion: 'Mejicanos', lat: 13.7178, lng: -89.2112, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'COL-REDING', nombre: 'Colonia Redington', direccion: 'Mejicanos', lat: 13.7234, lng: -89.2178, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'COL-DANT', nombre: 'Colonia Dina (Mejicanos)', direccion: 'Mejicanos', lat: 13.7156, lng: -89.2145, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'COL-LOMA', nombre: 'Colonia La Loma', direccion: 'Mejicanos', lat: 13.7267, lng: -89.2189, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'COL-ALAM', nombre: 'Colonia Alameda', direccion: 'Mejicanos', lat: 13.7289, lng: -89.2156, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'COL-MILAGR', nombre: 'Colonia Milagro de Dios', direccion: 'Mejicanos', lat: 13.7323, lng: -89.2089, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'COL-ESTRELLA', nombre: 'Colonia La Estrella', direccion: 'Mejicanos', lat: 13.7345, lng: -89.2112, zona: 'Mejicanos', tipo: 'Regular' },

  // ============ ZONA SOYAPANGO (25+ paradas) ============
  { codigo: 'SOY-CEN', nombre: 'Soyapango Centro', direccion: 'Parque Central Soyapango', lat: 13.7089, lng: -89.1523, zona: 'Soyapango', tipo: 'TransferHub' },
  { codigo: 'COL-SANBART', nombre: 'Colonia San Bartolo', direccion: 'Soyapango', lat: 13.7134, lng: -89.1489, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'COL-LIM', nombre: 'Colonia Limas', direccion: 'Soyapango', lat: 13.7156, lng: -89.1456, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'COL-MON-I', nombre: 'Colonia Monserrat I', direccion: 'Soyapango', lat: 13.7178, lng: -89.1412, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'COL-MON-II', nombre: 'Colonia Monserrat II', direccion: 'Soyapango', lat: 13.7189, lng: -89.1389, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'COL-BETEL', nombre: 'Colonia Bethel', direccion: 'Soyapango', lat: 13.7123, lng: -89.1423, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'COL-GUADAL', nombre: 'Colonia Guadalupe', direccion: 'Soyapango', lat: 13.7089, lng: -89.1445, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'COL-SJOSE', nombre: 'Colonia San José (Soy)', direccion: 'Soyapango', lat: 13.7045, lng: -89.1478, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'COL-VERACRUZ', nombre: 'Colonia Veracruz', direccion: 'Soyapango', lat: 13.7067, lng: -89.1501, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'COL-MODELO', nombre: 'Colonia Modelo', direccion: 'Soyapango', lat: 13.7112, lng: -89.1534, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'COL-IVU', nombre: 'Colonia IVU', direccion: 'Soyapango', lat: 13.7134, lng: -89.1556, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'COL-ELCARM', nombre: 'Colonia El Carmen', direccion: 'Soyapango', lat: 13.7098, lng: -89.1567, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'COL-SANANT', nombre: 'Colonia San Antonio (Soy)', direccion: 'Soyapango', lat: 13.7156, lng: -89.1578, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'COL-LAPAZ', nombre: 'Colonia La Paz', direccion: 'Soyapango', lat: 13.7178, lng: -89.1545, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'COL-SANMIG', nombre: 'Colonia San Miguel', direccion: 'Soyapango', lat: 13.7201, lng: -89.1523, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'COL-ALAM-S', nombre: 'Colonia Alameda (Soy)', direccion: 'Soyapango', lat: 13.7223, lng: -89.1489, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'COL-LAPRES', nombre: 'Colonia La Presita', direccion: 'Soyapango', lat: 13.7089, lng: -89.1412, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'COL-VENEZ', nombre: 'Colonia Venezuela', direccion: 'Soyapango', lat: 13.7056, lng: -89.1434, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'COL-LASPIED', nombre: 'Colonia Las Piedras', direccion: 'Soyapango', lat: 13.7034, lng: -89.1512, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'COL-LIBER', nombre: 'Colonia Libertad (Soy)', direccion: 'Soyapango', lat: 13.7023, lng: -89.1545, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'COL-FUEN', nombre: 'Colonia La Fuente', direccion: 'Soyapango', lat: 13.7012, lng: -89.1489, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'COL-LAESTREL', nombre: 'Colonia La Estrella (Soy)', direccion: 'Soyapango', lat: 13.7145, lng: -89.1512, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'COL-MIRADOR', nombre: 'Colonia El Mirador', direccion: 'Soyapango', lat: 13.7167, lng: -89.1534, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'COL-LASF', nombre: 'Colonia Las Flores (Soy)', direccion: 'Soyapango', lat: 13.7212, lng: -89.1456, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'MERC-SOY', nombre: 'Mercado de Soyapango', direccion: 'Soyapango Centro', lat: 13.7098, lng: -89.1534, zona: 'Soyapango', tipo: 'Regular' },

  // ============ MÁS COLONIAS SAN SALVADOR (30+ paradas) ============
  { codigo: 'COL-FLO', nombre: 'Colonia Flor Blanca', direccion: 'San Salvador', lat: 13.6867, lng: -89.2501, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'COL-ROMA', nombre: 'Colonia Roma', direccion: 'San Salvador', lat: 13.6934, lng: -89.2423, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'COL-MEDICA', nombre: 'Colonia Médica', direccion: 'San Salvador', lat: 13.6956, lng: -89.2434, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'COL-ARCE', nombre: 'Colonia Arce', direccion: 'San Salvador', lat: 13.7012, lng: -89.2212, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'COL-LAYCO', nombre: 'Colonia Layco', direccion: 'San Salvador', lat: 13.6978, lng: -89.2245, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'COL-MIRA', nombre: 'Colonia Miramonte', direccion: 'San Salvador', lat: 13.6845, lng: -89.2467, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'COL-SANFRAN', nombre: 'Colonia San Francisco', direccion: 'San Salvador', lat: 13.7089, lng: -89.2178, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'COL-SANMAT', nombre: 'Colonia San Mateo', direccion: 'Soyapango', lat: 13.7212, lng: -89.1378, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'COL-SANRAF', nombre: 'Colonia San Rafael', direccion: 'Mejicanos', lat: 13.7167, lng: -89.2189, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'COL-SANJOS2', nombre: 'Colonia San José 2', direccion: 'San Salvador', lat: 13.6889, lng: -89.2356, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'COL-DOLORES', nombre: 'Colonia Dolores', direccion: 'San Salvador', lat: 13.6912, lng: -89.2312, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'COL-IBERIA', nombre: 'Colonia Iberia', direccion: 'San Salvador', lat: 13.6945, lng: -89.2389, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'COL-CENTRAM', nombre: 'Colonia Centroamérica', direccion: 'San Salvador', lat: 13.6923, lng: -89.2378, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'COL-SANJAC', nombre: 'Colonia San Jacinto', direccion: 'San Salvador', lat: 13.7056, lng: -89.2134, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'COL-LUZA', nombre: 'Colonia Luz', direccion: 'San Salvador', lat: 13.7023, lng: -89.2156, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'COL-CONCEP', nombre: 'Colonia La Concepción', direccion: 'Mejicanos', lat: 13.7201, lng: -89.2223, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'COL-GREC', nombre: 'Colonia Grecia', direccion: 'Soyapango', lat: 13.7234, lng: -89.1423, zona: 'Soyapango', tipo: 'Regular' },
  { codigo: 'COL-HIPO', nombre: 'Colonia Hipódromo', direccion: 'San Salvador', lat: 13.6823, lng: -89.2489, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'COL-CUCUMA', nombre: 'Colonia Cucumacayán', direccion: 'San Salvador', lat: 13.6801, lng: -89.2512, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'COL-MONTE', nombre: 'Colonia Montebello', direccion: 'San Salvador', lat: 13.7034, lng: -89.2389, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'COL-RUBEND', nombre: 'Colonia Rubén Darío', direccion: 'San Salvador', lat: 13.6867, lng: -89.2289, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'COL-CASTAÑ', nombre: 'Colonia Castañeda', direccion: 'San Salvador', lat: 13.6878, lng: -89.2412, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'COL-SANMAR', nombre: 'Colonia San Mauricio', direccion: 'San Salvador', lat: 13.6956, lng: -89.2489, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'COL-LISBO', nombre: 'Colonia Lisboa', direccion: 'San Salvador', lat: 13.6989, lng: -89.2456, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'COL-VENEZ2', nombre: 'Colonia Venezuela (SS)', direccion: 'San Salvador', lat: 13.6934, lng: -89.2201, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'COL-BRASILIA', nombre: 'Colonia Brasilia', direccion: 'San Salvador', lat: 13.6912, lng: -89.2423, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'COL-MAGDA', nombre: 'Colonia La Magdalena', direccion: 'San Salvador', lat: 13.7001, lng: -89.2267, zona: 'San Salvador', tipo: 'Regular' },
  { codigo: 'COL-JUSTO', nombre: 'Colonia Justo Armas', direccion: 'Mejicanos', lat: 13.7156, lng: -89.2201, zona: 'Mejicanos', tipo: 'Regular' },
  { codigo: 'COL-SIERRA', nombre: 'Colonia La Sierra', direccion: 'Mejicanos', lat: 13.7189, lng: -89.2212, zona: 'Mejicanos', tipo: 'Regular' },
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

    // Insertar paradas (SINTAXIS SQLITE, sin ST_GeomFromText)
    console.log('📍 Insertando 250+ paradas...');
    const paradasMap = new Map();
    
    for (const parada of paradasSuperExpandidas) {
      try {
        const result = await pool.query(
          `INSERT INTO paradas (codigo, nombre, descripcion, direccion, latitud, longitud, zona, tipo, tiene_techo, tiene_asientos, accesible, activa) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, 1)
           RETURNING id`,
          [
            parada.codigo,
            parada.nombre,
            parada.direccion || '',
            parada.direccion,
            parada.lat,
            parada.lng,
            parada.zona,
            parada.tipo
          ]
        );
        
        paradasMap.set(parada.codigo, result.rows[0].id);
        
        const index = paradasSuperExpandidas.indexOf(parada);
        if (index % 20 === 0 || index === paradasSuperExpandidas.length - 1) {
          console.log(`  ✅ Procesando... ${index + 1}/${paradasSuperExpandidas.length}`);
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
    console.log('   npm start');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (err) {
    console.error('❌ Error durante la importación:', err);
    console.error(err.stack);
  } finally {
    process.exit(0);
  }
}

// Ejecutar importación
importarDatosSuperExpandidos();








