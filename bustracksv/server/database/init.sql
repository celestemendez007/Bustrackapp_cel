-- ============================================================================
-- BASE DE DATOS BUSTRACKSV - SISTEMA INTELIGENTE DE TRANSPORTE PÚBLICO
-- San Salvador, El Salvador - Área Metropolitana (AMSS)
-- Basado en datos del Viceministerio de Transporte (VMT)
-- ============================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- ============================================================================
-- TABLA DE USUARIOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    nombre_completo VARCHAR(255),
    telefono VARCHAR(20),
    foto_perfil TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    preferencias JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- TABLA DE HISTORIAL DE BÚSQUEDAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS historial_busquedas (
    id SERIAL PRIMARY KEY,
    id_usuario INT REFERENCES usuarios(id) ON DELETE CASCADE,
    ruta VARCHAR(200),
    numero_ruta VARCHAR(50),
    parada VARCHAR(200),
    fecha_busqueda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    latitud_origen DECIMAL(10, 8),
    longitud_origen DECIMAL(11, 8),
    latitud_destino DECIMAL(10, 8),
    longitud_destino DECIMAL(11, 8),
    tipo_busqueda VARCHAR(50) DEFAULT 'general', -- 'general', 'ruta', 'parada', 'recomendacion'
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- TABLA DE RUTAS DE BUSES
-- ============================================================================
CREATE TABLE IF NOT EXISTS rutas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    color VARCHAR(10) DEFAULT '#0066CC',
    numero_ruta VARCHAR(20) NOT NULL UNIQUE,
    empresa VARCHAR(100),
    tipo VARCHAR(50) DEFAULT 'Bus', -- Bus, Microbus, Expreso
    tarifa DECIMAL(5,2) DEFAULT 0.25,
    horario_inicio TIME DEFAULT '05:00:00',
    horario_fin TIME DEFAULT '21:00:00',
    frecuencia_minutos INT DEFAULT 15,
    activa BOOLEAN DEFAULT TRUE,
    geometry GEOMETRY(LINESTRING, 4326),
    longitud_km DECIMAL(10,2),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLA DE PARADAS DE BUSES
-- ============================================================================
CREATE TABLE IF NOT EXISTS paradas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    direccion TEXT,
    latitud DECIMAL(10, 8) NOT NULL,
    longitud DECIMAL(11, 8) NOT NULL,
    ubicacion GEOMETRY(POINT, 4326) NOT NULL,
    zona VARCHAR(100),
    tipo VARCHAR(50) DEFAULT 'Regular', -- Regular, Terminal, TransferHub
    tiene_techo BOOLEAN DEFAULT FALSE,
    tiene_asientos BOOLEAN DEFAULT FALSE,
    accesible BOOLEAN DEFAULT FALSE,
    activa BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLA DE RELACIÓN PARADAS-RUTAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS parada_ruta (
    id SERIAL PRIMARY KEY,
    id_parada INT REFERENCES paradas(id) ON DELETE CASCADE,
    id_ruta INT REFERENCES rutas(id) ON DELETE CASCADE,
    orden INT NOT NULL,
    direccion VARCHAR(10) DEFAULT 'ida', -- 'ida' o 'vuelta'
    distancia_km DECIMAL(10,2),
    tiempo_estimado_minutos INT,
    UNIQUE(id_parada, id_ruta, direccion, orden)
);

-- ============================================================================
-- ÍNDICES ESPACIALES Y DE RENDIMIENTO
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_usuario ON usuarios(usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_historial_usuario ON historial_busquedas(id_usuario);
CREATE INDEX IF NOT EXISTS idx_historial_fecha ON historial_busquedas(fecha_busqueda DESC);
CREATE INDEX IF NOT EXISTS idx_rutas_numero ON rutas(numero_ruta);
CREATE INDEX IF NOT EXISTS idx_rutas_activa ON rutas(activa);
CREATE INDEX IF NOT EXISTS idx_rutas_geometry ON rutas USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_paradas_codigo ON paradas(codigo);
CREATE INDEX IF NOT EXISTS idx_paradas_activa ON paradas(activa);
CREATE INDEX IF NOT EXISTS idx_paradas_ubicacion ON paradas USING GIST(ubicacion);
CREATE INDEX IF NOT EXISTS idx_paradas_zona ON paradas(zona);
CREATE INDEX IF NOT EXISTS idx_parada_ruta_parada ON parada_ruta(id_parada);
CREATE INDEX IF NOT EXISTS idx_parada_ruta_ruta ON parada_ruta(id_ruta);

-- ============================================================================
-- FUNCIONES POSTGIS PERSONALIZADAS
-- ============================================================================

-- Función para calcular distancia en metros entre dos puntos
CREATE OR REPLACE FUNCTION distancia_metros(lat1 DECIMAL, lon1 DECIMAL, lat2 DECIMAL, lon2 DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    RETURN ST_Distance(
        ST_GeomFromText('POINT(' || lon1 || ' ' || lat1 || ')', 4326)::geography,
        ST_GeomFromText('POINT(' || lon2 || ' ' || lat2 || ')', 4326)::geography
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para encontrar paradas cercanas a un punto
CREATE OR REPLACE FUNCTION paradas_cercanas(
    lat DECIMAL, 
    lon DECIMAL, 
    radio_metros INT DEFAULT 500,
    limite INT DEFAULT 10
)
RETURNS TABLE(
    id INT,
    codigo VARCHAR,
    nombre VARCHAR,
    direccion TEXT,
    latitud DECIMAL,
    longitud DECIMAL,
    distancia_metros DECIMAL,
    zona VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.codigo,
        p.nombre,
        p.direccion,
        p.latitud,
        p.longitud,
        ROUND(ST_Distance(
            p.ubicacion::geography,
            ST_GeomFromText('POINT(' || lon || ' ' || lat || ')', 4326)::geography
        )::DECIMAL, 2) as distancia_metros,
        p.zona
    FROM paradas p
    WHERE p.activa = TRUE
        AND ST_DWithin(
            p.ubicacion::geography,
            ST_GeomFromText('POINT(' || lon || ' ' || lat || ')', 4326)::geography,
            radio_metros
        )
    ORDER BY p.ubicacion <-> ST_GeomFromText('POINT(' || lon || ' ' || lat || ')', 4326)
    LIMIT limite;
END;
$$ LANGUAGE plpgsql STABLE;

-- Función para encontrar rutas cercanas a un punto
CREATE OR REPLACE FUNCTION rutas_cercanas(
    lat DECIMAL, 
    lon DECIMAL, 
    radio_metros INT DEFAULT 500,
    limite INT DEFAULT 10
)
RETURNS TABLE(
    id INT,
    numero_ruta VARCHAR,
    nombre VARCHAR,
    descripcion TEXT,
    color VARCHAR,
    distancia_metros DECIMAL,
    empresa VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.numero_ruta,
        r.nombre,
        r.descripcion,
        r.color,
        ROUND(ST_Distance(
            r.geometry::geography,
            ST_GeomFromText('POINT(' || lon || ' ' || lat || ')', 4326)::geography
        )::DECIMAL, 2) as distancia_metros,
        r.empresa
    FROM rutas r
    WHERE r.activa = TRUE
        AND ST_DWithin(
            r.geometry::geography,
            ST_GeomFromText('POINT(' || lon || ' ' || lat || ')', 4326)::geography,
            radio_metros
        )
    ORDER BY r.geometry <-> ST_GeomFromText('POINT(' || lon || ' ' || lat || ')', 4326)
    LIMIT limite;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- DATOS REALES: PARADAS DEL ÁREA METROPOLITANA DE SAN SALVADOR
-- Basado en ubicaciones reales y puntos clave de la ciudad
-- ============================================================================

INSERT INTO paradas (codigo, nombre, descripcion, direccion, latitud, longitud, ubicacion, zona, tipo, tiene_techo, tiene_asientos, accesible) VALUES
-- ZONA CENTRO
('P001', 'Terminal Centro', 'Terminal principal del Centro Histórico', 'Calle Rubén Darío, Centro Histórico', 13.6929, -89.2182, ST_GeomFromText('POINT(-89.2182 13.6929)', 4326), 'Centro', 'Terminal', TRUE, TRUE, TRUE),
('P002', 'Catedral Metropolitana', 'Frente a la Catedral', 'Plaza Barrios, Centro', 13.6983, -89.2144, ST_GeomFromText('POINT(-89.2144 13.6983)', 4326), 'Centro', 'Regular', TRUE, TRUE, FALSE),
('P003', 'Teatro Nacional', 'Parada Teatro Nacional', '2ª Calle Poniente, Centro', 13.6959, -89.2172, ST_GeomFromText('POINT(-89.2172 13.6959)', 4326), 'Centro', 'Regular', FALSE, FALSE, FALSE),
('P004', 'Mercado Central', 'Mercado Central', '8ª Calle Poniente, Centro', 13.6945, -89.2165, ST_GeomFromText('POINT(-89.2165 13.6945)', 4326), 'Centro', 'Regular', TRUE, FALSE, FALSE),

-- ZONA METROCENTRO / COMERCIAL
('P005', 'Metrocentro', 'Centro Comercial Metrocentro', 'Boulevard de los Héroes', 13.6929, -89.2311, ST_GeomFromText('POINT(-89.2311 13.6929)', 4326), 'San Salvador', 'TransferHub', TRUE, TRUE, TRUE),
('P006', 'Plaza Mundo', 'Centro Comercial Plaza Mundo', 'Autopista Sur', 13.6754, -89.2421, ST_GeomFromText('POINT(-89.2421 13.6754)', 4326), 'San Salvador', 'Regular', TRUE, TRUE, TRUE),
('P007', 'Multiplaza', 'Centro Comercial Multiplaza', 'Carretera Panamericana', 13.6694, -89.2436, ST_GeomFromText('POINT(-89.2436 13.6694)', 4326), 'Antiguo Cuscatlán', 'Regular', TRUE, TRUE, TRUE),

-- ZONA HOSPITAL / SALUD
('P008', 'Hospital Rosales', 'Hospital Nacional Rosales', '25 Avenida Norte', 13.7051, -89.2123, ST_GeomFromText('POINT(-89.2123 13.7051)', 4326), 'San Salvador', 'Regular', TRUE, TRUE, TRUE),
('P009', 'Hospital Bloom', 'Hospital de Niños Benjamín Bloom', '27 Avenida Norte', 13.7098, -89.2087, ST_GeomFromText('POINT(-89.2087 13.7098)', 4326), 'San Salvador', 'Regular', TRUE, FALSE, TRUE),

-- ZONA UNIVERSITARIA
('P010', 'Universidad de El Salvador', 'Ciudad Universitaria UES', 'Final 25 Avenida Norte', 13.7268, -89.1861, ST_GeomFromText('POINT(-89.1861 13.7268)', 4326), 'San Salvador', 'TransferHub', TRUE, TRUE, TRUE),
('P011', 'Universidad Centroamericana', 'UCA José Simeón Cañas', 'Boulevard de los Próceres', 13.6833, -89.2347, ST_GeomFromText('POINT(-89.2347 13.6833)', 4326), 'Antiguo Cuscatlán', 'Regular', TRUE, TRUE, TRUE),
('P012', 'Universidad Don Bosco', 'Universidad Don Bosco', 'Soyapango', 13.7089, -89.1556, ST_GeomFromText('POINT(-89.1556 13.7089)', 4326), 'Soyapango', 'Regular', TRUE, TRUE, FALSE),

-- TERMINALES Y TRANSFERENCIAS
('P013', 'Terminal de Occidente', 'Terminal de Buses de Occidente', 'Boulevard Venezuela', 13.6896, -89.2397, ST_GeomFromText('POINT(-89.2397 13.6896)', 4326), 'San Salvador', 'Terminal', TRUE, TRUE, TRUE),
('P014', 'Terminal de Oriente', 'Terminal de Buses de Oriente', 'Boulevard del Ejército', 13.6989, -89.1654, ST_GeomFromText('POINT(-89.1654 13.6989)', 4326), 'San Salvador', 'Terminal', TRUE, TRUE, TRUE),
('P015', 'Terminal Soyapango', 'Terminal de Soyapango', 'Soyapango Centro', 13.7108, -89.1394, ST_GeomFromText('POINT(-89.1394 13.7108)', 4326), 'Soyapango', 'Terminal', TRUE, TRUE, TRUE),

-- ZONA MEJICANOS
('P016', 'Mejicanos Centro', 'Centro de Mejicanos', 'Mejicanos', 13.7402, -89.2029, ST_GeomFromText('POINT(-89.2029 13.7402)', 4326), 'Mejicanos', 'TransferHub', TRUE, TRUE, FALSE),
('P017', 'Parque San José', 'Parque San José Mejicanos', 'Mejicanos', 13.7445, -89.2058, ST_GeomFromText('POINT(-89.2058 13.7445)', 4326), 'Mejicanos', 'Regular', FALSE, TRUE, FALSE),

-- SANTA TECLA
('P018', 'Santa Tecla Centro', 'Parque Daniel Hernández', 'Santa Tecla', 13.6767, -89.2794, ST_GeomFromText('POINT(-89.2794 13.6767)', 4326), 'Santa Tecla', 'TransferHub', TRUE, TRUE, TRUE),
('P019', 'Santa Tecla Norte', 'Colonia Santa Tecla Norte', 'Santa Tecla', 13.6845, -89.2756, ST_GeomFromText('POINT(-89.2756 13.6845)', 4326), 'Santa Tecla', 'Regular', TRUE, FALSE, FALSE),

-- SOYAPANGO
('P020', 'Soyapango Plaza', 'Plaza Soyapango', 'Soyapango', 13.7124, -89.1428, ST_GeomFromText('POINT(-89.1428 13.7124)', 4326), 'Soyapango', 'Regular', TRUE, TRUE, TRUE),
('P021', 'Soyapango San Bartolo', 'Colonia San Bartolo', 'Soyapango', 13.7156, -89.1512, ST_GeomFromText('POINT(-89.1512 13.7156)', 4326), 'Soyapango', 'Regular', FALSE, FALSE, FALSE),

-- APOPA
('P022', 'Apopa Centro', 'Centro de Apopa', 'Apopa', 13.8072, -89.1792, ST_GeomFromText('POINT(-89.1792 13.8072)', 4326), 'Apopa', 'TransferHub', TRUE, TRUE, FALSE),

-- ILOPANGO
('P023', 'Ilopango Centro', 'Centro de Ilopango', 'Ilopango', 13.7014, -89.1078, ST_GeomFromText('POINT(-89.1078 13.7014)', 4326), 'Ilopango', 'TransferHub', TRUE, TRUE, FALSE),

-- ANTIGUO CUSCATLÁN
('P024', 'Antiguo Cuscatlán', 'Centro Antiguo Cuscatlán', 'Antiguo Cuscatlán', 13.6642, -89.2517, ST_GeomFromText('POINT(-89.2517 13.6642)', 4326), 'Antiguo Cuscatlán', 'Regular', TRUE, TRUE, TRUE),

-- AEROPUERTO
('P025', 'Aeropuerto Internacional', 'Aeropuerto Monseñor Romero', 'Comalapa', 13.4406, -89.0556, ST_GeomFromText('POINT(-89.0556 13.4406)', 4326), 'Comalapa', 'Terminal', TRUE, TRUE, TRUE),

-- ZONA ROSA Y COMERCIAL
('P026', 'Zona Rosa', 'Boulevard del Hipódromo', 'Colonia San Benito', 13.6994, -89.2294, ST_GeomFromText('POINT(-89.2294 13.6994)', 4326), 'San Salvador', 'Regular', TRUE, TRUE, TRUE),
('P027', 'Galerías Escalón', 'Centro Comercial Galerías', 'Paseo General Escalón', 13.6967, -89.2372, ST_GeomFromText('POINT(-89.2372 13.6967)', 4326), 'San Salvador', 'Regular', TRUE, TRUE, TRUE),

-- ESTADIO Y DEPORTES
('P028', 'Estadio Cuscatlán', 'Estadio Nacional Cuscatlán', 'Colonia Flor Blanca', 13.6894, -89.2511, ST_GeomFromText('POINT(-89.2511 13.6894)', 4326), 'San Salvador', 'Regular', TRUE, TRUE, TRUE),

-- CIUDAD DELGADO
('P029', 'Ciudad Delgado', 'Centro Ciudad Delgado', 'Ciudad Delgado', 13.7275, -89.1733, ST_GeomFromText('POINT(-89.1733 13.7275)', 4326), 'Ciudad Delgado', 'TransferHub', TRUE, TRUE, FALSE),

-- CUSCATANCINGO
('P030', 'Cuscatancingo', 'Centro Cuscatancingo', 'Cuscatancingo', 13.7356, -89.1842, ST_GeomFromText('POINT(-89.1842 13.7356)', 4326), 'Cuscatancingo', 'Regular', TRUE, FALSE, FALSE);

-- ============================================================================
-- DATOS REALES: RUTAS DE BUSES DEL AMSS
-- 10 Rutas principales solicitadas con trayectorias realistas
-- ============================================================================

INSERT INTO rutas (nombre, descripcion, color, numero_ruta, empresa, tipo, tarifa, horario_inicio, horario_fin, frecuencia_minutos, geometry, longitud_km) VALUES

-- RUTA 1: Centro - Metrocentro - Plaza Mundo
('Ruta 1 Centro-Plaza Mundo', 'Conecta el Centro Histórico con zonas comerciales principales', '#FF6B6B', 'R1', 'Autobuses Metropolitanos', 'Bus', 0.25, '05:00:00', '21:00:00', 10,
 ST_GeomFromText('LINESTRING(-89.2182 13.6929, -89.2165 13.6945, -89.2172 13.6959, -89.2144 13.6983, -89.2200 13.6950, -89.2250 13.6940, -89.2311 13.6929, -89.2350 13.6900, -89.2380 13.6850, -89.2421 13.6754)', 4326), 8.5),

-- RUTA 101-D: Terminal Occidente - Centro - UES
('Ruta 101-D Terminal-UES', 'Ruta que conecta Terminal de Occidente con la Universidad', '#4ECDC4', '101-D', 'Transporte Capitalino', 'Microbus', 0.30, '05:00:00', '20:30:00', 12,
 ST_GeomFromText('LINESTRING(-89.2397 13.6896, -89.2350 13.6920, -89.2311 13.6929, -89.2250 13.6940, -89.2182 13.6929, -89.2123 13.7051, -89.2087 13.7098, -89.2000 13.7150, -89.1900 13.7220, -89.1861 13.7268)', 4326), 12.3),

-- RUTA 7-B: Mejicanos - Centro - Santa Tecla
('Ruta 7-B Mejicanos-Santa Tecla', 'Atraviesa la ciudad de norte a oeste', '#45B7D1', '7-B', 'Autobuses AMSS', 'Bus', 0.25, '04:30:00', '22:00:00', 8,
 ST_GeomFromText('LINESTRING(-89.2029 13.7402, -89.2058 13.7445, -89.2100 13.7300, -89.2123 13.7051, -89.2165 13.6945, -89.2182 13.6929, -89.2200 13.6900, -89.2300 13.6850, -89.2400 13.6800, -89.2500 13.6780, -89.2600 13.6770, -89.2700 13.6768, -89.2794 13.6767)', 4326), 16.8),

-- RUTA 30-B: Soyapango - Centro - Metrocentro
('Ruta 30-B Soyapango-Metrocentro', 'Ruta del este hacia el centro y zona comercial', '#FFA726', '30-B', 'Transporte del Este', 'Bus', 0.25, '05:00:00', '21:00:00', 15,
 ST_GeomFromText('LINESTRING(-89.1394 13.7108, -89.1428 13.7124, -89.1512 13.7156, -89.1556 13.7089, -89.1654 13.6989, -89.1750 13.6950, -89.1850 13.6930, -89.2000 13.6925, -89.2100 13.6927, -89.2182 13.6929, -89.2250 13.6928, -89.2311 13.6929)', 4326), 11.5),

-- RUTA 52: Terminal Oriente - Centro - Hospital Rosales
('Ruta 52 Oriente-Rosales', 'Conecta Terminal de Oriente con hospitales', '#9C27B0', '52', 'Autobuses del Oriente', 'Bus', 0.25, '05:30:00', '20:00:00', 20,
 ST_GeomFromText('LINESTRING(-89.1654 13.6989, -89.1750 13.6990, -89.1850 13.6985, -89.1950 13.6970, -89.2000 13.6960, -89.2100 13.6950, -89.2144 13.6983, -89.2150 13.7000, -89.2123 13.7051, -89.2087 13.7098)', 4326), 9.2),

-- RUTA 44: Apopa - Mejicanos - Centro
('Ruta 44 Apopa-Centro', 'Ruta del norte hacia el centro', '#F44336', '44', 'Autobuses del Norte', 'Bus', 0.30, '04:30:00', '21:30:00', 18,
 ST_GeomFromText('LINESTRING(-89.1792 13.8072, -89.1850 13.7900, -89.1900 13.7750, -89.1950 13.7600, -89.2000 13.7450, -89.2029 13.7402, -89.2100 13.7200, -89.2123 13.7051, -89.2144 13.6983, -89.2165 13.6945, -89.2182 13.6929)', 4326), 14.7),

-- RUTA 16: Ciudad Delgado - Centro - Metrocentro
('Ruta 16 Delgado-Metrocentro', 'Conecta Ciudad Delgado con áreas comerciales', '#2196F3', '16', 'Transporte Capitalino', 'Microbus', 0.30, '05:00:00', '20:30:00', 12,
 ST_GeomFromText('LINESTRING(-89.1733 13.7275, -89.1842 13.7356, -89.1900 13.7300, -89.1950 13.7200, -89.2000 13.7100, -89.2050 13.7000, -89.2123 13.7051, -89.2150 13.6990, -89.2182 13.6929, -89.2250 13.6930, -89.2311 13.6929)', 4326), 10.8),

-- RUTA 29-C: Santa Tecla - Centro - Soyapango
('Ruta 29-C Santa Tecla-Soyapango', 'Ruta transversal oeste-este', '#4CAF50', '29-C', 'Autobuses AMSS', 'Bus', 0.35, '05:00:00', '21:00:00', 15,
 ST_GeomFromText('LINESTRING(-89.2794 13.6767, -89.2700 13.6770, -89.2600 13.6780, -89.2500 13.6800, -89.2400 13.6850, -89.2311 13.6929, -89.2182 13.6929, -89.2000 13.6925, -89.1850 13.6930, -89.1750 13.6950, -89.1654 13.6989, -89.1556 13.7089, -89.1512 13.7156, -89.1428 13.7124, -89.1394 13.7108)', 4326), 19.5),

-- RUTA 4: Ilopango - Centro - Antiguo Cuscatlán
('Ruta 4 Ilopango-Cuscatlán', 'Conecta Ilopango con zona sur', '#FF9800', '4', 'Transporte del Este', 'Bus', 0.30, '05:00:00', '20:00:00', 18,
 ST_GeomFromText('LINESTRING(-89.1078 13.7014, -89.1200 13.7050, -89.1400 13.7080, -89.1654 13.6989, -89.1850 13.6950, -89.2000 13.6930, -89.2182 13.6929, -89.2250 13.6900, -89.2311 13.6850, -89.2400 13.6750, -89.2450 13.6680, -89.2517 13.6642)', 4326), 17.2),

-- RUTA 11: Centro - Zona Rosa - Multiplaza
('Ruta 11 Centro-Multiplaza', 'Ruta comercial y turística', '#E91E63', '11', 'Autobuses Metropolitanos', 'Bus', 0.25, '06:00:00', '22:00:00', 10,
 ST_GeomFromText('LINESTRING(-89.2182 13.6929, -89.2200 13.6950, -89.2250 13.6980, -89.2294 13.6994, -89.2311 13.6929, -89.2347 13.6833, -89.2372 13.6967, -89.2400 13.6850, -89.2421 13.6754, -89.2436 13.6694)', 4326), 9.8);

-- ============================================================================
-- RELACIONAR PARADAS CON RUTAS (Tabla parada_ruta)
-- ============================================================================

-- RUTA 1 (R1): Centro - Metrocentro - Plaza Mundo
INSERT INTO parada_ruta (id_parada, id_ruta, orden, direccion, tiempo_estimado_minutos) VALUES
(1, 1, 1, 'ida', 0),   -- Terminal Centro
(4, 1, 2, 'ida', 5),   -- Mercado Central
(3, 1, 3, 'ida', 10),  -- Teatro Nacional
(2, 1, 4, 'ida', 12),  -- Catedral
(5, 1, 5, 'ida', 20),  -- Metrocentro
(6, 1, 6, 'ida', 35);  -- Plaza Mundo

-- RUTA 101-D: Terminal Occidente - Centro - UES
INSERT INTO parada_ruta (id_parada, id_ruta, orden, direccion, tiempo_estimado_minutos) VALUES
(13, 2, 1, 'ida', 0),  -- Terminal de Occidente
(5, 2, 2, 'ida', 10),  -- Metrocentro
(1, 2, 3, 'ida', 15),  -- Terminal Centro
(8, 2, 4, 'ida', 25),  -- Hospital Rosales
(9, 2, 5, 'ida', 30),  -- Hospital Bloom
(10, 2, 6, 'ida', 45); -- Universidad UES

-- RUTA 7-B: Mejicanos - Centro - Santa Tecla
INSERT INTO parada_ruta (id_parada, id_ruta, orden, direccion, tiempo_estimado_minutos) VALUES
(16, 3, 1, 'ida', 0),  -- Mejicanos Centro
(17, 3, 2, 'ida', 5),  -- Parque San José
(8, 3, 3, 'ida', 20),  -- Hospital Rosales
(1, 3, 4, 'ida', 30),  -- Terminal Centro
(5, 3, 5, 'ida', 40),  -- Metrocentro
(28, 3, 6, 'ida', 50), -- Estadio Cuscatlán
(18, 3, 7, 'ida', 65), -- Santa Tecla Centro
(19, 3, 8, 'ida', 70); -- Santa Tecla Norte

-- RUTA 30-B: Soyapango - Centro - Metrocentro
INSERT INTO parada_ruta (id_parada, id_ruta, orden, direccion, tiempo_estimado_minutos) VALUES
(15, 4, 1, 'ida', 0),  -- Terminal Soyapango
(20, 4, 2, 'ida', 5),  -- Soyapango Plaza
(21, 4, 3, 'ida', 10), -- San Bartolo
(12, 4, 4, 'ida', 20), -- Universidad Don Bosco
(14, 4, 5, 'ida', 30), -- Terminal de Oriente
(1, 4, 6, 'ida', 45),  -- Terminal Centro
(5, 4, 7, 'ida', 55);  -- Metrocentro

-- RUTA 52: Terminal Oriente - Centro - Hospital Rosales
INSERT INTO parada_ruta (id_parada, id_ruta, orden, direccion, tiempo_estimado_minutos) VALUES
(14, 5, 1, 'ida', 0),  -- Terminal de Oriente
(2, 5, 2, 'ida', 15),  -- Catedral
(1, 5, 3, 'ida', 20),  -- Terminal Centro
(8, 5, 4, 'ida', 30),  -- Hospital Rosales
(9, 5, 5, 'ida', 35);  -- Hospital Bloom

-- RUTA 44: Apopa - Mejicanos - Centro
INSERT INTO parada_ruta (id_parada, id_ruta, orden, direccion, tiempo_estimado_minutos) VALUES
(22, 6, 1, 'ida', 0),  -- Apopa Centro
(16, 6, 2, 'ida', 25), -- Mejicanos Centro
(8, 6, 3, 'ida', 40),  -- Hospital Rosales
(2, 6, 4, 'ida', 50),  -- Catedral
(1, 6, 5, 'ida', 55);  -- Terminal Centro

-- RUTA 16: Ciudad Delgado - Centro - Metrocentro
INSERT INTO parada_ruta (id_parada, id_ruta, orden, direccion, tiempo_estimado_minutos) VALUES
(29, 7, 1, 'ida', 0),  -- Ciudad Delgado
(30, 7, 2, 'ida', 8),  -- Cuscatancingo
(8, 7, 3, 'ida', 25),  -- Hospital Rosales
(1, 7, 4, 'ida', 35),  -- Terminal Centro
(5, 7, 5, 'ida', 45);  -- Metrocentro

-- RUTA 29-C: Santa Tecla - Centro - Soyapango
INSERT INTO parada_ruta (id_parada, id_ruta, orden, direccion, tiempo_estimado_minutos) VALUES
(18, 8, 1, 'ida', 0),  -- Santa Tecla Centro
(19, 8, 2, 'ida', 7),  -- Santa Tecla Norte
(28, 8, 3, 'ida', 15), -- Estadio Cuscatlán
(5, 8, 4, 'ida', 25),  -- Metrocentro
(1, 8, 5, 'ida', 35),  -- Terminal Centro
(14, 8, 6, 'ida', 50), -- Terminal Oriente
(12, 8, 7, 'ida', 65), -- Universidad Don Bosco
(20, 8, 8, 'ida', 75), -- Soyapango Plaza
(15, 8, 9, 'ida', 80); -- Terminal Soyapango

-- RUTA 4: Ilopango - Centro - Antiguo Cuscatlán
INSERT INTO parada_ruta (id_parada, id_ruta, orden, direccion, tiempo_estimado_minutos) VALUES
(23, 9, 1, 'ida', 0),  -- Ilopango Centro
(14, 9, 2, 'ida', 20), -- Terminal Oriente
(1, 9, 3, 'ida', 35),  -- Terminal Centro
(5, 9, 4, 'ida', 45),  -- Metrocentro
(24, 9, 5, 'ida', 60); -- Antiguo Cuscatlán

-- RUTA 11: Centro - Zona Rosa - Multiplaza
INSERT INTO parada_ruta (id_parada, id_ruta, orden, direccion, tiempo_estimado_minutos) VALUES
(1, 10, 1, 'ida', 0),  -- Terminal Centro
(26, 10, 2, 'ida', 12), -- Zona Rosa
(27, 10, 3, 'ida', 18), -- Galerías Escalón
(5, 10, 4, 'ida', 20), -- Metrocentro
(11, 10, 5, 'ida', 25), -- UCA
(6, 10, 6, 'ida', 35), -- Plaza Mundo
(7, 10, 7, 'ida', 40); -- Multiplaza

-- ============================================================================
-- VISTAS ÚTILES PARA CONSULTAS FRECUENTES
-- ============================================================================

-- Vista: Rutas con número de paradas
CREATE OR REPLACE VIEW v_rutas_resumen AS
SELECT 
    r.id,
    r.numero_ruta,
    r.nombre,
    r.descripcion,
    r.color,
    r.empresa,
    r.tipo,
    r.tarifa,
    r.frecuencia_minutos,
    r.longitud_km,
    COUNT(DISTINCT pr.id_parada) as total_paradas,
    ST_AsGeoJSON(r.geometry) as geometry_json
FROM rutas r
LEFT JOIN parada_ruta pr ON r.id = pr.id_ruta
WHERE r.activa = TRUE
GROUP BY r.id;

-- Vista: Paradas con número de rutas que pasan
CREATE OR REPLACE VIEW v_paradas_resumen AS
SELECT 
    p.id,
    p.codigo,
    p.nombre,
    p.direccion,
    p.zona,
    p.tipo,
    p.latitud,
    p.longitud,
    COUNT(DISTINCT pr.id_ruta) as total_rutas_pasan,
    ST_AsGeoJSON(p.ubicacion) as ubicacion_json
FROM paradas p
LEFT JOIN parada_ruta pr ON p.id = pr.id_parada
WHERE p.activa = TRUE
GROUP BY p.id;

-- ============================================================================
-- TRIGGERS PARA MANTENER DATOS ACTUALIZADOS
-- ============================================================================

-- Trigger para actualizar fecha de modificación en rutas
CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_ruta
BEFORE UPDATE ON rutas
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_modificacion();

-- Trigger para calcular longitud de ruta automáticamente
CREATE OR REPLACE FUNCTION calcular_longitud_ruta()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.geometry IS NOT NULL THEN
        NEW.longitud_km = ROUND((ST_Length(NEW.geometry::geography) / 1000)::DECIMAL, 2);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_longitud
BEFORE INSERT OR UPDATE ON rutas
FOR EACH ROW
WHEN (NEW.geometry IS NOT NULL)
EXECUTE FUNCTION calcular_longitud_ruta();

-- ============================================================================
-- COMENTARIOS EN TABLAS PARA DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE rutas IS 'Rutas de buses del Área Metropolitana de San Salvador';
COMMENT ON TABLE paradas IS 'Paradas de buses con ubicación geográfica precisa';
COMMENT ON TABLE parada_ruta IS 'Relación entre paradas y rutas con orden y tiempo estimado';
COMMENT ON TABLE usuarios IS 'Usuarios registrados en el sistema';

-- ============================================================================
-- FIN DEL SCRIPT DE INICIALIZACIÓN
-- Sistema BusTrackSV - San Salvador, El Salvador
-- ============================================================================

