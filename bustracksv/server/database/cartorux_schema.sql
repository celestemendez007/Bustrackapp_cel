-- ============================================================================
-- ESQUEMA DE BASE DE DATOS PARA CARTORUX.COM
-- Basado en el Informe Técnico: Arquitectura de Datos y Estrategia de Implementación
-- Fase 1: Diseño del Esquema de Base de Datos (PostgreSQL)
-- ============================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- TABLA: DEPARTMENTS (Estructura Geopolítica - Sección 2.1)
-- ============================================================================
-- Los 14 departamentos de El Salvador actúan como "containers" de datos
-- Cada ruta debe estar asociada a un departamento para evitar conflictos
-- de nombres (ej. "Ruta 1" puede existir en múltiples departamentos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS departments (
    department_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE, -- Para URLs: "san-salvador", "la-libertad"
    code VARCHAR(10), -- Código ISO o abreviación oficial
    region VARCHAR(50), -- "Occidental", "Central", "Oriental", "Paracentral"
    priority INTEGER DEFAULT 5, -- 1-10: Prioridad para scraping (San Salvador=10, La Libertad=9)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para Departments
CREATE INDEX IF NOT EXISTS idx_departments_slug ON departments(slug);
CREATE INDEX IF NOT EXISTS idx_departments_priority ON departments(priority DESC);
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(is_active);

-- ============================================================================
-- TABLA: DESTINATIONS (Sección 3.3 - Entidad "Destino")
-- ============================================================================
-- Destinos turísticos que actúan como nodos de atracción
-- Relación Many-to-Many con Routes (un destino puede ser servido por múltiples rutas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS destinations (
    destination_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL, -- "Playa", "Museo", "Bosque", "Sitio Arqueológico", "Turicentro"
    description TEXT,
    department_id UUID REFERENCES departments(department_id) ON DELETE SET NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location GEOMETRY(POINT, 4326), -- PostGIS geometry
    source_url TEXT, -- URL original en cartorux.com
    content_quality_score INTEGER DEFAULT 5, -- 1-10: Calidad del contenido extraído
    is_validated BOOLEAN DEFAULT FALSE, -- Páginas "cascarón" deben marcarse como no validadas
    raw_content_length INTEGER, -- Longitud del contenido extraído (para detectar stubs)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para Destinations
CREATE INDEX IF NOT EXISTS idx_destinations_slug ON destinations(slug);
CREATE INDEX IF NOT EXISTS idx_destinations_category ON destinations(category);
CREATE INDEX IF NOT EXISTS idx_destinations_department ON destinations(department_id);
CREATE INDEX IF NOT EXISTS idx_destinations_validated ON destinations(is_validated);
CREATE INDEX IF NOT EXISTS idx_destinations_location ON destinations USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_destinations_quality ON destinations(content_quality_score DESC);

-- ============================================================================
-- TABLA: ROUTES (Sección 3.1 - La Entidad "Ruta de Bus")
-- ============================================================================
-- Representa una ruta de transporte público con todos sus atributos
-- Basado en el esquema propuesto en la Sección 3.1 del informe
-- ============================================================================
CREATE TABLE IF NOT EXISTS routes (
    route_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    public_id VARCHAR(50) NOT NULL, -- El nombre visible (ej. "102", "107", "177")
    department_id UUID NOT NULL REFERENCES departments(department_id) ON DELETE CASCADE,
    origin_text TEXT, -- Texto descriptivo del origen (ej. "Parque Simón Bolívar")
    destination_text TEXT, -- Texto descriptivo del destino (ej. "Playa El Tunco")
    origin_latitude DECIMAL(10, 8),
    origin_longitude DECIMAL(11, 8),
    destination_latitude DECIMAL(10, 8),
    destination_longitude DECIMAL(11, 8),
    base_fare DECIMAL(4, 2), -- Precio extraído (ej. 1.50)
    currency VARCHAR(3) DEFAULT 'USD',
    schedule_start TIME, -- Hora de inicio (ej. 06:00:00)
    schedule_end TIME, -- Hora de fin (ej. 19:00:00)
    frequency_min INTEGER, -- Intervalo en minutos (ej. 20)
    vehicle_type VARCHAR(20) DEFAULT 'Bus', -- 'Bus' o 'Microbus'
    route_geometry GEOMETRY(LINESTRING, 4326), -- Trayectoria de la ruta (PostGIS)
    raw_content TEXT, -- El cuerpo del artículo original para respaldo
    source_url TEXT, -- URL original en cartorux.com
    content_quality_score INTEGER DEFAULT 5, -- 1-10: Calidad del contenido extraído
    is_operational BOOLEAN DEFAULT TRUE,
    is_validated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint: public_id debe ser único dentro de un departamento
    CONSTRAINT unique_route_per_department UNIQUE (public_id, department_id)
);

-- Índices para Routes
CREATE INDEX IF NOT EXISTS idx_routes_public_id ON routes(public_id);
CREATE INDEX IF NOT EXISTS idx_routes_department ON routes(department_id);
CREATE INDEX IF NOT EXISTS idx_routes_vehicle_type ON routes(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_routes_operational ON routes(is_operational);
CREATE INDEX IF NOT EXISTS idx_routes_validated ON routes(is_validated);
CREATE INDEX IF NOT EXISTS idx_routes_geometry ON routes USING GIST(route_geometry);
CREATE INDEX IF NOT EXISTS idx_routes_quality ON routes(content_quality_score DESC);

-- ============================================================================
-- TABLA: SCHEDULES (Horarios Detallados)
-- ============================================================================
-- Permite almacenar horarios más complejos que solo start/end
-- Útil para servicios especiales como "Buses Alegres" (Sección 2.2)
-- ============================================================================
CREATE TABLE IF NOT EXISTS schedules (
    schedule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
    day_of_week INTEGER, -- 0=Domingo, 1=Lunes, ..., 6=Sábado, NULL=Diario
    start_time TIME NOT NULL,
    end_time TIME,
    frequency_min INTEGER,
    is_special_service BOOLEAN DEFAULT FALSE, -- Para "Buses Alegres" y servicios estacionales
    service_notes TEXT, -- Notas adicionales (ej. "Solo fines de semana")
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para Schedules
CREATE INDEX IF NOT EXISTS idx_schedules_route ON schedules(route_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day ON schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_schedules_special ON schedules(is_special_service);

-- ============================================================================
-- TABLA: ROUTE_DESTINATIONS (Tabla Pivote - Many-to-Many)
-- ============================================================================
-- Relación entre Routes y Destinations
-- Una ruta puede servir a múltiples destinos, un destino puede ser servido por múltiples rutas
-- ============================================================================
CREATE TABLE IF NOT EXISTS route_destinations (
    route_destination_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
    destination_id UUID NOT NULL REFERENCES destinations(destination_id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE, -- Destino principal de la ruta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint: Evitar duplicados
    CONSTRAINT unique_route_destination UNIQUE (route_id, destination_id)
);

-- Índices para Route_Destinations
CREATE INDEX IF NOT EXISTS idx_route_destinations_route ON route_destinations(route_id);
CREATE INDEX IF NOT EXISTS idx_route_destinations_destination ON route_destinations(destination_id);
CREATE INDEX IF NOT EXISTS idx_route_destinations_primary ON route_destinations(is_primary);

-- ============================================================================
-- DATOS INICIALES: DEPARTMENTS (Los 14 departamentos de El Salvador)
-- ============================================================================
INSERT INTO departments (name, slug, code, region, priority) VALUES
('Ahuachapán', 'ahuachapan', 'AH', 'Occidental', 3),
('Cabañas', 'cabanas', 'CA', 'Paracentral', 2),
('Chalatenango', 'chalatenango', 'CH', 'Norte', 2),
('Cuscatlán', 'cuscatlan', 'CU', 'Central', 4),
('La Libertad', 'la-libertad', 'LI', 'Central', 9), -- Alta prioridad turística
('La Paz', 'la-paz', 'PA', 'Central', 5), -- Zona del aeropuerto
('La Unión', 'la-union', 'UN', 'Oriental', 3),
('Morazán', 'morazan', 'MO', 'Noreste', 2),
('San Miguel', 'san-miguel', 'SM', 'Oriental', 7), -- Segunda mayor densidad
('San Salvador', 'san-salvador', 'SS', 'Central', 10), -- Mayor densidad y complejidad
('San Vicente', 'san-vicente', 'SV', 'Paracentral', 2),
('Santa Ana', 'santa-ana', 'SA', 'Occidental', 6),
('Sonsonate', 'sonsonate', 'SO', 'Occidental', 4),
('Usulután', 'usulutan', 'US', 'Oriental', 3)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER trigger_update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_destinations_updated_at
    BEFORE UPDATE ON destinations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_routes_updated_at
    BEFORE UPDATE ON routes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Función para calcular content_quality_score basado en raw_content_length
-- Implementa la lógica de la Sección 3.3 para detectar páginas "cascarón"
CREATE OR REPLACE FUNCTION calculate_content_quality_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el contenido es muy corto o contiene frases de error, baja calidad
    IF NEW.raw_content IS NULL OR LENGTH(NEW.raw_content) < 100 THEN
        NEW.content_quality_score = 1;
        NEW.is_validated = FALSE;
    ELSIF NEW.raw_content ILIKE '%unavailable%' OR 
          NEW.raw_content ILIKE '%not found%' OR
          NEW.raw_content ILIKE '%error%' THEN
        NEW.content_quality_score = 2;
        NEW.is_validated = FALSE;
    ELSIF LENGTH(NEW.raw_content) < 500 THEN
        NEW.content_quality_score = 5;
    ELSE
        NEW.content_quality_score = 8;
    END IF;
    
    NEW.raw_content_length = LENGTH(NEW.raw_content);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular calidad de contenido en routes
CREATE TRIGGER trigger_calculate_route_quality
    BEFORE INSERT OR UPDATE ON routes
    FOR EACH ROW
    WHEN (NEW.raw_content IS NOT NULL)
    EXECUTE FUNCTION calculate_content_quality_score();

-- Trigger similar para destinations
CREATE TRIGGER trigger_calculate_destination_quality
    BEFORE INSERT OR UPDATE ON destinations
    FOR EACH ROW
    WHEN (NEW.raw_content IS NOT NULL)
    EXECUTE FUNCTION calculate_content_quality_score();

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista: Rutas con información completa
CREATE OR REPLACE VIEW v_routes_complete AS
SELECT 
    r.route_id,
    r.public_id,
    d.name as department_name,
    d.slug as department_slug,
    r.origin_text,
    r.destination_text,
    r.base_fare,
    r.currency,
    r.schedule_start,
    r.schedule_end,
    r.frequency_min,
    r.vehicle_type,
    r.content_quality_score,
    r.is_operational,
    r.is_validated,
    COUNT(DISTINCT rd.destination_id) as destination_count,
    ST_AsGeoJSON(r.route_geometry) as geometry_json
FROM routes r
JOIN departments d ON r.department_id = d.department_id
LEFT JOIN route_destinations rd ON r.route_id = rd.route_id
GROUP BY r.route_id, d.name, d.slug;

-- Vista: Destinos con rutas asociadas
CREATE OR REPLACE VIEW v_destinations_with_routes AS
SELECT 
    dest.destination_id,
    dest.name,
    dest.category,
    dept.name as department_name,
    dest.content_quality_score,
    dest.is_validated,
    COUNT(DISTINCT rd.route_id) as route_count,
    STRING_AGG(DISTINCT r.public_id, ', ') as route_numbers
FROM destinations dest
LEFT JOIN departments dept ON dest.department_id = dept.department_id
LEFT JOIN route_destinations rd ON dest.destination_id = rd.destination_id
LEFT JOIN routes r ON rd.route_id = r.route_id
GROUP BY dest.destination_id, dest.name, dest.category, dept.name, dest.content_quality_score, dest.is_validated;

-- ============================================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE departments IS 'Los 14 departamentos de El Salvador. Actúan como contenedores de datos para evitar conflictos de nombres de rutas.';
COMMENT ON TABLE destinations IS 'Destinos turísticos (playas, museos, bosques, etc.) que actúan como nodos de atracción. Relación Many-to-Many con Routes.';
COMMENT ON TABLE routes IS 'Rutas de transporte público extraídas de cartorux.com. Incluye precios, horarios, frecuencias y geometría.';
COMMENT ON TABLE schedules IS 'Horarios detallados de rutas. Permite modelar servicios especiales como "Buses Alegres".';
COMMENT ON TABLE route_destinations IS 'Tabla pivote para relación Many-to-Many entre Routes y Destinations.';

COMMENT ON COLUMN routes.content_quality_score IS 'Puntuación 1-10 de calidad del contenido. Páginas "cascarón" (stubs) tienen score bajo.';
COMMENT ON COLUMN destinations.content_quality_score IS 'Puntuación 1-10 de calidad del contenido. Detecta páginas vacías o con errores.';
COMMENT ON COLUMN routes.is_validated IS 'FALSE para páginas detectadas como "cascarón" o con contenido insuficiente.';

-- ============================================================================
-- FIN DEL ESQUEMA
-- Sistema BusTrackSV - Extracción de Datos de Cartorux.com
-- ============================================================================


