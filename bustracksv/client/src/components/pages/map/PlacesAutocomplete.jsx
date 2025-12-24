import { useState, useEffect, useRef } from 'react';
import { useGoogleMaps } from '../../../contexts/GoogleMapsContext';

export default function PlacesAutocomplete({
    value,
    onChange,
    onSelect,
    suggestions: externalSuggestions = [], // Sugerencias del fallback (paradas + Nominatim)
    label,
    placeholder,
    onGetLocation // Callback para obtener ubicación actual
}) {
    const { isLoaded, loadError } = useGoogleMaps();
    const [suggestions, setSuggestions] = useState([]);
    const [autocompleteService, setAutocompleteService] = useState(null);
    const [placesService, setPlacesService] = useState(null);
    const [sessionToken, setSessionToken] = useState(null);

    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (isLoaded && window.google && !autocompleteService) {
            setAutocompleteService(new window.google.maps.places.AutocompleteService());
            // PlacesService requires a dummy div if not attached to map, but we just need Details
            const dummyDiv = document.createElement('div');
            setPlacesService(new window.google.maps.places.PlacesService(dummyDiv));
            setSessionToken(new window.google.maps.places.AutocompleteSessionToken());
        }
    }, [isLoaded, autocompleteService]);

    // Click outside to close
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
        const val = e.target.value;
        onChange(val);
        
        if (!val || val.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setShowSuggestions(true);

        // Si hay error de Google o no está cargado, las sugerencias externas se manejan en el padre
        if (loadError || !isLoaded || !autocompleteService) {
            // Las sugerencias externas se actualizan desde el componente padre
            // Solo necesitamos mostrar las que ya están disponibles
            return;
        }

        // Si Google Places está disponible, usarlo como fuente principal
        const request = {
            input: val,
            sessionToken: sessionToken,
            componentRestrictions: { country: 'sv' }, // Limit to El Salvador
            types: ['establishment', 'geocode'] // Incluir lugares y direcciones
        };

        autocompleteService.getPlacePredictions(request, (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                setSuggestions(predictions);
            } else {
                // Si Google Places falla, usar fallback
                setSuggestions([]);
            }
        });
    };

    const handleSelect = (item) => {
        // Si es una sugerencia de Google Places
        if (item.place_id && placesService) {
            onChange(item.description);
            setShowSuggestions(false);

            const request = {
                placeId: item.place_id,
                fields: ['name', 'geometry', 'formatted_address'],
                sessionToken: sessionToken
            };

            placesService.getDetails(request, (place, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry) {
                    onSelect({
                        nombre: place.name || item.description,
                        direccion: place.formatted_address,
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                        place_id: item.place_id
                    });
                    setSessionToken(new window.google.maps.places.AutocompleteSessionToken());
                }
            });
        } else {
            // Si es una sugerencia del fallback (paradas o Nominatim)
            onChange(item.nombre);
            setShowSuggestions(false);
            onSelect(item);
        }
    };

    // Determinar qué sugerencias mostrar
    // Prioridad: Google Places si está disponible, sino usar fallback
    const useGoogleSuggestions = !loadError && isLoaded && autocompleteService;
    const combinedSuggestions = useGoogleSuggestions ? suggestions : externalSuggestions;

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
                    onFocus={() => {
                        if (value && value.length >= 3) {
                            setShowSuggestions(true);
                        }
                    }}
                    placeholder={placeholder}
                    className="flex-1 h-11 px-4 rounded-xl border-2 border-white/20 bg-[#141a35] text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none transition"
                    autoComplete="off"
                    disabled={false} // Siempre habilitado para permitir fallback
                />
                {onGetLocation && (
                    <button
                        type="button"
                        onClick={onGetLocation}
                        className="px-4 h-11 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium transition whitespace-nowrap"
                        title="Usar mi ubicación actual"
                    >
                        Mi Ubicación
                    </button>
                )}
            </div>

            {showSuggestions && combinedSuggestions.length > 0 && (
                <div className="absolute z-[9999] w-full mt-2 bg-[#0f1629] border-2 border-sky-500/50 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    {combinedSuggestions.map((item, index) => {
                        // Determinar si es una sugerencia de Google Places o del fallback
                        const isGooglePlace = item.place_id && item.structured_formatting;
                        const key = isGooglePlace ? item.place_id : (item.id || item.place_id || `suggestion-${index}`);
                        
                        return (
                            <button
                                key={key}
                                onClick={() => handleSelect(item)}
                                onMouseDown={(e) => e.preventDefault()}
                                className="w-full text-left px-4 py-3 hover:bg-sky-600/40 transition border-b border-white/5 last:border-b-0 group"
                            >
                                <div className="font-semibold text-white group-hover:text-sky-300 transition">
                                    {isGooglePlace 
                                        ? item.structured_formatting.main_text 
                                        : (item.nombre || item.display_name)}
                                </div>
                                <div className="text-xs text-slate-400">
                                    {isGooglePlace 
                                        ? item.structured_formatting.secondary_text 
                                        : (item.descripcion || item.display_name || item.direccion || '')}
                                </div>
                            </button>
                        );
                    })}
                    {!loadError && isLoaded && suggestions.length > 0 && (
                        <div className="px-2 py-1 flex justify-end">
                            <img src="https://developers.google.com/maps/documentation/images/powered_by_google_on_non_white.png" alt="Powered by Google" className="h-4 opacity-70" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
