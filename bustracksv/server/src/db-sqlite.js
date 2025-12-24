import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;
const DB_PATH = path.join(__dirname, '..', 'bustracksv.sqlite');

// Inicializar la base de datos
async function initDatabase() {
  const SQL = await initSqlJs();
  
  // Cargar base de datos existente o crear una nueva
  try {
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
      console.log('✅ Base de datos SQLite cargada desde:', DB_PATH);
    } else {
      db = new SQL.Database();
      console.log('✅ Nueva base de datos SQLite creada');
      createSchema();
    }
  } catch (error) {
    console.error('Error al cargar base de datos:', error);
    db = new SQL.Database();
    createSchema();
  }
  
  return db;
}

// Crear el esquema de la base de datos
function createSchema() {
  console.log('📝 Creando esquema de base de datos...');
  
  // Tabla de usuarios
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      email TEXT UNIQUE,
      nombre_completo TEXT,
      telefono TEXT,
      foto_perfil TEXT,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      ultimo_acceso DATETIME,
      activo INTEGER DEFAULT 1,
      preferencias TEXT DEFAULT '{}'
    )
  `);
  
  // Tabla de historial de búsquedas
  db.run(`
    CREATE TABLE IF NOT EXISTS historial_busquedas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_usuario INTEGER,
      ruta TEXT,
      numero_ruta TEXT,
      parada TEXT,
      fecha_busqueda DATETIME DEFAULT CURRENT_TIMESTAMP,
      latitud_origen REAL,
      longitud_origen REAL,
      latitud_destino REAL,
      longitud_destino REAL,
      tipo_busqueda TEXT DEFAULT 'general',
      metadata TEXT DEFAULT '{}',
      FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
    )
  `);
  
  // Tabla de rutas
  db.run(`
    CREATE TABLE IF NOT EXISTS rutas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      color TEXT DEFAULT '#0066CC',
      numero_ruta TEXT NOT NULL UNIQUE,
      empresa TEXT,
      tipo TEXT DEFAULT 'Bus',
      tarifa REAL DEFAULT 0.25,
      horario_inicio TEXT DEFAULT '05:00:00',
      horario_fin TEXT DEFAULT '21:00:00',
      frecuencia_minutos INTEGER DEFAULT 15,
      activa INTEGER DEFAULT 1,
      geometry TEXT,
      longitud_km REAL,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Tabla de paradas
  db.run(`
    CREATE TABLE IF NOT EXISTS paradas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      direccion TEXT,
      latitud REAL NOT NULL,
      longitud REAL NOT NULL,
      zona TEXT,
      tipo TEXT DEFAULT 'Regular',
      tiene_techo INTEGER DEFAULT 0,
      tiene_asientos INTEGER DEFAULT 0,
      accesible INTEGER DEFAULT 0,
      activa INTEGER DEFAULT 1,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Tabla de relación paradas-rutas
  db.run(`
    CREATE TABLE IF NOT EXISTS parada_ruta (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_parada INTEGER,
      id_ruta INTEGER,
      orden INTEGER NOT NULL,
      direccion TEXT DEFAULT 'ida',
      distancia_km REAL,
      tiempo_estimado_minutos INTEGER,
      FOREIGN KEY (id_parada) REFERENCES paradas(id) ON DELETE CASCADE,
      FOREIGN KEY (id_ruta) REFERENCES rutas(id) ON DELETE CASCADE,
      UNIQUE(id_parada, id_ruta, direccion, orden)
    )
  `);
  
  console.log('✅ Esquema creado exitosamente');
  saveDatabase();
}

// Guardar la base de datos en disco
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// Wrapper para ejecutar queries tipo PostgreSQL pool.query()
class SQLitePool {
  constructor(database) {
    this.db = database;
  }
  
  async query(text, params = []) {
    try {
      // Convertir placeholders de PostgreSQL ($1, $2) a SQLite (?, ?)
      let sqlText = text;
      if (params && params.length > 0) {
        params.forEach((_, index) => {
          sqlText = sqlText.replace(`$${index + 1}`, '?');
        });
      }
      
      // Ejecutar query
      const stmt = this.db.prepare(sqlText);
      stmt.bind(params);
      
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      
      // Guardar cambios después de cada query que modifica datos
      if (text.trim().toUpperCase().startsWith('INSERT') || 
          text.trim().toUpperCase().startsWith('UPDATE') || 
          text.trim().toUpperCase().startsWith('DELETE')) {
        saveDatabase();
      }
      
      return { rows, rowCount: rows.length };
    } catch (error) {
      console.error('Error en query:', error);
      console.error('SQL:', text);
      console.error('Params:', params);
      throw error;
    }
  }
  
  async connect() {
    // Compatibilidad con PostgreSQL pool.connect()
    return {
      query: this.query.bind(this),
      release: () => {},
    };
  }
}

// Inicializar y exportar
let pool = null;

async function getPool() {
  if (!pool) {
    await initDatabase();
    pool = new SQLitePool(db);
  }
  return pool;
}

// Función para probar la conexión
export const testConnection = async () => {
  try {
    const poolInstance = await getPool();
    const result = await poolInstance.query('SELECT datetime("now") as now');
    console.log('✅ Conexión a la base de datos exitosa:', result.rows[0]);
    return true;
  } catch (err) {
    console.error('❌ Error al conectar con la base de datos:', err);
    return false;
  }
};

// Exportar pool (se inicializa cuando se usa por primera vez)
export const pool = new Proxy({}, {
  get(target, prop) {
    return async function(...args) {
      const poolInstance = await getPool();
      return poolInstance[prop](...args);
    };
  }
});

// Cerrar la base de datos al finalizar
process.on('exit', () => {
  if (db) {
    saveDatabase();
    db.close();
  }
});

process.on('SIGINT', () => {
  if (db) {
    saveDatabase();
    db.close();
  }
  process.exit(0);
});



