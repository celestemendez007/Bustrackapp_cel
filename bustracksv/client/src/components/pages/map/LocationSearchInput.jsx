import { useState, useEffect, useRef, useCallback } from 'react';
import { useGoogleMaps } from '../../../contexts/GoogleMapsContext';

/**
 * Componente profesional de búsqueda de ubicación con Google Places Autocomplete
 * y geolocalización con geocoding inverso.
 * 
 * SOLUCIONES:
 * 1. Autocomplete Híbrido: Usa Google si hay API Key, o OpenStreetMap (fallback) si no.
 * 2. Ubicación Exacta: Usa GPS del dispositivo y solo usa Google para el nombre de la calle.
 * 3. Sin Errores: Manejo robusto de inicialización y estados nulos.
 */
export default function LocationSearchInput({
    value,
    onChange,
    onSelect,
    suggestions = [], // SUGERENCIAS EXTERNAS (Offline/Fallback)
    label,
    placeholder = "Busca lugares, direcciones, restaurantes...",
    showLocationButton = true,
    disabled = false
}) {
    const { isLoaded, loadError } = useGoogleMaps();

    // Estado local para sugerencias de Google (Internal)
    // Renombrado para evitar conflicto con la prop 'suggestions'
    const [internalSuggestions, setInternalSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    // Servicios de Google Maps - refs para evitar re-renders
    const autocompleteServiceRef = useRef(null);
    const placesServiceRef = useRef(null);
    const geocoderRef = useRef(null);
    const sessionTokenRef = useRef(null);

    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    // Inicialización segura de servicios Google
    useEffect(() => {
        if (!isLoaded || loadError || !window.google || !window.google.maps) return;

        try {
            if (!autocompleteServiceRef.current && window.google.maps.places) {
                autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
                sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
            }
            if (!geocoderRef.current) {
                geocoderRef.current = new window.google.maps.Geocoder();
            }
            // PlacesService se vincula al input si es posible, o a un nodo dummy si no
            if (!placesServiceRef.current && window.google.maps.places) {
                const node = inputRef.current || document.createElement('div');
                placesServiceRef.current = new window.google.maps.places.PlacesService(node);
            }
        } catch (error) {
            console.error('Error init Google Services:', error);
        }
    }, [isLoaded, loadError]);

    // Click outside handler
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const reverseGeocode = useCallback(async (lat, lng) => {
        if (!geocoderRef.current) return null;
        try {
            const response = await geocoderRef.current.geocode({ location: { lat, lng } });
            if (response.results && response.results.length > 0) {
                return response.results[0];
            }
        } catch (e) {
            // Ignorar errores de geocoding, no son críticos
        }
        return null;
    }, []);

    // Manejo de "Mi Ubicación" - Versión mejorada con múltiples lecturas para mayor precisión
    const handleGetCurrentLocation = useCallback(async () => {
        if (!navigator.geolocation) {
            alert('Tu navegador no soporta geolocalización.');
            return;
        }

        setIsLoadingLocation(true);
        setShowSuggestions(false);

        const options = { 
            enableHighAccuracy: true, 
            timeout: 5000, // 5 segundos máximo para GPS (fail fast)
            maximumAge: 30000 // Aceptar ubicación de hace 30s
        };

        const lowAccuracyOptions = {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000 // Aceptar caché de 1 min
        };

        // Estrategia simplificada: Obtener ubicación lo más rápido posible
        const targetAccuracy = 100; // 100m es suficiente para empezar
        const minAccuracy = 3000; // Aceptar cualquier cosa razonable (< 3km)

        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            let bestReading = null;
            let watchId = null;

            const processPosition = async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const accuracy = position.coords.accuracy;

                // Validar coordenadas
                if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
                    return; 
                }

                // Si la precisión es suficiente, terminar de inmediato
                if (accuracy <= targetAccuracy) {
                     if (watchId !== null) navigator.geolocation.clearWatch(watchId);
                     finalizeLocation(lat, lng, accuracy, `Mi ubicación (±${Math.round(accuracy)}m)`);
                     return;
                }

                // Si es la primera lectura válida, usarla temporalmente pero buscar mejor
                if (!bestReading || accuracy < bestReading.accuracy) {
                    bestReading = { lat, lng, accuracy, timestamp: Date.now() };
                }
                
                // Si la precisión es "aceptable" (<= minAccuracy) y ya pasaron 2 segundos, terminar
                const elapsed = Date.now() - startTime;
                if (accuracy <= minAccuracy && elapsed > 2000) {
                    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
                    finalizeLocation(lat, lng, accuracy, `Mi ubicación (±${Math.round(accuracy)}m)`);
                    return;
                }
            };

            const finishWithBestReading = async () => {
                if (watchId !== null) navigator.geolocation.clearWatch(watchId);
                
                if (!bestReading) {
                    // Último intento: IP Location o error
                    setIsLoadingLocation(false);
                    alert('No se pudo obtener ubicación GPS. Intenta activar el GPS o salir al aire libre.');
                    reject(new Error('No valid readings'));
                    return;
                }

                const { lat, lng, accuracy } = bestReading;
                finalizeLocation(lat, lng, accuracy, `Mi ubicación (±${Math.round(accuracy)}m)`);
            };

            const finalizeLocation = async (lat, lng, accuracy, addressName) => {
                // Intentar mejorar el nombre con Geocoding (si está disponible)
                if (geocoderRef.current && accuracy <= minAccuracy) {
                    try {
                        const place = await reverseGeocode(lat, lng);
                        if (place) {
                            const addressParts = place.address_components;
                            const route = addressParts.find(c => c.types.includes('route'))?.long_name;
                            if (route) {
                                addressName = route;
                            } else {
                                const shortAddress = place.formatted_address.split(',')[0];
                                if (shortAddress) addressName = shortAddress;
                            }
                        }
                    } catch (e) {
                        // Si falla el geocoding, usar el nombre por defecto
                        console.warn('Geocoding falló, usando coordenadas:', e);
                    }
                }

                // Crear y devolver los datos de ubicación
                const locationData = {
                    lat, 
                    lng,
                    nombre: addressName,
                    direccion: addressName,
                    accuracy
                };

                onChange(addressName);
                onSelect(locationData);
                setIsLoadingLocation(false);
                resolve(locationData);
            };

            // Intentar primero con getCurrentPosition para respuesta rápida
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    await processPosition(position);
                    // Si no alcanzamos precisión objetivo, continuar con watchPosition
                    if (bestReading && bestReading.accuracy > targetAccuracy) {
                        watchId = navigator.geolocation.watchPosition(
                            processPosition,
                            (err) => {
                                // Si watchPosition falla, usar la mejor lectura que tengamos
                                if (bestReading) {
                                    finishWithBestReading();
                                } else {
                                    console.warn('Error watchPosition:', err);
                                    setIsLoadingLocation(false);
                                    alert('No se pudo obtener tu ubicación. Verifica los permisos.');
                                    reject(err);
                                }
                            },
                            options
                        );
                    }
                },
                async (err) => {
                    // Si getCurrentPosition falla (timeout o error), intentar con BAJA PRECISIÓN (WiFi/Celular)
                    console.warn('Alta precisión falló, intentando baja precisión:', err);
                    
                    navigator.geolocation.getCurrentPosition(
                        async (position) => {
                            // Éxito con baja precisión
                            const { latitude, longitude, accuracy } = position.coords;
                            finalizeLocation(latitude, longitude, accuracy, `Mi ubicación (±${Math.round(accuracy)}m)`);
                        },
                        (err2) => {
                            // Si falla también baja precisión, usar watchPosition como último recurso
                            console.warn('Baja precisión falló, último intento con watchPosition:', err2);
                            watchId = navigator.geolocation.watchPosition(
                                processPosition,
                                (err3) => {
                                    if (bestReading) {
                                        finishWithBestReading();
                                    } else {
                                        console.warn('Error fatal GPS:', err3);
                                        setIsLoadingLocation(false);
                                        alert('No se pudo obtener tu ubicación. Verifica que el GPS esté activado.');
                                        reject(err3);
                                    }
                                },
                                lowAccuracyOptions // Usar opciones relajadas
                            );

                            // Timeout de seguridad final
                            setTimeout(() => {
                                if (watchId !== null) navigator.geolocation.clearWatch(watchId);
                                if (bestReading) {
                                    finishWithBestReading();
                                } else {
                                    setIsLoadingLocation(false);
                                    alert('Tiempo de espera agotado. Verifica tu GPS.');
                                    reject(new Error('Timeout'));
                                }
                            }, 10000); // 10s extra max
                        },
                        lowAccuracyOptions
                    );
                },
                options
            );
        });
    }, [onChange, onSelect, reverseGeocode]);

    // Manejo de Input y Búsqueda
    const handleInputChange = useCallback((e) => {
        const val = e.target.value;
        onChange(val);

        if (!val || val.length < 2) {
            setInternalSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setShowSuggestions(true);

        // Si no hay Google, confiamos en que el padre actualice la prop 'suggestions'
        if (loadError || !isLoaded || !autocompleteServiceRef.current) {
            return;
        }

        // Si hay Google, usamos el servicio
        const request = {
            input: val,
            sessionToken: sessionTokenRef.current,
            componentRestrictions: { country: 'sv' },
            types: ['establishment', 'geocode', 'address']
        };

        autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                setInternalSuggestions(predictions);
            } else {
                setInternalSuggestions([]);
            }
        });
    }, [onChange, loadError, isLoaded]);

    // Selección de sugerencia
    const handleSelectSuggestion = useCallback((item) => {
        // CASE 1: Google Suggestion (tiene place_id y structured_formatting)
        if (item.place_id && placesServiceRef.current) {
            onChange(item.description);
            setShowSuggestions(false);

            const request = {
                placeId: item.place_id,
                fields: ['name', 'geometry', 'formatted_address', 'place_id'],
                sessionToken: sessionTokenRef.current
            };

            placesServiceRef.current.getDetails(request, (place, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry) {
                    onSelect({
                        nombre: place.name || item.description,
                        direccion: place.formatted_address,
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                        place_id: place.place_id
                    });
                    // Refresh token
                    sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
                } else {
                    console.error('Error place details:', status);
                }
            });
        }
        // CASE 2: External/Fallback Suggestion (ya tiene lat/lng)
        else {
            const name = item.nombre || item.display_name || item.name;
            const lat = parseFloat(item.lat || item.latitude || item.latitud);
            const lng = parseFloat(item.lng || item.longitude || item.longitud);

            onChange(name);
            setShowSuggestions(false);
            onSelect({
                nombre: name,
                direccion: item.direccion || item.display_name,
                lat, lng
            });
        }
    }, [onChange, onSelect]);

    // Decidir qué lista mostrar: Fallback vs Google
    const activeSuggestions = (loadError || !isLoaded) ? suggestions : internalSuggestions;

    return (
        <div ref={wrapperRef} className="relative w-full">
            <label className="block text-sm font-medium text-slate-200 mb-2">
                {label}
            </label>
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={handleInputChange}
                        onFocus={() => {
                            if (value && value.length >= 2) setShowSuggestions(true);
                        }}
                        placeholder={loadError ? `${placeholder} (Modo Offline)` : placeholder}
                        className="w-full h-11 px-4 rounded-xl border-2 border-white/20 bg-[#141a35] text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none transition disabled:opacity-50"
                        autoComplete="off"
                        disabled={disabled || (!isLoaded && !loadError)}
                    />
                    {!isLoaded && !loadError && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-400"></div>
                        </div>
                    )}
                </div>
                {showLocationButton && (
                    <button
                        type="button"
                        onClick={handleGetCurrentLocation}
                        disabled={disabled || isLoadingLocation}
                        className="px-4 h-11 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-medium transition whitespace-nowrap flex items-center gap-2"
                        title="Usar mi ubicación actual"
                    >
                        {isLoadingLocation ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        )}
                        <span className="hidden sm:inline">Ubicación</span>
                    </button>
                )}
            </div>

            {/* Dropdown de Sugerencias */}
            {showSuggestions && activeSuggestions.length > 0 && (
                <div className="absolute z-[9999] w-full mt-2 bg-[#0f1629] border-2 border-sky-500/50 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    {activeSuggestions.map((item, idx) => {
                        // Detectar si es Google (structured_formatting) o Fallback
                        const isGoogle = !!item.structured_formatting;
                        const mainText = isGoogle
                            ? item.structured_formatting.main_text
                            : (item.nombre || item.display_name);
                        const subText = isGoogle
                            ? item.structured_formatting.secondary_text
                            : (item.direccion || "Ubicación");
                        const key = item.place_id || item.id || idx;

                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => handleSelectSuggestion(item)}
                                className="w-full text-left px-4 py-3 hover:bg-sky-600/40 transition border-b border-white/5 last:border-b-0"
                            >
                                <div className="font-semibold text-white truncate">{mainText}</div>
                                <div className="text-xs text-slate-400 truncate">{subText}</div>
                            </button>
                        );
                    })}
                    {(!loadError && isLoaded) && (
                        <div className="px-2 py-1 flex justify-end border-t border-white/5">
                            <img src="https://developers.google.com/maps/documentation/images/powered_by_google_on_non_white.png" alt="Powered by Google" className="h-4 opacity-70" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
