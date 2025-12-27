import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, Polyline, Marker } from '@react-google-maps/api';
import { useGoogleMaps } from '../../../contexts/GoogleMapsContext';
import LeafletFallbackMap from './LeafletFallbackMap';
import adminService from '../../../services/adminService.js';

const containerStyle = {
  width: '100%',
  height: '100%'
};

export default function RouteGeometryEditor({ value, onChange, onSave, stops = [], previewStop = null, rutaId = null }) {
  const { isLoaded, loadError } = useGoogleMaps();
  const mapRef = useRef(null);
  const loadedFromDbRef = useRef(false); // Flag para saber si ya cargamos desde DB

  // Estados
  const [textoIda, setTextoIda] = useState('');
  const [textoRegreso, setTextoRegreso] = useState('');
  const [pathIda, setPathIda] = useState([]);
  const [pathRegreso, setPathRegreso] = useState([]);
  const [markersIda, setMarkersIda] = useState([]);
  const [markersRegreso, setMarkersRegreso] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar puntos guardados de la ruta cuando se edita (prioridad ALTA)
  useEffect(() => {
    console.log('🔍 RouteGeometryEditor useEffect ejecutado - rutaId:', rutaId, 'value:', value);
    
    if (rutaId) {
      console.log('✅ rutaId existe, cargando puntos desde DB...');
      const loadRoutePoints = async () => {
        try {
          console.log('📡 Llamando a getRoutePuntos con rutaId:', rutaId);
          const response = await adminService.getRoutePuntos(rutaId);
          console.log('📥 Respuesta recibida:', response);
          
          if (response.success && response.data) {
            const puntosIda = response.data.ida || [];
            const puntosRegreso = response.data.regreso || [];
            
            console.log('✅ Puntos cargados desde DB - Ida:', puntosIda.length, 'Regreso:', puntosRegreso.length);
            console.log('📍 Primer punto Ida:', puntosIda[0]);
            console.log('📍 Primer punto Regreso:', puntosRegreso[0]);
            
            // Solo cargar puntos desde DB si hay puntos guardados O si no hay puntos en el estado local
            // Esto evita sobrescribir puntos trazados localmente si la DB está vacía
            if (puntosIda.length > 0 || puntosRegreso.length > 0 || (pathIda.length === 0 && pathRegreso.length === 0)) {
              setPathIda(puntosIda);
              setPathRegreso(puntosRegreso);
              loadedFromDbRef.current = true; // Marcar que ya cargamos desde DB
              console.log('✅ Estados pathIda y pathRegreso actualizados desde DB');
            } else {
              console.log('⚠️ DB vacía pero hay puntos locales, manteniendo puntos locales');
            }
          } else {
            console.warn('⚠️ Respuesta sin éxito o sin data:', response);
          }
        } catch (err) {
          console.error("❌ Error cargando puntos de ruta:", err);
          // Si hay error, asegurar arrays vacíos
          setPathIda([]);
          setPathRegreso([]);
        }
      };
      loadRoutePoints();
    } else if (value && !loadedFromDbRef.current) {
      console.log('⚠️ No hay rutaId, usando value prop');
      // Solo usar value si no hay rutaId y no hemos cargado desde DB
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        if (parsed?.ida) setPathIda(parsed.ida);
        if (parsed?.regreso) setPathRegreso(parsed.regreso);
        if (Array.isArray(parsed)) setPathIda(parsed);
      } catch (e) {
        console.error("Error parseando geometry inicial", e);
      }
    } else {
      console.log('ℹ️ No hay rutaId ni value, no se cargan puntos');
    }
  }, [rutaId, value]);

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


  const handleUpdate = async () => {
    console.log('💾 handleUpdate ejecutado');
    console.log('📍 pathIda actual:', pathIda.length, 'puntos');
    console.log('📍 pathRegreso actual:', pathRegreso.length, 'puntos');
    
    const finalGeometry = { ida: pathIda, regreso: pathRegreso };
    const jsonString = JSON.stringify(finalGeometry);
    const stopData = { ida: markersIda, regreso: markersRegreso };
    
    if (onChange) onChange(jsonString);
    if (onSave) {
      console.log('📤 Llamando a onSave...');
      await onSave(jsonString, stopData);
      console.log('✅ onSave completado');
      
      // Recargar puntos DESPUÉS de guardar para asegurar que SIEMPRE se muestren
      if (rutaId) {
        try {
          console.log('⏳ Esperando 1 segundo antes de recargar puntos...');
          // Pequeño delay para asegurar que el backend haya guardado
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('🔄 Recargando puntos después de guardar, rutaId:', rutaId);
          const response = await adminService.getRoutePuntos(rutaId);
          console.log('📥 Respuesta al recargar:', response);
          
          if (response.success && response.data) {
            const puntosIda = response.data.ida || [];
            const puntosRegreso = response.data.regreso || [];
            console.log('✅ Puntos recargados después de guardar - Ida:', puntosIda.length, 'Regreso:', puntosRegreso.length);
            console.log('📍 Primer punto Ida recargado:', puntosIda[0]);
            console.log('📍 Primer punto Regreso recargado:', puntosRegreso[0]);
            
            // SIEMPRE actualizar las rutas, incluso si están vacías
            setPathIda(puntosIda);
            setPathRegreso(puntosRegreso);
            loadedFromDbRef.current = true;
            console.log('✅ Estados actualizados después de recargar');
          } else {
            console.warn('⚠️ Respuesta sin éxito al recargar:', response);
          }
        } catch (err) {
          console.error("❌ Error recargando puntos después de guardar:", err);
        }
      } else {
        console.warn('⚠️ No hay rutaId, no se recargan puntos');
      }
    } else {
      console.warn('⚠️ No hay onSave handler');
    }
  };

  const renderMapContent = () => {
    // SI HAY ERROR DE CARGA O MODO FALLBACK, USAMOS LEAFLET
    if (loadError) {
      // Convertir coordenadas a formato Leaflet [lat, lng]
      const mapIda = pathIda.filter(p => p && typeof p.lat === 'number' && typeof p.lng === 'number')
        .map(p => [p.lat, p.lng]);
      const mapRegreso = pathRegreso.filter(p => p && typeof p.lat === 'number' && typeof p.lng === 'number')
        .map(p => [p.lat, p.lng]);
      
      const puntosLeaflet = {
        ida: markersIda.filter(m => m && typeof m.lat === 'number' && typeof m.lng === 'number')
          .map(m => ({ 
            coordenadas: [m.lat, m.lng], 
            nombre: m.nombre || m.address || 'Punto', 
            direccion: m.address || m.nombre || '' 
          })),
        regreso: markersRegreso.filter(m => m && typeof m.lat === 'number' && typeof m.lng === 'number')
          .map(m => ({ 
            coordenadas: [m.lat, m.lng], 
            nombre: m.nombre || m.address || 'Punto', 
            direccion: m.address || m.nombre || '' 
          }))
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
            key="polyline-ida"
            path={pathIda.filter(p => p && typeof p.lat === 'number' && typeof p.lng === 'number')}
            options={{
              strokeColor: '#3b82f6', // blue-500
              strokeOpacity: 0.8,
              strokeWeight: 6,
              zIndex: 10
            }}
          />
        )}

        {/* Marcadores Ida */}
        {markersIda.filter(m => m && typeof m.lat === 'number' && typeof m.lng === 'number').map((m, i) => (
          <Marker
            key={`ida-${i}`}
            position={{ lat: m.lat, lng: m.lng }}
            label={{ text: (i + 1).toString(), color: "white", fontSize: "10px", fontWeight: "bold" }}
            title={m.address || m.nombre || `Punto ${i + 1}`}
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
        ))}

        {/* Trazado Regreso - ROJO */}
        {pathRegreso.length > 0 && (
          <Polyline
            key="polyline-regreso"
            path={pathRegreso.filter(p => p && typeof p.lat === 'number' && typeof p.lng === 'number')}
            options={{
              strokeColor: '#ef4444', // red-500
              strokeOpacity: 0.8,
              strokeWeight: 6,
              zIndex: 20
            }}
          />
        )}

        {/* Marcadores Regreso */}
        {markersRegreso.filter(m => m && typeof m.lat === 'number' && typeof m.lng === 'number').map((m, i) => (
          <Marker
            key={`regreso-${i}`}
            position={{ lat: m.lat, lng: m.lng }}
            label={{ text: (i + 1).toString(), color: "white", fontSize: "10px", fontWeight: "bold" }}
            title={m.address || m.nombre || `Punto ${i + 1}`}
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
        ))}

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


      </GoogleMap>
    );
  };

  return (
    <div className="flex flex-col h-full gap-4">

      {/* Panel de Entradas - SIEMPRE VISIBLE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-blue-500">
          <h4 className="font-bold text-blue-400 mb-2">Ruta de Ida</h4>
          <textarea
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white h-24"
            placeholder="Origen, Punto 1, Punto 2, Destino..."
            value={textoIda}
            onChange={e => setTextoIda(e.target.value)}
          />
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-red-500">
          <h4 className="font-bold text-red-400 mb-2">Ruta de Regreso</h4>
          <textarea
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white h-24"
            placeholder="Origen, Punto 1, Punto 2, Destino..."
            value={textoRegreso}
            onChange={e => setTextoRegreso(e.target.value)}
          />
        </div>
      </div>

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
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-red-500"></div> <span>Regreso</span>
          </div>
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

