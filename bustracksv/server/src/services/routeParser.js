import { GoogleGenerativeAI } from "@google/generative-ai";

class RouteParser {
  constructor(pool = null) {
    this.pool = pool;
    this.pool = pool;
    // La clave se leerá al momento de usarla para evitar problemas de orden de carga de env
    this.apiKey = null;
    // Lugares conocidos en El Salvador (base de conocimiento inicial)
    this.lugaresConocidos = {
      // Zonas y colonias
      'san marcos': { tipo: 'zona', busqueda: 'San Marcos, El Salvador' },
      'colonia 10 de octubre': { tipo: 'colonia', busqueda: 'Colonia 10 de Octubre, San Marcos, El Salvador' },
      'colonia el tránsito': { tipo: 'colonia', busqueda: 'Colonia El Tránsito, San Marcos, El Salvador' },
      'terminal del sur': { tipo: 'terminal', busqueda: 'Terminal del Sur, San Salvador' },
      'zona franca san marcos': { tipo: 'zona', busqueda: 'Zona Franca San Marcos, El Salvador' },
      'barrio san jacinto': { tipo: 'barrio', busqueda: 'Barrio San Jacinto, San Salvador' },
      'barrio modelo': { tipo: 'barrio', busqueda: 'Barrio Modelo, San Salvador' },
      'barrio candelaria': { tipo: 'barrio', busqueda: 'Barrio Candelaria, San Salvador' },
      'barrio concepción': { tipo: 'barrio', busqueda: 'Barrio Concepción, San Salvador' },
      'colonia miralvalle': { tipo: 'colonia', busqueda: 'Colonia Miralvalle, San Salvador' },

      // Calles y avenidas principales
      'carretera antigua a zacatecoluca': { tipo: 'carretera', busqueda: 'Carretera Antigua a Zacatecoluca, El Salvador' },
      'autopista a comalapa': { tipo: 'autopista', busqueda: 'Autopista a Comalapa, El Salvador' },
      'bulevar venezuela': { tipo: 'bulevar', busqueda: 'Bulevar Venezuela, San Salvador' },
      '25 avenida norte': { tipo: 'avenida', busqueda: '25 Avenida Norte, San Salvador' },
      'alameda roosevelt': { tipo: 'alameda', busqueda: 'Alameda Roosevelt, San Salvador' },
      'calle gabriela mistral': { tipo: 'calle', busqueda: 'Calle Gabriela Mistral, San Salvador' },
      'calle a san antonio abad': { tipo: 'calle', busqueda: 'Calle a San Antonio Abad, San Salvador' },

      // Puntos de referencia
      'ex-casa presidencial': { tipo: 'punto', busqueda: 'Ex Casa Presidencial, San Salvador' },
      'ex-zoológico nacional': { tipo: 'punto', busqueda: 'Ex Zoológico Nacional, San Salvador' },
      'calle modelo': { tipo: 'calle', busqueda: 'Calle Modelo, San Salvador' },
      'plaza el trovador': { tipo: 'plaza', busqueda: 'Plaza El Trovador, San Salvador' },
      'mercado belloso': { tipo: 'mercado', busqueda: 'Mercado Belloso, San Salvador' },
      'cementerio general': { tipo: 'punto', busqueda: 'Cementerio General, San Salvador' },
      'hospital pro-familia': { tipo: 'hospital', busqueda: 'Hospital Pro-Familia, San Salvador' },
      'hospital rosales': { tipo: 'hospital', busqueda: 'Hospital Rosales, San Salvador' },
      'parque cuscatlán': { tipo: 'parque', busqueda: 'Parque Cuscatlán, San Salvador' },
      'hospital de maternidad': { tipo: 'hospital', busqueda: 'Hospital de Maternidad, San Salvador' },
      'hospital prof. alberto masferrer': { tipo: 'hospital', busqueda: 'Hospital Prof. Alberto Masferrer, San Salvador' },
      'colegio la asunción': { tipo: 'colegio', busqueda: 'Colegio La Asunción, San Salvador' },
      'fuente luminosa': { tipo: 'punto', busqueda: 'Fuente Luminosa, San Salvador' },
      'universidad de el salvador': { tipo: 'universidad', busqueda: 'Universidad de El Salvador, San Salvador' },
      'la minerva': { tipo: 'punto', busqueda: 'La Minerva, Universidad de El Salvador, San Salvador' },
      'redondel constitución': { tipo: 'punto', busqueda: 'Redondel Constitución, San Salvador' },

      // Lugares comunes
      'metrocentro': { tipo: 'centro_comercial', busqueda: 'Metrocentro, San Salvador' },
      'soyapango': { tipo: 'municipio', busqueda: 'Soyapango, El Salvador' },
      'boulevard de los héroes': { tipo: 'bulevar', busqueda: 'Boulevard de los Héroes, San Salvador' },
    };
  }

