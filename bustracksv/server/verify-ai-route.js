import RouteParser from './src/services/routeParser.js';
import RouteGenerationService from './src/services/RouteGenerationService.js';
import { pool } from './src/db.js';
import dotenv from 'dotenv';

dotenv.config();

const parser = new RouteParser(pool);

const descripcion = `
1. Zona Sur: El Origen (San Marcos)
El microbús inicia su recorrido en las zonas populares de San Marcos.

Colonia 10 de Octubre: Punto de despacho habitual.

Colonia El Tránsito: Recorre las calles principales de San Marcos.

Carretera Antigua a Zacatecoluca: Baja buscando la autopista.

Terminal del Sur: Pasa justo enfrente o por el costado. Es un punto de referencia mayor para quienes vienen de otros departamentos.

Zona Franca San Marcos: Pasa por las cercanías del área industrial.

2. Zona de Transición: San Jacinto y Barrio Modelo
Aquí la ruta conecta el sur con la entrada a la capital.

Autopista a Comalapa (Tramo final): Entrando a San Salvador.

Barrio San Jacinto: Atraviesa parte del barrio, cerca de la Ex-Casa Presidencial.

Ex-Zoológico Nacional / Calle Modelo: Este es un punto clave.

Barrio Candelaria / Plaza El Trovador: Aquí suele haber mucho tráfico; es el punto donde decide si entrar al centro o buscar la periferia.

3. El Centro y Eje Médico (25 Avenida Norte)
Nota importante: Debido a la revitalización del Centro Histórico, los microbuses ya no entran al "micro-centro" (Parque Libertad), sino que lo rodean.

Mercado Belloso / Barrio Concepción: Pasa por la periferia sur del mercado.

Bulevar Venezuela: Utiliza un tramo para conectar con la 25 Avenida (cerca del Cementerio General).

La 25 Avenida Norte (El corazón de la ruta): Esta es la calle más importante que recorre la Ruta 26. Al subir por aquí pasa por:

Hospital Pro-Familia.

Hospital Rosales (Esquina clave con la Alameda Roosevelt).

Parque Cuscatlán (Costado poniente).

Hospital de Maternidad (Antiguo) y zona de clínicas médicas.

Hospital Prof. Alberto Masferrer (USAM) / Colegio La Asunción.

4. Zona Universitaria y Norte
Al finalizar la 25 Avenida Norte, la ruta entra en su tramo final.

Fuente Luminosa: Redondel donde conecta la 25 Avenida con la Calle Gabriela Mistral.

Universidad de El Salvador (UES): Pasa frente a la entrada principal ("La Minerva") o por la Autopista Norte dependiendo de la variante exacta del microbús, pero su función principal es dejar estudiantes en la Nacional.

Calle a San Antonio Abad: Sube buscando la zona residencial.

Colonia Miralvalle: Aquí es el punto de retorno (cerca del Redondel Constitución o calles internas de la colonia).
`;

console.log("🚀 Iniciando proceso de verificación y guardado de ruta...");

async function run() {
    try {
        console.log("1️⃣  Analizando descripción con IA...");
        const lugares = await parser.processRouteDescriptionWithAI(descripcion);
        console.log(`✅ Lugares identificados: ${lugares.length}`);

        if (lugares.length < 2) {
            console.error("❌ No se encontraron suficientes lugares para generar una ruta.");
            return;
        }

        // Preparar string separado por comas para el servicio de generación
        // Usar SOLO el nombre (sin ", El Salvador") para evitar que el split(',') del servicio
        // rompa "Lugar, El Salvador" en dos puntos "Lugar" y "El Salvador".
        // Además filtramos duplicados.
        const uniqueNames = [...new Set(lugares.map(l => l.nombre).filter(n => n && n.length > 2))];
        const lugaresString = uniqueNames.join(', ');
        // console.log("📝 String para generación:", lugaresString);
        console.log("2️⃣  Geocodificando y trazando ruta (Google Maps / OSRM)...");
        const generatedRoute = await RouteGenerationService.generateRouteFromText(lugaresString);

        if (!generatedRoute || !generatedRoute.geometry || generatedRoute.geometry.length === 0) {
            console.error("❌ Falló la generación de geometría de la ruta.");
            return;
        }

        console.log(`✅ Ruta generada con ${generatedRoute.geometry.length} puntos de geometría.`);

        // Preparar datos para guardar
        const routeData = {
            nombre: "Ruta 26 (Microbús) - AI Generated",
            descripcion: "Generada automáticamente desde descripción detallada de recorrido.",
            numero_ruta: "26-MB-AI",
            geometry: JSON.stringify(generatedRoute.geometry),
            color: "#FF5733"
        };

        console.log("3️⃣  Guardando en base de datos local...");
        const saveResult = await RouteGenerationService.saveRoute(routeData);

        if (saveResult.success) {
            console.log(`🎉 ¡ÉXITO! Ruta guardada localmente con ID: ${saveResult.id}`);
        } else {
            console.error("❌ Error al guardar en base de datos:", saveResult.message);
        }

    } catch (error) {
        console.error("❌ Ocurrió un error inesperado:", error);
    } finally {
        await pool.end(); // Cerrar conexión
        console.log("👋 Conexión a BD cerrada.");
    }
}

run();
