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
      console.log('Base de datos SQLite cargada desde:', DB_PATH);
    } else {
      db = new SQL.Database();
      console.log('Nueva base de datos SQLite creada');
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
  console.log('Creando esquema de base de datos...');

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
      preferencias TEXT DEFAULT '{}',
      rol TEXT DEFAULT 'usuario'
    )
  `);

  // Agregar columna rol si no existe (migración)
  try {
    db.run(`ALTER TABLE usuarios ADD COLUMN rol TEXT DEFAULT 'usuario'`);
    console.log('Columna rol agregada a usuarios');
  } catch (e) {
    // La columna ya existe, ignorar error
  }

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

  // Tabla puntos_ruta para almacenar las coordenadas de las rutas
  db.run(`
    CREATE TABLE IF NOT EXISTS puntos_ruta (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ruta_id INTEGER NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      orden INTEGER NOT NULL,
      tipo TEXT DEFAULT 'ida',
      FOREIGN KEY (ruta_id) REFERENCES rutas(id) ON DELETE CASCADE
    )
  `);

  // Tabla para entrenamiento de IA (lugares aprendidos)
  db.run(`
    CREATE TABLE IF NOT EXISTS lugares_aprendidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      nombre_normalizado TEXT NOT NULL,
      busqueda TEXT NOT NULL,
      tipo TEXT,
      coordenadas TEXT,
      veces_usado INTEGER DEFAULT 1,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      fecha_ultimo_uso DATETIME DEFAULT CURRENT_TIMESTAMP,
      precision REAL DEFAULT 1.0,
      UNIQUE(nombre_normalizado)
    )
  `);

  // Tabla para ejemplos de entrenamiento
  db.run(`
    CREATE TABLE IF NOT EXISTS ejemplos_entrenamiento (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      descripcion_original TEXT NOT NULL,
      lugares_extraidos TEXT NOT NULL,
      coordenadas_resultantes TEXT,
      resultado_exitoso INTEGER DEFAULT 1,
      feedback TEXT,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Esquema creado exitosamente');
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
      const hasReturning = /RETURNING/i.test(text);

      if (params && params.length > 0) {
        // Reemplazar desde el último hacia el primero para evitar conflictos
        for (let i = params.length; i > 0; i--) {
          sqlText = sqlText.replace(new RegExp(`\\$${i}\\b`, 'g'), '?');
        }
      }

      // Determinar si es SELECT o no
      const isSelect = text.trim().toUpperCase().startsWith('SELECT');
      const isInsert = text.trim().toUpperCase().startsWith('INSERT');
      const isUpdate = text.trim().toUpperCase().startsWith('UPDATE');
      const isDelete = text.trim().toUpperCase().startsWith('DELETE');

      let rows = [];

      if (isSelect || ((isUpdate || isDelete) && hasReturning)) {
        // Para SELECT y UPDATE/DELETE con RETURNING, usar step() para obtener filas
        const stmt = this.db.prepare(sqlText);
        if (params && params.length > 0) {
          stmt.bind(params);
        }

        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
      } else if (isInsert && hasReturning) {
        // Para INSERT con RETURNING, ejecutar INSERT y luego obtener el ID
        // Remover la parte RETURNING de la query
        const insertSql = sqlText.replace(/\s+RETURNING\s+.*$/i, '');
        const returningField = text.match(/RETURNING\s+(\w+)/i)?.[1] || 'id';

        // Ejecutar el INSERT
        const stmt = this.db.prepare(insertSql);
        if (params && params.length > 0) {
          stmt.bind(params);
        }
        stmt.step();
        stmt.free();

        // Obtener el ID del último insert
        const lastIdStmt = this.db.prepare("SELECT last_insert_rowid() as id");
        let lastId = null;
        if (lastIdStmt.step()) {
          const result = lastIdStmt.getAsObject();
          lastId = result.id;
        }
        lastIdStmt.free();

        if (lastId !== null) {
          rows.push({ [returningField]: lastId });
        }
      } else {
        // Para INSERT/UPDATE/DELETE sin RETURNING, usar step()
        const stmt = this.db.prepare(sqlText);
        if (params && params.length > 0) {
          stmt.bind(params);
        }
        stmt.step();
        stmt.free();

        // Si es INSERT, intentar obtener el último ID insertado
        if (isInsert) {
          const lastIdStmt = this.db.prepare("SELECT last_insert_rowid() as id");
          let lastId = null;
          if (lastIdStmt.step()) {
            const result = lastIdStmt.getAsObject();
            lastId = result.id;
          }
          lastIdStmt.free();

          if (lastId !== null) {
            rows.push({ id: lastId });
          }
        }
      }

      // Guardar cambios después de cada query que modifica datos
      if (isInsert || isUpdate || isDelete) {
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
      release: () => { },
    };
  }

  async save() {
    saveDatabase();
    console.log('Base de datos guardada manualmente.');
  }
}

// Inicializar y exportar
let poolInstance = null;

async function getPool() {
  if (!poolInstance) {
    await initDatabase();
    poolInstance = new SQLitePool(db);
  }
  return poolInstance;
}

// Función para probar la conexión
export const testConnection = async () => {
  try {
    const poolInstance = await getPool();
    await poolInstance.query('SELECT 1');
    console.log('✅ Conexión a la base de datos exitosa');
    return true;
  } catch (err) {
    console.error('Error al conectar con la base de datos:', err);
    return false;
  }
};

// Exportar pool (se inicializa cuando se usa por primera vez)
export const pool = new Proxy({}, {
  get(target, prop) {
    return async function (...args) {
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
