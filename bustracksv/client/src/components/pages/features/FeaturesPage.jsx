import Header from '../../layout/Header';

const FeaturesPage = () => {
  const features = [
    {
      title: 'Rastreo en tiempo real',
      body:
        'Observa en el mapa dónde está tu bus y recibe notificaciones al instante sobre su ubicación.',
    },
    {
      title: 'Rutas optimizadas',
      body:
        'Encuentra siempre la mejor ruta para ahorrar tiempo, evitando retrasos y eligiendo trayectos más rápidos.',
    },
    {
      title: 'Información confiable',
      body:
        'Datos actualizados constantemente para que tomes decisiones inteligentes sobre tu movilidad.',
    },
    {
      title: 'Experiencia sin estrés',
      body:
        'Planea tu viaje con anticipación y muévete con confianza, sin la incertidumbre de cuándo llegará tu transporte.',
    },
  ];

  return (
    <>
      {/* Background Image - Fuera del contenedor principal */}
      <div 
        style={{
          position: 'fixed',
          top: '-50px',
          left: '-60px',
          bottom: '-50px',
          right: '-50px',
          width: 'calc(100vw + 120px)',
          height: 'calc(100vh + 100px)',
          backgroundImage: 'url(/fondo_info.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'left center',
          backgroundRepeat: 'no-repeat',
          zIndex: -1,
          margin: 0,
          padding: 0
        }}
      />
      <div className="min-h-screen relative flex flex-col">
      
      <Header />

      <main className="relative z-10 w-full px-6 sm:px-10 py-10 flex justify-center">
        {/* Card / panel */}
        <section
     className="bg-gray-900/80 backdrop-blur-sm rounded-3xl p-6 md:p-8 max-w-6xl mx-auto shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto"

        >
          {/* Título */}
          <h1 className="text-text-primary text-3xl sm:text-4xl font-bold">
            Nuestras caracteristicas
          </h1>

          {/* Barra de acento bajo el título */}
          <div className="mt-3 h-2 w-40 bg-accent-light-blue rounded-full" />

          {/* Lista de features */}
          <div className="mt-8 space-y-7">
            {features.map(({ title, body }) => (
              <div key={title}>
                <h3 className="text-text-primary text-xl sm:text-2xl font-extrabold">
                  {title}
                </h3>
                <p className="mt-2 text-text-secondary leading-relaxed sm:max-w-4xl">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      </div>
    </>
  );
};

export default FeaturesPage;

