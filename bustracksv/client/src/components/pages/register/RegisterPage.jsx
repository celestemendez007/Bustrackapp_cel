import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext.jsx";

export default function RegisterPage({ onSuccess }) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { register } = useAuth();

  const validate = () => {
    if (!usuario.trim()) return "Ingresa un nombre de usuario.";
    if (usuario.length < 3) return "El usuario debe tener al menos 3 caracteres.";
    if (!email.trim()) return "Ingresa un email válido.";
    if (!email.includes("@")) return "El email debe ser válido.";
    if (!nombreCompleto.trim()) return "Ingresa tu nombre completo.";
    if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
    if (password !== confirmPassword) return "Las contraseñas no coinciden.";
    return "";
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    const validationError = validate();
    if (validationError) return setError(validationError);
    
    setLoading(true);
    try {
      const result = await register({ 
        usuario, 
        password, 
        email, 
        nombre_completo: nombreCompleto, 
        telefono 
      });
      
      if (result.success) {
        setSuccess(result.message);
        // Limpiar formulario
        setUsuario("");
        setPassword("");
        setConfirmPassword("");
        setEmail("");
        setNombreCompleto("");
        setTelefono("");
        
        // Si hay callback de éxito, ejecutarlo
        if (typeof onSuccess === "function") {
          onSuccess(result);
        }
      } else {
        setError(result.message || "Error al registrar usuario");
      }
    } catch (err) {
      setError(err.message || "Error al registrar usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh relative bg-[radial-gradient(1200px_600px_at_50%_100%,#1b2250_0%,#0b0f24_60%,#060816_100%)] text-slate-100">
      <div className="pointer-events-none absolute inset-0 rounded-md" />
      <button
        className="absolute left-5 top-5 text-slate-200/90 hover:text-white text-2xl"
        onClick={() => window.history.back()}
      >
        ««
      </button>

      <div className="mx-auto max-w-5xl px-4 py-16 grid place-items-center">
        <div className="w-full max-w-md rounded-2xl bg-white/5 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.35)] px-8 py-8">
          <header className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
              Regístrate en <br />
              <span className="text-white">BusTrackSV</span>
            </h1>
            <div className="mx-auto mt-3 h-2 w-24 rounded-full bg-[#6ab0ff]/70" />
          </header>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Usuario</label>
              <input
                type="text"
                placeholder="Nombre de usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full h-11 rounded-xl bg-[#141a35] text-slate-100 placeholder:text-slate-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400 px-4"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Email</label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 rounded-xl bg-[#141a35] text-slate-100 placeholder:text-slate-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400 px-4"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Nombre Completo</label>
              <input
                type="text"
                placeholder="Tu nombre completo"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                className="w-full h-11 rounded-xl bg-[#141a35] text-slate-100 placeholder:text-slate-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400 px-4"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Teléfono (opcional)</label>
              <input
                type="tel"
                placeholder="Tu número de teléfono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full h-11 rounded-xl bg-[#141a35] text-slate-100 placeholder:text-slate-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400 px-4"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pr-12 rounded-xl bg-[#141a35] text-slate-100 placeholder:text-slate-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400 px-4"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute inset-y-0 right-2 my-auto h-8 w-10 grid place-items-center rounded-lg border border-white/10 bg-white/5 text-lg"
                >
                  {showPass ? "🔓" : "🔒"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Confirmar Contraseña</label>
              <div className="relative">
                <input
                  type={showConfirmPass ? "text" : "password"}
                  placeholder="Confirma tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-11 pr-12 rounded-xl bg-[#141a35] text-slate-100 placeholder:text-slate-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400 px-4"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass((s) => !s)}
                  className="absolute inset-y-0 right-2 my-auto h-8 w-10 grid place-items-center rounded-lg border border-white/10 bg-white/5 text-lg"
                >
                  {showConfirmPass ? "🔓" : "🔒"}
                </button>
              </div>
            </div>


            {error && (
              <div className="rounded-lg border border-red-300/30 bg-red-500/10 px-3 py-2 text-red-200 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-green-300/30 bg-green-500/10 px-3 py-2 text-green-200 text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[#6ab0ff] text-[#0b1733] font-semibold disabled:opacity-70 hover:brightness-110 transition"
            >
              {loading ? "Registrando…" : "Registrarse"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-300">
            ¿Ya tienes cuenta?{" "}
            <a href="/login" className="underline decoration-slate-400 hover:text-white">
              Inicia sesión en BusTrackSV
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}