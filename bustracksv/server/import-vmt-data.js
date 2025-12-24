/**
 * Script de Importación de Datos VMT / Cartorux
 * Expande la base de datos con rutas adicionales de San Salvador
 */

import { pool } from './src/db.js';

console.log('🚌 BusTrackSV - Importador de Datos VMT/Cartorux');
console.log('📍 Agregando nuevas rutas y conexiones...\n');

// Reutilizamos las paradas existentes del script anterior para mantener consistencia
// Pero definimos las nuevas rutas que queremos agregar

const nuevasRutas = [
    { numero_ruta: '42', nombre: 'Centro - Santa Tecla (Vía Panamericana)', descripcion: 'Ruta tradicional por Alameda Roosevelt', empresa: 'ACOSTES', tipo: 'Bus', tarifa: 0.25, color: '#E74C3C', horario_inicio: '04:00:00', horario_fin: '22:00:00', frecuencia_minutos: 5 },
    { numero_ruta: '42-B', nombre: 'Centro - Santa Tecla (Vía Zaragoza)', descripcion: 'Ruta por Zaragoza y Libertad', empresa: 'ACOSTES', tipo: 'Microbus', tarifa: 0.35, color: '#C0392B', horario_inicio: '04:30:00', horario_fin: '21:00:00', frecuencia_minutos: 8 },
    { numero_ruta: '101-B', nombre: 'Centro - Santa Tecla', descripcion: 'Ruta rápida por Panamericana', empresa: 'Transportes 101', tipo: 'Bus', tarifa: 0.25, color: '#2980B9', horario_inicio: '04:00:00', horario_fin: '22:30:00', frecuencia_minutos: 5 },
    { numero_ruta: '52', nombre: 'Paseo - Centro', descripcion: 'Ruta por Paseo General Escalón', empresa: 'Ruta 52 S.A.', tipo: 'Bus', tarifa: 0.25, color: '#8E44AD', horario_inicio: '05:00:00', horario_fin: '21:00:00', frecuencia_minutos: 10 },
    { numero_ruta: '7-C', nombre: 'Mejicanos - Terminal de Oriente', descripcion: 'Interconexión norte-oriente', empresa: 'Ruta 7', tipo: 'Microbus', tarifa: 0.30, color: '#16A085', horario_inicio: '05:00:00', horario_fin: '20:00:00', frecuencia_minutos: 15 },
    { numero_ruta: '44-MB', nombre: 'Mexicanos - UCA - Antiguo', descripcion: 'Microbús rápido universitario', empresa: 'Ruta 44', tipo: 'Microbus', tarifa: 0.35, color: '#D35400', horario_inicio: '05:00:00', horario_fin: '21:00:00', frecuencia_minutos: 8 },
    { numero_ruta: '30-B', nombre: 'Ayutuxtepeque - Metrocentro - Salvador del Mundo', descripcion: 'Ruta clave del norte', empresa: 'Ruta 30', tipo: 'Bus', tarifa: 0.25, color: '#F39C12', horario_inicio: '04:30:00', horario_fin: '21:30:00', frecuencia_minutos: 10 },
    { numero_ruta: '26', nombre: 'San Marcos - Zoológico - Centro', descripcion: 'Ruta turística del sur', empresa: 'Ruta 26', tipo: 'Bus', tarifa: 0.25, color: '#27AE60', horario_inicio: '05:00:00', horario_fin: '20:00:00', frecuencia_minutos: 12 }
];

