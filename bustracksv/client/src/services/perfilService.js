import apiClient from '../api/client';

const perfilService = {
  // Obtener perfil del usuario
  obtenerPerfil: async () => {
    try {
      const response = await apiClient.get('/perfil');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener perfil'
      };
    }
  },

  // Actualizar perfil del usuario
  actualizarPerfil: async (datosActualizados) => {
    try {
      const response = await apiClient.put('/perfil', datosActualizados);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar perfil'
      };
    }
  },

  // Cambiar contraseña
  cambiarPassword: async (passwordActual, passwordNueva) => {
    try {
      const response = await apiClient.put('/perfil/password', {
        password_actual: passwordActual,
        password_nueva: passwordNueva
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al cambiar contraseña'
      };
    }
  },

  // Convertir imagen a base64
  convertirImagenABase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  },

  // Alias para compatibilidad
  getPerfil: function() {
    return this.obtenerPerfil();
  },

  updatePerfil: function(datos) {
    return this.actualizarPerfil(datos);
  }
};

export default perfilService;



