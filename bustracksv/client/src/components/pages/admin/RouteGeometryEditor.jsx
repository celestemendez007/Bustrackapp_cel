import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, Polyline, Marker } from '@react-google-maps/api';
import { useGoogleMaps } from '../../../contexts/GoogleMapsContext';
import LeafletFallbackMap from './LeafletFallbackMap';
import adminService from '../../../services/adminService.js';
import routeService from '../../../services/routeService.js';

const containerStyle = {
  width: '100%',
  height: '100%'
};

export default function RouteGeometryEditor({ value, onChange, onSave, stops = [], previewStop = null }) {
  const { isLoaded, loadError } = useGoogleMaps();
  const mapRef = useRef(null);

  // Estados
  const [textoIda, setTextoIda] = useState('');
  const [textoRegreso, setTextoRegreso] = useState('');
  const [pathIda, setPathIda] = useState([]);
  const [pathRegreso, setPathRegreso] = useState([]);
  const [markersIda, setMarkersIda] = useState([]);
  const [markersRegreso, setMarkersRegreso] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [recomendacionesRegreso, setRecomendacionesRegreso] = useState([]);
  const [showRecomendaciones, setShowRecomendaciones] = useState(false);

  // Inicializar
  useEffect(() => {
    if (value) {
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        if (parsed?.ida) setPathIda(parsed.ida);
        if (parsed?.regreso) setPathRegreso(parsed.regreso);
        if (Array.isArray(parsed)) setPathIda(parsed);
      } catch (e) {
        console.error("Error parseando geometry inicial", e);
      }
    }
  }, [value]);

  const onLoad = useCallback((map) => {
    if (!map || !window.google || !window.google.maps) {
      console.warn('Google Maps not fully loaded');
      return;
    }
    try {
      mapRef.current = map;
      const bounds = new window.google.maps.LatLngBounds();
      let hasPoints = false;
      [...pathIda, ...pathRegreso].forEach(p => {
        if (p && typeof p.lat === 'number' && typeof p.lng === 'number') {
          bounds.extend({ lat: p.lat, lng: p.lng });
          hasPoints = true;
        }
      });
      if (hasPoints && map) {
        map.fitBounds(bounds);
      }
    } catch (error) {
      console.error('Error in onLoad callback:', error);
    }
  }, [pathIda, pathRegreso]);

  // Estrategia Híbrida: Cliente (Google) o Servidor (Backend)
  const calcularTrazo = async (textoInput) => {
    if (!textoInput) return { points: [], markers: [] };

    // ESTRATEGIA A: Google Maps JS Client (Preferida)
    if (window.google && window.google.maps && isLoaded && !loadError) {
      try {
        const lugares = textoInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
        if (lugares.length < 2) return { points: [], markers: [] };

        const origin = lugares[0];
        const destination = lugares[lugares.length - 1];
        const waypoints = lugares.slice(1, -1).map(l => ({ location: l, stopover: true }));

        if (!window.google.maps.DirectionsService) {
          console.warn('DirectionsService not available, using backend...');
          // Fall through to backend
        } else {
          const directionsService = new window.google.maps.DirectionsService();

          return new Promise((resolve, reject) => {
            try {
              directionsService.route({
                origin: origin,
                destination: destination,
                waypoints: waypoints,
                travelMode: window.google.maps.TravelMode.DRIVING,
                optimizeWaypoints: false
              }, (result, status) => {
                if (status === window.google.maps.DirectionsStatus.OK && result && result.routes && result.routes.length > 0) {
                  try {
                    const points = result.routes[0].overview_path.map(p => ({ lat: p.lat(), lng: p.lng() }));
                    const markers = [];
                    const legs = result.routes[0].legs;
                    if (legs && legs.length > 0) {
                      legs.forEach((leg, index) => {
                        markers.push({
                          lat: leg.start_location.lat(),
                          lng: leg.start_location.lng(),
                          address: leg.start_address,
                          nombre: lugares[index] || leg.start_address
                        });
                      });
                      const lastLeg = legs[legs.length - 1];
                      markers.push({
                        lat: lastLeg.end_location.lat(),
                        lng: lastLeg.end_location.lng(),
                        address: lastLeg.end_address,
                        nombre: lugares[lugares.length - 1]
                      });
                    }
                    resolve({ points, markers });
                  } catch (err) {
                    console.error('Error processing directions result:', err);
                    resolve(null); // Fallback to backend
                  }
                } else {
                  console.warn(`Client-side directions failed: ${status}. Trying backend...`);
                  resolve(null); // Return null to trigger backend fallback
                }
              });
            } catch (err) {
              console.error('Error calling directions service:', err);
              resolve(null); // Fallback to backend
            }
          });
        }
      } catch (err) {
        console.error('Error in client-side route calculation:', err);
        // Fall through to backend
      }
    }

    // ESTRATEGIA B: Backend Service (Fallback)
    // Si no hay mapa JS, o falló la carga, usamos el backend que tiene su propia key.
    // console.log("Using Backend Fallback for route calculation...");
    try {
      const response = await adminService.generateRoute(textoInput);
      if (response && response.success && response.data) {
        const data = response.data.data || response.data; // Manejar ambos formatos de respuesta

        // Decodificar Polyline String si es necesario
        let points = [];
        if (typeof data.geometry === 'string') {
          // Es un polyline codificado
          points = decodePolyline(data.geometry);
        } else if (Array.isArray(data.geometry)) {
          // Es un array de coordenadas
          points = data.geometry.map(p => {
            if (typeof p === 'object' && p.lat !== undefined && p.lng !== undefined) {
              return { lat: parseFloat(p.lat), lng: parseFloat(p.lng) };
            } else if (Array.isArray(p) && p.length >= 2) {
              return { lat: parseFloat(p[0]), lng: parseFloat(p[1]) };
            }
            return null;
          }).filter(p => p !== null);
        }

        // Si no hay puntos de la geometría, usar los puntos geocodificados
        if (points.length === 0 && data.puntos_geocodificados && data.puntos_geocodificados.length > 0) {
          points = data.puntos_geocodificados.map(p => ({
            lat: parseFloat(p.lat),
            lng: parseFloat(p.lng)
          }));
        }

        let markers = [];
        if (data.legs && Array.isArray(data.legs) && data.legs.length > 0) {
          // Usar 'legs' si el backend los devuelve (Directions API)
          data.legs.forEach((leg, index) => {
            markers.push({
              lat: typeof leg.start_location.lat === 'function' ? leg.start_location.lat() : parseFloat(leg.start_location.lat),
              lng: typeof leg.start_location.lng === 'function' ? leg.start_location.lng() : parseFloat(leg.start_location.lng),
              address: leg.start_address,
              nombre: `Punto ${index + 1}`
            });
          });
          // Agregar el destino final
          const lastLeg = data.legs[data.legs.length - 1];
          markers.push({
            lat: typeof lastLeg.end_location.lat === 'function' ? lastLeg.end_location.lat() : parseFloat(lastLeg.end_location.lat),
            lng: typeof lastLeg.end_location.lng === 'function' ? lastLeg.end_location.lng() : parseFloat(lastLeg.end_location.lng),
            address: lastLeg.end_address,
            nombre: `Destino`
          });
        } else {
          // Fallback: usar puntos geocodificados
          markers = (data.puntos_geocodificados || []).map(p => ({
            lat: parseFloat(p.lat),
            lng: parseFloat(p.lng),
            address: p.nombre_original || p.nombre || 'Punto',
            nombre: p.nombre_original || p.nombre || 'Punto'
          }));
        }

        // Mostrar advertencia si existe (silencioso)
        // if (data.advertencia) {
        //   console.debug("Info:", data.advertencia);
        // }

        return { points, markers };
      } else {
        // Si falló, mostrar el mensaje de error
        const errorMsg = response?.message || "No se pudo generar la ruta";
        console.error("Error generando ruta:", errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error("Backend fallback failed:", err);
      // Re-throw to be caught by handlePreview
      throw err;
    }

    return { points: [], markers: [] };
  };

  // Utility: Decode Google Polyline
  // Source: https://github.com/googlemaps/js-polyline-codec/blob/main/src/index.ts (Simplified)
  function decodePolyline(str, precision) {
    var index = 0,
      lat = 0,
      lng = 0,
      coordinates = [],
      shift = 0,
      result = 0,
      byte = null,
      latitude_change,
      longitude_change,
      factor = Math.pow(10, precision === undefined ? 5 : precision);

    while (index < str.length) {
      byte = null;
      shift = 0;
      result = 0;

      do {
        byte = str.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
      shift = result = 0;

      do {
        byte = str.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

      lat += latitude_change;
      lng += longitude_change;

      coordinates.push({ lat: lat / factor, lng: lng / factor });
    }

    return coordinates;
  };

  const handlePreview = async () => {
    setLoading(true);
    setError('');

    // Safety timeout: stop loading after 120 seconds if backend hangs (matching API timeout)
    let safetyTimeout;
    const timeoutRef = { current: null };

    safetyTimeout = setTimeout(() => {
      timeoutRef.current = true;
      setLoading(prev => {
        if (prev) {
          setError('El servidor tardó demasiado en responder. Intenta de nuevo.');
          return false;
        }
        return prev;
      });
    }, 120000); // 120 seconds to match API timeout

    try {
      // Calcular ambas rutas
      let resIda = { points: [], markers: [] };
      if (textoIda.trim()) {
        try {
          resIda = await calcularTrazo(textoIda);
          if (resIda === null || !resIda.points || resIda.points.length === 0) {
            // Si la estrategia A falló, intentar de nuevo (posible retry logic o fallback)
            resIda = await calcularTrazo(textoIda);
          }
        } catch (err) {
          console.error('Error calculating ida route:', err);
          resIda = { points: [], markers: [] };
        }
      }

      let resRegreso = { points: [], markers: [] };
      if (textoRegreso.trim()) {
        try {
          resRegreso = await calcularTrazo(textoRegreso);
          if (resRegreso === null || !resRegreso.points || resRegreso.points.length === 0) {
            resRegreso = await calcularTrazo(textoRegreso);
          }
        } catch (err) {
          console.error('Error calculating regreso route:', err);
          resRegreso = { points: [], markers: [] };
        }
      }

      // Clear timeout on success
      if (safetyTimeout) {
        clearTimeout(safetyTimeout);
      }

      // Only update if we haven't timed out
      if (!timeoutRef.current) {
        if (resIda && resIda.points && resIda.points.length > 0) {
          setPathIda(resIda.points);
          setMarkersIda(resIda.markers || []);
        }
        if (resRegreso && resRegreso.points && resRegreso.points.length > 0) {
          setPathRegreso(resRegreso.points);
          setMarkersRegreso(resRegreso.markers || []);
        }
      }

      // Update view logic handled by map components individually

    } catch (err) {
      if (safetyTimeout) {
        clearTimeout(safetyTimeout);
      }
      console.error('Error in handlePreview:', err);
      if (!timeoutRef.current) {
        setError(err.message || 'Error calculando rutas. Verifica tu conexión y que el servidor esté corriendo.');
      }
    } finally {
      // Ensure loading is false only if we haven't already timed out
      if (!timeoutRef.current) {
        setLoading(false);
      }
    }
  };

  // Geocodificar una dirección a coordenadas
  const geocodificarDireccion = async (direccion) => {
    if (!direccion || !direccion.trim()) return null;

    // Si tenemos Google Maps disponible, usarlo
    if (window.google && window.google.maps && window.google.maps.Geocoder) {
      return new Promise((resolve) => {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: direccion }, (results, status) => {
          if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
            const location = results[0].geometry.location;
            resolve({
              lat: location.lat(),
              lng: location.lng(),
              address: results[0].formatted_address
            });
          } else {
            resolve(null);
          }
        });
      });
    }

    // Fallback: usar el backend
    try {
      const response = await adminService.generateRoute(direccion);
      if (response && response.success && response.data) {
        const data = response.data.data || response.data;
        if (data.puntos_geocodificados && data.puntos_geocodificados.length > 0) {
          const punto = data.puntos_geocodificados[0];
          return {
            lat: parseFloat(punto.lat),
            lng: parseFloat(punto.lng),
            address: punto.nombre_original || punto.nombre || direccion
          };
        }
      }
    } catch (err) {
      console.error('Error geocodificando dirección:', err);
    }

    return null;
  };

  // Obtener recomendaciones de ruta
  const obtenerRecomendaciones = async (textoInput, esIda = true) => {
    if (!textoInput || !textoInput.trim()) {
      setError('Por favor ingresa una ruta con origen y destino');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const lugares = textoInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
      if (lugares.length < 2) {
        setError('Se necesitan al menos dos puntos (origen y destino)');
        setLoading(false);
        return;
      }

      const origenTexto = lugares[0];
      const destinoTexto = lugares[lugares.length - 1];

      // Geocodificar origen y destino
      const [origen, destino] = await Promise.all([
        geocodificarDireccion(origenTexto),
        geocodificarDireccion(destinoTexto)
      ]);

      if (!origen || !destino) {
        setError('No se pudieron obtener las coordenadas del origen o destino');
        setLoading(false);
        return;
      }

      // Obtener recomendaciones del servicio
      const resultado = await routeService.recomendarRuta(
        origen.lat,
        origen.lng,
        destino.lat,
        destino.lng,
        5000
      );

      if (resultado.success && resultado.data && resultado.data.recomendaciones) {
        if (esIda) {
          setRecomendaciones(resultado.data.recomendaciones);
        } else {
          setRecomendacionesRegreso(resultado.data.recomendaciones);
        }
        setShowRecomendaciones(true);
      } else {
        setError('No se encontraron rutas recomendadas');
      }
    } catch (err) {
      console.error('Error obteniendo recomendaciones:', err);
      setError('Error al obtener recomendaciones: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // Aplicar una recomendación seleccionada
  const aplicarRecomendacion = (recomendacion, esIda = true) => {
    if (!recomendacion || !recomendacion.segmentos) return;

    const puntos = [];
    const marcadores = [];
    let marcadorIndex = 1;

    recomendacion.segmentos.forEach((segmento, index) => {
      // Obtener geometría del segmento (puede ser geometry o geometria)
      const geometria = segmento.geometry || segmento.geometria || [];
      
      if (Array.isArray(geometria) && geometria.length > 0) {
        // Agregar puntos de la geometría del segmento
        geometria.forEach(punto => {
          if (punto) {
            const lat = parseFloat(punto.lat || punto.latitud);
            const lng = parseFloat(punto.lng || punto.longitud);
            if (!isNaN(lat) && !isNaN(lng)) {
              puntos.push({ lat, lng });
            }
          }
        });
      }

      // Agregar marcadores para paradas (tanto de bus como caminatas iniciales/finales)
      // Para segmentos de bus, agregar paradas de inicio y fin
      if (segmento.tipo === 'bus' || segmento.tipo === 'BUS') {
        if (segmento.fromStop || segmento.paradaOrigen) {
          const stop = segmento.fromStop || segmento.paradaOrigen;
          marcadores.push({
            lat: parseFloat(stop.lat || stop.latitud),
            lng: parseFloat(stop.lng || stop.longitud),
            address: stop.nombre || stop.address || `Parada ${marcadorIndex}`,
            nombre: stop.nombre || `Parada ${marcadorIndex}`,
            tipo: 'bus'
          });
          marcadorIndex++;
        }
        if (segmento.toStop || segmento.paradaDestino) {
          const stop = segmento.toStop || segmento.paradaDestino;
          marcadores.push({
            lat: parseFloat(stop.lat || stop.latitud),
            lng: parseFloat(stop.lng || stop.longitud),
            address: stop.nombre || stop.address || `Parada ${marcadorIndex}`,
            nombre: stop.nombre || `Parada ${marcadorIndex}`,
            tipo: 'bus'
          });
          marcadorIndex++;
        }
      } else if (segmento.tipo === 'WALK' || segmento.tipo === 'walk') {
        // Para caminatas, si tienen paradas definidas, agregarlas también
        if (segmento.fromStop) {
          marcadores.push({
            lat: parseFloat(segmento.fromStop.lat || segmento.fromStop.latitud),
            lng: parseFloat(segmento.fromStop.lng || segmento.fromStop.longitud),
            address: segmento.fromStop.nombre || segmento.fromStop.address || `Inicio caminata`,
            nombre: segmento.fromStop.nombre || `Inicio caminata`,
            tipo: 'walk'
          });
        }
        if (segmento.toStop) {
          marcadores.push({
            lat: parseFloat(segmento.toStop.lat || segmento.toStop.latitud),
            lng: parseFloat(segmento.toStop.lng || segmento.toStop.longitud),
            address: segmento.toStop.nombre || segmento.toStop.address || `Fin caminata`,
            nombre: segmento.toStop.nombre || `Fin caminata`,
            tipo: 'walk'
          });
        }
      }
    });

    // Si no hay puntos pero hay marcadores, crear una ruta simple entre marcadores
    if (puntos.length === 0 && marcadores.length > 0) {
      marcadores.forEach(m => {
        puntos.push({ lat: m.lat, lng: m.lng });
      });
    }

    if (esIda) {
      setPathIda(puntos);
      setMarkersIda(marcadores);
      // Actualizar el texto con el resumen de la recomendación
      if (recomendacion.resumen) {
        setTextoIda(recomendacion.resumen);
      }
    } else {
      setPathRegreso(puntos);
      setMarkersRegreso(marcadores);
      if (recomendacion.resumen) {
        setTextoRegreso(recomendacion.resumen);
      }
    }

    setShowRecomendaciones(false);
  };

  const handleUpdate = () => {
    const finalGeometry = { ida: pathIda, regreso: pathRegreso };
    const jsonString = JSON.stringify(finalGeometry);
    const stopData = { ida: markersIda, regreso: markersRegreso };
    if (onChange) onChange(jsonString);
    if (onSave) onSave(jsonString, stopData);
  };

  const renderMapContent = () => {
    // SI HAY ERROR DE CARGA O MODO FALLBACK, USAMOS LEAFLET
    if (loadError) {
      const mapIda = pathIda.map(p => [p.lat, p.lng]);
      const mapRegreso = pathRegreso.map(p => [p.lat, p.lng]);
      const puntosLeaflet = {
        ida: markersIda.map(m => ({ coordenadas: [m.lat, m.lng], nombre: m.nombre, direccion: m.address })),
        regreso: markersRegreso.map(m => ({ coordenadas: [m.lat, m.lng], nombre: m.nombre, direccion: m.address }))
      };

      return (
        <div className="w-full h-full relative">
          <LeafletFallbackMap
            rutaCompletaIda={mapIda}
            rutaCompletaRegreso={mapRegreso}
            puntos={puntosLeaflet}
            stops={stops}
            previewStop={previewStop}
          />
          <div className="absolute top-0 left-0 right-0 bg-blue-900/90 text-blue-100 text-xs p-1 text-center z-[1000] border-b border-blue-700">
            ℹ️ Modo Compatibilidad: Usando OpenStreetMap (Sin Google Maps API Key)
          </div>
        </div>
      );
    }

    if (!isLoaded) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
          <span className="animate-pulse">Cargando Mapa...</span>
        </div>
      );
    }

    return (
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={{ lat: 13.6929, lng: -89.2182 }}
        zoom={12}
        onLoad={onLoad}
        options={{
          styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
          ]
        }}
      >
        {/* Trazado Ida - AZUL */}
        {pathIda.length > 0 && (
          <Polyline
            path={pathIda}
            options={{
              strokeColor: '#3b82f6', // blue-500
              strokeOpacity: 0.8,
              strokeWeight: 6,
              zIndex: 10
            }}
          />
        )}

        {/* Marcadores Ida */}
        {markersIda.map((m, i) => {
          if (!m || typeof m.lat !== 'number' || typeof m.lng !== 'number') return null;
          return (
            <Marker
              key={`ida-${i}`}
              position={{ lat: m.lat, lng: m.lng }}
              label={{ text: (i + 1).toString(), color: "white", fontSize: "10px", fontWeight: "bold" }}
              title={m.address}
              icon={window.google?.maps?.SymbolPath ? {
                path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z", // Pin Icon
                fillColor: '#2563eb', // blue-600
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 1,
                scale: 1.5,
                anchor: new window.google.maps.Point(12, 22)
              } : undefined}
            />
          );
        })}

        {/* Trazado Regreso - ROJO */}
        {pathRegreso.length > 0 && (
          <Polyline
            path={pathRegreso}
            options={{
              strokeColor: '#ef4444', // red-500
              strokeOpacity: 0.8,
              strokeWeight: 6,
              zIndex: 20
            }}
          />
        )}

        {/* Marcadores Regreso */}
        {markersRegreso.map((m, i) => {
          if (!m || typeof m.lat !== 'number' || typeof m.lng !== 'number') return null;
          return (
            <Marker
              key={`regreso-${i}`}
              position={{ lat: m.lat, lng: m.lng }}
              label={{ text: (i + 1).toString(), color: "white", fontSize: "10px", fontWeight: "bold" }}
              title={m.address}
              icon={window.google?.maps?.SymbolPath ? {
                path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z", // Pin Icon
                fillColor: '#dc2626', // red-600
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 1,
                scale: 1.5,
                anchor: new window.google.maps.Point(12, 22)
              } : undefined}
            />
          );
        })}

        {/* Paradas de la Ruta (DB) */}
        {stops && stops.map((stop, i) => (
          <Marker
            key={`stop-${stop.id || i}`}
            position={{
              lat: typeof stop.latitud === 'string' ? parseFloat(stop.latitud) : stop.latitud,
              lng: typeof stop.longitud === 'string' ? parseFloat(stop.longitud) : stop.longitud
            }}
            title={`Parada: ${stop.nombre}`}
            icon={{
              path: window.google?.maps?.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: "#FBBF24", // amber-400
              fillOpacity: 1,
              strokeColor: "white",
              strokeWeight: 2,
            }}
          />
        ))}

        {/* Preview Parada (Stop Form) */}
        {previewStop && previewStop.latitud && previewStop.longitud && (
          <Marker
            position={{
              lat: typeof previewStop.latitud === 'string' ? parseFloat(previewStop.latitud) : previewStop.latitud,
              lng: typeof previewStop.longitud === 'string' ? parseFloat(previewStop.longitud) : previewStop.longitud
            }}
            title="Vista Previa Parada"
            label={{ text: "NUEVA", color: "white", fontSize: "10px", fontWeight: "bold" }}
            icon={{
              path: window.google?.maps?.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#FBBF24", // amber-400
              fillOpacity: 1,
              strokeColor: "white",
              strokeWeight: 2,
            }}
          />
        )}

        {/* Rutas Recomendadas - Ida (Verde) */}
        {showRecomendaciones && recomendaciones.length > 0 && recomendaciones.map((rec, recIdx) => {
          if (!rec.segmentos) return null;
          return rec.segmentos.map((seg, segIdx) => {
            let puntos = [];
            
            // Obtener geometría del segmento
            const geometry = seg.geometry || seg.geometria || [];
            if (Array.isArray(geometry) && geometry.length > 0) {
              puntos = geometry.map(p => {
                if (!p) return null;
                return {
                  lat: parseFloat(p.lat || p.latitud),
                  lng: parseFloat(p.lng || p.longitud)
                };
              }).filter(p => p && !isNaN(p.lat) && !isNaN(p.lng));
            }
            
            // Si no hay geometría pero hay paradas, crear línea entre ellas
            if (puntos.length === 0) {
              if (seg.fromStop && seg.toStop) {
                const fromStop = seg.fromStop;
                const toStop = seg.toStop;
                puntos = [
                  {
                    lat: parseFloat(fromStop.lat || fromStop.latitud),
                    lng: parseFloat(fromStop.lng || fromStop.longitud)
                  },
                  {
                    lat: parseFloat(toStop.lat || toStop.latitud),
                    lng: parseFloat(toStop.lng || toStop.longitud)
                  }
                ].filter(p => !isNaN(p.lat) && !isNaN(p.lng));
              } else if (seg.paradaOrigen && seg.paradaDestino) {
                const fromStop = seg.paradaOrigen;
                const toStop = seg.paradaDestino;
                puntos = [
                  {
                    lat: parseFloat(fromStop.lat || fromStop.latitud),
                    lng: parseFloat(fromStop.lng || fromStop.longitud)
                  },
                  {
                    lat: parseFloat(toStop.lat || toStop.latitud),
                    lng: parseFloat(toStop.lng || toStop.longitud)
                  }
                ].filter(p => !isNaN(p.lat) && !isNaN(p.lng));
              }
            }

            if (puntos.length === 0) return null;

            // Caminatas en verde claro, buses en el color de la ruta
            const isWalking = seg.tipo === 'WALK' || seg.tipo === 'walk';
            const strokeColor = isWalking
              ? '#10b981' // green-500 para caminatas
              : (seg.ruta?.color || seg.color || '#22c55e'); // Color de la ruta para buses

            return (
              <Polyline
                key={`rec-ida-${recIdx}-${segIdx}`}
                path={puntos}
                options={{
                  strokeColor: strokeColor,
                  strokeOpacity: 0.6,
                  strokeWeight: isWalking ? 3 : 4,
                  zIndex: 15,
                  geodesic: isWalking // Las caminatas pueden ser geodésicas
                }}
              />
            );
          });
        })}

        {/* Rutas Recomendadas - Regreso (Morado) */}
        {showRecomendaciones && recomendacionesRegreso.length > 0 && recomendacionesRegreso.map((rec, recIdx) => {
          if (!rec.segmentos) return null;
          return rec.segmentos.map((seg, segIdx) => {
            let puntos = [];
            
            // Obtener geometría del segmento
            const geometry = seg.geometry || seg.geometria || [];
            if (Array.isArray(geometry) && geometry.length > 0) {
              puntos = geometry.map(p => {
                if (!p) return null;
                return {
                  lat: parseFloat(p.lat || p.latitud),
                  lng: parseFloat(p.lng || p.longitud)
                };
              }).filter(p => p && !isNaN(p.lat) && !isNaN(p.lng));
            }
            
            // Si no hay geometría pero hay paradas, crear línea entre ellas
            if (puntos.length === 0) {
              if (seg.fromStop && seg.toStop) {
                const fromStop = seg.fromStop;
                const toStop = seg.toStop;
                puntos = [
                  {
                    lat: parseFloat(fromStop.lat || fromStop.latitud),
                    lng: parseFloat(fromStop.lng || fromStop.longitud)
                  },
                  {
                    lat: parseFloat(toStop.lat || toStop.latitud),
                    lng: parseFloat(toStop.lng || toStop.longitud)
                  }
                ].filter(p => !isNaN(p.lat) && !isNaN(p.lng));
              } else if (seg.paradaOrigen && seg.paradaDestino) {
                const fromStop = seg.paradaOrigen;
                const toStop = seg.paradaDestino;
                puntos = [
                  {
                    lat: parseFloat(fromStop.lat || fromStop.latitud),
                    lng: parseFloat(fromStop.lng || fromStop.longitud)
                  },
                  {
                    lat: parseFloat(toStop.lat || toStop.latitud),
                    lng: parseFloat(toStop.lng || toStop.longitud)
                  }
                ].filter(p => !isNaN(p.lat) && !isNaN(p.lng));
              }
            }

            if (puntos.length === 0) return null;

            // Caminatas en morado claro, buses en el color de la ruta
            const isWalking = seg.tipo === 'WALK' || seg.tipo === 'walk';
            const strokeColor = isWalking
              ? '#a855f7' // purple-500 para caminatas
              : (seg.ruta?.color || seg.color || '#9333ea'); // Color de la ruta para buses

            return (
              <Polyline
                key={`rec-regreso-${recIdx}-${segIdx}`}
                path={puntos}
                options={{
                  strokeColor: strokeColor,
                  strokeOpacity: 0.6,
                  strokeWeight: isWalking ? 3 : 4,
                  zIndex: 25,
                  geodesic: isWalking // Las caminatas pueden ser geodésicas
                }}
              />
            );
          });
        })}

      </GoogleMap>
    );
  };

  return (
    <div className="flex flex-col h-full gap-4">

      {/* Panel de Entradas - SIEMPRE VISIBLE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-blue-500">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-blue-400">Ruta de Ida (Azul)</h4>
            <button
              type="button"
              onClick={() => obtenerRecomendaciones(textoIda, true)}
              disabled={loading || !textoIda.trim()}
              className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded transition disabled:opacity-50"
              title="Obtener recomendaciones de rutas y paradas"
            >
              🎯 Recomendar
            </button>
          </div>
          <textarea
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white h-24"
            placeholder="Origen, Destino (ej: Centro de San Salvador, Aeropuerto)"
            value={textoIda}
            onChange={e => setTextoIda(e.target.value)}
          />
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-red-500">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-red-400">Ruta de Regreso (Rojo)</h4>
            <button
              type="button"
              onClick={() => obtenerRecomendaciones(textoRegreso, false)}
              disabled={loading || !textoRegreso.trim()}
              className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded transition disabled:opacity-50"
              title="Obtener recomendaciones de rutas y paradas"
            >
              🎯 Recomendar
            </button>
          </div>
          <textarea
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white h-24"
            placeholder="Origen, Destino (ej: Aeropuerto, Centro de San Salvador)"
            value={textoRegreso}
            onChange={e => setTextoRegreso(e.target.value)}
          />
        </div>
      </div>

      {/* Panel de Recomendaciones */}
      {showRecomendaciones && (recomendaciones.length > 0 || recomendacionesRegreso.length > 0) && (
        <div className="bg-slate-800 p-4 rounded-lg border border-purple-500">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-purple-400">🎯 Rutas Recomendadas</h4>
            <button
              type="button"
              onClick={() => {
                setShowRecomendaciones(false);
                setRecomendaciones([]);
                setRecomendacionesRegreso([]);
              }}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕ Cerrar
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recomendaciones Ida */}
            {recomendaciones.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-blue-400 mb-2">Ruta de Ida:</h5>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {recomendaciones.map((rec, idx) => (
                    <div
                      key={`rec-ida-${idx}`}
                      className="bg-slate-900 p-3 rounded border border-blue-700 hover:border-blue-500 cursor-pointer transition"
                      onClick={() => aplicarRecomendacion(rec, true)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium text-white">{rec.resumen || `Opción ${idx + 1}`}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            aplicarRecomendacion(rec, true);
                          }}
                          className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded"
                        >
                          Aplicar
                        </button>
                      </div>
                      <div className="text-xs text-slate-400 space-y-1">
                        {rec.total_caminata_metros && (
                          <div>🚶 Caminata: {Math.round(rec.total_caminata_metros)}m</div>
                        )}
                        {rec.transbordos !== undefined && (
                          <div>🔄 Transbordos: {rec.transbordos}</div>
                        )}
                        {rec.tarifaTotal && (
                          <div>💰 Tarifa: ${rec.tarifaTotal}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recomendaciones Regreso */}
            {recomendacionesRegreso.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-red-400 mb-2">Ruta de Regreso:</h5>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {recomendacionesRegreso.map((rec, idx) => (
                    <div
                      key={`rec-regreso-${idx}`}
                      className="bg-slate-900 p-3 rounded border border-red-700 hover:border-red-500 cursor-pointer transition"
                      onClick={() => aplicarRecomendacion(rec, false)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium text-white">{rec.resumen || `Opción ${idx + 1}`}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            aplicarRecomendacion(rec, false);
                          }}
                          className="text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded"
                        >
                          Aplicar
                        </button>
                      </div>
                      <div className="text-xs text-slate-400 space-y-1">
                        {rec.total_caminata_metros && (
                          <div>🚶 Caminata: {Math.round(rec.total_caminata_metros)}m</div>
                        )}
                        {rec.transbordos !== undefined && (
                          <div>🔄 Transbordos: {rec.transbordos}</div>
                        )}
                        {rec.tarifaTotal && (
                          <div>💰 Tarifa: ${rec.tarifaTotal}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Botones de Acción */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={handlePreview}
          disabled={loading || (!isLoaded && !loadError)}
          className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded transition disabled:opacity-50"
        >
          {loading ? 'Calculando Trazos...' : '📍 Convertir a Coordenadas y Trazar Ruta'}
        </button>

        <button
          type="button"
          onClick={handleUpdate}
          className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded transition shadow-lg shadow-green-900/50"
        >
          💾 Actualizar
        </button>
      </div>

      {error && <div className="text-red-400 bg-red-900/20 p-2 rounded text-sm text-center">{error}</div>}

      {/* Mapa */}
      <div className="flex-1 min-h-[400px] bg-slate-900 rounded-lg overflow-hidden border border-slate-700 relative">
        {renderMapContent()}

        {/* Leyenda */}
        <div className="absolute top-2 right-2 bg-slate-900/90 p-2 rounded border border-slate-700 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-1 bg-blue-500"></div> <span>Ida</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-1 bg-red-500"></div> <span>Regreso</span>
          </div>
          {showRecomendaciones && (
            <>
              <div className="flex items-center gap-2 mb-1 mt-2 pt-2 border-t border-slate-700">
                <div className="w-4 h-1 bg-green-500"></div> <span>Caminata Ida</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-purple-500"></div> <span>Caminata Regreso</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lista de Paradas Detectadas */}
      {(markersIda.length > 0 || markersRegreso.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {markersIda.length > 0 && (
            <div className="bg-slate-800 p-3 rounded border-l-4 border-blue-500 text-sm">
              <h5 className="font-bold text-blue-400 mb-2">Paradas Ida ({markersIda.length})</h5>
              <ul className="space-y-1 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {markersIda.map((m, i) => (
                  <li key={`list-ida-${i}`} className="flex gap-2 text-slate-300 border-b border-slate-700 pb-1 last:border-0">
                    <span className="font-mono text-blue-400 font-bold">{i + 1}.</span>
                    <span className="truncate" title={m.address}>{m.nombre || m.address}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {markersRegreso.length > 0 && (
            <div className="bg-slate-800 p-3 rounded border-l-4 border-red-500 text-sm">
              <h5 className="font-bold text-red-400 mb-2">Paradas Regreso ({markersRegreso.length})</h5>
              <ul className="space-y-1 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {markersRegreso.map((m, i) => (
                  <li key={`list-regreso-${i}`} className="flex gap-2 text-slate-300 border-b border-slate-700 pb-1 last:border-0">
                    <span className="font-mono text-red-400 font-bold">{i + 1}.</span>
                    <span className="truncate" title={m.address}>{m.nombre || m.address}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

