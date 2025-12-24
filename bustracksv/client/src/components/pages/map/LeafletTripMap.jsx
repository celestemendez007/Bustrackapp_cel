import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useRef, useMemo } from 'react';

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Crear iconos personalizados con colores diferentes para origen y destino
const createCustomIcon = (color) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            background-color: ${color};
            width: 30px;
            height: 30px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        ">
            <div style="
                width: 100%;
                height: 100%;
                border-radius: 50% 50% 50% 0;
                transform: rotate(45deg);
                display: flex;
                align-items: center;
                justify-content: center;
            "></div>
        </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });
};

// Iconos con colores distintos
const ICON_ORIGEN_LEAFLET = createCustomIcon('#10b981'); // Verde
const ICON_DESTINO_LEAFLET = createCustomIcon('#ef4444'); // Rojo

// Helper para validar coordenadas
const isValidCoord = (lat, lng) => {
    return typeof lat === 'number' && typeof lng === 'number' &&
        !isNaN(lat) && !isNaN(lng) &&
        lat !== null && lng !== null &&
        lat !== undefined && lng !== undefined &&
        Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
};

// Helper para normalizar coordenadas a formato [lat, lng]
const normalizeCoordinate = (p) => {
    try {
        // Validación exhaustiva de entrada
        if (p === null || p === undefined) return null;
        if (typeof p !== 'object' && !Array.isArray(p)) return null;

        let lat, lng;

        if (Array.isArray(p)) {
            // Validar que el array tenga al menos 2 elementos
            if (p.length < 2) return null;
            // Validar que los elementos no sean null/undefined
            if (p[0] === null || p[0] === undefined || p[1] === null || p[1] === undefined) return null;
            lat = Number(p[0]);
            lng = Number(p[1]);
        } else if (typeof p === 'object') {
            // Validar que tenga propiedades lat/lng o latitud/longitud
            if (p.lat !== undefined && p.lat !== null) {
                lat = Number(p.lat);
            } else if (p.latitud !== undefined && p.latitud !== null) {
                lat = Number(p.latitud);
            } else {
                return null;
            }

            if (p.lng !== undefined && p.lng !== null) {
                lng = Number(p.lng);
            } else if (p.longitud !== undefined && p.longitud !== null) {
                lng = Number(p.longitud);
            } else {
                return null;
            }
        } else {
            return null;
        }

        // Validación final de números
        if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
            return null;
        }

        // Validación de rangos geográficos
        if (!isValidCoord(lat, lng)) {
            return null;
        }

        return [lat, lng];
    } catch (error) {
        console.warn('Error normalizing coordinate:', error, p);
        return null;
    }
};

// Componente para ajustar los límites del mapa
function MapBounds({ bounds }) {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.isValid()) {
            map.fitBounds(bounds);
        }
    }, [bounds, map]);
    return null;
}

// Componente para centrar el mapa en un punto específico
function MapCenter({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center && isValidCoord(center[0], center[1])) {
            map.setView(center, zoom || 16);
        }
    }, [center, zoom, map]);
    return null;
}

// Componente wrapper con validación de seguridad
function SafePolyline({ positions, pathOptions }) {
    // Validación final antes de renderizar
    if (!positions || !Array.isArray(positions) || positions.length < 2) {
        return null;
    }

    // Verificar que todos los elementos sean arrays válidos - VALIDACIÓN ULTRA ESTRICTA
    const safePositions = positions
        .map((pos, idx) => {
            // Validar que no sea null/undefined
            if (pos === null || pos === undefined) {
                console.warn(`SafePolyline: posición ${idx} es null/undefined`);
                return null;
            }

            // Validar que sea un array
            if (!Array.isArray(pos)) {
                console.warn(`SafePolyline: posición ${idx} no es un array:`, pos);
                return null;
            }

            // Validar longitud
            if (pos.length !== 2) {
                console.warn(`SafePolyline: posición ${idx} no tiene 2 elementos:`, pos);
                return null;
            }

            // Validar que ambos elementos sean números válidos
            const lat = pos[0];
            const lng = pos[1];

            if (lat === null || lat === undefined || lng === null || lng === undefined) {
                console.warn(`SafePolyline: posición ${idx} tiene valores null/undefined:`, pos);
                return null;
            }

            if (typeof lat !== 'number' || typeof lng !== 'number') {
                console.warn(`SafePolyline: posición ${idx} no tiene números:`, pos);
                return null;
            }

            if (isNaN(lat) || isNaN(lng)) {
                console.warn(`SafePolyline: posición ${idx} tiene NaN:`, pos);
                return null;
            }

            // Validar rangos geográficos
            if (!isValidCoord(lat, lng)) {
                console.warn(`SafePolyline: posición ${idx} fuera de rangos válidos:`, pos);
                return null;
            }

            return [lat, lng];
        })
        .filter(pos => pos !== null);

    if (safePositions.length < 2) {
        console.warn('SafePolyline: no hay suficientes posiciones válidas', {
            original: positions.length,
            valid: safePositions.length
        });
        return null;
    }

    // Validación final: asegurar que no hay undefined en ningún lugar
    const finalCheck = safePositions.every(pos =>
        Array.isArray(pos) &&
        pos.length === 2 &&
        typeof pos[0] === 'number' &&
        typeof pos[1] === 'number' &&
        !isNaN(pos[0]) &&
        !isNaN(pos[1]) &&
        pos[0] !== undefined &&
        pos[1] !== undefined &&
        pos[0] !== null &&
        pos[1] !== null
    );

    if (!finalCheck) {
        console.error('SafePolyline: validación final falló', safePositions);
        return null;
    }

    try {
        return <Polyline positions={safePositions} pathOptions={pathOptions} />;
    } catch (error) {
        console.error('Error rendering Polyline:', error, {
            positionsLength: positions.length,
            safePositionsLength: safePositions.length,
            firstFew: safePositions.slice(0, 3)
        });
        return null;
    }
}

