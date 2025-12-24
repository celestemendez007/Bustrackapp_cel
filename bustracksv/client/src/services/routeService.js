import apiClient from "../api/client.js";

class RouteService {
  // Obtener todas las paradas
  async getParadas() {
    try {
      const response = await apiClient.get("/api/paradas");

      // El servidor devuelve un array directamente, pero necesitamos normalizarlo
      const paradas = Array.isArray(response.data) ? response.data : [];

      // Agregar total_rutas si no existe (para compatibilidad con el código)
      const paradasConRutas = await Promise.all(
        paradas.map(async (parada) => {
          try {
            // Intentar obtener el conteo de rutas para esta parada
            // Por ahora, retornamos la parada sin modificar
            return {
              ...parada,
              latitud: parseFloat(parada.latitud),
              longitud: parseFloat(parada.longitud),
              total_rutas: parada.total_rutas || 0
            };
          } catch (error) {
            return {
              ...parada,
              latitud: parseFloat(parada.latitud),
              longitud: parseFloat(parada.longitud),
              total_rutas: 0
            };
          }
        })
      );

      return {
        success: true,
        data: paradasConRutas
      };
    } catch (error) {
      console.error("Error al obtener paradas:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Error al obtener paradas",
        data: []
      };
    }
  }

  // Obtener todas las rutas
  async getRutas() {
    try {
      const response = await apiClient.get("/api/rutas");
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : []
      };
    } catch (error) {
      console.error("Error al obtener rutas:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Error al obtener rutas",
        data: []
      };
    }
  }

  // Obtener paradas cercanas a una ubicación
  async getParadasCercanas(lat, lng, radio = 500) {
    try {
      const response = await apiClient.get("/api/paradas-cercanas", {
        params: {
          lat,
          lng,
          radio,
          limite: 10
        }
      });

      if (response.data.success && response.data.paradas) {
        // Normalizar la respuesta: el servidor devuelve paradas con distancia_metros
        // pero MapPage espera distancia
        const paradas = response.data.paradas.map(parada => ({
          ...parada,
          distancia: parada.distancia_metros || 0,
          latitud: parseFloat(parada.latitud),
          longitud: parseFloat(parada.longitud)
        }));

        return {
          success: true,
          data: paradas
        };
      } else {
        return {
          success: false,
          message: response.data.message || "No se encontraron paradas cercanas",
          data: []
        };
      }
    } catch (error) {
      console.error("Error al obtener paradas cercanas:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Error al obtener paradas cercanas",
        data: []
      };
    }
  }

  // Recomendar ruta (AHORA USANDO EL BUSCADOR VISUAL REAL)
  async recomendarRuta(inicioLat, inicioLng, destinoLat, destinoLng, radio = 5000) {
    try {
      const response = await apiClient.post("/api/buscar-mejor-ruta", {
        origen: { lat: parseFloat(inicioLat), lng: parseFloat(inicioLng) },
        destino: { lat: parseFloat(destinoLat), lng: parseFloat(destinoLng) }
      });

      const recomendacionesRaw = response.data.recomendaciones || [];

      if (recomendacionesRaw.length === 0) {
        return { success: false, message: "No se encontraron rutas" };
      }

      // Adaptar respuesta del Grafo al formato frontend
      const recomendacionesAdaptadas = recomendacionesRaw.map((rec, index) => {
        // Mapear segmentos para asegurar compatibilidad de nombres (geometria -> geometry)
        const segmentosAdaptados = (rec.segmentos || []).map(seg => ({
          ...seg,
          geometry: seg.geometria || seg.geometry || [], // Normalizar
          tipo: seg.tipo ? seg.tipo.toLowerCase() : 'walk',
          modo: seg.tipo ? seg.tipo.toUpperCase() : 'WALK',
          // Asegurar campos para Bus
          ruta: seg.tipo === 'BUS' ? {
            numero_ruta: seg.numero,
            nombre: seg.nombre || `Ruta ${seg.numero}`,
            color: seg.color || '#0000FF',
            tarifa: seg.tarifa || 0.25
          } : null,
          fromStop: seg.fromStop || null, // Si viene del back
          toStop: seg.toStop || null
        }));

        // Calcular tarifa total
        const tarifaTotal = segmentosAdaptados.reduce((acc, s) => {
          if (s.tipo === 'bus') {
             // Priorizar la tarifa que viene en 'ruta', sino usar el default de 0.25
             const precio = (s.ruta && s.ruta.tarifa) ? parseFloat(s.ruta.tarifa) : 0.25;
             return acc + precio;
          }
          return acc;
        }, 0);

        return {
          id: `rec-${index}`,
          resumen: rec.resumen,
          score: rec.total_caminata_metros, // Score basado en caminata
          transbordos: segmentosAdaptados.filter(s => s.subtipo === 'TRANSFER').length,
          distanciaTotalMetros: segmentosAdaptados.reduce((acc, s) => acc + (s.distancia || 0), 0),
          segmentos: segmentosAdaptados,
          tarifaTotal: tarifaTotal.toFixed(2),
          // Legacy fields para evitar crash si algo los busca
          distanciaCaminataOrigenMetros: (segmentosAdaptados[0] && segmentosAdaptados[0].tipo === 'walk') ? segmentosAdaptados[0].distancia : 0,
          distanciaCaminataDestinoMetros: 0
        };
      });

      return {
        success: true,
        data: {
          recomendaciones: recomendacionesAdaptadas,
          mensaje: "Ruta optimizada encontrada",
          origen: { lat: inicioLat, lng: inicioLng },
          destino: { lat: destinoLat, lng: destinoLng }
        }
      };
    } catch (error) {
      console.error("Error al obtener ruta:", error);
      return { success: false, message: "Error al conectar con el servicio de rutas" };
    }
  }
}

// Exportar instancia singleton
export default new RouteService();
