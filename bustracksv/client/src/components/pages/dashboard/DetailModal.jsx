import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';

const DetailModal = ({ isOpen, onClose, title, data, type, loading = false }) => {
  // No retornar null, siempre mostrar el modal si está abierto
  const [paradasExpandidas, setParadasExpandidas] = useState({}); // Controlar qué rutas tienen paradas expandidas

  // Resetear el estado cuando se cierra el modal o cambia el tipo
  useEffect(() => {
    if (!isOpen) {
      setParadasExpandidas({});
    }
  }, [isOpen, type]);

  // Función para formatear hora sin segundos
  const formatearHoraSinSegundos = (hora) => {
    if (!hora) return '';
    // Si es un string tipo "06:00:00", quitar los segundos
    if (typeof hora === 'string' && hora.includes(':')) {
      return hora.split(':').slice(0, 2).join(':');
    }
    return hora;
  };

  // Función para obtener la primera letra para indexación
  const obtenerPrimeraLetra = (texto) => {
    if (!texto) return '#';
    const primeraLetra = texto.trim().charAt(0).toUpperCase();
    return primeraLetra.match(/[A-Z]/) ? primeraLetra : '#';
  };

  // Función para agrupar por primera letra
  const agruparPorLetra = (items, obtenerTexto) => {
    const grupos = {};
    items.forEach((item) => {
      const letra = obtenerPrimeraLetra(obtenerTexto(item));
      if (!grupos[letra]) {
        grupos[letra] = [];
      }
      grupos[letra].push(item);
    });
    // Ordenar las letras
    const letrasOrdenadas = Object.keys(grupos).sort();
    return { grupos, letrasOrdenadas };
  };

  // Función para renderizar el contenido según el tipo
  const renderContent = () => {
    if (type === 'paradas') {
      const { grupos, letrasOrdenadas } = agruparPorLetra(data, (parada) => parada.nombre || '');
      
      return (
        <div className="max-h-[60vh] overflow-y-auto space-y-6">
          {letrasOrdenadas.map((letra) => (
            <div key={letra}>
              <h3 className="text-xl font-bold text-white mb-3">
                {letra}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {grupos[letra].map((parada, index) => {
                  // Filtrar todos los campos numéricos que sean 0, "0", "00", "000", etc.
                  const mostrarCampo = (valor) => {
                    if (valor === undefined || valor === null || valor === '') return false;
                    const strValor = String(valor).trim();
                    // Verificar si es un número en 0 (incluye "0", "00", "000", etc.)
                    if (/^0+$/.test(strValor)) return false;
                    // Verificar si es el número 0
                    if (Number(valor) === 0 && typeof valor !== 'boolean') return false;
                    return true;
                  };

                  // Filtrar campos que no queremos mostrar
                  const camposExcluidos = ['id', 'latitud', 'longitud', 'activa', 'descripcion'];
                  const camposParaMostrar = Object.keys(parada).filter(key => 
                    !camposExcluidos.includes(key) && mostrarCampo(parada[key])
                  );

                  // Limpiar objeto parada para remover campos con valor 0
                  const paradaLimpia = Object.keys(parada).reduce((acc, key) => {
                    const valor = parada[key];
                    // Excluir campos que no queremos mostrar
                    if (['id', 'latitud', 'longitud', 'activa', 'descripcion', 'fecha_creacion'].includes(key)) {
                      return acc;
                    }
                    // Excluir valores que sean 0, "0", "00", "000", etc.
                    if (valor !== undefined && valor !== null) {
                      const strValor = String(valor).trim();
                      if (/^0+$/.test(strValor)) {
                        return acc; // No incluir campos con solo ceros
                      }
                      if (Number(valor) === 0 && typeof valor !== 'boolean') {
                        return acc; // No incluir el número 0
                      }
                    }
                    acc[key] = valor;
                    return acc;
                  }, {});

                  return (
                    <div key={parada.id || index} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                      <div className="space-y-1 text-gray-300">
                        <div className="font-semibold text-white">{paradaLimpia.nombre || 'Sin nombre'}</div>
                        {mostrarCampo(paradaLimpia.codigo) && (
                          <div className="text-sm text-gray-400">Código: {paradaLimpia.codigo}</div>
                        )}
                        {mostrarCampo(paradaLimpia.direccion) && (
                          <div className="text-sm">{paradaLimpia.direccion}</div>
                        )}
                        {mostrarCampo(paradaLimpia.zona) && (
                          <div className="text-sm text-gray-400">Zona: {paradaLimpia.zona}</div>
                        )}
                        {mostrarCampo(paradaLimpia.tipo) && (
                          <div className="text-sm text-gray-400">Tipo: {paradaLimpia.tipo}</div>
                        )}
                        {paradaLimpia.tiene_techo && (
                          <div className="text-xs text-green-400">✓ Tiene techo</div>
                        )}
                        {paradaLimpia.tiene_asientos && (
                          <div className="text-xs text-green-400">✓ Tiene asientos</div>
                        )}
                        {paradaLimpia.accesible && (
                          <div className="text-xs text-green-400">✓ Accesible</div>
                        )}
                        {/* Evitar mostrar valores numéricos en 0 */}
                        {paradaLimpia.total_rutas !== undefined && paradaLimpia.total_rutas !== null && paradaLimpia.total_rutas > 0 && (
                          <div className="text-sm text-gray-400">Rutas: {paradaLimpia.total_rutas}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (type === 'rutas') {
      // Para rutas, usar el nombre o número de ruta para indexación
      const { grupos, letrasOrdenadas } = agruparPorLetra(data, (ruta) => ruta.nombre || ruta.numero_ruta || '');
      
      return (
        <div className="max-h-[60vh] overflow-y-auto space-y-6">
          {letrasOrdenadas.map((letra) => (
            <div key={letra}>
              <h3 className="text-xl font-bold text-white mb-3">
                {letra}
              </h3>
              <div className="space-y-4">
                {grupos[letra].map((ruta, index) => (
                  <div key={ruta.id || index} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="mb-3">
                      <div className="font-semibold text-lg text-white">{ruta.nombre || 'Sin nombre'}</div>
                      <div className="text-sm text-gray-400">Ruta: {ruta.numero_ruta || 'N/A'}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      {ruta.empresa && (
                        <div>
                          <div className="text-gray-400">Empresa</div>
                          <div className="text-white">{ruta.empresa}</div>
                        </div>
                      )}
                      {ruta.tarifa !== undefined && (
                        <div>
                          <div className="text-gray-400">Tarifa</div>
                          <div className="text-white">${ruta.tarifa.toFixed(2)}</div>
                        </div>
                      )}
                      {ruta.longitud_km && (
                        <div>
                          <div className="text-gray-400">Distancia</div>
                          <div className="text-white">{ruta.longitud_km.toFixed(1)} km</div>
                        </div>
                      )}
                    </div>

                    {ruta.horario_inicio && ruta.horario_fin && (
                      <div className="mt-3 text-sm">
                        <div className="text-gray-400">Horario</div>
                        <div className="text-white">
                          {formatearHoraSinSegundos(ruta.horario_inicio)} - {formatearHoraSinSegundos(ruta.horario_fin)}
                        </div>
                      </div>
                    )}

                    {ruta.frecuencia_minutos && (
                      <div className="mt-2 text-sm">
                        <div className="text-gray-400">Frecuencia</div>
                        <div className="text-white">Cada {ruta.frecuencia_minutos} minutos</div>
                      </div>
                    )}

                    {ruta.paradas && ruta.paradas.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm text-gray-400 mb-2">Paradas ({ruta.paradas.length})</div>
                        <div className="max-h-32 overflow-y-auto">
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              const rutaKey = `${ruta.id || index}_${letra}`;
                              const mostrarTodas = paradasExpandidas[rutaKey];
                              const paradasAMostrar = mostrarTodas ? ruta.paradas : ruta.paradas.slice(0, 5);
                              
                              return (
                                <>
                                  {paradasAMostrar.map((parada, idx) => (
                                    <span key={idx} className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                                      {parada.nombre}
                                    </span>
                                  ))}
                                  {!mostrarTodas && ruta.paradas.length > 5 && (
                                    <button
                                      onClick={() => setParadasExpandidas({ ...paradasExpandidas, [rutaKey]: true })}
                                      className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer underline"
                                    >
                                      +{ruta.paradas.length - 5} más
                                    </button>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (type === 'buses') {
      // Separar buses en dos grupos: solo números y con letras
      const busesSoloNumeros = [];
      const busesConLetras = [];
      
      data.forEach((bus) => {
        const numeroBus = bus.numero_bus || bus.numero_ruta || 'N/A';
        // Verificar si tiene letras (A-Z, a-z)
        if (/[A-Za-z]/.test(numeroBus)) {
          busesConLetras.push({ ...bus, numeroBus });
        } else {
          busesSoloNumeros.push({ ...bus, numeroBus });
        }
      });
      
      // Ordenar solo números numéricamente
      busesSoloNumeros.sort((a, b) => {
        const numA = parseInt(a.numeroBus) || 0;
        const numB = parseInt(b.numeroBus) || 0;
        return numA - numB;
      });
      
      // Ordenar con letras alfabéticamente
      busesConLetras.sort((a, b) => a.numeroBus.localeCompare(b.numeroBus));
      
      return (
        <div className="grid grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto">
          {/* Columna de solo números */}
          <div className="space-y-4">
            <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm pb-3 z-10">
              <h3 className="text-xl font-bold text-white mb-2">Números</h3>
              <div className="h-1 w-16 bg-cyan-300 rounded-full"></div>
            </div>
            <div className="flex flex-wrap gap-3">
              {busesSoloNumeros.map((bus, index) => (
                <div 
                  key={bus.id || index} 
                  className="group relative bg-gradient-to-br from-gray-800/60 to-gray-800/40 rounded-xl px-5 py-3 border border-gray-700/50 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 cursor-pointer transform hover:scale-105"
                >
                  <div className="text-white font-semibold text-base group-hover:text-blue-300 transition-colors">
                    {bus.numeroBus}
                  </div>
                  <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 rounded-xl transition-colors"></div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Columna con letras */}
          <div className="space-y-4">
            <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm pb-3 z-10">
              <h3 className="text-xl font-bold text-white mb-2">Con letras</h3>
              <div className="h-1 w-16 bg-cyan-300 rounded-full"></div>
            </div>
            <div className="flex flex-wrap gap-3">
              {busesConLetras.map((bus, index) => (
                <div 
                  key={bus.id || index} 
                  className="group relative bg-gradient-to-br from-gray-800/60 to-gray-800/40 rounded-xl px-5 py-3 border border-gray-700/50 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 cursor-pointer transform hover:scale-105"
                >
                  <div className="text-white font-semibold text-base group-hover:text-blue-300 transition-colors">
                    {bus.numeroBus}
                  </div>
                  <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 rounded-xl transition-colors"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-gray-900/95 backdrop-blur-lg border border-gray-700 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-3xl font-bold text-white"
                  >
                    {title}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                    onClick={onClose}
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-4">
                  <div className="h-1 bg-blue-500 rounded-full w-40"></div>
                </div>

                <div className="mt-4">
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                      <div className="mt-4 text-gray-400">Cargando datos...</div>
                    </div>
                  ) : data && data.length > 0 ? (
                    renderContent()
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      No hay datos disponibles
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default DetailModal;