  // Normalizar texto para búsqueda
  normalize(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .trim();
  }

  // Extraer lugares del texto descriptivo (versión mejorada)
  extractPlaces(text) {
    const normalized = this.normalize(text);
    const lugares = [];
    const lugaresEncontrados = new Set();

    // 1. Buscar lugares conocidos en la base de conocimiento
    for (const [key, info] of Object.entries(this.lugaresConocidos)) {
      if (normalized.includes(key)) {
        lugaresEncontrados.add(key);
        lugares.push({
          nombre: key,
          busqueda: info.busqueda,
          tipo: info.tipo,
          original: key,
          confianza: info.precision || 1.0
        });
      }
    }

    // 2. Extraer lugares con patrones específicos (mejorados)
    const patrones = [
      // Patrones de acción: "pasa por X", "recorre Y", etc.
      /(?:pasa por|pasa|recorre|atraviesa|baja|sube|entra|sale|llega a|desde|hasta|inicia en|termina en)\s+(?:las?|los?|el|la)?\s*([^,.:;()]+?)(?:\s*[.:;]|\s*\(|$)/gi,
      // Patrones de ubicación: "Colonia X", "Barrio Y", etc.
      /(?:Colonia|Barrio|Zona|Calle|Avenida|Boulevard|Bulevar|Autopista|Carretera|Terminal|Hospital|Parque|Plaza|Mercado|Universidad|Colegio|Redondel|Fuente)\s+([^,.:;()]+?)(?:\s*[.:;]|\s*\(|$)/gi,
      // Patrones de referencia: "cerca de X", "frente a Y", etc.
      /(?:cerca de|frente a|enfrente de|por el costado de|por las cercanías de|al lado de)\s+([^,.:;()]+?)(?:\s*[.:;]|\s*\(|$)/gi,
      // Patrones de puntos específicos: "X: Descripción"
      /^([^:]+?):\s*[^:]+$/gm,
      // Patrones de listas: "1. Lugar", "2. Lugar"
      /^\d+\.\s*([^:]+?)(?:\s*:|\s*$)/gm
    ];

    for (const patron of patrones) {
      const matches = [...text.matchAll(patron)];
      for (const match of matches) {
        let lugar = match[1] ? match[1].trim() : match[0].trim();

        // Limpiar el lugar
        lugar = lugar
          .replace(/^(las?|los?|el|la|un|una|unos|unas)\s+/i, '')
          .replace(/\s*\([^)]*\)/g, '') // Remover paréntesis
          .trim();

        if (lugar.length < 3) continue;

        const normalizedLugar = this.normalize(lugar);

        // Evitar duplicados
        if (!lugaresEncontrados.has(normalizedLugar) && lugar.length > 3) {
          lugaresEncontrados.add(normalizedLugar);

          // Determinar tipo basado en el contexto
          let tipo = 'desconocido';
          if (/colonia|barrio|zona/i.test(lugar)) tipo = 'zona';
          else if (/calle|avenida|boulevard|bulevar/i.test(lugar)) tipo = 'calle';
          else if (/hospital|clínica/i.test(lugar)) tipo = 'hospital';
          else if (/terminal|estación/i.test(lugar)) tipo = 'terminal';
          else if (/parque|plaza/i.test(lugar)) tipo = 'parque';
          else if (/universidad|colegio|escuela/i.test(lugar)) tipo = 'educacion';

          lugares.push({
            nombre: lugar,
            busqueda: `${lugar}, El Salvador`,
            tipo: tipo,
            original: lugar,
            confianza: 0.7 // Confianza media para lugares extraídos
          });
        }
      }
    }

    // 3. Extraer lugares de contexto (ej: "las zonas populares de San Marcos")
    const contextos = [
      /(?:zonas?|áreas?|regiones?)\s+(?:populares?|residenciales?|comerciales?)\s+(?:de|del|la|el)\s+([A-Z][^,.:;]+)/gi,
      /(?:calles?|vías?)\s+(?:principales?|secundarias?)\s+(?:de|del|la|el)\s+([A-Z][^,.:;]+)/gi
    ];

    for (const patron of contextos) {
      const matches = [...text.matchAll(patron)];
      for (const match of matches) {
        const lugar = match[1].trim();
        const normalizedLugar = this.normalize(lugar);

        if (!lugaresEncontrados.has(normalizedLugar) && lugar.length > 3) {
          lugaresEncontrados.add(normalizedLugar);
          lugares.push({
            nombre: lugar,
            busqueda: `${lugar}, El Salvador`,
            tipo: 'zona',
            original: lugar,
            confianza: 0.6
          });
        }
      }
    }

    // Ordenar por orden de aparición en el texto y confianza
    const lugaresOrdenados = lugares.sort((a, b) => {
      const indexA = normalized.indexOf(this.normalize(a.nombre));
      const indexB = normalized.indexOf(this.normalize(b.nombre));

      // Si ambos están en el texto, ordenar por posición
      if (indexA >= 0 && indexB >= 0) {
        return indexA - indexB;
      }

      // Si solo uno está, priorizar el que está
      if (indexA >= 0) return -1;
      if (indexB >= 0) return 1;

      // Si ninguno está (no debería pasar), ordenar por confianza
      return (b.confianza || 0) - (a.confianza || 0);
    });

    return lugaresOrdenados;
  }

  // Procesar descripción completa de ruta
  async processRouteDescription(text) {
    // Dividir en secciones si hay números o títulos
    const secciones = text.split(/\d+\.\s+/).filter(s => s.trim());

    const todosLosLugares = [];

    for (const seccion of secciones) {
      const lugares = this.extractPlaces(seccion);
      todosLosLugares.push(...lugares);
    }

    // Si no hay secciones, procesar todo el texto
    if (todosLosLugares.length === 0) {
      const lugares = this.extractPlaces(text);
      todosLosLugares.push(...lugares);
    }

    // Eliminar duplicados manteniendo el orden
    const lugaresUnicos = [];
    const vistos = new Set();

    for (const lugar of todosLosLugares) {
      const key = this.normalize(lugar.nombre);
      if (!vistos.has(key)) {
        vistos.add(key);
        lugaresUnicos.push(lugar);
      }
    }

    return lugaresUnicos;
  }

  // Procesado con IA (Gemini)
  async processRouteDescriptionWithAI(text) {
    const apiKey = this.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("No GEMINI_API_KEY provided, falling back to regex parser");
      return this.processRouteDescription(text);
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        Eres un asistente experto en geografía de El Salvador y análisis de rutas de transporte público.
        Tu tarea es extraer una lista ORDENADA de los lugares físicos por los que pasa la ruta descrita.
        
        Descripción: "${text}"

        INSTRUCCIONES:
        1. Extrae los nombres de lugares, calles, colonias o puntos de referencia.
        2. Formatéalos para que sean fáciles de encontrar en Google Maps (ej: "Nombre Lugar, Ciudad, El Salvador").
        3. Mantén estrictamente el orden del recorrido.
        4. Devuelve SOLO un arreglo JSON de strings. NADA MÁS.
        
        Ejemplo de salida:
        ["San Marcos, El Salvador", "Terminal del Sur, San Salvador", "Hospital Rosales, San Salvador"]
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let textResponse = response.text();

      // Limpiar markdown si existe
      textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

      const lugaresNombres = JSON.parse(textResponse);

      // Convertir al formato interno
      return lugaresNombres.map(nombre => ({
        nombre: nombre.split(',')[0].trim(), // Nombre corto para mostrar
        busqueda: nombre,
        tipo: 'punto', // Genérico por ahora
        original: nombre,
        confianza: 0.95
      }));

    } catch (error) {
      console.error("Error calling Gemini AI:", error);
      // Fallback a regex si falla la IA
      return this.processRouteDescription(text);
    }
  }

  // Nuevo método para extracción de Definición completa de Ruta (Admin Panel)
  async extractRouteDefinition(text) {
    const apiKey = this.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("No GEMINI_API_KEY provided, falling back to regex parser");
      // Fallback: usar el parser de regex para extraer lugares básicos
      const lugares = await this.processRouteDescription(text);
      if (lugares.length < 2) {
        throw new Error("No se encontraron suficientes lugares en la descripción. Intenta ser más específico o configura GEMINI_API_KEY para mejor procesamiento.");
      }
      
      // Construir una definición básica desde los lugares encontrados
      return {
        nombre_ruta: `Ruta ${lugares[0].nombre} - ${lugares[lugares.length - 1].nombre}`,
        descripcion: `Ruta que pasa por ${lugares.length} puntos`,
        puntos_clave: lugares.map(l => l.busqueda || l.nombre)
      };
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        Eres un arquitecto de transporte. Analiza el siguiente texto y extrae la definición técnica de la ruta de autobús.
        
        Texto: "${text}"
        
        Tu salida debe ser un JSON VÁLIDO con esta estructura exacta:
        {
          "nombre_ruta": "Nombre corto (Ej: Ruta 42B)",
          "descripcion": "Resumen breve de 1 linea",
          "puntos_clave": ["Origen exacto, Ciudad", "Punto Intermedio 1, Ciudad", "Punto Intermedio 2, Ciudad", "Destino final, Ciudad"]
        }

        REGLAS:
        1. "puntos_clave" debe tener nombres completos geocodificables (agrega ", El Salvador" si es necesario).
        2. Debe haber al menos 4 puntos para asegurar buena geometría.
        3. Ordena los puntos lógicamente según el recorrido descrito.
        4. NO incluyas markdown. Solo el JSON raw.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Limpieza robusta de Markdown/JSON
      text = text.replace(/```json/g, '').replace(/```/g, '');
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        text = text.substring(firstBrace, lastBrace + 1);
      }

      return JSON.parse(text);
    } catch (error) {
      console.error("AI Route Extraction Failed:", error);
      console.warn("Falling back to regex parser...");
      
      // Fallback: usar el parser de regex
      const lugares = await this.processRouteDescription(text);
      if (lugares.length < 2) {
        throw new Error("No se pudieron extraer suficientes lugares de la descripción. Intenta ser más específico con los nombres de los lugares.");
      }
      
      // Construir una definición básica desde los lugares encontrados
      return {
        nombre_ruta: `Ruta ${lugares[0].nombre} - ${lugares[lugares.length - 1].nombre}`,
        descripcion: `Ruta que pasa por ${lugares.length} puntos principales`,
        puntos_clave: lugares.map(l => l.busqueda || `${l.nombre}, El Salvador`)
      };
    }
  }

  // Agregar nuevo lugar al conocimiento (para entrenamiento)
  addKnownPlace(nombre, busqueda, tipo = 'desconocido') {
    const key = this.normalize(nombre);
    this.lugaresConocidos[key] = {
      tipo,
      busqueda: busqueda || `${nombre}, El Salvador`
    };
  }

  // Cargar lugares aprendidos de la base de datos
  async loadLearnedPlaces() {
    if (!this.pool) return;

    try {
      const result = await this.pool.query(`
        SELECT nombre, nombre_normalizado, busqueda, tipo, coordenadas, veces_usado, precision
        FROM lugares_aprendidos
        ORDER BY veces_usado DESC, precision DESC
      `);

      for (const lugar of result.rows) {
        const key = lugar.nombre_normalizado;
        this.lugaresConocidos[key] = {
          tipo: lugar.tipo || 'desconocido',
          busqueda: lugar.busqueda,
          coordenadas: lugar.coordenadas ? JSON.parse(lugar.coordenadas) : null,
          veces_usado: lugar.veces_usado || 1,
          precision: lugar.precision || 1.0
        };
      }

      console.log(`Cargados ${result.rows.length} lugares aprendidos de la base de datos`);
    } catch (err) {
      console.error('Error al cargar lugares aprendidos:', err);
    }
  }

  // Guardar lugar aprendido en la base de datos
  async saveLearnedPlace(nombre, busqueda, tipo, coordenadas = null) {
    if (!this.pool) return;

    try {
      const nombreNormalizado = this.normalize(nombre);

      // Verificar si ya existe
      const existing = await this.pool.query(
        "SELECT id, veces_usado FROM lugares_aprendidos WHERE nombre_normalizado = $1",
        [nombreNormalizado]
      );

      if (existing.rows.length > 0) {
        // Actualizar: incrementar veces_usado y actualizar fecha
        // Detectar si es PostgreSQL (cloud) o SQLite (local)
        const isPostgreSQL = process.env.DATABASE_URL || process.env.DB_HOST;
        const nowFunction = isPostgreSQL ? 'NOW()' : "datetime('now')";
        await this.pool.query(
          `UPDATE lugares_aprendidos 
           SET veces_usado = veces_usado + 1, 
               fecha_ultimo_uso = ${nowFunction},
               busqueda = $1,
               coordenadas = $2
           WHERE nombre_normalizado = $3`,
          [busqueda, coordenadas ? JSON.stringify(coordenadas) : null, nombreNormalizado]
        );
      } else {
        // Insertar nuevo
        await this.pool.query(
          `INSERT INTO lugares_aprendidos (nombre, nombre_normalizado, busqueda, tipo, coordenadas)
           VALUES ($1, $2, $3, $4, $5)`,
          [nombre, nombreNormalizado, busqueda, tipo, coordenadas ? JSON.stringify(coordenadas) : null]
        );
      }
    } catch (err) {
      console.error('Error al guardar lugar aprendido:', err);
    }
  }

  // Guardar ejemplo de entrenamiento
  async saveTrainingExample(descripcion, lugaresExtraidos, coordenadas, exitoso = true, feedback = null) {
    if (!this.pool) return;

    try {
      await this.pool.query(
        `INSERT INTO ejemplos_entrenamiento (descripcion_original, lugares_extraidos, coordenadas_resultantes, resultado_exitoso, feedback)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          descripcion,
          JSON.stringify(lugaresExtraidos),
          JSON.stringify(coordenadas),
          exitoso ? 1 : 0,
          feedback
        ]
      );
    } catch (err) {
      console.error('Error al guardar ejemplo de entrenamiento:', err);
    }
  }

  // Mejorar extracción basándose en ejemplos anteriores
  async improveFromExamples() {
    if (!this.pool) return;

    try {
      const result = await this.pool.query(`
        SELECT descripcion_original, lugares_extraidos, coordenadas_resultantes
        FROM ejemplos_entrenamiento
        WHERE resultado_exitoso = 1
        ORDER BY fecha_creacion DESC
        LIMIT 100
      `);

      // Analizar patrones comunes en ejemplos exitosos
      for (const ejemplo of result.rows) {
        const lugares = JSON.parse(ejemplo.lugares_extraidos);
        // Aquí se podrían extraer patrones y mejorar el parser
        // Por ahora solo cargamos los lugares aprendidos
      }
    } catch (err) {
      console.error('Error al mejorar desde ejemplos:', err);
    }
  }
}

export default RouteParser;
