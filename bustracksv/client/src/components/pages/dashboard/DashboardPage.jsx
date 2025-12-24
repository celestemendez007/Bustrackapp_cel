import Header from "../../layout/Header";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import historialService from "../../../services/historialService";
import routeService from "../../../services/routeService";

/* ---------- Tarjeta estilo mock ---------- */
const StatCard = ({ title, iconSrc, value = 0, onClick }) => (
  <div
    onClick={onClick}
    className="rounded-[18px] bg-[#a9c9e8] text-[#0f2b4a] px-8 py-6 shadow-[0_8px_24px_rgba(0,0,0,0.15)] cursor-pointer hover:scale-105 transition-transform duration-200"
  >
    <p className="text-[28px] font-extrabold tracking-tight mb-4">{title}</p>

    <div className="flex items-center">
      {/* ícono cuadrado azul */}
      <div className="h-[84px] w-[84px] rounded-[10px] bg-[#64a3d5] grid place-items-center">
        <img src={iconSrc} alt={title} className="h-[54px] w-[54px] object-contain" />
      </div>

      {/* número grande */}
      <span className="ml-auto text-[56px] leading-none font-extrabold text-[#102a5a]">
        {value}
      </span>
    </div>
  </div>
);

/* ---------- Modal de Detalles ---------- */
const DetailsModal = ({ isOpen, onClose, title, data, type }) => {
  if (!isOpen) return null;

  // Función para obtener la letra inicial para ordenar
  const getSortKey = (item) => {
    if (type === 'rutas' || type === 'buses') {
      // Para rutas, ordenar por nombre o número de ruta
      const nombre = item.nombre || '';
      const numero = item.numero_ruta || '';
      return (nombre + ' ' + numero).trim().toUpperCase();
    } else {
      // Para paradas, ordenar por nombre
      return (item.nombre || '').trim().toUpperCase();
    }
  };

  // Ordenar y agrupar datos alfabéticamente
  const sortedData = [...data].sort((a, b) => {
    const keyA = getSortKey(a);
    const keyB = getSortKey(b);
    return keyA.localeCompare(keyB);
  });

  // Agrupar por letra inicial
  const groupedData = sortedData.reduce((acc, item) => {
    const sortKey = getSortKey(item);
    const firstLetter = sortKey.charAt(0).toUpperCase();

    // Si no es una letra, poner en grupo "#"
    const groupKey = /[A-Z]/.test(firstLetter) ? firstLetter : '#';

    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {});

  // Ordenar las claves de los grupos
  const sortedGroups = Object.keys(groupedData).sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1e263b] w-full max-w-4xl max-h-[80vh] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#151b2e]">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-[#6aaee0]">Listado de {title}</span>
            <span className="text-sm bg-white/10 px-3 py-1 rounded-full text-slate-300 font-normal">
              Total: {data.length}
            </span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {sortedGroups.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              No se encontraron datos para mostrar.
            </div>
          ) : (
            sortedGroups.map((letter) => (
              <div key={letter} className="mb-8">
                {/* Encabezado de letra */}
                <div className="mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#6aaee0] flex items-center justify-center">
                    <span className="text-[#0f2b4a] font-bold text-xl">{letter}</span>
                  </div>
                  <div className="h-px flex-1 bg-white/10"></div>
                  <span className="text-sm text-slate-400">{groupedData[letter].length} {groupedData[letter].length === 1 ? 'item' : 'items'}</span>
                </div>

                {/* Grid de items para esta letra */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6">
                  {groupedData[letter].map((item, index) => (
                    <div key={item.id || index} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                      {type === 'rutas' || type === 'buses' ? (
                        <>
                          <div className="flex justify-between items-start mb-2">
                            <span className="bg-[#6aaee0] text-[#0f2b4a] font-bold px-2 py-1 rounded text-sm">
                              Ruta {item.numero_ruta}
                            </span>
                            <span className="text-xs text-slate-400 bg-black/20 px-2 py-1 rounded">
                              {item.tipo || 'Bus'}
                            </span>
                          </div>
                          <h3 className="font-semibold text-white mb-1 line-clamp-1">{item.nombre}</h3>
                          <p className="text-sm text-slate-400 mb-2 line-clamp-2">{item.descripcion || 'Sin descripción'}</p>
                          <div className="text-xs text-slate-500 flex justify-between mt-auto pt-2 border-t border-white/5">
                            <span>{item.empresa || 'Empresa desconocida'}</span>
                            <span className="text-[#6aaee0] font-bold">${item.tarifa || '0.25'}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-2">
                            <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-1 rounded text-xs">
                              {item.codigo || 'S/C'}
                            </span>
                            <span className="text-xs text-slate-400 bg-black/20 px-2 py-1 rounded">
                              {item.zona || 'General'}
                            </span>
                          </div>
                          <h3 className="font-semibold text-white mb-1 line-clamp-1">{item.nombre}</h3>
                          <p className="text-sm text-slate-400 mb-1 line-clamp-1">{item.direccion || 'Sin dirección'}</p>
                          {item.total_rutas > 0 && (
                            <div className="text-xs text-[#6aaee0] mt-2">
                              Conecta con {item.total_rutas} rutas
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);

  const [stats, setStats] = useState({
    rutas: [],
    paradas: [],
    buses: [] // Usaremos rutas como proxy para buses por ahora
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ type: '', title: '', data: [] });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoadingHistorial(true);

    try {
      // Cargar Historial
      const historialRes = await historialService.obtenerHistorial(10);
      if (historialRes.success) {
        setHistorial(historialRes.data.historial);
      }

      // Cargar Rutas y Paradas
      const [rutasRes, paradasRes] = await Promise.all([
        routeService.getRutas(),
        routeService.getParadas()
      ]);

      const rutas = rutasRes.success ? rutasRes.data : [];
      const paradas = paradasRes.success ? paradasRes.data : [];

      setStats({
        rutas: rutas,
        paradas: paradas,
        buses: rutas // Asumimos 1 bus por ruta como mínimo para visualización, o mostramos las rutas como "flota"
      });

    } catch (error) {
      console.error("Error cargando datos del dashboard:", error);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const openModal = (type) => {
    let data = [];
    let title = '';

    switch (type) {
      case 'buses':
        data = stats.buses;
        title = 'Buses (Rutas Activas)';
        break;
      case 'paradas':
        data = stats.paradas;
        title = 'Paradas';
        break;
      case 'rutas':
        data = stats.rutas;
        title = 'Rutas';
        break;
      default:
        return;
    }

    setModalConfig({ type, title, data });
    setModalOpen(true);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      // SQLite devuelve "YYYY-MM-DD HH:MM:SS" en UTC
      // Asegurar formato ISO UTC para que JS lo interprete correctamente
      let fechaStr = fecha;
      if (typeof fecha === 'string' && !fecha.includes('T') && !fecha.includes('Z')) {
        fechaStr = fecha.replace(' ', 'T') + 'Z';
      }

      const date = new Date(fechaStr);

      return new Intl.DateTimeFormat('es-SV', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        timeZone: 'America/El_Salvador'
      }).format(date);
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'N/A';
    }
  };

  const formatearHora = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      // SQLite devuelve "YYYY-MM-DD HH:MM:SS" en UTC
      let fechaStr = fecha;
      if (typeof fecha === 'string' && !fecha.includes('T') && !fecha.includes('Z')) {
        fechaStr = fecha.replace(' ', 'T') + 'Z';
      }

      const date = new Date(fechaStr);

      const horaFormateada = new Intl.DateTimeFormat('es-SV', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/El_Salvador'
      }).format(date);

      return horaFormateada.toLowerCase();
    } catch (error) {
      console.error('Error al formatear hora:', error);
      return 'N/A';
    }
  };

  const handleHistorialClick = async (item) => {
    // Navegar al mapa con los datos del historial
    // Si hay coordenadas guardadas, usarlas; si no, buscar por nombre de parada
    const historialData = {
      origen: item.parada || null,
      destino: null, // El historial solo guarda la parada de origen
      latOrigen: item.latitud_origen || null,
      lngOrigen: item.longitud_origen || null,
      latDestino: item.latitud_destino || null,
      lngDestino: item.longitud_destino || null,
      ruta: item.ruta || null,
      numeroRuta: item.numero_ruta || null
    };

    // Guardar en sessionStorage para que el mapa pueda acceder
    sessionStorage.setItem('historialSearch', JSON.stringify(historialData));

    // Navegar al mapa
    navigate('/map');
  };

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white">
      <Header />

      <main className="px-8 mt-10">
        {/* Título y subrayado */}
        <h1 className="text-4xl sm:text-[44px] font-semibold">Accesos rápidos con mapa</h1>
        <div className="mt-3 h-[10px] w-40 rounded-full bg-[#6aaee0]" />

        {/* ---------- Panel de tarjetas ---------- */}
        <section className="mt-10">
          <div className="mx-auto max-w-[1100px]">
            <div className="rounded-[16px] bg-[#1e263b]/90 border border-white/10 px-10 py-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <StatCard
                  title="Buses"
                  iconSrc="/busDashboard.png"
                  value={stats.buses.length}
                  onClick={() => openModal('buses')}
                />
                <StatCard
                  title="Paradas"
                  iconSrc="/Parada.png"
                  value={stats.paradas.length}
                  onClick={() => openModal('paradas')}
                />
                <StatCard
                  title="Rutas"
                  iconSrc="/Ruta.png"
                  value={stats.rutas.length}
                  onClick={() => openModal('rutas')}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Historial (igual al mock) ---------- */}
        <section className="mt-10 pb-16">
          <div className="mx-auto max-w-[1100px] rounded-xl bg-[#1f2740] border border-[#1f2740] px-4 pt-5 pb-6 relative">

            {/* Píldora "Historial" EXACTA */}
            <div className="inline-flex items-center gap-4 rounded-[28px] px-6 py-3 bg-[#69AEE0] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.15)] mb-6">
              <span className="text-[24px] font-extrabold leading-none">Historial</span>
              <img src="/Reloj.png" alt="Reloj" className="h-8 w-8 object-contain" />
            </div>


            {/* Tarjeta azul clara con tabla redondeada */}
            <div className="relative z-[1] mx-auto max-w-[980px] rounded-[14px] overflow-hidden bg-[#77AEDD]">
              {loadingHistorial ? (
                <div className="py-10 text-center text-[#0f2b4a]">
                  <p className="text-lg font-semibold">Cargando historial...</p>
                </div>
              ) : historial.length === 0 ? (
                <div className="py-10 text-center text-[#0f2b4a]">
                  <p className="text-lg font-semibold">No hay búsquedas en tu historial</p>
                  <p className="text-sm mt-2">Comienza a buscar rutas en el mapa para ver tu historial aquí</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#5EA0D6] text-white font-semibold">
                      <th className="px-6 py-3 text-left">Ruta</th>
                      <th className="px-6 py-3 text-left">Inicio</th>
                      <th className="px-6 py-3 text-left">Final</th>
                      <th className="px-6 py-3 text-left">Día</th>
                      <th className="px-6 py-3 text-left">Hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((h, i) => (
                      <tr
                        key={h.id || i}
                        onClick={() => handleHistorialClick(h)}
                        className={`${i % 2 ? "bg-[#6CA6DA]" : "bg-[#A9C8E8]"} cursor-pointer hover:opacity-80 transition-opacity`}
                      >
                        <td className="px-6 py-3 text-[#0f2b4a] font-medium">{h.ruta || 'N/A'}</td>
                        <td className="px-6 py-3 text-[#0f2b4a] font-medium">{h.parada || 'N/A'}</td>
                        <td className="px-6 py-3 text-[#0f2b4a] font-medium">{h.parada_destino || 'N/A'}</td>
                        <td className="px-6 py-3 text-[#0f2b4a] font-medium">{formatearFecha(h.fecha_busqueda)}</td>
                        <td className="px-6 py-3 text-[#0f2b4a] font-medium">{formatearHora(h.fecha_busqueda)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Modal */}
      <DetailsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalConfig.title}
        data={modalConfig.data}
        type={modalConfig.type}
      />
    </div>
  );
}
