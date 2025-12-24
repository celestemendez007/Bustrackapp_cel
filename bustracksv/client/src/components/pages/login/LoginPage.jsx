import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext.jsx";

export default function LoginPage({ onSuccess }) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location.state]);

  const validate = () => {
    if (!usuario.trim()) return "Ingresa tu usuario.";
    if (password.length < 3) return "La contraseña debe tener al menos 3 caracteres.";
    return "";
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const validationError = validate();
    if (validationError) return setError(validationError);
    
    setLoading(true);
    try {
      const result = await login({ usuario, password });
      
      if (result.success) {
        // Login exitoso - redirigir al dashboard o a la página que intentaba acceder
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
        
        // Ejecutar callback si existe
        if (typeof onSuccess === "function") {
          onSuccess(result);
        }
      } else {
        setError(result.message || "Error al iniciar sesión");
      }
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
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
              Inicia sesión en <br />
              <span className="text-white">BusTrackSV</span>
            </h1>
            <div className="mx-auto mt-3 h-2 w-24 rounded-full bg-[#6ab0ff]/70" />
          </header>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Usuario</label>
              <input
                type="text"
                placeholder="Tu usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full h-11 rounded-xl bg-[#141a35] text-slate-100 placeholder:text-slate-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400 px-4"
                required
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

            {error && (
              <div className="rounded-lg border border-red-300/30 bg-red-500/10 px-3 py-2 text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[#6ab0ff] text-[#0b1733] font-semibold disabled:opacity-70 hover:brightness-110 transition"
            >
              {loading ? "Entrando…" : "Iniciar sesión"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-300">
            ¿No tienes cuenta?{" "}
            <a href="/register" className="underline decoration-slate-400 hover:text-white">
              Regístrate en BusTrackSV
            </a>
          </p>
          
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-center text-xs text-slate-400 mb-2">
              ¿Eres personal del gobierno?
            </p>
            <Link 
              to="/admin/login" 
              className="block text-center text-sm text-yellow-400 hover:text-yellow-300 underline"
            >
              Acceso Gobierno →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}