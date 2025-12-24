import React, { useState } from 'react';
import { GoogleMap, Polyline, Marker } from '@react-google-maps/api';
import adminService from '../../../services/adminService';
import { useGoogleMaps } from '../../../contexts/GoogleMapsContext';

const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '0.5rem'
};

const center = {
    lat: 13.6929,
    lng: -89.2182
};

const RouteAdmin = () => {
    const { isLoaded } = useGoogleMaps();
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState(null); // { nombre_sugerido, descripcion_sugerida, puntos_geocodificados, geometry }
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleGenerate = async () => {
        if (!description.trim()) return;
        setLoading(true);
        setError('');
        setPreviewData(null);

        const res = await adminService.generateRoute(description);

        if (res.success) {
            setPreviewData(res.data);
        } else {
            setError(res.message);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!previewData) return;
        setLoading(true);

        // Transformar geometry (path de Google Maps) a array de objetos {lat, lng} para el backend nuevo
        // previewData.geometry ya viene como [{lat, lng}, ...] del backend generate
        // Si viniera como objeto Google Maps LatLng, habría que mapearlo, pero parece que ya es plano.

        // ADVERTENCIA: Asegúrate de que previewData.geometry tenga ALTA RESOLUCIÓN (muchos puntos)
        // Si el backend AI devuelve solo paradas, el trazado será una línea recta.
        // Pero asumimos que la IA (o el editor) proveyó un polyline decente.

        const puntosParaGuardar = previewData.geometry.map(p => ({
            lat: p.lat,
            lng: p.lng
        }));

        const payload = {
            numero: previewData.nombre_sugerido.replace(/\s/g, '').toUpperCase().slice(0, 10), // Ej: "RUTA-55"
            nombre: previewData.nombre_sugerido, // Ej: "Ruta 55 - Centro"
            puntos: puntosParaGuardar
        };

        // Usar el nuevo método "Real" que guarda en puntos_ruta
        const res = await adminService.guardarRutaReal(payload);

        if (res.success) {
            setSuccessMsg(`Ruta guardada exitosamente en DB Real con ID: ${res.data.id}`);
            setPreviewData(null);
            setDescription('');
        } else {
            setError(res.message);
        }
        setLoading(false);
    };

    const decodePolyline = (encoded) => {
        if (!window.google) return [];
        return window.google.maps.geometry.encoding.decodePath(encoded).map(p => ({ lat: p.lat(), lng: p.lng() }));
    };

    return (
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg text-white">
            <h2 className="text-2xl font-bold mb-4 text-yellow-400">✨ Creador de Rutas con IA</h2>

            <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-slate-300">
                    Describe la ruta en lenguaje natural
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ej: La Ruta 42 inicia en el Parque Cuscatlán, pasa por Metrocentro y termina en la UES..."
                    className="w-full h-32 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none text-white placeholder-slate-400"
                />
                <p className="text-xs text-slate-400 mt-2">
                    Incluye al menos origen, destino y puntos intermedios clave.
                </p>
            </div>

            <div className="flex gap-4 mb-6">
                <button
                    onClick={handleGenerate}
                    disabled={loading || !description}
                    className={`px-6 py-2 rounded-lg font-bold transition flex items-center gap-2
            ${loading || !description ? 'bg-slate-600 cursor-not-allowed text-slate-400' : 'bg-yellow-500 hover:bg-yellow-400 text-slate-900'}
          `}
                >
                    {loading ? 'Procesando...' : '🔮 Generar Trazado'}
                </button>
            </div>

            {error && (
                <div className="p-4 mb-6 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                    ⚠️ {error}
                </div>
            )}

            {successMsg && (
                <div className="p-4 mb-6 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200">
                    ✅ {successMsg}
                </div>
            )}

            {previewData && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-4">
                            <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                                <h3 className="text-lg font-bold text-yellow-400 mb-2">Detalles Sugeridos</h3>
                                <div className="space-y-2">
                                    <div>
                                        <span className="text-slate-400 text-sm">Nombre:</span>
                                        <p className="font-mono text-lg">{previewData.nombre_sugerido}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 text-sm">Descripción:</span>
                                        <p className="text-sm">{previewData.descripcion_sugerida}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 text-sm">Estadísticas:</span>
                                        <div className="flex gap-4 mt-1">
                                            <span className="bg-slate-600 px-2 py-1 rounded text-xs">📏 {previewData.distancia_km} km</span>
                                            <span className="bg-slate-600 px-2 py-1 rounded text-xs">⏱️ {previewData.tiempo_min} min</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                                <h3 className="text-sm font-bold text-slate-300 mb-2">Puntos Detectados ({previewData.puntos_geocodificados.length})</h3>
                                <ul className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                    {previewData.puntos_geocodificados.map((p, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm p-2 bg-slate-800 rounded">
                                            <span className="w-5 h-5 flex items-center justify-center bg-yellow-500/20 text-yellow-500 rounded-full text-xs font-bold">
                                                {i + 1}
                                            </span>
                                            <span className="truncate">{p.nombre_original}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="h-[400px] bg-slate-900 rounded-lg overflow-hidden border border-slate-600 relative">
                            {isLoaded ? (
                                <GoogleMap
                                    mapContainerStyle={mapContainerStyle}
                                    center={previewData.puntos_geocodificados[0] ? {
                                        lat: previewData.puntos_geocodificados[0].lat,
                                        lng: previewData.puntos_geocodificados[0].lng
                                    } : center}
                                    zoom={12}
                                    options={{
                                        styles: [
                                            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                                            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                                            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                                        ]
                                    }}
                                >
                                    {/* Trazado de ruta */}
                                    <Polyline
                                        path={previewData.geometry} // Geometry viene como array de objetos {lat, lng} directo del backend
                                        options={{
                                            strokeColor: "#FF0000",
                                            strokeOpacity: 0.8,
                                            strokeWeight: 4,
                                        }}
                                    />

                                    {/* Marcadores de puntos clave */}
                                    {previewData.puntos_geocodificados.map((point, i) => (
                                        <Marker
                                            key={i}
                                            position={{ lat: point.lat, lng: point.lng }}
                                            label={{
                                                text: (i + 1).toString(),
                                                color: "white",
                                                fontSize: "12px",
                                                fontWeight: "bold"
                                            }}
                                        />
                                    ))}
                                </GoogleMap>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500">
                                    Cargando mapa...
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                        <button
                            onClick={() => setPreviewData(null)}
                            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition shadow-lg shadow-green-900/20"
                        >
                            💾 Guardar Ruta en Base de Datos
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RouteAdmin;
