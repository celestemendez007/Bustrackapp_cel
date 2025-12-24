import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { useGoogleMaps } from '../../../contexts/GoogleMapsContext';
import routeService from "../../../services/routeService";
import historialService from "../../../services/historialService";
import geocodingService from "../../../services/geocodingService";
import LeafletTripMap from './LeafletTripMap';
import LocationSearchInput from './LocationSearchInput';

const containerStyle = {
  width: '100%',
  height: '100%'
};

// Iconos
const ICON_ORIGEN = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
const ICON_DESTINO = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';

const crearIconoParada = (tipo, color = '#0EA5E9') => {
  // Simplificado para Google Maps: usar SVG path o URL
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: 'white',
    strokeWeight: 2,
    scale: 7
  };
};

// Helper para decodificar polylines de Google/OSRM
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

function AutocompleteInput({ value, onChange, suggestions, onSelect, placeholder, label, onGetLocation }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    onChange(e.target.value);
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (item) => {
    onSelect(item);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label className="block text-sm font-medium text-slate-200 mb-2">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="flex-1 h-11 px-4 rounded-xl border-2 border-white/20 bg-[#141a35] text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none transition"
          autoComplete="off"
        />
        {onGetLocation && (
          <button
            onClick={onGetLocation}
            className="px-4 h-11 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium transition whitespace-nowrap"
          >
            Mi Ubicación
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          className="absolute z-[9999] w-full mt-2 bg-[#0f1629] border-2 border-sky-500/50 rounded-xl shadow-2xl max-h-96 overflow-y-auto"
        >
          {value === '' && (
            <div className="px-4 py-2 bg-sky-600/20 border-b border-sky-500/30 sticky top-0 z-10">
              <div className="text-xs font-semibold text-sky-300">Paradas Populares</div>
            </div>
          )}
          {suggestions.map((item, index) => (
            <button
              key={item.id || index}
              onClick={() => handleSelectSuggestion(item)}
              onMouseDown={(e) => e.preventDefault()}
              className="w-full text-left px-4 py-3 hover:bg-sky-600/40 transition border-b border-white/5 last:border-b-0 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-white group-hover:text-sky-300 transition">
                    {item.nombre}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {item.direccion || item.zona}
                  </div>
                </div>
                {item.tipo && (
                  <div className="ml-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded ${item.tipo === 'Terminal' ? 'bg-green-500/20 text-green-300' :
                      item.tipo === 'TransferHub' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-slate-500/20 text-slate-300'
                      } `}>
                      {item.tipo}
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MapPage() {
  const navigate = useNavigate();
  const { isLoaded, loadError, apiKey } = useGoogleMaps();

  const [map, setMap] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);

  const [paradas, setParadas] = useState([]);
  const [loading, setLoading] = useState(false);

  const [origenInput, setOrigenInput] = useState('');
  const [destinoInput, setDestinoInput] = useState('');
  const [origenSeleccionado, setOrigenSeleccionado] = useState(null);
  const [destinoSeleccionado, setDestinoSeleccionado] = useState(null);

  const [sugerenciasOrigen, setSugerenciasOrigen] = useState([]);
  const [sugerenciasDestino, setSugerenciasDestino] = useState([]);

  // Handlers para cambios de input que invalidan la selección previa
  const handleOrigenChange = (val) => {
    setOrigenInput(val);
    // Si el usuario edita el texto, invalidamos la selección anterior para obligar a re-geocodificar
    if (origenSeleccionado && val !== origenSeleccionado.nombre) {
      setOrigenSeleccionado(null);
    }
  };

  const handleDestinoChange = (val) => {
    setDestinoInput(val);
    if (destinoSeleccionado && val !== destinoSeleccionado.nombre) {
      setDestinoSeleccionado(null);
    }
  };

  const [resultados, setResultados] = useState(null);
  const [rutaSeleccionada, setRutaSeleccionada] = useState(0);

  // Calcular rutas únicas (sin duplicados) - ahora agrupa por combinación de buses
  const recomendacionesUnicas = useMemo(() => {
    try {
      // DEBUG: Log para ver qué hay en resultados
      console.log('🔍 Procesando recomendaciones únicas. Resultados:', resultados);

      if (!resultados || !resultados.recomendaciones || !Array.isArray(resultados.recomendaciones)) {
        console.warn('⚠️ No hay recomendaciones válidas:', {
          tieneResultados: !!resultados,
          tieneRecomendaciones: !!resultados?.recomendaciones,
          esArray: Array.isArray(resultados?.recomendaciones)
        });
        return [];
      }

      console.log(`📋 Procesando ${resultados.recomendaciones.length} recomendaciones...`);

      // Ordenar primero por distancia de caminata (menos caminata primero)
      const recomendacionesOrdenadas = [...resultados.recomendaciones].sort((a, b) => {
        const caminataA = (a.distanciaCaminataOrigenMetros || 0) + (a.distanciaCaminataDestinoMetros || 0);
        const caminataB = (b.distanciaCaminataOrigenMetros || 0) + (b.distanciaCaminataDestinoMetros || 0);

        // Priorizar menos caminata
        if (Math.abs(caminataA - caminataB) > 50) {
          return caminataA - caminataB;
        }

        // Luego menos transbordos
        if (a.transbordos !== b.transbordos) {
          return a.transbordos - b.transbordos;
        }

        // Finalmente menos tiempo
        return (a.tiempoEstimadoMinutos || 0) - (b.tiempoEstimadoMinutos || 0);
      });

      // Crear clave única basada en la combinación de buses (ej: "26-46" para transbordo)
      const rutasUnicas = recomendacionesOrdenadas.reduce((acc, rec, idx) => {
        try {
          const segmentos = rec?.segmentos;
          if (!segmentos || !Array.isArray(segmentos) || segmentos.length === 0) {
            return acc;
          }

          // Crear clave única: combinación de números de ruta (ej: "26" o "26-46" o "26-46-43")
          const numerosRuta = segmentos
            .filter(seg => seg.tipo === 'bus' && seg.ruta?.numero_ruta)
            .map(seg => seg.ruta.numero_ruta)
            .join('-');

          if (!numerosRuta) {
            return acc;
          }

          const key = numerosRuta;
          const caminataActual = (rec.distanciaCaminataOrigenMetros || 0) + (rec.distanciaCaminataDestinoMetros || 0);
          const caminataExistente = acc[key]
            ? ((acc[key].distanciaCaminataOrigenMetros || 0) + (acc[key].distanciaCaminataDestinoMetros || 0))
            : Infinity;

          // Priorizar la opción con menos caminata para la misma combinación de buses
          if (!acc[key] || caminataActual < caminataExistente) {
            acc[key] = { ...rec, originalIndex: idx, numerosRuta };
          }
          return acc;
        } catch (error) {
          console.warn('Error procesando recomendación:', error);
          return acc;
        }
      }, {});

      // Ordenar resultado final por caminata
      return Object.values(rutasUnicas).sort((a, b) => {
        const caminataA = (a.distanciaCaminataOrigenMetros || 0) + (a.distanciaCaminataDestinoMetros || 0);
        const caminataB = (b.distanciaCaminataOrigenMetros || 0) + (b.distanciaCaminataDestinoMetros || 0);
        if (Math.abs(caminataA - caminataB) > 50) {
          return caminataA - caminataB;
        }
        return (a.tiempoEstimadoMinutos || 0) - (b.tiempoEstimadoMinutos || 0);
      });
    } catch (error) {
      console.error('Error calculando rutas únicas:', error);
      return [];
    }
  }, [resultados]);
  const [routeSegments, setRouteSegments] = useState([]);
  const [walkingSegments, setWalkingSegments] = useState([]);
  const [transitionPoints, setTransitionPoints] = useState([]);

  // InfoWindow State
  const [selectedMarker, setSelectedMarker] = useState(null);

  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    cargarParadas();

    // Cargar rutas para mostrar trazados (Task 3)
    fetch('/api/rutas')
      .then(async res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Respuesta no es JSON');
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setRoutes(data);
        } else {
          console.warn('Respuesta de /api/rutas no es un array:', data);
          setRoutes([]);
        }
      })
      .catch(err => {
        console.error("Error cargando rutas:", err);
        setRoutes([]); // Asegurar que routes sea un array vacío en caso de error
      });
  }, []);

  useEffect(() => {
    const historialData = sessionStorage.getItem('historialSearch');
    if (historialData && paradas.length > 0) {
      try {
        const data = JSON.parse(historialData);
        cargarDesdeHistorial(data);
        sessionStorage.removeItem('historialSearch');
      } catch (error) {
        console.error('Error al cargar datos del historial:', error);
      }
    }
  }, [paradas]);

  const onLoad = useCallback((map) => {
    setMap(map);
    setDirectionsService(new window.google.maps.DirectionsService());
  }, []);

  const onUnmount = useCallback((map) => {
    setMap(null);
    setDirectionsService(null);
  }, []);

  const cargarParadas = async () => {
    setLoading(true);
    try {
      const result = await routeService.getParadas();
      if (result.success && result.data) {
        setParadas(result.data);
      } else {
        alert('Error al cargar paradas: ' + result.message);
      }
    } catch (error) {
      alert('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const cargarDesdeHistorial = async (historialData) => {
    // (Misma lógica de historial)
    // Simplificado para brevedad, asumiendo estructura similar
    let nuevoOrigen = null;
    let nuevoDestino = null;

    if (historialData.latOrigen && historialData.lngOrigen) {
      nuevoOrigen = { lat: parseFloat(historialData.latOrigen), lng: parseFloat(historialData.lngOrigen), nombre: historialData.origen || 'Ubicación guardada' };
      setOrigenInput(historialData.origen || 'Ubicación guardada');
      setOrigenSeleccionado(nuevoOrigen);
    }

    if (historialData.latDestino && historialData.lngDestino) {
      nuevoDestino = { lat: parseFloat(historialData.latDestino), lng: parseFloat(historialData.lngDestino), nombre: historialData.destino || 'Destino guardado' };
      setDestinoInput(historialData.destino || 'Destino guardado');
      setDestinoSeleccionado(nuevoDestino);
    }

    if (nuevoOrigen && nuevoDestino) {
      setTimeout(() => buscarRutasConCoordenadas(nuevoOrigen, nuevoDestino), 500);
    }
  };

  const buscarRutasConCoordenadas = async (origen, destino) => {
    if (!origen || !destino) return;
    setLoading(true);
    try {
      const result = await routeService.recomendarRuta(origen.lat, origen.lng, destino.lat, destino.lng, 5000);
      if (result.success) {
        setResultados(result.data);
        if (result.data.recomendaciones && result.data.recomendaciones.length === 0) {
          alert(result.data.mensaje);
        }
      } else {
        alert(result.error?.mensaje || result.message);
        setResultados(result.error || null);
      }
    } catch (error) {
      alert('Error al buscar rutas');
    } finally {
      setLoading(false);
    }
  };

  const obtenerUbicacionActual = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }
    setLoading(true);

    // Opciones para máxima precisión (inicial)
    const options = {
      enableHighAccuracy: true, // Intentar GPS primero
      timeout: 15000, // Aumentado a 15s para dar tiempo al GPS de calentar
      maximumAge: 0 // No aceptar caché viejo si queremos <20m
    };

    // Opciones de respaldo (WiFi/Celular)
    const fallbackOptions = {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 60000 // Aceptar caché de 1 min
    };

    let bestPosition = null;
    let bestAccuracy = Infinity;
    let readings = [];
    const maxReadings = 10;
    const targetAccuracy = 20; // Relajado a 20m
    let startTime = Date.now();
    const maxTime = 40000; // Máximo 40 segundos total

    // Función auxiliar para procesar posición
    const handlePosition = (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy || Infinity;
      const altitude = position.coords.altitude;
      const altitudeAccuracy = position.coords.altitudeAccuracy;

      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

      readings.push({ lat, lng, accuracy, timestamp: Date.now() });

      if (accuracy < bestAccuracy) {
        bestAccuracy = accuracy;
        bestPosition = { lat, lng, accuracy, altitude, altitudeAccuracy };

        const ubicacionGPS = {
          lat,
          lng,
          nombre: `Mi ubicación (±${Math.round(accuracy)}m)`
        };

        // Actualizar UI inmediatamente si es decente (< 50m)
        if (accuracy <= 50) {
          setOrigenInput(ubicacionGPS.nombre);
          setOrigenSeleccionado(ubicacionGPS);
          if (map && window.google && window.google.maps) {
            map.panTo({ lat, lng });
            map.setZoom(18);
          }
        }
      }
    };

    // 1. Intentar High Accuracy primero (Estrategia agresiva para < 20m)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Primera lectura: Si es buena, la tomamos. Si no, esperamos mejor.
        handlePosition(position);

        if (position.coords.accuracy <= 20) {
          setLoading(false); // Éxito rápido con buena precisión
        } else {
          // Si la primera lectura es mala (>20m), intentar watchPosition por más tiempo
          console.log("Primera lectura GPS imprecisa (" + position.coords.accuracy + "m). Refinando para < 20m...");

          const watchId = navigator.geolocation.watchPosition(
            (pos) => {
              handlePosition(pos);
              if (pos.coords.accuracy <= 20) {
                console.log("Precisión deseada alcanzada:", pos.coords.accuracy);
                navigator.geolocation.clearWatch(watchId);
                setLoading(false); // Logramos precisión deseada
              }
            },
            (err) => console.warn("Error refinando GPS:", err),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
          );

          // Timeout de seguridad extendido (20s) para intentar bajar de 20m
          setTimeout(() => {
            navigator.geolocation.clearWatch(watchId);
            if (loading) { // Si aún no hemos terminado (no alcanzamos la meta)
                setLoading(false);
                if (bestAccuracy > 20) {
                    // Advertir si no logramos el objetivo
                    console.warn(`No se logró precisión < 20m. Mejor: ${bestAccuracy}m`);
                }
            }
          }, 20000);
        }
      },
      (error) => {
        console.warn("High accuracy failed, trying fallback...", error);
        // 2. Fallback a Low Accuracy (Solo si falla el High Accuracy totalmente)
        navigator.geolocation.getCurrentPosition(
          (position) => {
            handlePosition(position);
            setLoading(false);
            if (position.coords.accuracy > 100) {
              alert(`Ubicación obtenida con baja precisión (±${Math.round(position.coords.accuracy)}m). Los resultados pueden no ser exactos.`);
            }
          },
          (error2) => {
            console.error("Fallback failed", error2);
            alert("No se pudo obtener tu ubicación. Verifica permisos y GPS.");
            setLoading(false);
          },
          fallbackOptions
        );
      },
      options
    );
  };

  // Función robusta para buscar rutas (Senior Refactor)
  // Función robusta para buscar rutas (Senior Refactor)
  const buscarRutas = async () => {
    // 0. Prevención de Inputs Vacíos
    if (!origenInput.trim() || !destinoInput.trim()) {
      alert("Por favor ingrese origen y destino.");
      return;
    }

    setLoading(true);
    setResultados(null);

    try {
      // 1. Normalización y Resolución de Coordenadas
      const resolverCoordenadas = async (texto, actual) => {
        // Caso A: Ya tenemos coordenadas numéricas válidas en el objeto seleccionado
        if (actual && typeof actual.lat === 'number' && typeof actual.lng === 'number' && !isNaN(actual.lat)) {
          return {
            lat: actual.lat,
            lng: actual.lng,
            nombre: actual.nombre || texto
          };
        }

        // Caso B: Fallback a propiedades latitud/longitud (legacy)
        if (actual && typeof actual.latitud === 'number' && typeof actual.longitud === 'number') {
          return {
            lat: actual.latitud,
            lng: actual.longitud,
            nombre: actual.nombre || texto
          };
        }

        // Caso C: No hay coordenadas, intentar Geocoding por texto
        if (texto && texto.length > 2) {
          console.log(`🌍 Intentando resolver coordenadas para: "${texto}"...`);
          try {
            // C.1: Buscar en paradas locales (Prioridad)
            const paradaMatch = paradas.find(p => p.nombre.toLowerCase() === texto.toLowerCase());
            if (paradaMatch) {
              return {
                lat: parseFloat(paradaMatch.latitud),
                lng: parseFloat(paradaMatch.longitud),
                nombre: paradaMatch.nombre
              };
            }

            // C.2: Buscar en servicio externo (Geocoding)
            const resultados = await geocodingService.searchAddress(texto);
            if (resultados && resultados.length > 0) {
              return {
                lat: parseFloat(resultados[0].latitud),
                lng: parseFloat(resultados[0].longitud),
                nombre: resultados[0].nombre
              };
            }
          } catch (err) {
            console.warn("⚠️ Falló geocoding on-the-fly:", err);
          }
        }
        return null;
      };

      // Resolver en paralelo
      const [origenResuelto, destinoResuelto] = await Promise.all([
        resolverCoordenadas(origenInput, origenSeleccionado),
        resolverCoordenadas(destinoInput, destinoSeleccionado)
      ]);

      // 2. Validación Estricta (Guard Clauses)
      const isValid = (obj) => obj && typeof obj.lat === 'number' && !isNaN(obj.lat) && typeof obj.lng === 'number' && !isNaN(obj.lng);

      if (!isValid(origenResuelto)) {
        console.error("❌ Origen inválido:", JSON.stringify({ input: origenInput, seleccionado: origenSeleccionado, resuelto: origenResuelto }, null, 2));
        alert(`No se pudo determinar la ubicación de origen: "${origenInput}". Use 'Mi Ubicación' o seleccione de la lista.`);
        setLoading(false);
        return;
      }

      if (!isValid(destinoResuelto)) {
        console.error("❌ Destino inválido:", JSON.stringify({ input: destinoInput, seleccionado: destinoSeleccionado, resuelto: destinoResuelto }, null, 2));
        alert(`No se pudo determinar la ubicación de destino: "${destinoInput}". Seleccione una dirección válida.`);
        setLoading(false);
        return;
      }

      // Actualizar estados para consistencia
      if (!origenSeleccionado) setOrigenSeleccionado(origenResuelto);
      if (!destinoSeleccionado) setDestinoSeleccionado(destinoResuelto);

      console.log("✅ Coordenadas validadas. Iniciando búsqueda...", { origen: origenResuelto, destino: destinoResuelto });

      // 3. Llamada a la API
      const result = await routeService.recomendarRuta(
        origenResuelto.lat,
        origenResuelto.lng,
        destinoResuelto.lat,
        destinoResuelto.lng,
        5000
      );

      if (result.success) {
        console.log('✅ Resultados recibidos:', result.data);
        setResultados(result.data);
        setRutaSeleccionada(0);

        if (result.data.recomendaciones?.length > 0) {
          historialService.guardarBusqueda({
            ruta: 'Busqueda',
            parada: origenResuelto.nombre || "Origen",
            parada_destino: destinoResuelto.nombre || "Destino",
            latitud_origen: origenResuelto.lat,
            longitud_origen: origenResuelto.lng,
            latitud_destino: destinoResuelto.lat,
            longitud_destino: destinoResuelto.lng
          }).catch(e => console.warn('Error historial:', e));
        } else {
          console.warn('⚠️ API respondió éxito pero sin recomendaciones.');
        }
      } else {
        console.error('❌ Error API:', result);
        alert(result.error?.mensaje || "No se encontraron rutas.");
      }

    } catch (e) {
      console.error('🔥 Excepción en buscarRutas:', e);
      alert('Error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleOriginMove = (newPos) => {
    if (!newPos) return;
    const { lat, lng } = newPos;

    // Actualizar estado con coordenadas numéricas válidas
    const origenActualizado = {
      ...origenSeleccionado,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      nombre: "Ubicación ajustada manualmente"
    };

    setOrigenSeleccionado(origenActualizado);
    // setOrigenInput("Ubicación ajustada manualmente"); // Opcional: ¿cambiar el input o dejar el nombre anterior?
  };

  // Efecto para buscar sugerencias de Origen (Enhanced)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!origenInput || origenInput.length < 3) return;

      const results = [];

      // 1. Buscar en paradas locales (Siempre prioridad 1)
      if (paradas) {
        const paradasMatch = paradas.filter(p =>
          p.nombre.toLowerCase().includes(origenInput.toLowerCase())
        ).slice(0, 3).map(p => ({
          nombre: p.nombre,
          direccion: 'Parada de Autobús',
          lat: p.lat,
          lng: p.lng,
          type: 'station'
        }));
        results.push(...paradasMatch);
      }

      // 2. Google Places Autocomplete (Prioridad 2 - Si hay API Key)
      if (window.google && window.google.maps && window.google.maps.places) {
        try {
          const autocompleteService = new window.google.maps.places.AutocompleteService();
          const placeResults = await new Promise((resolve) => {
            autocompleteService.getPlacePredictions({
              input: origenInput,
              componentRestrictions: { country: 'sv' }, // Restringir a El Salvador
              types: ['geocode', 'establishment'] // Lugares y direcciones
            }, (predictions, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                resolve(predictions.map(p => ({
                  nombre: p.structured_formatting.main_text,
                  direccion: p.structured_formatting.secondary_text,
                  place_id: p.place_id,
                  type: 'google'
                })));
              } else {
                resolve([]);
              }
            });
          });
          results.push(...placeResults);
        } catch (e) {
          console.warn('Google Places Auto-complete error:', e);
        }
      }

      // 3. Fallback: Nominatim (OSM) - Solo si no usamos Google o para complementar
      // Si ya tenemos muchos resultados de Google, quizás no necesitamos Nominatim, 
      // pero para "exhaustividad" lo dejamos con un límite mayor si no hay Google.
      if (!window.google || results.length < 5) {
        try {
          const limit = window.google ? 2 : 5; // Si tenemos Google, pedimos pocos. Si no, pedimos más.
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(origenInput)}+El+Salvador&limit=${limit}&addressdetails=1`);
          if (response.ok) {
            const osmData = await response.json();
            const osmResults = osmData.map(item => ({
              nombre: item.name || item.display_name.split(',')[0],
              direccion: item.display_name,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              type: 'osm'
            }));
            // Evitar duplicados obvios (por nombre exacto)
            const nuevos = osmResults.filter(osm => !results.some(r => r.nombre === osm.nombre));
            results.push(...nuevos);
          }
        } catch (e) {
          console.warn('Error fetching Nominatim', e);
        }
      }

      setSugerenciasOrigen(results.slice(0, 8)); // Mostrar top 8
    };

    const timer = setTimeout(fetchSuggestions, 400); // Debounce un poco más corto
    return () => clearTimeout(timer);
  }, [origenInput, paradas]);

  // Efecto para buscar sugerencias de Destino (Enhanced)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!destinoInput || destinoInput.length < 3) return;

      const results = [];

      // 1. Buscar en paradas locales
      if (paradas) {
        const paradasMatch = paradas.filter(p =>
          p.nombre.toLowerCase().includes(destinoInput.toLowerCase())
        ).slice(0, 3).map(p => ({
          nombre: p.nombre,
          direccion: 'Parada de Autobús',
          lat: p.lat,
          lng: p.lng,
          type: 'station'
        }));
        results.push(...paradasMatch);
      }

      // 2. Google Places Autocomplete
      if (window.google && window.google.maps && window.google.maps.places) {
        try {
          const autocompleteService = new window.google.maps.places.AutocompleteService();
          const placeResults = await new Promise((resolve) => {
            autocompleteService.getPlacePredictions({
              input: destinoInput,
              componentRestrictions: { country: 'sv' },
              types: ['geocode', 'establishment']
            }, (predictions, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                resolve(predictions.map(p => ({
                  nombre: p.structured_formatting.main_text,
                  direccion: p.structured_formatting.secondary_text,
                  place_id: p.place_id,
                  type: 'google'
                })));
              } else {
                resolve([]);
              }
            });
          });
          results.push(...placeResults);
        } catch (e) {
          console.warn('Google Places Auto-complete error:', e);
        }
      }

      // 3. Fallback: Nominatim (OSM)
      if (!window.google || results.length < 5) {
        try {
          const limit = window.google ? 2 : 5;
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destinoInput)}+El+Salvador&limit=${limit}&addressdetails=1`);
          if (response.ok) {
            const osmData = await response.json();
            const osmResults = osmData.map(item => ({
              nombre: item.name || item.display_name.split(',')[0],
              direccion: item.display_name,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              type: 'osm'
            }));
            const nuevos = osmResults.filter(osm => !results.some(r => r.nombre === osm.nombre));
            results.push(...nuevos);
          }
        } catch (e) {
          console.warn('Error fetching Nominatim', e);
        }
      }

      setSugerenciasDestino(results.slice(0, 8));
    };

    const timer = setTimeout(fetchSuggestions, 400);
    return () => clearTimeout(timer);
  }, [destinoInput, paradas]);


  // Handlers mejorados para manejar datos de Google Places
  const handleSeleccionarOrigen = async (locationData) => {
    let lat = locationData.lat;
    let lng = locationData.lng;
    const nombre = locationData.nombre || locationData.direccion || locationData.display_name || locationData.name || '';

    // Si es resultado de Google, obtener detalles para coordenadas
    if (locationData.type === 'google' && locationData.place_id && window.google) {
      try {
        const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));
        const details = await new Promise((resolve, reject) => {
          placesService.getDetails({
            placeId: locationData.place_id,
            fields: ['geometry', 'name']
          }, (place, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry) {
              resolve(place);
            } else {
              reject(status);
            }
          });
        });
        lat = details.geometry.location.lat();
        lng = details.geometry.location.lng();
      } catch (e) {
        console.warn('Error getting place details:', e);
      }
    } else {
      // Fallback or legacy format
      lat = lat || parseFloat(locationData.latitud || locationData.latitude);
      lng = lng || parseFloat(locationData.longitud || locationData.longitude);
    }

    setOrigenInput(nombre);
    setOrigenSeleccionado({
      lat,
      lng,
      nombre,
      direccion: locationData.direccion,
      place_id: locationData.place_id
    });
  };

  const handleSeleccionarDestino = async (locationData) => {
    let lat = locationData.lat;
    let lng = locationData.lng;
    const nombre = locationData.nombre || locationData.direccion || locationData.display_name || locationData.name || '';

    // Si es resultado de Google, obtener detalles
    if (locationData.type === 'google' && locationData.place_id && window.google) {
      try {
        const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));
        const details = await new Promise((resolve, reject) => {
          placesService.getDetails({
            placeId: locationData.place_id,
            fields: ['geometry', 'name']
          }, (place, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry) {
              resolve(place);
            } else {
              reject(status);
            }
          });
        });
        lat = details.geometry.location.lat();
        lng = details.geometry.location.lng();
      } catch (e) {
        console.warn('Error getting place details:', e);
      }
    } else {
      // Fallback
      lat = lat || parseFloat(locationData.latitud || locationData.latitude);
      lng = lng || parseFloat(locationData.longitud || locationData.longitude);
    }

    setDestinoInput(nombre);
    setDestinoSeleccionado({
      lat,
      lng,
      nombre,
      direccion: locationData.direccion,
      place_id: locationData.place_id
    });
  };

  const limpiarBusqueda = () => {
    setOrigenInput('');
    setDestinoInput('');
    setOrigenSeleccionado(null);
    setDestinoSeleccionado(null);
    setResultados(null);
    setRutaSeleccionada(0);
    setRouteSegments([]);
    setWalkingSegments([]);
    setTransitionPoints([]);
  };

  const verRutaEnMapa = (index) => {
    setRutaSeleccionada(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helpers de Directions api
  const getDirections = async (origin, destination, mode) => {
    // Validar entradas
    if (!origin || !destination ||
      isNaN(origin.lat) || isNaN(origin.lng) ||
      isNaN(destination.lat) || isNaN(destination.lng)) {
      console.warn('Invalid origin or destination in getDirections');
      return [];
    }

    // Fallback: Línea recta si no hay servicio de Google
    if (!directionsService) {
      return [
        { lat: Number(origin.lat), lng: Number(origin.lng) },
        { lat: Number(destination.lat), lng: Number(destination.lng) }
      ];
    }

    return new Promise((resolve) => {
      directionsService.route({
        origin: { lat: Number(origin.lat), lng: Number(origin.lng) },
        destination: { lat: Number(destination.lat), lng: Number(destination.lng) },
        travelMode: mode
      }, (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && result && result.routes && result.routes[0]) {
          try {
            const path = result.routes[0].overview_path
              .map(p => {
                try {
                  if (p && typeof p.lat === 'function' && typeof p.lng === 'function') {
                    return { lat: Number(p.lat()), lng: Number(p.lng()) };
                  }
                  return null;
                } catch (e) {
                  return null;
                }
              })
              .filter(p => p !== null && !isNaN(p.lat) && !isNaN(p.lng));

            // Asegurar al menos 2 puntos
            if (path.length >= 2) {
              resolve(path);
            } else {
              // Fallback si el path es muy corto
              resolve([
                { lat: Number(origin.lat), lng: Number(origin.lng) },
                { lat: Number(destination.lat), lng: Number(destination.lng) }
              ]);
            }
          } catch (e) {
            console.error('Error processing directions path:', e);
            resolve([
              { lat: Number(origin.lat), lng: Number(origin.lng) },
              { lat: Number(destination.lat), lng: Number(destination.lng) }
            ]);
          }
        } else {
          console.error(`Directions request failed: ${status}`);
          // Fallback línea recta
          resolve([
            { lat: Number(origin.lat), lng: Number(origin.lng) },
            { lat: Number(destination.lat), lng: Number(destination.lng) }
          ]);
        }
      });
    });
  };

  useEffect(() => {
    const calcularGeometria = async () => {
      // Permitir continuar si hay resultados, incluso sin directionsService (modo OSM)
      if (!resultados || !resultados.recomendaciones || !resultados.recomendaciones[rutaSeleccionada]) {
        // Limpiar geometría si no hay resultados
        setRouteSegments([]);
        setWalkingSegments([]);
        setTransitionPoints([]);
        return;
      }

      const rec = resultados.recomendaciones[rutaSeleccionada];
      const newSegments = [];
      const newWalkingSegments = [];
      const newTransitionPoints = [];

      // Bounds: usar dummy bounds si no hay google maps
      const bounds = window.google && window.google.maps ? new window.google.maps.LatLngBounds() : null;
      const extendBounds = (pt) => {
        if (bounds && pt) {
          const lat = typeof pt === 'object' && 'lat' in pt ? pt.lat : (Array.isArray(pt) ? pt[0] : pt);
          const lng = typeof pt === 'object' && 'lng' in pt ? pt.lng : (Array.isArray(pt) ? pt[1] : pt);
          if (typeof lat === 'number' && typeof lng === 'number') {
            bounds.extend({ lat, lng });
          }
        }
      };

      try {
        // Helper to decode Google Maps polylines
        const decodePolyline = (encoded) => {
          if (!encoded) return [];
          const poly = [];
          let index = 0, len = encoded.length;
          let lat = 0, lng = 0;

          while (index < len) {
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

            poly.push({ lat: lat / 1e5, lng: lng / 1e5 });
          }
          return poly;
        };

        const fetchOsrmRoute = async (start, end) => {
          try {
            const url = `https://router.project-osrm.org/route/v1/foot/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=polyline`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
              return decodePolyline(data.routes[0].geometry);
            }
          } catch (err) {
            console.warn("OSRM Client Error:", err);
          }
          return null;
        };

        // Helper de normalización local
        const normalizePoint = (p) => {
          if (!p) return null;
          const lat = parseFloat(p.lat || p.latitud);
          const lng = parseFloat(p.lng || p.longitud);
          if (isNaN(lat) || isNaN(lng)) return null;
          return { lat, lng };
        };

        // 2. Procesar Segmentos (Nueva Lógica Unificada)
        // rec.segmentos ahora trae [Walk, Bus, Walk] o combinaciones

        for (const seg of rec.segmentos) {
          if (seg.tipo === 'walk' || seg.modo === 'WALK') {
            let path = seg.geometry;

            // Intentar mejorar la geometría de caminata con OSRM si son solo 2 puntos
            if (path && path.length === 2 && path[0] && path[1]) {
              const p1 = normalizePoint(path[0]);
              const p2 = normalizePoint(path[1]);
              if (p1 && p2) {
                try {
                  // Solo intentar OSRM si la distancia es razonable (> 10m)
                  const osrmPath = await fetchOsrmRoute(p1, p2);
                  if (osrmPath && osrmPath.length > 2) {
                    // OSRM devuelve puntos "snapped" a la calle. 
                    // Para que la línea llegue visualmente al marcador (que puede estar "off-road" como dentro de la UES),
                    // forzamos el inicio y fin originales.
                    path = [p1, ...osrmPath, p2];
                  }
                } catch (e) { console.warn("OSRM falback failed, keeping straight line"); }
              }
            }

            if (path && path.length >= 2) {
              newWalkingSegments.push({ path });
              path.forEach(extendBounds);
            }

          } else if (seg.tipo === 'bus' || seg.modo === 'BUS') {
            // Bus segment - Usar geometría exacta provista por el backend (sliced)
            if (seg.geometry && seg.geometry.length >= 2) {
              newSegments.push({
                path: seg.geometry,
                color: seg.ruta?.color || '#1E88E5'
              });
              seg.geometry.forEach(extendBounds);

              // Agregar puntos de abordaje/bajada a marcadores de transición
              if (seg.fromStop) {
                newTransitionPoints.push({
                  lat: parseFloat(seg.fromStop.lat),
                  lng: parseFloat(seg.fromStop.lng),
                  tipo: 'abordaje',
                  nombre: `Abordar Ruta ${seg.ruta?.numero_ruta || ''}`,
                  descripcion: seg.fromStop.nombre,
                  color: '#10b981' // Green
                });
              }
              if (seg.toStop) {
                newTransitionPoints.push({
                  lat: parseFloat(seg.toStop.lat),
                  lng: parseFloat(seg.toStop.lng),
                  tipo: 'bajada',
                  nombre: `Bajar Ruta ${seg.ruta?.numero_ruta || ''}`,
                  descripcion: seg.toStop.nombre,
                  color: '#ef4444' // Red
                });
              }
            }
          }
        }



        // Validar que todos los segmentos tengan paths válidos antes de actualizar
        const validRouteSegments = newSegments.filter(seg =>
          seg && seg.path && Array.isArray(seg.path) && seg.path.length >= 2
        );
        const validWalkingSegments = newWalkingSegments.filter(seg =>
          seg && seg.path && Array.isArray(seg.path) && seg.path.length >= 2
        );

        // Actualizar estado (esto no bloquea la UI)
        setRouteSegments(validRouteSegments);
        setWalkingSegments(validWalkingSegments);
        setTransitionPoints(newTransitionPoints);

        // Ajustar bounds del mapa
        if (map && bounds) {
          try {
            map.fitBounds(bounds);
          } catch (e) {
            console.warn('Error ajustando bounds:', e);
          }
        }
      } catch (error) {
        console.error('Error calculando geometría:', error);
        // Aún así mostrar algo básico
        setRouteSegments(newSegments);
        setWalkingSegments(newWalkingSegments);
        setTransitionPoints(newTransitionPoints);
      }
    };

    // Ejecutar sin bloquear
    calcularGeometria();
  }, [resultados, rutaSeleccionada, directionsService, origenSeleccionado, destinoSeleccionado, map, routes]);

  // Función para renderizar el mapa o el error
  const renderMap = () => {
    // 1. Fallback: Si hay error de carga (ej. sin API Key), usar OpenStreetMap
    if (loadError) {
      // Validar y limpiar segmentos antes de pasar a Leaflet - VALIDACIÓN ULTRA ESTRICTA
      const safeRouteSegments = (routeSegments || []).map(seg => {
        try {
          if (!seg || !seg.path || !Array.isArray(seg.path) || seg.path.length === 0) {
            return null;
          }

          const validPath = seg.path
            .map(p => {
              if (!p || p === null || p === undefined) return null;

              let lat, lng;
              if (Array.isArray(p)) {
                if (p.length < 2) return null;
                lat = Number(p[0]);
                lng = Number(p[1]);
              } else if (typeof p === 'object') {
                lat = p.lat !== undefined ? Number(p.lat) : (p.latitud ? Number(p.latitud) : null);
                lng = p.lng !== undefined ? Number(p.lng) : (p.longitud ? Number(p.longitud) : null);
              } else {
                return null;
              }

              if (isNaN(lat) || isNaN(lng) || lat === null || lng === null) {
                return null;
              }

              return { lat, lng };
            })
            .filter(p => p !== null && typeof p.lat === 'number' && typeof p.lng === 'number' && !isNaN(p.lat) && !isNaN(p.lng));

          return validPath.length >= 2 ? { path: validPath, color: seg.color } : null;
        } catch (e) {
          console.error('Error sanitizing route segment:', e);
          return null;
        }
      }).filter(seg => seg !== null);

      const safeWalkingSegments = (walkingSegments || []).map(seg => {
        try {
          if (!seg || !seg.path || !Array.isArray(seg.path) || seg.path.length === 0) {
            return null;
          }

          const validPath = seg.path
            .map(p => {
              if (!p || p === null || p === undefined) return null;

              let lat, lng;
              if (Array.isArray(p)) {
                if (p.length < 2) return null;
                lat = Number(p[0]);
                lng = Number(p[1]);
              } else if (typeof p === 'object') {
                lat = p.lat !== undefined ? Number(p.lat) : (p.latitud ? Number(p.latitud) : null);
                lng = p.lng !== undefined ? Number(p.lng) : (p.longitud ? Number(p.longitud) : null);
              } else {
                return null;
              }

              if (isNaN(lat) || isNaN(lng) || lat === null || lng === null) {
                return null;
              }

              return { lat, lng };
            })
            .filter(p => p !== null && typeof p.lat === 'number' && typeof p.lng === 'number' && !isNaN(p.lat) && !isNaN(p.lng));

          return validPath.length >= 2 ? { path: validPath } : null;
        } catch (e) {
          console.error('Error sanitizing walking segment:', e);
          return null;
        }
      }).filter(seg => seg !== null);

      return (
        <div className="h-full w-full rounded-xl overflow-hidden border-2 border-white/10 relative">
          <div className="absolute top-2 right-2 z-[1000] bg-slate-800/90 px-3 py-1 rounded text-xs text-slate-300 border border-slate-600 shadow-lg backdrop-blur-sm">
            🗺️ Modo OpenStreetMap (Google Maps no configurado)
          </div>
          <LeafletTripMap
            origen={origenSeleccionado ? { lat: origenSeleccionado.lat, lng: origenSeleccionado.lng, nombre: origenSeleccionado.nombre } : null}
            destino={destinoSeleccionado ? { lat: destinoSeleccionado.lat, lng: destinoSeleccionado.lng, nombre: destinoSeleccionado.nombre } : null}
            routeSegments={safeRouteSegments}
            walkingSegments={safeWalkingSegments}
            transitionPoints={transitionPoints}
            onOriginMove={handleOriginMove}
            dbRoutes={routes}
          />
        </div>
      );
    }

    // 2. Cargando
    if (!isLoaded) {
      return (
        <div className="h-full w-full flex items-center justify-center bg-slate-900 text-slate-400">
          Cargando Mapa...
        </div>
      );
    }

    // 3. Google Maps (Normal)
    return (
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={{ lat: 13.6929, lng: -89.2182 }}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{ styles: [{ elementType: "geometry", stylers: [{ color: "#242f3e" }] }, { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] }, { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] }] }}
      >
        {origenSeleccionado && <Marker position={origenSeleccionado} icon={ICON_ORIGEN} title="Origen" />}
        {destinoSeleccionado && <Marker position={destinoSeleccionado} icon={ICON_DESTINO} title="Destino" />}

        {/* Renderizar Rutas cargadas desde BD (AI Routes) */}
        {routes.map((route, idx) => {
          if (!route.geometry || !Array.isArray(route.geometry) || route.geometry.length < 2) {
            return null;
          }

          // Validar y normalizar geometría
          const validGeometry = route.geometry
            .map(point => {
              if (!point) return null;
              // Aceptar tanto {lat, lng} como [lat, lng]
              if (Array.isArray(point)) {
                const lat = Number(point[0]);
                const lng = Number(point[1]);
                if (isNaN(lat) || isNaN(lng)) return null;
                return { lat, lng };
              } else if (typeof point === 'object') {
                const lat = point.lat !== undefined ? Number(point.lat) : (point.latitud ? Number(point.latitud) : null);
                const lng = point.lng !== undefined ? Number(point.lng) : (point.longitud ? Number(point.longitud) : null);
                if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) return null;
                return { lat, lng };
              }
              return null;
            })
            .filter(point => point !== null && typeof point.lat === 'number' && typeof point.lng === 'number' && !isNaN(point.lat) && !isNaN(point.lng));

          if (validGeometry.length < 2) {
            console.warn(`Ruta ${route.id || idx} tiene geometría inválida, omitiendo`);
            return null;
          }

          return (
            <Polyline
              key={`route-db-${route.id || idx}`}
              path={validGeometry}
              options={{
                strokeColor: route.color || '#999999',
                strokeWeight: 4,
                strokeOpacity: 0.6,
                clickable: true,
                zIndex: 1
              }}
              onClick={() => {
                const centerIdx = Math.floor(validGeometry.length / 2);
                setSelectedMarker({
                  nombre: route.nombre,
                  descripcion: route.descripcion || `Ruta ${route.numero_ruta}`,
                  position: validGeometry[centerIdx] || validGeometry[0]
                });
              }}
            />
          );
        })}

        {walkingSegments.map((seg, idx) => (
          <Polyline key={`walk-${idx}`} path={seg.path} options={{ strokeColor: '#7bc4f0', strokeOpacity: 0, icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4 }, offset: '0', repeat: '20px' }], strokeWeight: 2, zIndex: 10 }} />
        ))}

        {routeSegments.map((seg, idx) => (
          <Polyline key={`bus-${idx}`} path={seg.path} options={{ strokeColor: seg.color, strokeWeight: 6, zIndex: 20 }} />
        ))}

        {transitionPoints.map((pt, idx) => (
          <Marker
            key={`pt-${idx}`}
            position={pt}
            icon={crearIconoParada(pt.tipo, pt.color)}
            onClick={() => setSelectedMarker(pt)}
            zIndex={30}
          />
        ))}

        {selectedMarker && (
          <InfoWindow position={selectedMarker.position || selectedMarker} onCloseClick={() => setSelectedMarker(null)}>
            <div className="text-black">
              <h3 className="font-bold">{selectedMarker.nombre}</h3>
              <p>{selectedMarker.descripcion}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    );
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_50%_100%,#1b2250_0%,#0b0f24_60%,#060816_100%)] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header y Search Block mismos que original pero simplificados */}
        <div className="mb-6"><button onClick={() => navigate(-1)} className="text-white">Volver</button></div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-2xl bg-white/5 p-6 backdrop-blur-md">
              <LocationSearchInput
                value={origenInput}
                onChange={handleOrigenChange}
                onSelect={handleSeleccionarOrigen}
                suggestions={sugerenciasOrigen}
                label="Origen"
                placeholder="Busca lugares, restaurantes, direcciones..."
                showLocationButton={true}
              />
              <div className="mt-4">
                <LocationSearchInput
                  value={destinoInput}
                  onChange={handleDestinoChange}
                  onSelect={handleSeleccionarDestino}
                  suggestions={sugerenciasDestino}
                  label="Destino"
                  placeholder="Busca lugares, restaurantes, direcciones..."
                  showLocationButton={false}
                />
              </div>
              <div className="mt-6 space-y-2">
                <button onClick={buscarRutas} disabled={loading} className="w-full bg-blue-500 py-3 rounded-xl font-bold">Buscar Rutas</button>
                <button onClick={limpiarBusqueda} className="w-full bg-slate-600 py-2 rounded-xl">Limpiar</button>
              </div>

              {/* Lista de Resultados */}
              {loading && (
                <div className="mt-6 flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="text-sm text-slate-400">Buscando rutas...</p>
                  </div>
                </div>
              )}

              {!loading && recomendacionesUnicas.length === 0 && resultados && (
                <div className="mt-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                  <p className="text-sm text-yellow-300">
                    No se encontraron rutas disponibles. Intenta con otras ubicaciones.
                  </p>
                </div>
              )}

              {!loading && recomendacionesUnicas.length > 0 && (
                <div className="mt-6">
                  <div className="text-sm text-slate-400 mb-3 font-medium">
                    {recomendacionesUnicas.length} {recomendacionesUnicas.length === 1 ? 'ruta encontrada' : 'rutas encontradas'}
                  </div>
                  <div className="space-y-4">
                    {recomendacionesUnicas.map((rec, idx) => {
                      const originalIdx = rec.originalIndex;

                      // Obtener todos los números de ruta (para mostrar "26 → 46" si hay transbordo)
                      const numerosRuta = rec.segmentos
                        ?.filter(seg => seg.tipo === 'bus' && seg.ruta?.numero_ruta)
                        .map(seg => seg.ruta.numero_ruta) || [];

                      // Calcular distancia total de caminata
                      const caminataTotal = Math.round(
                        ((rec.distanciaCaminataOrigenMetros || 0) + (rec.distanciaCaminataDestinoMetros || 0)) / 1000 * 10
                      ) / 10; // Redondear a 1 decimal

                      // Texto de la ruta: "26" o "26 → 46" o "26 → 46 → 43"
                      const textoRuta = numerosRuta.length > 1
                        ? numerosRuta.join(' → ')
                        : numerosRuta[0] || 'N/A';

                      // Indicador de transbordos
                      const tieneTransbordos = (rec.transbordos || 0) > 0;

                      return (
                        <div
                          key={`${rec.numerosRuta || idx}-${idx}`}
                          onClick={() => verRutaEnMapa(originalIdx)}
                          className={`p-4 rounded-xl border ${rutaSeleccionada === originalIdx ? 'border-blue-500 bg-blue-500/20' : 'border-white/10 bg-white/5'} cursor-pointer hover:bg-white/10 transition`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-bold text-lg">
                              {tieneTransbordos ? (
                                <span className="flex items-center gap-2">
                                  <span>Rutas {textoRuta}</span>
                                  <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-1 rounded">
                                    {rec.transbordos} transbordo{rec.transbordos > 1 ? 's' : ''}
                                  </span>
                                </span>
                              ) : (
                                <span>Ruta {textoRuta}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col text-sm">
                            <div className="text-slate-300 flex items-center justify-between">
                              <span className="font-semibold text-white">Tarifa Total: ${rec.tarifaTotal || '0.00'}</span>
                              {rec.tiempoEstimadoMinutos && (
                                <span className="ml-3 text-slate-400">
                                  ⏱️ ~{rec.tiempoEstimadoMinutos} min
                                </span>
                              )}
                            </div>
                            
                            {/* Desglose de Tarifas por Ruta */}
                            {rec.segmentos && (
                              <div className="mt-2 text-xs text-slate-400 space-y-1 bg-black/20 p-2 rounded">
                                {rec.segmentos.filter(s => s.tipo === 'bus').map((seg, i) => (
                                   <div key={i} className="flex justify-between">
                                      <span>{seg.ruta.nombre}</span>
                                      <span className="text-slate-300">${parseFloat(seg.ruta.tarifa || 0.25).toFixed(2)}</span>
                                   </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-xs">
                            {caminataTotal > 0 && (
                              <span className="text-green-400">
                                🚶 Caminata: ~{caminataTotal} km
                              </span>
                            )}
                            {rec.numParadas && (
                              <span className="text-blue-400">
                                🚏 {rec.numParadas} paradas
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="h-[700px] rounded-xl overflow-hidden border-2 border-white/10">
              {renderMap()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
