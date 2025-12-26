import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import adminService from "../../../services/adminService.js";
import RouteGeometryEditor from "./RouteGeometryEditor.jsx";
import RouteAdmin from "./RouteAdmin.jsx";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("rutas");
  const [rutas, setRutas] = useState([]);
  const [paradas, setParadas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();

  // Estados para gestión de paradas en ruta
  const [routeStops, setRouteStops] = useState([]);
  const [loadingStops, setLoadingStops] = useState(false);
  const [showStopForm, setShowStopForm] = useState(false);
  const [stopFormData, setStopFormData] = useState({
    nombre: "",
    codigo: "",
    latitud: "",
    longitud: "",
    direccion: "",
    tiene_techo: false,
    tiene_asientos: false,
    accesible: false,
    activa: true,
    orden: 0
  });

  useEffect(() => {
    // Verificar autenticación (usar las mismas claves que apiClient)
    const userStr = localStorage.getItem('bustracksv:user');
    if (!userStr) {
      navigate("/admin/login");
      return;
    }

    const user = JSON.parse(userStr);
    if (user.rol !== 'admin' && user.rol !== 'gobierno') {
      navigate("/admin/login");
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [rutasRes, paradasRes, usuariosRes] = await Promise.all([
        adminService.getRutas(),
        adminService.getParadas(),
        adminService.getUsuarios()
      ]);

      if (rutasRes.success) setRutas(rutasRes.data);
      if (paradasRes.success) setParadas(paradasRes.data);
      if (usuariosRes.success) setUsuarios(usuariosRes.data);

      if (!rutasRes.success || !paradasRes.success || !usuariosRes.success) {
        setError("Error al cargar datos");
      }
    } catch (err) {
      setError("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    if (activeTab === "rutas") {
      setFormData({
        nombre: "",
        numero_ruta: "",
        empresa: "",
        tipo: "Bus",
        tarifa: 0.25,
        color: "#0066CC",
        horario_inicio: "05:00:00",
        horario_fin: "21:00:00",
        frecuencia_minutos: 15,
        activa: true,
        geometry: ""
      });
    } else if (activeTab === "paradas") {
      setFormData({
        nombre: "",
        codigo: "",
        latitud: "",
        longitud: "",
        direccion: "",
        tipo: "Regular",
        tiene_techo: false,
        tiene_asientos: false,
        accesible: false,
        activa: true
      });
    } else if (activeTab === "usuarios") {
      setFormData({
        usuario: "",
        password: "",
        email: "",
        nombre_completo: "",
        telefono: "",
        rol: "gobierno"
      });
    }
    setShowModal(true);
  };

  const handleEdit = async (item) => {
    setEditingItem(item);
    setFormData({
      ...item,
      activa: item.activa === 1 || item.activa === true
    });

    // Si es ruta, cargar sus paradas y construir geometría desde paradas
    if (activeTab === "rutas") {
      setLoadingStops(true);
      setRouteStops([]);
      try {
        const res = await adminService.getRouteParadas(item.id);
        if (res.success) {
          setRouteStops(res.data);
          
          // Construir geometría desde las paradas guardadas
          const paradasIda = res.data
            .filter(p => p.direccion === 'ida' || !p.direccion)
            .sort((a, b) => (a.orden || 0) - (b.orden || 0));
          const paradasRegreso = res.data
            .filter(p => p.direccion === 'regreso')
            .sort((a, b) => (a.orden || 0) - (b.orden || 0));
          
          // Construir paths desde las coordenadas de las paradas
          const pathIda = paradasIda.map(p => ({
            lat: typeof p.latitud === 'number' ? p.latitud : parseFloat(p.latitud),
            lng: typeof p.longitud === 'number' ? p.longitud : parseFloat(p.longitud)
          })).filter(p => !isNaN(p.lat) && !isNaN(p.lng));
          
          const pathRegreso = paradasRegreso.map(p => ({
            lat: typeof p.latitud === 'number' ? p.latitud : parseFloat(p.latitud),
            lng: typeof p.longitud === 'number' ? p.longitud : parseFloat(p.longitud)
          })).filter(p => !isNaN(p.lat) && !isNaN(p.lng));
          
          // Si hay geometría guardada en item.geometry, usarla, sino construir desde paradas
          let geometry = item.geometry;
          if ((!geometry || geometry === '' || geometry === 'null') && (pathIda.length > 0 || pathRegreso.length > 0)) {
            geometry = JSON.stringify({ ida: pathIda, regreso: pathRegreso });
          }
          
          // Actualizar formData con la geometría
          setFormData(prev => ({
            ...prev,
            geometry: geometry || JSON.stringify({ ida: pathIda, regreso: pathRegreso })
          }));
        }
      } catch (err) {
        console.error("Error cargando paradas de ruta:", err);
      } finally {
        setLoadingStops(false);
      }
    }

    setShowModal(true);
  };

  const handleEditStop = (stop) => {
    setStopFormData({
      id: stop.id, // Store ID for updates
      nombre: stop.nombre || "",
      codigo: stop.codigo || "",
      latitud: stop.latitud,
      longitud: stop.longitud,
      direccion: stop.direccion || "",
      tiene_techo: stop.tiene_techo === 1 || stop.tiene_techo === true,
      tiene_asientos: stop.tiene_asientos === 1 || stop.tiene_asientos === true,
      accesible: stop.accesible === 1 || stop.accesible === true,
      activa: stop.activa === 1 || stop.activa === true,
      orden: stop.orden
    });
    setShowStopForm(true);
  };

  const handleAddStopToRoute = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      let nuevaParadaId;

      // Check if we are updating an existing stop or creating a new one
      if (stopFormData.id) {
        // Update existing stop
        const resUpdate = await adminService.updateParada(stopFormData.id, stopFormData);

        if (resUpdate.success) {
          // Update local list directly to reflect changes immediately
          setRouteStops(prev => prev.map(p => p.id === stopFormData.id ? { ...p, ...stopFormData } : p));
          nuevaParadaId = stopFormData.id; // Keep ID to maintain association if needed (though it already exists)
          alert("Parada actualizada correctamente.");

          // Clear form and close
          setShowStopForm(false);
          setStopFormData({
            nombre: "", codigo: "", latitud: "", longitud: "", direccion: "",
            tiene_techo: false, tiene_asientos: false, accesible: false, activa: true, orden: 0
          });
          return; // Exit after update
        } else {
          alert("Error al actualizar parada: " + resUpdate.message);
          return;
        }
      } else {
        // Create new stop
        const resCrear = await adminService.createParada(stopFormData);

        if (resCrear.success) {
          nuevaParadaId = resCrear.data.id;
        } else {
          if (resCrear.message && resCrear.message.includes("código")) {
            alert("⚠️ " + resCrear.message + "\nIntenta cambiar el código o usa una parada existente.");
            return;
          }
          alert("Error al crear parada: " + resCrear.message);
          return;
        }
      }

      // 2. Asociar a la ruta (Only for new stops)
      if (nuevaParadaId) {
        const asociacion = await adminService.asociarParadaRuta(editingItem.id, {
          paradaId: nuevaParadaId,
          orden: routeStops.length + 1
        });

        if (asociacion.success) {
          // Recargar lista
          const res = await adminService.getRouteParadas(editingItem.id);
          if (res.success) setRouteStops(res.data);

          setShowStopForm(false);
          setStopFormData({
            nombre: "", codigo: "", latitud: "", longitud: "", direccion: "",
            tiene_techo: false, tiene_asientos: false, accesible: false, activa: true, orden: 0
          });
        } else {
          alert("Error al asociar parada a la ruta: " + asociacion.message);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error inesperado: " + err.message);
    }
  };

  const handleDeleteStopFromRoute = async (paradaId) => {
    if (!editingItem || !confirm("¿Eliminar parada de esta ruta? \n\nNOTA: Esto solo quitará la parada de la ruta actual. Si deseas borrar la parada permanentemente de la base de datos, selecciona 'Borrar Permanentemente'.")) return;
    try {
      await adminService.deleteParadaRuta(editingItem.id, paradaId);
      setRouteStops(prev => prev.filter(p => p.id !== paradaId));
    } catch (err) {
      alert("Error al eliminar parada");
    }
  };

  const handleDeleteStopPermanently = async (paradaId) => {
    if (!confirm("⚠️ ¿Estás seguro de eliminar esta parada PERMANENTEMENTE? \n\nSe eliminará de TODAS las rutas que la usen y de la base de datos.")) return;

    try {
      const res = await adminService.deleteParada(paradaId);
      if (res.success) {
        // Eliminar de la lista local
        setRouteStops(prev => prev.filter(p => p.id !== paradaId));
        alert("Parada eliminada permanentemente.");
      } else {
        alert("Error al eliminar: " + res.message);
      }
    } catch (err) {
      alert("Error al eliminar parada de la base de datos");
    }
  };

  const handleGeometryChange = useCallback((geometry) => {
    setFormData(prev => {
      // Avoid infinite loop if value is same
      if (prev.geometry === geometry) return prev;
      return { ...prev, geometry };
    });
  }, []);

  const handleQuickSave = async (geometryJson, stopData) => {
    if (!editingItem) {
      alert("Para guardar una nueva ruta, usa el botón 'Crear' al final del formulario.");
      return;
    }

    try {
      // Parsear la geometría para enviarla como puntos crudos al backend (para puntos_ruta)
      let puntosIda = [];
      let puntosRegreso = [];
      try {
        const parsed = JSON.parse(geometryJson);
        if (parsed) {
          // El editor devuelve { ida: [...], regreso: [...] }
          if (Array.isArray(parsed.ida)) puntosIda = parsed.ida;
          if (Array.isArray(parsed.regreso)) puntosRegreso = parsed.regreso;
        }
      } catch (e) {
        console.error("Error parseando geometry para guardar:", e);
      }

      const payload = {
        ...formData,
        geometry: geometryJson,
        stops: stopData,
        puntos_ida: puntosIda,
        puntos_regreso: puntosRegreso
      };

      // Actualizar estado local
      setFormData(payload);

      const result = await adminService.updateRuta(editingItem.id, payload);

      if (result.success) {
        alert("✅ Ruta actualizada y guardada correctamente");

        // Recargar paradas si se actualizaron
        if (stopData) {
          try {
            const stopsRes = await adminService.getRouteParadas(editingItem.id);
            if (stopsRes.success) setRouteStops(stopsRes.data);
          } catch (e) {
            console.error("Error reloading stops:", e);
          }
        }

        loadData();
      } else {
        alert("❌ Error al guardar: " + (result.message || "Error desconocido"));
      }
    } catch (err) {
      console.error("Error saving route geometry:", err);
      alert("❌ Error al conectar con el servidor");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este elemento?")) return;

    let result;
    if (activeTab === "rutas") {
      result = await adminService.deleteRuta(id);
    } else if (activeTab === "paradas") {
      result = await adminService.deleteParada(id);
    } else if (activeTab === "usuarios") {
      result = await adminService.deleteUsuario(id);
    }

    if (result.success) {
      loadData();
    } else {
      alert(result.message || "Error al eliminar");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    let result;
    if (activeTab === "rutas") {
      result = editingItem
        ? await adminService.updateRuta(editingItem.id, formData)
        : await adminService.createRuta(formData);
    } else if (activeTab === "paradas") {
      result = editingItem
        ? await adminService.updateParada(editingItem.id, formData)
        : await adminService.createParada(formData);
    } else if (activeTab === "usuarios") {
      result = editingItem
        ? await adminService.updateUsuarioRol(editingItem.id, formData.rol)
        : await adminService.createUsuarioGobierno(formData);
    }

    if (result.success) {
      setShowModal(false);
      loadData();
    } else {
      setError(result.message || "Error al guardar");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bustracksv:token');
    localStorage.removeItem('bustracksv:user');
    navigate("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-yellow-500/30 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-yellow-400">Panel de Administración</h1>
            <p className="text-sm text-slate-400">Gobierno de El Salvador - BusTrackSV</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          <button
            onClick={() => setActiveTab("rutas")}
            className={`px-6 py-3 font-semibold transition ${activeTab === "rutas"
              ? "border-b-2 border-yellow-400 text-yellow-400"
              : "text-slate-400 hover:text-white"
              }`}
          >
            Rutas
          </button>
          <button
            onClick={() => setActiveTab("paradas")}
            className={`px-6 py-3 font-semibold transition ${activeTab === "paradas"
              ? "border-b-2 border-yellow-400 text-yellow-400"
              : "text-slate-400 hover:text-white"
              }`}
          >
            Paradas
          </button>
          <button
            onClick={() => setActiveTab("usuarios")}
            className={`px-6 py-3 font-semibold transition ${activeTab === "usuarios"
              ? "border-b-2 border-yellow-400 text-yellow-400"
              : "text-slate-400 hover:text-white"
              }`}
          >
            Usuarios Gobierno
          </button>
        </div>

        {/* Content */}
        {activeTab !== "ai-creator" && (
          <div className="bg-slate-800/50 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {activeTab === "rutas" ? "Gestión de Rutas" :
                  activeTab === "paradas" ? "Gestión de Paradas" :
                    "Gestión de Usuarios de Gobierno"}
              </h2>
              {activeTab !== "usuarios" && (
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold rounded-lg transition"
                >
                  + Agregar {activeTab === "rutas" ? "Ruta" : "Parada"}
                </button>
              )}
              {activeTab === "usuarios" && (
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold rounded-lg transition"
                >
                  + Crear Usuario Gobierno
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                {error}
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    {activeTab === "rutas" ? (
                      <>
                        <th className="text-left p-3">Número</th>
                        <th className="text-left p-3">Nombre</th>
                        <th className="text-left p-3">Empresa</th>
                        <th className="text-left p-3">Tarifa</th>
                        <th className="text-left p-3">Estado</th>
                        <th className="text-left p-3">Acciones</th>
                      </>
                    ) : activeTab === "paradas" ? (
                      <>
                        <th className="text-left p-3">Código</th>
                        <th className="text-left p-3">Nombre</th>
                        <th className="text-left p-3">Ubicación</th>
                        <th className="text-left p-3">Estado</th>
                        <th className="text-left p-3">Acciones</th>
                      </>
                    ) : (
                      <>
                        <th className="text-left p-3">Usuario</th>
                        <th className="text-left p-3">Email</th>
                        <th className="text-left p-3">Nombre</th>
                        <th className="text-left p-3">Rol</th>
                        <th className="text-left p-3">Acciones</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === "rutas" ? rutas :
                    activeTab === "paradas" ? paradas :
                      usuarios.filter(u => u.rol === 'admin' || u.rol === 'gobierno')).map((item) => (
                        <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                          {activeTab === "rutas" ? (
                            <>
                              <td className="p-3 font-bold text-yellow-400">{item.numero_ruta}</td>
                              <td className="p-3">{item.nombre}</td>
                              <td className="p-3">{item.empresa || "-"}</td>
                              <td className="p-3">${item.tarifa}</td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs ${item.activa === 1 || item.activa === true
                                  ? "bg-green-500/20 text-green-300"
                                  : "bg-red-500/20 text-red-300"
                                  }`}>
                                  {item.activa === 1 || item.activa === true ? "Activa" : "Inactiva"}
                                </span>
                              </td>
                              <td className="p-3">
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded mr-2"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded"
                                >
                                  Eliminar
                                </button>
                              </td>
                            </>
                          ) : activeTab === "paradas" ? (
                            <>
                              <td className="p-3">{item.codigo || "-"}</td>
                              <td className="p-3">{item.nombre}</td>
                              <td className="p-3 text-sm text-slate-400">
                                {item.latitud?.toFixed(4)}, {item.longitud?.toFixed(4)}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs ${item.activa === 1 || item.activa === true
                                  ? "bg-green-500/20 text-green-300"
                                  : "bg-red-500/20 text-red-300"
                                  }`}>
                                  {item.activa === 1 || item.activa === true ? "Activa" : "Inactiva"}
                                </span>
                              </td>
                              <td className="p-3">
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded mr-2"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded"
                                >
                                  Eliminar
                                </button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-3 font-bold text-yellow-400">{item.usuario}</td>
                              <td className="p-3">{item.email || "-"}</td>
                              <td className="p-3">{item.nombre_completo || "-"}</td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs ${item.rol === 'admin' || item.rol === 'gobierno'
                                  ? "bg-yellow-500/20 text-yellow-300"
                                  : "bg-slate-500/20 text-slate-300"
                                  }`}>
                                  {item.rol || 'usuario'}
                                </span>
                              </td>
                              <td className="p-3">
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded mr-2"
                                >
                                  Cambiar Rol
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded"
                                >
                                  Eliminar
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {activeTab === "ai-creator" && (
        <div className="max-w-7xl mx-auto p-4">
          <RouteAdmin />
        </div>
      )}


      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4 text-yellow-400">
              {editingItem ? "Editar" : "Crear"} {activeTab === "rutas" ? "Ruta" : activeTab === "paradas" ? "Parada" : "Usuario Gobierno"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === "rutas" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Número de Ruta *</label>
                    <input
                      type="text"
                      value={formData.numero_ruta || ""}
                      onChange={(e) => setFormData({ ...formData, numero_ruta: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={formData.nombre || ""}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Empresa</label>
                      <input
                        type="text"
                        value={formData.empresa || ""}
                        onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tipo</label>
                      <select
                        value={formData.tipo || "Bus"}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      >
                        <option value="Bus">Bus</option>
                        <option value="Microbus">Microbus</option>
                        <option value="Ruta Especial">Ruta Especial</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Tarifa</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.tarifa || 0.25}
                        onChange={(e) => setFormData({ ...formData, tarifa: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Horario Inicio</label>
                      <input
                        type="time"
                        value={formData.horario_inicio || "05:00"}
                        onChange={(e) => setFormData({ ...formData, horario_inicio: e.target.value + ":00" })}
                        className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Horario Fin</label>
                      <input
                        type="time"
                        value={formData.horario_fin?.substring(0, 5) || "21:00"}
                        onChange={(e) => setFormData({ ...formData, horario_fin: e.target.value + ":00" })}
                        className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Frecuencia (min)</label>
                      <input
                        type="number"
                        value={formData.frecuencia_minutos || 15}
                        onChange={(e) => setFormData({ ...formData, frecuencia_minutos: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.activa || false}
                        onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>Ruta activa</span>
                    </label>
                  </div>
                  {/* Sección de Paradas de la Ruta (MOVIDO ARRIBA) */}
                  {editingItem && (
                    <div className="mb-8 border-b border-slate-700 pb-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-bold text-yellow-400">Paradas de la Ruta</h4>
                        <button
                          type="button"
                          onClick={() => {
                            setShowStopForm(!showStopForm);
                            if (!showStopForm) {
                              // Reset form when opening new
                              setStopFormData({
                                nombre: "", codigo: "", latitud: "", longitud: "", direccion: "",
                                tiene_techo: false, tiene_asientos: false, accesible: false, activa: true, orden: 0
                              });
                            }
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                        >
                          {showStopForm ? "Cancelar" : "+ Agregar Parada"}
                        </button>
                      </div>

                      {showStopForm && (
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-600 mb-4">
                          <h5 className="font-bold mb-3 text-white">
                            {stopFormData.id ? "Editar Parada" : "Nueva Parada"}
                          </h5>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium mb-1">Nombre *</label>
                              <input
                                type="text"
                                value={stopFormData.nombre}
                                onChange={e => setStopFormData({ ...stopFormData, nombre: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1">Código</label>
                              <input
                                type="text"
                                value={stopFormData.codigo}
                                onChange={e => setStopFormData({ ...stopFormData, codigo: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 text-sm"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium mb-1">Latitud *</label>
                                <input
                                  type="number"
                                  step="any"
                                  value={stopFormData.latitud}
                                  onChange={e => setStopFormData({ ...stopFormData, latitud: e.target.value })}
                                  className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1">Longitud *</label>
                                <input
                                  type="number"
                                  step="any"
                                  value={stopFormData.longitud}
                                  onChange={e => setStopFormData({ ...stopFormData, longitud: e.target.value })}
                                  className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 text-sm"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1">Dirección</label>
                              <input
                                type="text"
                                value={stopFormData.direccion}
                                onChange={e => setStopFormData({ ...stopFormData, direccion: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 text-sm"
                              />
                            </div>
                            <div className="flex gap-4 pt-2">
                              <label className="flex items-center gap-2 text-xs">
                                <input type="checkbox" checked={stopFormData.tiene_techo} onChange={e => setStopFormData({ ...stopFormData, tiene_techo: e.target.checked })} /> Techo
                              </label>
                              <label className="flex items-center gap-2 text-xs">
                                <input type="checkbox" checked={stopFormData.tiene_asientos} onChange={e => setStopFormData({ ...stopFormData, tiene_asientos: e.target.checked })} /> Asientos
                              </label>
                              <label className="flex items-center gap-2 text-xs">
                                <input type="checkbox" checked={stopFormData.accesible} onChange={e => setStopFormData({ ...stopFormData, accesible: e.target.checked })} /> Accesible
                              </label>
                              <label className="flex items-center gap-2 text-xs">
                                <input type="checkbox" checked={stopFormData.activa} onChange={e => setStopFormData({ ...stopFormData, activa: e.target.checked })} /> Activa
                              </label>
                            </div>
                            <button
                              type="button"
                              onClick={handleAddStopToRoute}
                              className={`w-full mt-2 py-2 rounded font-bold text-sm ${stopFormData.id ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                            >
                              {stopFormData.id ? "Actualizar Parada" : "Guardar Parada"}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {loadingStops ? (
                          <div className="text-center text-slate-400 py-4">Cargando paradas...</div>
                        ) : routeStops.length === 0 ? (
                          <div className="text-center text-slate-500 py-4 italic border border-dashed border-slate-700 rounded">
                            No hay paradas asociadas a esta ruta
                          </div>
                        ) : (
                          routeStops.map((stop, idx) => (
                            <div
                              key={stop.id}
                              className="bg-slate-700 p-3 rounded flex justify-between items-center group hover:bg-slate-600 transition cursor-pointer"
                              onClick={() => handleEditStop(stop)}
                            >
                              <div className="flex items-center gap-3">
                                <span className="bg-slate-800 text-slate-400 px-2 py-1 rounded text-xs font-mono">{idx + 1}</span>
                                <div>
                                  <div className="font-bold text-sm">{stop.nombre}</div>
                                  <div className="text-xs text-slate-400 flex gap-2">
                                    <span>{stop.codigo || 'S/C'}</span>
                                    <span>•</span>
                                    <span>{parseFloat(stop.latitud).toFixed(4)}, {parseFloat(stop.longitud).toFixed(4)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteStopFromRoute(stop.id); }}
                                  className="bg-yellow-600 hover:bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold transition"
                                  title="Quitar de esta ruta"
                                >
                                  Quitar
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteStopPermanently(stop.id); }}
                                  className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded text-xs font-bold transition"
                                  title="Eliminar permanentemente de la BD"
                                >
                                  Borrar
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <RouteGeometryEditor
                      value={formData.geometry}
                      onChange={handleGeometryChange}
                      onSave={handleQuickSave}
                      stops={routeStops}
                      previewStop={showStopForm ? stopFormData : null}
                    />
                    <div className="mt-4 p-3 bg-slate-700/50 rounded text-xs text-slate-300 border border-slate-600">
                      <p className="font-semibold mb-2">Consejos:</p>
                      <ul className="list-disc list-inside space-y-1 text-slate-400">
                        <li>Escribe los lugares en orden, separados por comas o palabras como "y", "luego", "hasta"</li>
                        <li>Usa nombres de lugares conocidos: "Metrocentro", "Soyapango", "Boulevard de los Héroes"</li>
                        <li>La ruta se calculará automáticamente siguiendo las calles reales</li>
                        <li>Puedes ver la ruta en el mapa antes de guardar</li>
                      </ul>
                    </div>
                  </div>
                </>
              ) : activeTab === "paradas" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={formData.nombre || ""}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Código</label>
                    <input
                      type="text"
                      value={formData.codigo || ""}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Latitud *</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={formData.latitud || ""}
                        onChange={(e) => setFormData({ ...formData, latitud: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Longitud *</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={formData.longitud || ""}
                        onChange={(e) => setFormData({ ...formData, longitud: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Dirección</label>
                    <input
                      type="text"
                      value={formData.direccion || ""}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.tiene_techo || false}
                        onChange={(e) => setFormData({ ...formData, tiene_techo: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>Tiene techo</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.tiene_asientos || false}
                        onChange={(e) => setFormData({ ...formData, tiene_asientos: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>Tiene asientos</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.accesible || false}
                        onChange={(e) => setFormData({ ...formData, accesible: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>Accesible</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.activa || false}
                        onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>Parada activa</span>
                    </label>
                  </div>
                </>
              ) : activeTab === "usuarios" ? (
                <>
                  {!editingItem && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">Usuario *</label>
                        <input
                          type="text"
                          value={formData.usuario || ""}
                          onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Contraseña *</label>
                        <input
                          type="password"
                          value={formData.password || ""}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          required={!editingItem}
                          minLength={6}
                        />
                        <p className="text-xs text-slate-400 mt-1">Mínimo 6 caracteres</p>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      value={formData.nombre_completo || ""}
                      onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={formData.telefono || ""}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Rol *</label>
                    <select
                      value={formData.rol || "gobierno"}
                      onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      required
                    >
                      <option value="gobierno">Gobierno</option>
                      <option value="admin">Administrador</option>
                    </select>
                    <p className="text-xs text-slate-400 mt-1">
                      Solo usuarios con rol 'gobierno' o 'admin' pueden acceder al panel
                    </p>
                  </div>
                  {editingItem && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                      <p className="text-sm text-yellow-300">
                        Solo puedes cambiar el rol. Para cambiar contraseña, el usuario debe usar "Cambiar contraseña" en su perfil.
                      </p>
                    </div>
                  )}
                </>
              ) : null}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold rounded-lg transition"
                >
                  {editingItem ? "Actualizar" : "Crear"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

