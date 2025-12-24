/**
 * SCRIPT DE MIGRACIÓN: SQLite → PostgreSQL
 * 
 * Este script migra todos los datos de SQLite a PostgreSQL
 * Compatible con Supabase, AWS RDS, o cualquier PostgreSQL
 * 
 * Uso:
 *   node scripts/migrate-sqlite-to-postgres.js
 */

import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { pool } from '../src/db-cloud.js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const SQLITE_DB_PATH = path.join(__dirname, '..', 'bustracksv.sqlite');

// Función para cargar SQLite
async function loadSQLite() {
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(SQLITE_DB_PATH);
  return new SQL.Database(buffer);
}

// Función para migrar usuarios
async function migrateUsers(sqliteDb) {
  console.log('📦 Migrando usuarios...');
  const stmt = sqliteDb.prepare('SELECT * FROM usuarios');
  const users = [];
  
  while (stmt.step()) {
    users.push(stmt.getAsObject());
  }
  stmt.free();
  
  for (const user of users) {
    try {
      await pool.query(`
        INSERT INTO usuarios (id, usuario, password, email, nombre_completo, telefono, 
                             foto_perfil, fecha_creacion, ultimo_acceso, activo, rol)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          usuario = EXCLUDED.usuario,
          email = EXCLUDED.email,
          nombre_completo = EXCLUDED.nombre_completo,
          telefono = EXCLUDED.telefono,
          ultimo_acceso = EXCLUDED.ultimo_acceso
      `, [
        user.id, user.usuario, user.password, user.email || null,
        user.nombre_completo || null, user.telefono || null,
        user.foto_perfil || null, user.fecha_creacion || new Date(),
        user.ultimo_acceso || null, user.activo !== 0, user.rol || 'usuario'
      ]);
    } catch (error) {
      console.error(`Error migrando usuario ${user.id}:`, error.message);
    }
  }
  
  console.log(`✅ ${users.length} usuarios migrados`);
}

// Función para migrar rutas
async function migrateRoutes(sqliteDb) {
  console.log('📦 Migrando rutas...');
  const stmt = sqliteDb.prepare('SELECT * FROM rutas');
  const routes = [];
  
  while (stmt.step()) {
    routes.push(stmt.getAsObject());
  }
  stmt.free();
  
  for (const route of routes) {
    try {
      // Convertir geometry de SQLite a PostGIS
      let geometry = null;
      if (route.geometry) {
        try {
          const geomData = typeof route.geometry === 'string' 
            ? JSON.parse(route.geometry) 
            : route.geometry;
          
          if (Array.isArray(geomData) && geomData.length > 0) {
            // Convertir array de coordenadas a LINESTRING
            const coords = geomData.map(([lat, lng]) => `${lng} ${lat}`).join(', ');
            geometry = `LINESTRING(${coords})`;
          }
        } catch (e) {
          console.warn(`Error parseando geometry de ruta ${route.id}:`, e.message);
        }
      }
      
      await pool.query(`
        INSERT INTO rutas (id, nombre, descripcion, color, numero_ruta, empresa, tipo,
                          tarifa, horario_inicio, horario_fin, frecuencia_minutos, activa,
                          geometry, longitud_km, fecha_creacion, fecha_actualizacion)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                ${geometry ? `ST_GeomFromText('${geometry}', 4326)` : 'NULL'}, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET
          nombre = EXCLUDED.nombre,
          descripcion = EXCLUDED.descripcion,
          activa = EXCLUDED.activa,
          fecha_actualizacion = EXCLUDED.fecha_actualizacion
      `, [
        route.id, route.nombre, route.descripcion || null, route.color || '#0066CC',
        route.numero_ruta, route.empresa || null, route.tipo || 'Bus',
        route.tarifa || 0.25, route.horario_inicio || '05:00:00',
        route.horario_fin || '21:00:00', route.frecuencia_minutos || 15,
        route.activa !== 0, route.longitud_km || null,
        route.fecha_creacion || new Date(), route.fecha_actualizacion || new Date()
      ]);
    } catch (error) {
      console.error(`Error migrando ruta ${route.id}:`, error.message);
    }
  }
  
  console.log(`✅ ${routes.length} rutas migradas`);
}

// Función para migrar paradas
async function migrateStops(sqliteDb) {
  console.log('📦 Migrando paradas...');
  const stmt = sqliteDb.prepare('SELECT * FROM paradas');
  const stops = [];
  
  while (stmt.step()) {
    stops.push(stmt.getAsObject());
  }
  stmt.free();
  
  for (const stop of stops) {
    try {
      await pool.query(`
        INSERT INTO paradas (id, codigo, nombre, descripcion, direccion, latitud, longitud,
                            ubicacion, zona, tipo, tiene_techo, tiene_asientos, accesible,
                            activa, fecha_creacion)
        VALUES ($1, $2, $3, $4, $5, $6, $7,
                ST_GeomFromText('POINT($7 $6)', 4326), $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO UPDATE SET
          nombre = EXCLUDED.nombre,
          direccion = EXCLUDED.direccion,
          activa = EXCLUDED.activa
      `, [
        stop.id, stop.codigo || null, stop.nombre, stop.descripcion || null,
        stop.direccion || null, stop.latitud, stop.longitud,
        stop.zona || null, stop.tipo || 'Regular',
        stop.tiene_techo !== 0, stop.tiene_asientos !== 0, stop.accesible !== 0,
        stop.activa !== 0, stop.fecha_creacion || new Date()
      ]);
    } catch (error) {
      console.error(`Error migrando parada ${stop.id}:`, error.message);
    }
  }
  
  console.log(`✅ ${stops.length} paradas migradas`);
}

