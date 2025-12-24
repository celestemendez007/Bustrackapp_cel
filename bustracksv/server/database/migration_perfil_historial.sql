-- ============================================================================
-- MIGRACIÓN: Agregar funcionalidad de perfil y historial
-- BusTrackSV - San Salvador, El Salvador
-- ============================================================================
-- Este script actualiza una base de datos existente para agregar:
-- 1. Campo foto_perfil a la tabla usuarios
-- 2. Tabla historial_busquedas
-- ============================================================================

-- Agregar campo foto_perfil a la tabla usuarios si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'foto_perfil'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN foto_perfil TEXT;
        RAISE NOTICE 'Campo foto_perfil agregado a la tabla usuarios';
    ELSE
        RAISE NOTICE 'Campo foto_perfil ya existe en la tabla usuarios';
    END IF;
END $$;

-- Crear tabla historial_busquedas si no existe
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

-- Crear índices para la tabla historial_busquedas si no existen
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'historial_busquedas' AND indexname = 'idx_historial_usuario'
    ) THEN
        CREATE INDEX idx_historial_usuario ON historial_busquedas(id_usuario);
        RAISE NOTICE 'Índice idx_historial_usuario creado';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'historial_busquedas' AND indexname = 'idx_historial_fecha'
    ) THEN
        CREATE INDEX idx_historial_fecha ON historial_busquedas(fecha_busqueda DESC);
        RAISE NOTICE 'Índice idx_historial_fecha creado';
    END IF;
END $$;

-- Agregar comentarios a las nuevas tablas/columnas
COMMENT ON COLUMN usuarios.foto_perfil IS 'URL o base64 de la foto de perfil del usuario';
COMMENT ON TABLE historial_busquedas IS 'Historial de búsquedas realizadas por los usuarios';

-- Verificar que la migración se completó correctamente
DO $$
DECLARE
    v_usuarios_tiene_foto BOOLEAN;
    v_historial_existe BOOLEAN;
BEGIN
    -- Verificar campo foto_perfil
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'foto_perfil'
    ) INTO v_usuarios_tiene_foto;
    
    -- Verificar tabla historial_busquedas
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'historial_busquedas'
    ) INTO v_historial_existe;
    
    -- Mostrar resultados
    IF v_usuarios_tiene_foto AND v_historial_existe THEN
        RAISE NOTICE '✅ Migración completada exitosamente';
        RAISE NOTICE '   - Campo foto_perfil: %', CASE WHEN v_usuarios_tiene_foto THEN 'OK' ELSE 'FALTA' END;
        RAISE NOTICE '   - Tabla historial_busquedas: %', CASE WHEN v_historial_existe THEN 'OK' ELSE 'FALTA' END;
    ELSE
        RAISE WARNING '⚠️  La migración puede no haberse completado correctamente';
        RAISE WARNING '   - Campo foto_perfil: %', CASE WHEN v_usuarios_tiene_foto THEN 'OK' ELSE 'FALTA' END;
        RAISE WARNING '   - Tabla historial_busquedas: %', CASE WHEN v_historial_existe THEN 'OK' ELSE 'FALTA' END;
    END IF;
END $$;

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================






