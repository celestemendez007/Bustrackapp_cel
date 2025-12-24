
import { pool } from './src/db.js';

async function update() {
    try {
        console.log("Creating puntos_ruta table...");
        await pool.query(`
      CREATE TABLE IF NOT EXISTS puntos_ruta (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ruta_id INTEGER,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        orden INTEGER NOT NULL,
        tipo TEXT DEFAULT 'ida',
        FOREIGN KEY(ruta_id) REFERENCES rutas(id) ON DELETE CASCADE
      );
    `);

        console.log("Creating indices...");
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_puntos_ruta_ruta_id ON puntos_ruta(ruta_id);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_puntos_ruta_coords ON puntos_ruta(lat, lng);`);

        console.log("Success.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

update();
