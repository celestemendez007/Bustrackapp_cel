import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import perfilService from '../../../services/perfilService';

import Header from '../../layout/Header';

export default function ProfilePage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth?.user || null;
  const logout = auth?.logout || (() => { });
  const updateUser = auth?.updateUser || (() => { });

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    usuario: '',
    nombre_completo: '',
    email: '',
    telefono: '',
  });
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Estados para cambio de contraseña
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData] = useState({
    password_actual: '',
    password_nueva: '',
    password_confirmar: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    actual: false,
    nueva: false,
    confirmar: false,
  });

  useEffect(() => {
    // Usar try-catch para prevenir errores en el efecto
    try {
      loadProfile();
    } catch (error) {
      console.error('Error en useEffect:', error);
      setLoading(false);
      setMessage({ type: 'error', text: 'Error al inicializar el perfil' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const result = await perfilService.getPerfil();
      if (result.success && result.data) {
        setProfile(result.data);
        setFormData({
          usuario: result.data.usuario || '',
          nombre_completo: result.data.nombre_completo || '',
          email: result.data.email || '',
          telefono: result.data.telefono || '',
        });
        setFotoPreview(result.data.foto_perfil || null);
      } else {
        console.error('Error al cargar perfil:', result);
        setMessage({ type: 'error', text: result.message || 'Error al cargar perfil' });
      }
    } catch (error) {
      console.error('Error completo al cargar perfil:', error);
      setMessage({ type: 'error', text: 'Error al cargar perfil. Por favor, intenta de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Por favor selecciona un archivo de imagen' });
      return;
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'La imagen debe ser menor a 2MB' });
      return;
    }

    try {
      // Convertir a base64
      const base64 = await perfilService.convertirImagenABase64(file);
      setFotoPerfil(base64);
      setFotoPreview(base64);
      setMessage({ type: 'success', text: 'Foto seleccionada. Guarda los cambios para aplicarla.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error al procesar imagen:', error);
      setMessage({ type: 'error', text: 'Error al procesar la imagen' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const datosActualizados = { ...formData };
      if (fotoPerfil) {
        datosActualizados.foto_perfil = fotoPerfil;
      }

      const result = await perfilService.updatePerfil(datosActualizados);
      if (result.success) {
        setMessage({ type: 'success', text: '¡Perfil actualizado exitosamente!' });

        // Manejar la respuesta de manera segura
        const updatedProfile = result.data?.usuario || result.data;

        if (updatedProfile) {
          setProfile(updatedProfile);

          // Actualizar el usuario en el contexto para que se refleje en el header
          if (updateUser && user) {
            updateUser({
              ...user,
              usuario: updatedProfile.usuario || user.usuario,
              nombre_completo: updatedProfile.nombre_completo || user.nombre_completo,
              email: updatedProfile.email || user.email,
              foto_perfil: updatedProfile.foto_perfil || user.foto_perfil,
            });
          }

          // Limpiar foto temporal después de guardar
          if (fotoPerfil) {
            setFotoPerfil(null);
          }

          setEditing(false);
          setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } else {
          // Si no hay perfil actualizado, recargar desde el servidor
          await loadProfile();
          setEditing(false);
          setMessage({ type: 'success', text: '¡Perfil actualizado exitosamente!' });
          setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
      } else {
        setMessage({ type: 'error', text: result.message || 'Error al actualizar perfil' });
      }
    } catch (error) {
      console.error('Error completo al actualizar perfil:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al actualizar perfil';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Manejar cambios en los campos de contraseña
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  // Alternar visibilidad de contraseñas
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Cambiar contraseña
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validar que las contraseñas nuevas coincidan
    if (passwordData.password_nueva !== passwordData.password_confirmar) {
      setMessage({ type: 'error', text: 'Las contraseñas nuevas no coinciden' });
      return;
    }

    // Validar longitud mínima
    if (passwordData.password_nueva.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    setLoading(true);

    try {
      const result = await perfilService.cambiarPassword(
        passwordData.password_actual,
        passwordData.password_nueva
      );

      if (result.success) {
        setMessage({ type: 'success', text: '¡Contraseña cambiada exitosamente!' });
        setPasswordData({
          password_actual: '',
          password_nueva: '',
          password_confirmar: '',
        });
        setShowPasswordSection(false);
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.message || 'Error al cambiar contraseña' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al cambiar contraseña' });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_50%_100%,#1b2250_0%,#0b0f24_60%,#060816_100%)]">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-md rounded-2xl shadow-xl p-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
              <p className="text-slate-400 mt-4">Cargando perfil...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Protección contra errores - mostrar perfil básico si hay problemas
  if (!profile && !loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_50%_100%,#1b2250_0%,#0b0f24_60%,#060816_100%)]">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-md rounded-2xl shadow-xl p-8">
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">Error al cargar el perfil</p>
              <button
                onClick={() => {
                  setLoading(true);
                  loadProfile();
                }}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_50%_100%,#1b2250_0%,#0b0f24_60%,#060816_100%)]">
      <div className="flex items-center justify-center py-8 px-4">
        {/* Modal centrado */}
        <div className="relative w-full max-w-md bg-[#1a1f3a] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
          {/* Botón cerrar */}
          <button
            onClick={() => navigate('/dashboard')}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition z-10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {message.text && (
            <div className={`p-3 mx-4 mt-4 rounded-lg ${message.type === 'success'
              ? 'bg-green-600/20 border border-green-500/30 text-green-300'
              : 'bg-red-600/20 border border-red-500/30 text-red-300'
              }`}>
              {message.text}
            </div>
          )}

          <div className="p-6">
            {!editing ? (
              // Vista de lectura
              <div className="space-y-6">
                {/* Foto de perfil grande centrada */}
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    {profile?.foto_perfil || fotoPreview ? (
                      <img
                        src={profile?.foto_perfil || fotoPreview}
                        alt="Foto de perfil"
                        className="w-32 h-32 rounded-full object-cover border-4 border-sky-500/50"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-sky-600/30 border-4 border-sky-500/50 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Nombre y username */}
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {profile?.nombre_completo || profile?.usuario || 'Usuario'}
                  </h2>
                  <p className="text-sm text-slate-400 mb-4">{profile?.usuario || user?.usuario || 'Usuario'}</p>

                  {/* Botones de foto */}
                  <div className="flex gap-2">
                    <label className="cursor-pointer px-4 py-2 border border-white/20 rounded-lg text-white text-sm hover:bg-white/10 transition flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Cambiar foto
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFotoChange}
                        className="hidden"
                      />
                    </label>
                    {profile?.foto_perfil && (
                      <button
                        onClick={async () => {
                          try {
                            const datosActualizados = { ...formData, foto_perfil: null };
                            const result = await perfilService.updatePerfil(datosActualizados);
                            if (result.success) {
                              setFotoPreview(null);
                              await loadProfile();
                              setMessage({ type: 'success', text: 'Foto eliminada exitosamente' });
                              setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                            }
                          } catch (error) {
                            setMessage({ type: 'error', text: 'Error al eliminar foto' });
                          }
                        }}
                        className="px-4 py-2 border border-white/20 rounded-lg text-white text-sm hover:bg-white/10 transition flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar foto
                      </button>
                    )}
                  </div>
                </div>

                {/* Información del perfil */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-white">Sobre mi</span>
                    <span className="text-slate-400">{profile?.nombre_completo || 'No especificado'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white">Usuario desde</span>
                    <span className="text-slate-400">
                      {profile?.fecha_creacion
                        ? new Date(profile.fecha_creacion).toLocaleDateString('es-SV', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          timeZone: 'America/El_Salvador'
                        })
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white">Email</span>
                    <span className="text-slate-400">{profile?.email || 'No especificado'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white">Teléfono</span>
                    <span className="text-slate-400">{profile?.telefono || 'No especificado'}</span>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="pt-4 flex gap-3 border-t border-white/10">
                  <button
                    onClick={() => setEditing(true)}
                    className="flex-1 px-4 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Guardar
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Cerrar sesión
                  </button>
                </div>
              </div>
            ) : (
              // Vista de edición
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Foto de perfil */}
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    {fotoPreview ? (
                      <img
                        src={fotoPreview}
                        alt="Vista previa"
                        className="w-32 h-32 rounded-full object-cover border-4 border-sky-500/50"
                      />
                    ) : profile?.foto_perfil ? (
                      <img
                        src={profile.foto_perfil}
                        alt="Foto actual"
                        className="w-32 h-32 rounded-full object-cover border-4 border-sky-500/50"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-sky-600/30 border-4 border-sky-500/50 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <label className="cursor-pointer px-4 py-2 border border-white/20 rounded-lg text-white text-sm hover:bg-white/10 transition flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {fotoPreview ? 'Cambiar foto' : 'Subir foto'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFotoChange}
                        className="hidden"
                      />
                    </label>
                    {fotoPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setFotoPreview(profile?.foto_perfil || null);
                          setFotoPerfil(null);
                        }}
                        className="px-4 py-2 border border-white/20 rounded-lg text-white text-sm hover:bg-white/10 transition"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Nombre de Usuario
                    </label>
                    <input
                      type="text"
                      name="usuario"
                      value={formData.usuario}
                      onChange={handleInputChange}
                      className="w-full h-11 px-4 rounded-lg border-2 border-white/20 bg-[#141a35] text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none transition"
                      placeholder="Tu nombre de usuario"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      name="nombre_completo"
                      value={formData.nombre_completo}
                      onChange={handleInputChange}
                      className="w-full h-11 px-4 rounded-lg border-2 border-white/20 bg-[#141a35] text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none transition"
                      placeholder="Tu nombre completo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full h-11 px-4 rounded-lg border-2 border-white/20 bg-[#141a35] text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none transition"
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className="w-full h-11 px-4 rounded-lg border-2 border-white/20 bg-[#141a35] text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none transition"
                      placeholder="1234-5678"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        usuario: profile?.usuario || '',
                        nombre_completo: profile?.nombre_completo || '',
                        email: profile?.email || '',
                        telefono: profile?.telefono || '',
                      });
                      setFotoPreview(profile?.foto_perfil || null);
                      setFotoPerfil(null);
                    }}
                    className="flex-1 px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {loading ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            )}

            {/* Sección de Cambio de Contraseña */}
            {!editing && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition"
                >
                  <span className="text-slate-200 font-semibold">Cambiar Contraseña</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 text-slate-400 transition-transform ${showPasswordSection ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {showPasswordSection && (
                  <div className="mt-4 p-6 bg-gradient-to-br from-orange-600/20 to-red-600/20 rounded-2xl border-2 border-orange-500/30">
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-200 mb-2">
                          Contraseña Actual
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.actual ? "text" : "password"}
                            name="password_actual"
                            value={passwordData.password_actual}
                            onChange={handlePasswordChange}
                            className="w-full h-11 px-4 pr-12 rounded-xl border-2 border-white/20 bg-[#141a35] text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none transition"
                            placeholder="Tu contraseña actual"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('actual')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                          >
                            {showPasswords.actual ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-200 mb-2">
                          Contraseña Nueva
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.nueva ? "text" : "password"}
                            name="password_nueva"
                            value={passwordData.password_nueva}
                            onChange={handlePasswordChange}
                            className="w-full h-11 px-4 pr-12 rounded-xl border-2 border-white/20 bg-[#141a35] text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none transition"
                            placeholder="Tu nueva contraseña"
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('nueva')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                          >
                            {showPasswords.nueva ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                              </svg>
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Mínimo 6 caracteres</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-200 mb-2">
                          Confirmar Contraseña Nueva
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirmar ? "text" : "password"}
                            name="password_confirmar"
                            value={passwordData.password_confirmar}
                            onChange={handlePasswordChange}
                            className="w-full h-11 px-4 pr-12 rounded-xl border-2 border-white/20 bg-[#141a35] text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none transition"
                            placeholder="Confirma tu nueva contraseña"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('confirmar')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                          >
                            {showPasswords.confirmar ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="pt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordSection(false);
                            setPasswordData({
                              password_actual: '',
                              password_nueva: '',
                              password_confirmar: '',
                            });
                          }}
                          className="flex-1 px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-xl transition"
                          disabled={loading}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition disabled:opacity-50"
                          disabled={loading}
                        >
                          {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

