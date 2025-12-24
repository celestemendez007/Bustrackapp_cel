import { createContext, useContext, useMemo } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

const libraries = ['geometry', 'places'];

// Validar si la key parece real (no vacía ni el default)
const isValidKey = (key) => {
  return key && key !== 'YOUR_API_KEY_HERE' && typeof key === 'string' && key.trim() !== '';
};

const getApiKey = () => {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return isValidKey(key) ? String(key).trim() : '';
};

const GoogleMapsContext = createContext(null);

// Componente interno que SÍ usa el hook (solo se renderiza si hay key)
function InnerGoogleMapsProvider({ children, apiKey }) {
  const loaderOptions = useMemo(() => ({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries
  }), [apiKey]);

  const { isLoaded, loadError } = useJsApiLoader(loaderOptions);

  const value = useMemo(() => ({
    isLoaded,
    loadError,
    apiKey,
    libraries
  }), [isLoaded, loadError, apiKey]);

  return (
    <GoogleMapsContext.Provider value={value}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

// Wrapper que decide qué renderizar
export function GoogleMapsProvider({ children }) {
  const apiKey = useMemo(() => getApiKey(), []);
  const hasValidKey = isValidKey(apiKey);

  if (hasValidKey) {
    return <InnerGoogleMapsProvider apiKey={apiKey}>{children}</InnerGoogleMapsProvider>;
  }

  // Fallback seguro sin intentar cargar el script
  const safeValue = {
    isLoaded: false,
    loadError: new Error("La clave API de Google Maps no está configurada"),
    apiKey: '',
    libraries
  };

  return (
    <GoogleMapsContext.Provider value={safeValue}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

export function useGoogleMaps() {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error('useGoogleMaps must be used within GoogleMapsProvider');
  }
  return context;
}

