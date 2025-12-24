import apiClient from '../api/client';

const detalleService = {
  // Obtener todas las paradas con detalles
  obtenerParadasDetalle: async () => {
    try {
      const response = await apiClient.get('/api/paradas/detalle');
      console.log('Respuesta de paradas/detalle:', response.data);
      const paradas = response.data.paradas || response.data || [];
      return {
        success: response.data.success !== false,
        data: Array.isArray(paradas) ? paradas : []
      };
    } catch (error) {
      console.error('Error al obtener paradas detalladas:', error);
      console.error('Detalles del error:', error.response?.data || error.message);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Error al obtener paradas'
      };
    }
  },

  // Obtener todas las rutas con detalles
  obtenerRutasDetalle: async () => {
    try {
      const response = await apiClient.get('/api/rutas/detalle');
      console.log('Respuesta de rutas/detalle:', response.data);
      const rutas = response.data.rutas || response.data || [];
      return {
        success: response.data.success !== false,
        data: Array.isArray(rutas) ? rutas : []
      };
    } catch (error) {
      console.error('Error al obtener rutas detalladas:', error);
      console.error('Detalles del error:', error.response?.data || error.message);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Error al obtener rutas'
      };
    }
  },

  // Obtener todos los buses con detalles
  obtenerBusesDetalle: async () => {
    try {
      const response = await apiClient.get('/api/buses/detalle');
      console.log('Respuesta de buses/detalle:', response.data);
      const buses = response.data.buses || response.data || [];
      return {
        success: response.data.success !== false,
        data: Array.isArray(buses) ? buses : []
      };
    } catch (error) {
      console.error('Error al obtener buses detallados:', error);
      console.error('Detalles del error:', error.response?.data || error.message);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Error al obtener buses'
      };
    }
  }
};

export default detalleService;

