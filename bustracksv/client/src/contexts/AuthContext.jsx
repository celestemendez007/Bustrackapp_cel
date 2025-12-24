import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService.js';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar autenticación al cargar la aplicación
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Si hay un token guardado, validarlo
        if (authService.isAuthenticated()) {
          const result = await authService.validateToken();
          if (result.success) {
            setUser(result.user);
          } else {
            // Token inválido, limpiar datos
            authService.logout();
            setUser(null);
          }
        } else {
          // No hay token, usuario no autenticado
          setUser(null);
        }
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
        // Si es un error de conexión, no limpiar el token (podría ser temporal)
        if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || error.message?.includes('timeout')) {
          console.warn('No se pudo conectar al servidor. Verifica que esté corriendo y que la URL sea correcta.');
        } else {
          authService.logout();
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Función para iniciar sesión
  const login = async (credentials) => {
    try {
      setLoading(true);
      const result = await authService.login(credentials);
      
      if (result.success) {
        setUser(result.user);
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, message: 'Error inesperado al iniciar sesión' };
    } finally {
      setLoading(false);
    }
  };

  // Función para registrar usuario
  const register = async (userData) => {
    try {
      setLoading(true);
      const result = await authService.register(userData);
      
      if (result.success) {
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Error en registro:', error);
      return { success: false, message: 'Error inesperado al registrar usuario' };
    } finally {
      setLoading(false);
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    authService.logout();
    setUser(null);
  };


  // Función para verificar si está autenticado
  const isAuthenticated = () => {
    return !!user;
  };

  // Función para actualizar el usuario (útil después de actualizar el perfil)
  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};