import apiClient from "../api/client.js";

class GeocodingService {
    /**
     * Busca direcciones en El Salvador usando Nominatim (OpenStreetMap)
     * @param {string} query - Texto a buscar
     * @returns {Promise<Array>} - Lista de sugerencias
     */
    async searchAddress(query) {
        if (!query || query.length < 3) return [];

        try {
            // 1. Buscar en BD local (Paradas oficiales) - Prioridad Alta
            const localPromise = apiClient.get(`/api/paradas?q=${encodeURIComponent(query)}`)
                .then(res => res.data.map(p => ({
                    id: `local-${p.id}`,
                    nombre: p.nombre,
                    descripcion: p.direccion || "Parada oficial",
                    latitud: parseFloat(p.latitud),
                    longitud: parseFloat(p.longitud),
                    tipo: 'Parada',
                    origen: 'db'
                })))
                .catch(err => {
                    console.error("Error buscando paradas locales:", err);
                    return [];
                });

            // 2. Buscar en Nominatim (OpenStreetMap) - Respaldo
            const nominatimParams = new URLSearchParams({
                q: query,
                format: 'json',
                countrycodes: 'sv',
                limit: 5,
                addressdetails: 1
            });

            const nominatimPromise = fetch(`https://nominatim.openstreetmap.org/search?${nominatimParams.toString()}`, {
                headers: { 'User-Agent': 'BusTrackSV/1.0' }
            })
                .then(res => res.ok ? res.json() : [])
                .then(data => data.map(item => ({
                    id: `nominatim-${item.place_id}`,
                    nombre: item.display_name.split(',')[0],
                    descripcion: item.display_name,
                    latitud: parseFloat(item.lat),
                    longitud: parseFloat(item.lon),
                    tipo: 'Dirección',
                    origen: 'nominatim'
                })))
                .catch(err => {
                    console.error("Error buscando en Nominatim:", err);
                    return [];
                });

            // Esperar ambos y combinar (Local primero)
            const [localResults, nominatimResults] = await Promise.all([localPromise, nominatimPromise]);

            return [...localResults, ...nominatimResults];

        } catch (error) {
            console.error("Error geocodificando:", error);
            return [];
        }
    }
}

export default new GeocodingService();
