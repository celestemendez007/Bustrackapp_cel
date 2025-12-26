-- ============================================================================
-- ESQUEMA DE BASE DE DATOS POSTGRESQL PARA BUS TRACK SV
-- Compatible con Render, Supabase, AWS RDS, o cualquier PostgreSQL
-- ============================================================================

-- Habilitar extensiones necesarias (si están disponibles)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS postgis; -- Descomentar si PostGIS está disponible

-- ============================================================================
-- TABLA: usuarios
-- ============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(100) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email VARCHAR(255) UNIQUE,
    nombre_completo VARCHAR(255),
    telefono VARCHAR(50),
    foto_perfil TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    preferencias JSONB DEFAULT '{}'::jsonb,
    rol VARCHAR(50) DEFAULT 'usuario'
);

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_usuario ON usuarios(usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

-- ============================================================================
-- TABLA: historial_busquedas
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
    tipo_busqueda VARCHAR(50) DEFAULT 'general',
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para historial
CREATE INDEX IF NOT EXISTS idx_historial_usuario ON historial_busquedas(id_usuario);
CREATE INDEX IF NOT EXISTS idx_historial_fecha ON historial_busquedas(fecha_busqueda DESC);

-- ============================================================================
-- TABLA: rutas
-- ============================================================================
CREATE TABLE IF NOT EXISTS rutas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#0066CC',
    numero_ruta VARCHAR(50) NOT NULL UNIQUE,
    empresa VARCHAR(255),
    tipo VARCHAR(50) DEFAULT 'Bus',
    tarifa DECIMAL(10, 2) DEFAULT 0.25,
    horario_inicio TIME DEFAULT '05:00:00',
    horario_fin TIME DEFAULT '21:00:00',
    frecuencia_minutos INTEGER DEFAULT 15,
    activa BOOLEAN DEFAULT TRUE,
    geometry TEXT, -- GeoJSON string
    longitud_km DECIMAL(10, 2),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para rutas
CREATE INDEX IF NOT EXISTS idx_rutas_numero ON rutas(numero_ruta);
CREATE INDEX IF NOT EXISTS idx_rutas_activa ON rutas(activa) WHERE activa = TRUE;

-- ============================================================================
-- TABLA: paradas
-- ============================================================================
CREATE TABLE IF NOT EXISTS paradas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    direccion VARCHAR(255),
    latitud DECIMAL(10, 8) NOT NULL,
    longitud DECIMAL(11, 8) NOT NULL,
    zona VARCHAR(100),
    tipo VARCHAR(50) DEFAULT 'Regular',
    tiene_techo BOOLEAN DEFAULT FALSE,
    tiene_asientos BOOLEAN DEFAULT FALSE,
    accesible BOOLEAN DEFAULT FALSE,
    activa BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Columna geoespacial (si PostGIS está disponible, descomentar):
    -- ubicacion GEOGRAPHY(POINT, 4326)
);

-- Índices para paradas
CREATE INDEX IF NOT EXISTS idx_paradas_codigo ON paradas(codigo);
CREATE INDEX IF NOT EXISTS idx_paradas_activa ON paradas(activa) WHERE activa = TRUE;
CREATE INDEX IF NOT EXISTS idx_paradas_zona ON paradas(zona);

-- ============================================================================
-- TABLA: parada_ruta (relación muchos a muchos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS parada_ruta (
    id SERIAL PRIMARY KEY,
    id_parada INT REFERENCES paradas(id) ON DELETE CASCADE,
    id_ruta INT REFERENCES rutas(id) ON DELETE CASCADE,
    orden INTEGER NOT NULL,
    direccion VARCHAR(20) DEFAULT 'ida',
    distancia_km DECIMAL(10, 2),
    tiempo_estimado_minutos INTEGER,
    UNIQUE(id_parada, id_ruta, direccion, orden)
);

-- Índices para parada_ruta
CREATE INDEX IF NOT EXISTS idx_parada_ruta_parada ON parada_ruta(id_parada);
CREATE INDEX IF NOT EXISTS idx_parada_ruta_ruta ON parada_ruta(id_ruta);
CREATE INDEX IF NOT EXISTS idx_parada_ruta_orden ON parada_ruta(id_ruta, orden);

-- ============================================================================
-- TABLA: lugares_aprendidos (para entrenamiento de IA)
-- ============================================================================
CREATE TABLE IF NOT EXISTS lugares_aprendidos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    nombre_normalizado VARCHAR(255) NOT NULL UNIQUE,
    busqueda TEXT NOT NULL,
    tipo VARCHAR(100),
    coordenadas JSONB,
    veces_usado INTEGER DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultimo_uso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    precision DECIMAL(3, 2) DEFAULT 1.0
);

-- Índices para lugares_aprendidos
CREATE INDEX IF NOT EXISTS idx_lugares_normalizado ON lugares_aprendidos(nombre_normalizado);

-- ============================================================================
-- TABLA: ejemplos_entrenamiento
-- ============================================================================
CREATE TABLE IF NOT EXISTS ejemplos_entrenamiento (
    id SERIAL PRIMARY KEY,
    descripcion_original TEXT NOT NULL,
    lugares_extraidos TEXT NOT NULL,
    coordenadas_resultantes JSONB,
    resultado_exitoso BOOLEAN DEFAULT TRUE,
    feedback TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FIN DEL ESQUEMA
-- ============================================================================




