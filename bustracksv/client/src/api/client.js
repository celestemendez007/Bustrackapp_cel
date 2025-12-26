import axios from "axios";

// Detectar la URL del API automáticamente
const getApiBaseUrl = () => {
  // Si hay una variable de entorno, usarla
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Si estamos en desarrollo, usar localhost
  if (import.meta.env.DEV) {
    return "http://localhost:4000";
  }
  
  // En producción, usar la URL correcta del backend en Render
  // Si el frontend está en Render, el backend debería estar en bustrackapp-cel.onrender.com
  if (window.location.hostname.includes('render.com') || window.location.hostname.includes('onrender.com')) {
    return "https://bustrackapp-cel.onrender.com";
  }
  
  // Fallback: localhost para desarrollo local
  return "http://localhost:4000";
};

// Configuración base del cliente Axios
const API_BASE_URL = getApiBaseUrl();

// Crear instancia de Axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para requests - agregar token automáticamente
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("bustracksv:token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para responses - manejar errores globalmente
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Manejar errores de conexión
    if (!error.response) {
      // Error de red (servidor no disponible, CORS, etc.)
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        console.error('No se pudo conectar al servidor. Verifica que esté corriendo en:', API_BASE_URL);
        // No redirigir automáticamente, solo loguear el error
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.error('Request timeout:', error.config?.url);
      }
    }
    
    // Manejar errores de timeout
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      console.error('Request timeout:', error.config?.url);
    }
    
    // Si el token es inválido o expiró, limpiar localStorage
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("bustracksv:token");
      localStorage.removeItem("bustracksv:user");
      // Redirigir al login apropiado según la ruta
      const currentPath = window.location.pathname;
      if (currentPath.startsWith("/admin")) {
        // Si estamos en rutas de admin, redirigir a login de admin
        if (currentPath !== "/admin/login") {
          window.location.href = "/admin/login";
        }
      } else {
        // Si estamos en rutas normales, redirigir a login normal
        if (currentPath !== "/login") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