export default function LeafletTripMap({
    origen,
    destino,
    routeSegments,
    walkingSegments,
    transitionPoints,
    onOriginMove, // Callback prop
    dbRoutes = [] // Rutas desde la base de datos
}) {
    const markerRef = useRef(null);

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const { lat, lng } = marker.getLatLng();
                    if (onOriginMove) {
                        onOriginMove({ lat, lng });
                    }
                }
            },
        }),
        [onOriginMove],
    );

    // Validar que routeSegments y walkingSegments sean arrays válidos (PRIMERO)
    const safeRouteSegments = Array.isArray(routeSegments) ? routeSegments : [];
    const safeWalkingSegments = Array.isArray(walkingSegments) ? walkingSegments : [];
    const safeTransitionPoints = Array.isArray(transitionPoints) ? transitionPoints : [];
    const safeDbRoutes = Array.isArray(dbRoutes) ? dbRoutes : [];

    // Validar dbRoutes antes de renderizar
    const validatedDbRoutes = safeDbRoutes.filter(route => {
        if (!route || !route.geometry) return false;
        if (!Array.isArray(route.geometry) || route.geometry.length < 2) return false;
        return true;
    });

    let center = [13.6929, -89.2182]; // Default: San Salvador
    let bounds = null;

    // Calcular bounds basados en todos los puntos disponibles
    const allPoints = [];

    // Validar y agregar origen
    if (origen && isValidCoord(origen.lat, origen.lng)) {
        try {
            const origPoint = L.latLng(origen.lat, origen.lng);
            allPoints.push(origPoint);
            // Si solo hay origen, usar ese como centro
            if (!destino && safeRouteSegments.length === 0) {
                center = [origen.lat, origen.lng];
            }
        } catch (e) {
            console.error("Invalid Origin Coords:", origen);
        }
    }

    // Validar y agregar destino
    if (destino && isValidCoord(destino.lat, destino.lng)) {
        try {
            allPoints.push(L.latLng(destino.lat, destino.lng));
        } catch (e) {
            console.error("Invalid Destination Coords:", destino);
        }
    }

    safeRouteSegments.forEach(seg => {
        if (seg && seg.path && Array.isArray(seg.path)) {
            seg.path.forEach(p => {
                if (p && typeof p === 'object' && isValidCoord(p.lat, p.lng)) {
                    try {
                        allPoints.push(L.latLng(p.lat, p.lng));
                    } catch (e) {
                        console.warn('Invalid coordinate in route segment:', p);
                    }
                }
            });
        }
    });

    safeWalkingSegments.forEach(seg => {
        if (seg && seg.path && Array.isArray(seg.path)) {
            seg.path.forEach(p => {
                if (p && typeof p === 'object' && isValidCoord(p.lat, p.lng)) {
                    try {
                        allPoints.push(L.latLng(p.lat, p.lng));
                    } catch (e) {
                        console.warn('Invalid coordinate in walking segment:', p);
                    }
                }
            });
        }
    });

    if (allPoints.length > 0) {
        try {
            bounds = L.latLngBounds(allPoints);
            // Solo usar bounds.getCenter() si hay múltiples puntos
            if (allPoints.length > 1 && bounds.isValid()) {
                const calculatedCenter = bounds.getCenter();
                if (calculatedCenter && isValidCoord(calculatedCenter.lat, calculatedCenter.lng)) {
                    center = [calculatedCenter.lat, calculatedCenter.lng];
                }
            } else if (allPoints.length === 1) {
                // Si solo hay un punto, usarlo como centro
                const singlePoint = allPoints[0];
                if (singlePoint && isValidCoord(singlePoint.lat, singlePoint.lng)) {
                    center = [singlePoint.lat, singlePoint.lng];
                }
            }
        } catch (e) {
            console.warn('Error calculating bounds:', e);
        }
    }

    // Validación final del centro
    const safeCenter = Array.isArray(center) && center.length === 2 &&
        isValidCoord(center[0], center[1])
        ? center
        : [13.6929, -89.2182];

    try {
        return (
            <MapContainer
                center={safeCenter}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {bounds && <MapBounds bounds={bounds} />}

                {/* Centrar en origen si solo hay origen y no hay rutas */}
                {origen && isValidCoord(origen.lat, origen.lng) && (!destino && (!routeSegments || routeSegments.length === 0)) && (
                    <MapCenter center={[origen.lat, origen.lng]} zoom={16} />
                )}

                {/* Marcador Origen - Verde */}
                {origen && isValidCoord(origen.lat, origen.lng) && (
                    <Marker
                        draggable={!!onOriginMove}
                        eventHandlers={eventHandlers}
                        position={[origen.lat, origen.lng]}
                        ref={markerRef}
                        icon={ICON_ORIGEN_LEAFLET}
                    >
                        <Popup>Origen: {origen.nombre} <br /> (Arrastra para corregir)</Popup>
                    </Marker>
                )}

                {/* Marcador Destino - Rojo */}
                {destino && isValidCoord(destino.lat, destino.lng) && (
                    <Marker
                        position={[destino.lat, destino.lng]}
                        icon={ICON_DESTINO_LEAFLET}
                    >
                        <Popup>Destino: {destino.nombre}</Popup>
                    </Marker>
                )}

                {/* Caminatas (Líneas Punteadas) */}
                {safeWalkingSegments.map((seg, idx) => {
                    try {
                        // Validar que seg y seg.path existan y sean arrays
                        if (!seg || !seg.path || !Array.isArray(seg.path) || seg.path.length === 0) {
                            return null;
                        }

                        // Normalizar y validar todas las coordenadas
                        const validPositions = seg.path
                            .map(normalizeCoordinate)
                            .filter(pos => pos !== null && Array.isArray(pos) && pos.length === 2);

                        // Solo renderizar si hay al menos 2 puntos válidos
                        if (!validPositions || validPositions.length < 2) {
                            return null;
                        }

                        // Validación final: asegurar que no hay undefined en el array
                        const finalPositions = validPositions.filter(pos =>
                            pos &&
                            Array.isArray(pos) &&
                            pos.length === 2 &&
                            typeof pos[0] === 'number' &&
                            typeof pos[1] === 'number' &&
                            !isNaN(pos[0]) &&
                            !isNaN(pos[1])
                        );

                        if (finalPositions.length < 2) {
                            return null;
                        }

                        return (
                            <SafePolyline
                                key={`walk-${idx}`}
                                positions={finalPositions}
                                pathOptions={{
                                    color: '#7bc4f0',
                                    dashArray: '10, 10',
                                    weight: 4,
                                    opacity: 0.8
                                }}
                            />
                        );
                    } catch (error) {
                        console.error(`Error rendering walking segment ${idx}:`, error, seg);
                        return null;
                    }
                })}

                {/* Segmentos de Bus */}
                {safeRouteSegments.map((seg, idx) => {
                    try {
                        // Validar que seg y seg.path existan y sean arrays
                        if (!seg || !seg.path || !Array.isArray(seg.path) || seg.path.length === 0) {
                            return null;
                        }

                        // Normalizar y validar todas las coordenadas
                        const validPositions = seg.path
                            .map(normalizeCoordinate)
                            .filter(pos => pos !== null && Array.isArray(pos) && pos.length === 2);

                        // Solo renderizar si hay al menos 2 puntos válidos
                        if (!validPositions || validPositions.length < 2) {
                            return null;
                        }

                        // Validación final: asegurar que no hay undefined en el array
                        const finalPositions = validPositions.filter(pos =>
                            pos &&
                            Array.isArray(pos) &&
                            pos.length === 2 &&
                            typeof pos[0] === 'number' &&
                            typeof pos[1] === 'number' &&
                            !isNaN(pos[0]) &&
                            !isNaN(pos[1])
                        );

                        if (finalPositions.length < 2) {
                            return null;
                        }

                        return (
                            <SafePolyline
                                key={`bus-${idx}`}
                                positions={finalPositions}
                                pathOptions={{
                                    color: seg.color || '#1E88E5',
                                    weight: 6,
                                    opacity: 0.9
                                }}
                            />
                        );
                    } catch (error) {
                        console.error(`Error rendering route segment ${idx}:`, error, seg);
                        return null;
                    }
                })}

                {/* Puntos de Transición */}
                {safeTransitionPoints.map((pt, idx) => (
                    isValidCoord(pt.lat, pt.lng) && (
                        <Marker
                            key={`pt-${idx}`}
                            position={[pt.lat, pt.lng]}
                        >
                            <Popup>
                                <strong>{pt.nombre}</strong>
                                <br />
                                {pt.descripcion}
                            </Popup>
                        </Marker>
                    )
                ))}

                {/* Rutas desde Base de Datos (AI Routes) */}
                {validatedDbRoutes.map((route, idx) => {
                    try {
                        if (!route || !route.geometry) {
                            console.warn(`Ruta DB ${route?.id || idx}: sin geometría`);
                            return null;
                        }

                        if (!Array.isArray(route.geometry)) {
                            console.warn(`Ruta DB ${route.id || idx}: geometría no es array:`, typeof route.geometry);
                            return null;
                        }

                        if (route.geometry.length < 2) {
                            console.warn(`Ruta DB ${route.id || idx}: geometría tiene menos de 2 puntos:`, route.geometry.length);
                            return null;
                        }

                        // Usar normalizeCoordinate para normalizar cada punto
                        const normalizedGeometry = route.geometry
                            .map((point, pointIdx) => {
                                const normalized = normalizeCoordinate(point);
                                if (normalized === null && pointIdx < 5) {
                                    console.warn(`Ruta DB ${route.id || idx}, punto ${pointIdx} inválido:`, point);
                                }
                                return normalized;
                            })
                            .filter(pos => pos !== null);

                        if (normalizedGeometry.length < 2) {
                            console.warn(`Ruta DB ${route.id || idx}: solo ${normalizedGeometry.length} puntos válidos de ${route.geometry.length}`);
                            return null;
                        }

                        // Validación final: asegurar que no hay undefined en ningún lugar
                        const finalPositions = normalizedGeometry.filter(pos => {
                            if (!pos || !Array.isArray(pos) || pos.length !== 2) return false;
                            const [lat, lng] = pos;
                            return typeof lat === 'number' &&
                                typeof lng === 'number' &&
                                !isNaN(lat) &&
                                !isNaN(lng) &&
                                lat !== undefined &&
                                lng !== undefined &&
                                lat !== null &&
                                lng !== null;
                        });

                        if (finalPositions.length < 2) {
                            console.warn(`Ruta DB ${route.id || idx}: validación final falló, solo ${finalPositions.length} puntos válidos`);
                            return null;
                        }

                        // Log para debugging de la ruta 26
                        if (route.numero_ruta === '26' || route.numero_ruta === 26) {
                            console.log('Ruta 26 - Geometría procesada:', {
                                original: route.geometry.length,
                                normalized: normalizedGeometry.length,
                                final: finalPositions.length,
                                firstFew: finalPositions.slice(0, 3)
                            });
                        }

                        return (
                            <SafePolyline
                                key={`db-route-${route.id || idx}`}
                                positions={finalPositions}
                                pathOptions={{
                                    color: route.color || '#999999',
                                    weight: 4,
                                    opacity: 0.6
                                }}
                            />
                        );
                    } catch (error) {
                        console.error(`Error rendering DB route ${route?.id || idx}:`, error, {
                            routeId: route?.id,
                            routeNumber: route?.numero_ruta,
                            hasGeometry: !!route?.geometry,
                            geometryType: typeof route?.geometry,
                            geometryLength: Array.isArray(route?.geometry) ? route.geometry.length : 'N/A'
                        });
                        return null;
                    }
                })}
            </MapContainer>
        );
    } catch (error) {
        console.error('Error rendering LeafletTripMap:', error);
        return (
            <div className="h-full w-full flex items-center justify-center bg-slate-800 text-white">
                <div className="text-center">
                    <p className="text-red-400 mb-2">Error al renderizar el mapa</p>
                    <p className="text-sm text-slate-400">{error.message}</p>
                </div>
            </div>
        );
    }
}
