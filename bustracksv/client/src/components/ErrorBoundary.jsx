import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el estado para que la próxima renderización muestre la UI de error
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Registra el error en la consola
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // UI personalizada de error
      return (
        <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_50%_100%,#1b2250_0%,#0b0f24_60%,#060816_100%)] flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white/5 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-red-500/30">
            <h1 className="text-3xl font-bold text-red-400 mb-4">Error en la aplicación</h1>
            <p className="text-slate-300 mb-4">
              Ocurrió un error inesperado. Por favor, recarga la página.
            </p>
            
            {this.state.error && (
              <details className="mt-4">
                <summary className="text-slate-400 cursor-pointer mb-2">
                  Detalles del error (haz clic para expandir)
                </summary>
                <pre className="text-xs text-red-300 bg-black/30 p-4 rounded overflow-auto max-h-96">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition"
              >
                Recargar página
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition"
              >
                Ir al inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

