import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useRef } from 'react';

// Fix for default marker icon in React Leaflet
if (!L.Icon.Default.prototype._getIconUrl_original) {
    L.Icon.Default.prototype._getIconUrl_original = L.Icon.Default.prototype._getIconUrl;
    delete L.Icon.Default.prototype._getIconUrl;
    
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
}

// Custom Icons with Pins (Gota/Pin Shape)
const createPinIcon = (color) => {
    const svgColor = color === 'blue' ? '#2563eb' : '#dc2626'; // blue-600 or red-600
    
    return L.divIcon({
        className: 'custom-pin-icon',
        html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${svgColor}" stroke="white" stroke-width="1.5" style="filter: drop-shadow(2px 4px 4px rgba(0,0,0,0.4)); width: 36px; height: 36px;">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36], // Anchor at bottom-center tip
        popupAnchor: [0, -36]
    });
};

const iconBlue = createPinIcon('blue');
const iconRed = createPinIcon('red');

// Icono de Círculo Amarillo para Paradas
const iconYellowCircle = L.divIcon({
    className: 'custom-yellow-circle',
    html: `<div style="background-color: #FBBF24; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
});


// Componente para ajustar los límites del mapa
function MapBounds({ bounds }) {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [bounds, map]);
    return null;
}

export default function LeafletFallbackMap({
    rutaCompletaIda,
    rutaCompletaRegreso,
    puntos,
    stops, // Nuevas paradas de DB
    previewStop
}) {
    // Forzar re-renderizado cuando cambian los datos
    const mapRef = useRef(null);

    const isValidPoint = (p) => {
        return Array.isArray(p) && p.length === 2 &&
            typeof p[0] === 'number' && !isNaN(p[0]) &&
            typeof p[1] === 'number' && !isNaN(p[1]);
    };

    const validIda = (rutaCompletaIda || []).filter(isValidPoint);
    const validRegreso = (rutaCompletaRegreso || []).filter(isValidPoint);

    // Recalcular bounds con puntos validos
    let center = [13.6929, -89.2182]; // Default: San Salvador
    let bounds = null;

    const allCoords = [
        ...validIda,
        ...validRegreso
    ];
    
    // Add marker coordinates to bounds calculation
    if (puntos?.ida) puntos.ida.forEach(p => { if (isValidPoint(p.coordenadas)) allCoords.push(p.coordenadas) });
    if (puntos?.regreso) puntos.regreso.forEach(p => { if (isValidPoint(p.coordenadas)) allCoords.push(p.coordenadas) });
    
    // Add stops coordinates to bounds
    if (stops && Array.isArray(stops)) {
        stops.forEach(s => {
            const lat = typeof s.latitud === 'string' ? parseFloat(s.latitud) : s.latitud;
            const lng = typeof s.longitud === 'string' ? parseFloat(s.longitud) : s.longitud;
            if (!isNaN(lat) && !isNaN(lng)) {
                allCoords.push([lat, lng]);
            }
        });
    }

    if (previewStop && previewStop.latitud && previewStop.longitud) {
         const lat = typeof previewStop.latitud === 'string' ? parseFloat(previewStop.latitud) : previewStop.latitud;
         const lng = typeof previewStop.longitud === 'string' ? parseFloat(previewStop.longitud) : previewStop.longitud;
         if (!isNaN(lat) && !isNaN(lng)) {
             allCoords.push([lat, lng]);
         }
    }

    if (allCoords.length > 0) {
        center = allCoords[0];
        const latLngs = allCoords.map(c => L.latLng(c[0], c[1]));
        bounds = L.latLngBounds(latLngs);
    }

    return (
        <MapContainer
            ref={mapRef}
            center={center}
            zoom={13}
            style={{ height: '100%', width: '100%', minHeight: '400px', zIndex: 1 }}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {bounds && <MapBounds bounds={bounds} />}

            {/* Ruta de Ida - Azul (coincidir con Google Maps) */}
            {validIda.length > 0 && (
                <Polyline
                    key="ruta-ida"
                    positions={validIda}
                    pathOptions={{ 
                        color: '#3b82f6', 
                        weight: 6, 
                        opacity: 0.8,
                        zIndex: 10
                    }}
                />
            )}

            {/* Marcadores de Ida */}
            {puntos?.ida && puntos.ida.length > 0 && puntos.ida.map((punto, idx) => {
                if (!punto || !punto.coordenadas || !isValidPoint(punto.coordenadas)) return null;
                return (
                    <Marker
                        key={`ida-${idx}`}
                        position={[punto.coordenadas[0], punto.coordenadas[1]]}
                        icon={iconBlue}
                    >
                        <Popup>
                            <div className="text-sm">
                                <strong className="text-blue-600">Ida {idx + 1}: {punto.nombre || `Punto ${idx + 1}`}</strong>
                                {punto.direccion && <><br />{punto.direccion}</>}
                            </div>
                        </Popup>
                    </Marker>
                );
            })}

            {/* Ruta de Regreso - Rojo */}
            {validRegreso.length > 0 && (
                <Polyline
                    key="ruta-regreso"
                    positions={validRegreso}
                    pathOptions={{ 
                        color: '#ef4444', 
                        weight: 6, 
                        opacity: 0.8,
                        zIndex: 20
                    }}
                />
            )}

            {/* Marcadores de Regreso */}
            {puntos?.regreso && puntos.regreso.length > 0 && puntos.regreso.map((punto, idx) => {
                if (!punto || !punto.coordenadas || !isValidPoint(punto.coordenadas)) return null;
                return (
                    <Marker
                        key={`regreso-${idx}`}
                        position={[punto.coordenadas[0], punto.coordenadas[1]]}
                        icon={iconRed}
                    >
                        <Popup>
                            <div className="text-sm">
                                <strong className="text-red-600">Regreso {idx + 1}: {punto.nombre || `Punto ${idx + 1}`}</strong>
                                {punto.direccion && <><br />{punto.direccion}</>}
                            </div>
                        </Popup>
                    </Marker>
                );
            })}

            {/* Paradas de la Ruta (DB) - CON CIRCULO AMARILLO */}
            {stops && stops.map((stop, i) => {
                const lat = typeof stop.latitud === 'string' ? parseFloat(stop.latitud) : stop.latitud;
                const lng = typeof stop.longitud === 'string' ? parseFloat(stop.longitud) : stop.longitud;
                
                if (isNaN(lat) || isNaN(lng)) return null;

                return (
                    <Marker
                        key={`stop-${stop.id || i}`}
                        position={[lat, lng]}
                        icon={iconYellowCircle}
                    >
                        <Popup>
                            <div className="text-sm font-sans">
                                <strong>🚏 Parada: {stop.nombre}</strong>
                                <br />
                                <span className="text-xs text-gray-600">{stop.codigo || 'Sin código'}</span>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}

            {/* Preview Parada (Stop Form) */}
            {previewStop && previewStop.latitud && previewStop.longitud && (
                 <Marker
                    position={[
                        typeof previewStop.latitud === 'string' ? parseFloat(previewStop.latitud) : previewStop.latitud,
                        typeof previewStop.longitud === 'string' ? parseFloat(previewStop.longitud) : previewStop.longitud
                    ]}
                    icon={L.divIcon({
                        className: 'custom-preview-icon',
                        html: `<div style="background-color: #FBBF24; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">+</div>`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    })}
                >
                    <Popup>Vista Previa: Nueva Parada</Popup>
                </Marker>
            )}

        </MapContainer>
    );
}
