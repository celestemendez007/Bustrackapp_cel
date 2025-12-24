
import { pool } from './src/db.js';

async function migrateGeometry() {
    try {
        // Buscar rutas con geometry pero sin puntos_ruta
        const rutas = await pool.query(`
      SELECT r.id, r.numero_ruta, r.geometry 
      FROM rutas r
      WHERE r.geometry IS NOT NULL 
      AND (SELECT count(*) FROM puntos_ruta pr WHERE pr.ruta_id = r.id) = 0
    `);

        console.log(`Found ${rutas.rows.length} routes to migrate.`);

        for (const r of rutas.rows) {
            if (!r.geometry) continue;

            let points = [];
            // Intentar parsear si es JSON
            if (r.geometry.startsWith('[')) {
                try {
                    points = JSON.parse(r.geometry);
                    // Si es array de array [lat, lng] o objeto {lat, lng}
                    if (points.length > 0 && Array.isArray(points[0])) {
                        points = points.map(p => ({ lat: p[0], lng: p[1] }));
                    }
                } catch (e) { console.log('JSON parse error', e); }
            }
            // Si no es JSON, asumir encoded polyline
            else {
                // Necesitamos la funcion decodePolyline aqui
                points = decodePolyline(r.geometry);
            }

            console.log(`Route ${r.numero_ruta} has ${points.length} points.`);

            if (points.length > 0) {
                let orden = 1;
                const client = await pool.connect();
                await client.query('BEGIN');
                for (const p of points) {
                    await client.query(
                        'INSERT INTO puntos_ruta (ruta_id, lat, lng, orden, tipo) VALUES (?, ?, ?, ?, ?)',
                        [r.id, p.lat, p.lng, orden, 'ida']
                    );
                    orden++;
                }
                await client.query('COMMIT');
                client.release();
                console.log(`Migrated ${points.length} points for Route ${r.numero_ruta}`);
            }
        }

    } catch (e) { console.error(e); }
    process.exit(0);
}

// Minimal decode for script
const decodePolyline = (encoded) => {
    if (!encoded) return [];
    var poly = [];
    var index = 0, len = encoded.length;
    var lat = 0, lng = 0;
    while (index < len) {
        var b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        var dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
        lat += dlat;
        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        var dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
        lng += dlng;
        poly.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }
    return poly;
};

migrateGeometry();
