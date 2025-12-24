
import { pool } from './src/db.js';

async function inspect() {
    try {
        const res = await pool.query(`SELECT name FROM sqlite_master WHERE type='table'`);
        console.log('Tables:', res.rows.map(r => r.name));

        const rutasCols = await pool.query(`PRAGMA table_info(rutas)`);
        console.log('Rutas Columns:', rutasCols.rows);

        const puntosCols = await pool.query(`PRAGMA table_info(puntos_ruta)`);
        console.log('Puntos Ruta Columns:', puntosCols.rows);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspect();