// Mapeo de paradas (Códigos existentes en la DB)
const relacionesNuevas = {
    '42': ['TC-001', 'HRO-001', 'GAL-001', 'LME-001', 'PLZ-NAT'],
    '42-B': ['TC-001', 'HRO-001', 'BAS-001', 'LME-001', 'PLZ-NAT'],
    '101-B': ['TC-001', 'HRO-001', 'UES-001', 'PLZ-NAT'], // Simplificada
    '52': ['GAL-001', 'HRO-001', 'TC-001', 'PL-LIB'],
    '7-C': ['MEJ-CEN', 'UES-001', 'SOY-CEN', 'PLZ-MUNDO'], // Asumiendo PLZ-MUNDO existe o similar
    '44-MB': ['MEJ-CEN', 'UES-001', 'MET-SUR', 'UCA-001', 'LME-001'],
    '30-B': ['AYUTUX-001', 'UES-001', 'MCP-001', 'HRO-001', 'SAL-MUN'], // SAL-MUN a agregar si no existe
    '26': ['SMARCOS-001', 'ZOO-SS', 'MC-001', 'TC-001']
};

async function importarVMT() {
    try {
        // 1. Obtener IDs de paradas existentes
        console.log('🔍 Buscando paradas existentes...');
        const paradasRes = await pool.query('SELECT id, codigo FROM paradas');
        const paradasMap = new Map();
        paradasRes.rows.forEach(p => paradasMap.set(p.codigo, p.id));

        // 2. Insertar Nuevas Rutas
        console.log('🚌 Insertando nuevas rutas...');
        const rutasMap = new Map();

        for (const ruta of nuevasRutas) {
            // Verificar si ya existe para no duplicar (o actualizar)
            const existe = await pool.query('SELECT id FROM rutas WHERE numero_ruta = ?', [ruta.numero_ruta]);

            let rutaId;
            if (existe.rows.length > 0) {
                console.log(`  ⚠️  Ruta ${ruta.numero_ruta} ya existe, actualizando...`);
                await pool.query(
                    `UPDATE rutas SET nombre=?, descripcion=?, empresa=?, tipo=?, tarifa=?, color=?, activa=1 WHERE id=?`,
                    [ruta.nombre, ruta.descripcion, ruta.empresa, ruta.tipo, ruta.tarifa, ruta.color, existe.rows[0].id]
                );
                rutaId = existe.rows[0].id;
            } else {
                const result = await pool.query(
                    `INSERT INTO rutas (numero_ruta, nombre, descripcion, empresa, tipo, tarifa, color, horario_inicio, horario_fin, frecuencia_minutos, activa)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
           RETURNING id`,
                    [ruta.numero_ruta, ruta.nombre, ruta.descripcion, ruta.empresa, ruta.tipo, ruta.tarifa, ruta.color, ruta.horario_inicio, ruta.horario_fin, ruta.frecuencia_minutos]
                );
                rutaId = result.rows[0].id;
                console.log(`  ✅ Ruta ${ruta.numero_ruta} insertada.`);
            }
            rutasMap.set(ruta.numero_ruta, rutaId);
        }

        // 3. Crear Relaciones
        console.log('🔗 Creando conexiones...');
        for (const [numRuta, codigosParadas] of Object.entries(relacionesNuevas)) {
            const rutaId = rutasMap.get(numRuta);
            if (!rutaId) continue;

            // Limpiar relaciones anteriores de esta ruta
            await pool.query('DELETE FROM parada_ruta WHERE id_ruta = ?', [rutaId]);

            let orden = 1;
            for (const codigo of codigosParadas) {
                const paradaId = paradasMap.get(codigo);
                if (paradaId) {
                    await pool.query(
                        `INSERT INTO parada_ruta (id_ruta, id_parada, orden, direccion, tiempo_estimado_minutos)
             VALUES (?, ?, ?, 'ida', ?)`,
                        [rutaId, paradaId, orden, orden * 10] // Tiempo estimado simple
                    );
                    orden++;
                } else {
                    console.log(`  ⚠️  Parada ${codigo} no encontrada para ruta ${numRuta}`);
                }
            }
            console.log(`  ✅ Ruta ${numRuta} conectada con ${orden - 1} paradas.`);
        }

        console.log('\n✅ IMPORTACIÓN VMT COMPLETADA');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        process.exit(0);
    }
}

importarVMT();
