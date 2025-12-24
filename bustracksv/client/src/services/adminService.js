import apiClient from "../api/client.js";

class AdminService {
  // Rutas
  async getRutas() {
    try {
      const response = await apiClient.get("/admin/rutas");
      return { success: true, data: response.data.data || [] };
    } catch (error) {
      console.error("Error al obtener rutas:", error);
      return { success: false, message: error.response?.data?.message || "Error al obtener rutas", data: [] };
    }
  }

  async createRuta(rutaData) {
    try {
      const response = await apiClient.post("/admin/rutas", rutaData);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error("Error al crear ruta:", error);
      return { success: false, message: error.response?.data?.message || "Error al crear ruta" };
    }
  }

  async updateRuta(id, rutaData) {
    try {
      const response = await apiClient.put(`/admin/rutas/${id}`, rutaData);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error("Error al actualizar ruta:", error);
      return { success: false, message: error.response?.data?.message || "Error al actualizar ruta" };
    }
  }

  async deleteRuta(id) {
    try {
      await apiClient.delete(`/admin/rutas/${id}`);
      return { success: true };
    } catch (error) {
      console.error("Error al eliminar ruta:", error);
      return { success: false, message: error.response?.data?.message || "Error al eliminar ruta" };
    }
  }

  // Paradas
  async getParadas() {
    try {
      const response = await apiClient.get("/admin/paradas");
      return { success: true, data: response.data.data || [] };
    } catch (error) {
      console.error("Error al obtener paradas:", error);
      return { success: false, message: error.response?.data?.message || "Error al obtener paradas", data: [] };
    }
  }

  async createParada(paradaData) {
    try {
      const response = await apiClient.post("/admin/paradas", paradaData);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error("Error al crear parada:", error);
      return { success: false, message: error.response?.data?.message || "Error al crear parada" };
    }
  }

  async updateParada(id, paradaData) {
    try {
      const response = await apiClient.put(`/admin/paradas/${id}`, paradaData);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error("Error al actualizar parada:", error);
      return { success: false, message: error.response?.data?.message || "Error al actualizar parada" };
    }
  }

  async deleteParada(id) {
    try {
      await apiClient.delete(`/admin/paradas/${id}`);
      return { success: true };
    } catch (error) {
      console.error("Error al eliminar parada:", error);
      return { success: false, message: error.response?.data?.message || "Error al eliminar parada" };
    }
  }

  // Asociar parada a ruta
  async asociarParadaRuta(rutaId, paradaData) {
    try {
      const response = await apiClient.post(`/admin/rutas/${rutaId}/paradas`, paradaData);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error("Error al asociar parada:", error);
      return { success: false, message: error.response?.data?.message || "Error al asociar parada" };
    }
  }

  // Obtener paradas de una ruta específica
  async getRouteParadas(rutaId) {
    try {
      const response = await apiClient.get(`/api/rutas/${rutaId}/paradas`);
      // Endpoint público retorna array, pero aseguremos consistencia
      const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
      return { success: true, data };
    } catch (error) {
      console.error("Error al obtener paradas de la ruta:", error);
      return { success: false, message: "Error al obtener paradas de la ruta", data: [] };
    }
  }

  // Eliminar parada de ruta
  async deleteParadaRuta(rutaId, paradaId) {
    try {
      await apiClient.delete(`/admin/rutas/${rutaId}/paradas/${paradaId}`);
      return { success: true };
    } catch (error) {
      console.error("Error al eliminar parada de ruta:", error);
      return { success: false, message: error.response?.data?.message || "Error al eliminar parada de ruta" };
    }
  }

  // Usuarios de gobierno
  async getUsuarios() {
    try {
      const response = await apiClient.get("/admin/usuarios");
      return { success: true, data: response.data.data || [] };
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      return { success: false, message: error.response?.data?.message || "Error al obtener usuarios", data: [] };
    }
  }

  async createUsuarioGobierno(usuarioData) {
    try {
      const response = await apiClient.post("/admin/usuarios", usuarioData);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error("Error al crear usuario:", error);
      return { success: false, message: error.response?.data?.message || "Error al crear usuario" };
    }
  }

  async updateUsuarioRol(id, rol) {
    try {
      const response = await apiClient.put(`/admin/usuarios/${id}/rol`, { rol });
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error("Error al actualizar rol:", error);
      return { success: false, message: error.response?.data?.message || "Error al actualizar rol" };
    }
  }

  async deleteUsuario(id) {
    try {
      await apiClient.delete(`/admin/usuarios/${id}`);
      return { success: true };
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      return { success: false, message: error.response?.data?.message || "Error al eliminar usuario" };
    }
  }

  // Geocoding y Routing
  async geocodeTexto(texto) {
    try {
      const response = await apiClient.post("/admin/geocode", { texto });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error en geocoding:", error);
      return { success: false, message: error.response?.data?.message || "Error al geocodificar texto" };
    }
  }

  async calcularRuta(coordenadas) {
    try {
      const response = await apiClient.post("/admin/route", { coordenadas });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error en routing:", error);
      return { success: false, message: error.response?.data?.message || "Error al calcular ruta" };
    }
  }

  async procesarRutaDesdeTexto(texto) {
    try {
      // Usar el endpoint unificado
      const response = await apiClient.post("/admin/generate-route-from-text", { text: texto }, { timeout: 120000 });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error al procesar ruta desde texto:", error);
      const errorMessage = error.response?.data?.message || error.message || "Error al procesar la ruta";
      return { success: false, message: errorMessage };
    }
  }

  async procesarRutaDesdeDescripcion(descripcion) {
    try {
      const response = await apiClient.post("/admin/generate-route-from-text", { text: descripcion }, { timeout: 120000 });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error al procesar descripción de ruta:", error);
      const errorMessage = error.response?.data?.message || error.message || "Error al procesar la descripción";
      return { success: false, message: errorMessage };
    }
  }

  // Método unificado para generar rutas desde texto (alias para compatibilidad)
  // generado por duplicado eliminado


  // AI Route Creator (New)
  async generateRoute(text) {
    try {
      // Usar el endpoint unificado con timeout extendido
      // Crear una instancia temporal con timeout más largo para esta petición
      const response = await apiClient.post("/admin/generate-route-from-text", { text }, {
        timeout: 120000 // 120 segundos
      });
      return { success: true, data: response.data.data || response.data };
    } catch (error) {
      console.error("Error generating route:", error);
      let errorMessage = "Error al generar ruta";

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = "El servidor tardó demasiado en responder. Intenta de nuevo.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { success: false, message: errorMessage };
    }
  }

  async saveGeneratedRoute(routeData) {
    try {
      const response = await apiClient.post("/admin/save-route", routeData);
      return { success: true, id: response.data.id };
    } catch (error) {
      console.error("Error saving route:", error);
      return { success: false, message: error.response?.data?.message || "Error al guardar ruta" };
    }
  }

  // Integración "fuerza bruta" solicitada
  async guardarRutaReal(datos) {
    try {
      // Enviar al backend (endpoint nuevo)
      // datos debe ser { numero, nombre, puntos: [{lat, lng}, ...] }
      const response = await apiClient.post('/admin/guardar-ruta', datos);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error al guardar ruta real:", error);
      return { success: false, message: error.response?.data?.message || "Error de servidor" };
    }
  }
}


export default new AdminService();

