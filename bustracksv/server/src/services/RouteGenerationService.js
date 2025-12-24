import { Client } from "@googlemaps/google-maps-services-js";
import RouteParser from "./routeParser.js";
import { pool } from "../db.js";

const googleClient = new Client({});

class RouteGenerationService {
    constructor() {
        this.parser = new RouteParser(pool);
    }

    // Flujo principal: Texto -> Ruta Estructurada -> Geometría
    // REFACTORIZADO: Lógica robusta para lista separada por comas
    async generateRouteFromText(text) {
        console.log("🤖 Procesando texto de ruta:", text);

        // Validar API Key - Verificar que existe y no está vacía
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        const hasGoogleKey = !!(apiKey && apiKey.trim() && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE');

        if (!hasGoogleKey) {
            console.warn("⚠️ La clave API de Google Maps no está configurada en el servidor. Se usará el modo de compatibilidad (Nominatim + Líneas Rectas).");
        } else {
            console.log("✅ Google Maps API Key configurada correctamente");
        }

        try {
            // 1. Parseo Simple: Separar por comas
            let rawPoints = text.split(',').map(p => p.trim()).filter(p => p.length > 0);

            if (rawPoints.length < 2) {
                throw new Error("Por favor ingresa al menos 2 puntos separados por comas (Ej: Origen, Destino)");
            }

            console.log(`📍 Puntos detectados (${rawPoints.length}):`, rawPoints);

            // 2. Geocodificación Robusta (Google -> Nominatim)
            const waypoints = [];
            const erroresGeocodificacion = [];

            for (const puntoNombre of rawPoints) {
                try {
                    const query = puntoNombre.toLowerCase().includes('salvador')
                        ? puntoNombre
                        : `${puntoNombre}, El Salvador`;

                    // Intentar geocodificar (Google o Fallback)
                    const coord = await this._geocodePlace(query);

                    if (coord && typeof coord.lat === 'number' && typeof coord.lng === 'number') {
                        waypoints.push({
                            nombre_input: puntoNombre,
                            location: { lat: coord.lat, lng: coord.lng },
                            stopover: true
                        });
                        console.log(`✅ Geocodificado: ${puntoNombre} -> (${coord.lat}, ${coord.lng})`);
                    } else {
                        const errorMsg = `No se encontró coordenadas para: ${puntoNombre}`;
                        console.warn(`⚠️ ${errorMsg}`);
                        erroresGeocodificacion.push(errorMsg);
                    }
                } catch (innerErr) {
                    const errorMsg = `Error geocodificando "${puntoNombre}": ${innerErr.message}`;
                    console.error(`❌ ${errorMsg}`);
                    erroresGeocodificacion.push(errorMsg);
                }
            }

            // Validar si logramos suficientes puntos validos
            if (waypoints.length < 2) {
                const mensajeError = `No se pudieron geocodificar suficientes puntos. Se encontraron ${waypoints.length} de ${rawPoints.length} puntos válidos. Errores: ${erroresGeocodificacion.join('; ')}`;
                throw new Error(mensajeError);
            }

            // 3. Generar Polilínea
            // Si hay key, usar Google Directions. Si no, devolver "mock"
            let routeResult = null;

            if (hasGoogleKey) {
                try {
                    const origin = waypoints[0].location;
                    const destination = waypoints[waypoints.length - 1].location;
                    const intermediateWaypoints = waypoints.slice(1, -1).map(w => ({
                        location: w.location,
                        stopover: true
                    }));

                    console.log("🚗 Consultando Google Directions API...");
                    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
                    const directionRes = await googleClient.directions({
                        params: {
                            origin: origin,
                            destination: destination,
                            waypoints: intermediateWaypoints.length > 0 ? intermediateWaypoints : undefined,
                            mode: 'DRIVING',
                            optimize: false,
                            key: apiKey
                        }
                    });

                    if (directionRes.data && directionRes.data.routes.length > 0) {
                        routeResult = directionRes.data.routes[0];
                    }
                } catch (googleErr) {
                    console.error("❌ Google Directions falló (o key inválida), usando fallback:", googleErr.message);
                }
            }

            // 4. Construir Respuesta (Con o Sin ruta detallada)
            const result = {
                nombre_sugerido: `Ruta: ${waypoints[0].nombre_input} - ${waypoints[waypoints.length - 1].nombre_input}`,
                descripcion_sugerida: text.substring(0, 100),
                puntos_geocodificados: waypoints.map(w => ({
                    nombre_original: w.nombre_input,
                    lat: w.location.lat,
                    lng: w.location.lng,
                }))
            };

            if (routeResult) {
                // Modo Google Full - Decodificar polyline a coordenadas
                result.legs = routeResult.legs.map((leg, index) => ({
                    start_address: leg.start_address,
                    end_address: leg.end_address,
                    distance: leg.distance,
                    duration: leg.duration,
                    start_location: leg.start_location,
                    end_location: leg.end_location
                }));

                // Decodificar el polyline a array de coordenadas {lat, lng}
                const encodedPolyline = routeResult.overview_polyline?.points;
                if (encodedPolyline) {
                    result.geometry = this._decodePolyline(encodedPolyline);
                    console.log(`✅ Ruta decodificada: ${result.geometry.length} puntos`);
                } else {
                    // Fallback: usar waypoints si no hay polyline
                    result.geometry = waypoints.map(w => ({ lat: w.location.lat, lng: w.location.lng }));
                }

                result.distancia_km = routeResult.legs ? (routeResult.legs.reduce((acc, leg) => acc + leg.distance.value, 0) / 1000).toFixed(2) : null;
                result.tiempo_min = routeResult.legs ? Math.round(routeResult.legs.reduce((acc, leg) => acc + leg.duration.value, 0) / 60) : null;
            } else {
                // Modo Fallback (Nominatim + OSRM)
                console.log("⚠️ Intentando generar ruta con OSRM (Open Source Routing Machine)...");

                try {
                    // Obtener geometría detallada de OSRM
                    const osrmGeometry = await this._getOSRMRoute(waypoints.map(w => w.location));

                    if (osrmGeometry && osrmGeometry.length > 0) {
                        result.geometry = osrmGeometry;
                        result.advertencia = !hasGoogleKey
                            ? "Modo Compatibilidad: Ruta generada con OSRM (OpenStreetMap)."
                            : "Ruta generada con OSRM debido a fallo en Google Directions.";
                        console.log(`✅ Ruta OSRM generada: ${result.geometry.length} puntos`);
                    } else {
                        // Si OSRM falla, volver a líneas rectas
                        throw new Error("No se pudo obtener geometría de OSRM");
                    }

                    // Calcular distancia/tiempo aproximados si es posible (simple euclidiano o de OSRM si lo soportáramos completo)
                    // Por ahora, dejamos null o calculamos manual si fuera crítico, pero el frontend maneja null.

                } catch (osrmError) {
                    console.warn(`❌ Falló OSRM (${osrmError.message}), usando líneas rectas.`);
                    result.geometry = waypoints.map(w => ({ lat: w.location.lat, lng: w.location.lng }));
                    result.advertencia = "Modo Compatibilidad: Líneas rectas (No se pudo conectar con servicios de ruta).";
                }

                // Generar "legs" falsos para que el frontend dibuje marcadores
                result.legs = [];
                for (let i = 0; i < waypoints.length - 1; i++) {
                    result.legs.push({
                        start_location: waypoints[i].location,
                        end_location: waypoints[i + 1].location,
                        start_address: waypoints[i].nombre_input,
                        end_address: waypoints[i + 1].nombre_input,
                        distance: { text: "N/A", value: 0 },
                        duration: { text: "N/A", value: 0 }
                    });
                }
            }

            return result;

        } catch (error) {
            console.error("❌ Error General en RouteGenerationService:", error);
            throw new Error(error.message || "Error procesando la ruta");
        }
    }

    async _geocodePlace(placeName) {
        // 1. Intentar Google si hay key válida
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (apiKey && apiKey.trim() && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
            try {
                const res = await googleClient.geocode({
                    params: {
                        address: placeName,
                        region: 'sv',
                        key: apiKey
                    }
                });
                if (res.data && res.data.results && res.data.results.length > 0) {
                    return res.data.results[0].geometry.location;
                }
            } catch (e) {
                console.warn(`Google Geocoding error for ${placeName}: ${e.message}`);
                // Continue to fallback
            }
        }

        // 2. Fallback: Nominatim (OpenStreetMap)
        return this._geocodeWithNominatim(placeName);
    }

    async _geocodeWithNominatim(texto) {
        let timeoutId;
        try {
            console.log(`🌍 Usando Nominatim para: ${texto}`);
            // Pequeño delay para respetar límites de Nominatim si se usa mucho
            await new Promise(r => setTimeout(r, 1000));

            const query = encodeURIComponent(texto);
            const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=sv`;

            const controller = new AbortController();
            timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

            const response = await fetch(url, {
                headers: { 'User-Agent': 'BusTrackSV/1.0 (Integration Fix)' },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP Error ${response.status}`);
            }

            const data = await response.json();

            if (data && data.length > 0) {
                const result = data[0];
                return {
                    lat: parseFloat(result.lat),
                    lng: parseFloat(result.lon)
                };
            }
            return null;
        } catch (error) {
            if (timeoutId) clearTimeout(timeoutId);
            console.error("❌ Error en geocoding Nominatim:", error.message);
            return null;
        }
    }

    async _getOSRMRoute(coordinates) {
        if (!coordinates || coordinates.length < 2) return null;

        try {
            // Construir string de coordenadas "lon,lat;lon,lat"
            const coordsString = coordinates
                .map(c => `${c.lng},${c.lat}`)
                .join(';');

            // URL del servicio público de OSRM (Demo Server)
            // Nota: En producción, se recomienda usar una instancia propia o un servicio pagado de OSRM/Mapbox
            const url = `http://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=polyline`;

            console.log("🛣️ Consultando OSRM Routing...");

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

            const response = await fetch(url, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`OSRM HTTP Error ${response.status}`);
            }

            const data = await response.json();

            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                // OSRM devuelve polyline codificado con precisión 5 (similar a Google)
                const encodedPolyline = data.routes[0].geometry;
                return this._decodePolyline(encodedPolyline);
            }

            return null;
        } catch (error) {
            console.error("❌ Error consultando OSRM:", error.message);
            throw error;
        }
    }

    // Decodificar polyline de Google Maps a array de coordenadas
    _decodePolyline(encoded, precision = 5) {
        if (!encoded) return [];
        const factor = Math.pow(10, precision);
        const coordinates = [];
        let index = 0;
        let lat = 0;
        let lng = 0;

        while (index < encoded.length) {
            let b, shift = 0, result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            const dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
            lat += dlat;

            shift = 0;
            result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            const dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
            lng += dlng;

            coordinates.push({ lat: lat / factor, lng: lng / factor });
        }

        return coordinates;
    }

    // Guardar ruta confirmada en BD
    async saveRoute(routeData) {
        const { nombre, descripcion, numero_ruta, geometry, color } = routeData;

        // Ensure geometry is stored as a JSON string if it's an object/array
        const geometryString = (typeof geometry === 'object') 
            ? JSON.stringify(geometry) 
            : geometry;

        // Insertar
        const result = await pool.query(`
      INSERT INTO rutas (nombre, descripcion, numero_ruta, geometry, color, activa, tipo)
      VALUES ($1, $2, $3, $4, $5, 1, 'Bus')
    `, [nombre, descripcion, numero_ruta, geometryString, color]);

        return { success: true, id: result.id };
    }
}

export default new RouteGenerationService();