// Función para migrar relaciones parada-ruta
async function migrateStopRoutes(sqliteDb) {
  console.log('📦 Migrando relaciones parada-ruta...');
  const stmt = sqliteDb.prepare('SELECT * FROM parada_ruta');
  const relations = [];
  
  while (stmt.step()) {
    relations.push(stmt.getAsObject());
  }
  stmt.free();
  
  for (const rel of relations) {
    try {
      await pool.query(`
        INSERT INTO parada_ruta (id_parada, id_ruta, orden, direccion,
                                 distancia_km, tiempo_estimado_minutos)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id_parada, id_ruta, direccion, orden) DO NOTHING
      `, [
        rel.id_parada, rel.id_ruta, rel.orden, rel.direccion || 'ida',
        rel.distancia_km || null, rel.tiempo_estimado_minutos || null
      ]);
    } catch (error) {
      console.error(`Error migrando relación ${rel.id_parada}-${rel.id_ruta}:`, error.message);
    }
  }
  
  console.log(`✅ ${relations.length} relaciones migradas`);
}

// Función para migrar historial
async function migrateHistory(sqliteDb) {
  console.log('📦 Migrando historial de búsquedas...');
  const stmt = sqliteDb.prepare('SELECT * FROM historial_busquedas');
  const history = [];
  
  while (stmt.step()) {
    history.push(stmt.getAsObject());
  }
  stmt.free();
  
  for (const item of history) {
    try {
      let metadata = '{}';
      if (item.metadata) {
        metadata = typeof item.metadata === 'string' ? item.metadata : JSON.stringify(item.metadata);
      }
      
      await pool.query(`
        INSERT INTO historial_busquedas (id, id_usuario, ruta, numero_ruta, parada,
                                        fecha_busqueda, latitud_origen, longitud_origen,
                                        latitud_destino, longitud_destino, tipo_busqueda, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
        ON CONFLICT (id) DO NOTHING
      `, [
        item.id, item.id_usuario || null, item.ruta || null, item.numero_ruta || null,
        item.parada || null, item.fecha_busqueda || new Date(),
        item.latitud_origen || null, item.longitud_origen || null,
        item.latitud_destino || null, item.longitud_destino || null,
        item.tipo_busqueda || 'general', metadata
      ]);
    } catch (error) {
      console.error(`Error migrando historial ${item.id}:`, error.message);
    }
  }
  
  console.log(`✅ ${history.length} registros de historial migrados`);
}

// Función principal
async function main() {
  console.log('🚀 Iniciando migración de SQLite a PostgreSQL...\n');
  
  // Verificar conexión a PostgreSQL
  const connected = await pool.query('SELECT NOW()');
  if (!connected) {
    console.error('❌ No se pudo conectar a PostgreSQL');
    process.exit(1);
  }
  console.log('✅ Conectado a PostgreSQL\n');
  
  // Cargar SQLite
  if (!fs.existsSync(SQLITE_DB_PATH)) {
    console.error(`❌ No se encontró el archivo SQLite: ${SQLITE_DB_PATH}`);
    process.exit(1);
  }
  
  console.log('📂 Cargando base de datos SQLite...');
  const sqliteDb = await loadSQLite();
  console.log('✅ SQLite cargado\n');
  
  try {
    // Migrar en orden (respetando foreign keys)
    await migrateUsers(sqliteDb);
    await migrateRoutes(sqliteDb);
    await migrateStops(sqliteDb);
    await migrateStopRoutes(sqliteDb);
    await migrateHistory(sqliteDb);
    
    console.log('\n✅ Migración completada exitosamente!');
    
    // Mostrar estadísticas
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM usuarios) as usuarios,
        (SELECT COUNT(*) FROM rutas) as rutas,
        (SELECT COUNT(*) FROM paradas) as paradas,
        (SELECT COUNT(*) FROM historial_busquedas) as historial
    `);
    
    console.log('\n📊 Estadísticas finales:');
    console.log(`   Usuarios: ${stats.rows[0].usuarios}`);
    console.log(`   Rutas: ${stats.rows[0].rutas}`);
    console.log(`   Paradas: ${stats.rows[0].paradas}`);
    console.log(`   Historial: ${stats.rows[0].historial}`);
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    sqliteDb.close();
    await pool.end();
  }
}

// Ejecutar migración
main().catch(console.error);


