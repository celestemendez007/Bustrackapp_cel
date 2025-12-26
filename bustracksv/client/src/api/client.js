import axios from "axios";

// Configuración base del cliente Axios
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

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
