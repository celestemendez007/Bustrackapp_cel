
import { pool } from './src/db.js';

async function checkRoute() {
    try {
        // 1. Ver si existe la ruta 26
        const res = await pool.query("SELECT * FROM rutas WHERE numero_ruta LIKE '%26%' OR nombre LIKE '%26%'");
        console.log("Rutas encontradas:", res.rows);

        if (res.rows.length > 0) {
            const rutaId = res.rows[0].id;
            // 2. Contar puntos
            const pts = await pool.query("SELECT count(*) as count FROM puntos_ruta WHERE ruta_id = ?", [rutaId]);
            console.log(`Puntos para ruta ${rutaId}:`, pts.rows[0]);

            // 3. Ver una muestra de puntos
            const sample = await pool.query("SELECT lat, lng, orden FROM puntos_ruta WHERE ruta_id = ? ORDER BY orden LIMIT 5", [rutaId]);
            console.log("Muestra de puntos:", sample.rows);
        } else {
            console.log("ALERT: No se encontró la Ruta 26 en la tabla 'rutas'.");
        }
    } catch (e) { console.error(e); }
    process.exit(0);
}

checkRoute();
