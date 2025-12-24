import { Link } from 'react-router-dom';
import Header from '../../layout/Header';

const IndexPage = () => {
  return (
    <div className="min-h-screen bg-[#0C0E19] pb-10">
      <Header />
      <main className="w-full px-8 py-0">
        {/* Top Section - Two Columns */}
        <div className="grid grid-cols-12 gap-8 mb-16 mt-8">
          {/* Top Left Column - Text Content */}
          <div className="col-span-5 flex flex-col justify-center">
            {/* 1. Title */}
            <h1 className="text-5xl md:text-6xl text-white mb-6 leading-tight font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Donde tu ruta es la más{' '}
              <span className="relative inline-block">
                eficiente
                <span className="absolute bottom-0 left-0 w-full h-1.5 bg-[#7bc4f0]" style={{ width: 'calc(100% + 8px)', left: '-4px' }}></span>
              </span>
            </h1>

            {/* 3. First Paragraph */}
            <p className="text-white text-lg mb-6 leading-relaxed font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Planea tu viaje sin estrés: encuentra la mejor ruta, ahorra tiempo y llega puntual.
            </p>

            {/* 4. Second Paragraph */}
            <p className="text-white text-base mb-8 leading-relaxed font-normal" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Con BusTrackSV, tus trayectos en bus se convierten en experiencias más predecibles y rápidas.
              Observa en el mapa dónde está tu bus, recibe alertas de llegada y toma decisiones inteligentes
              para no perder tiempo. Porque tu viaje no empieza cuando subes al bus, empieza cuando sabes
              exactamente a qué hora llegará.
            </p>

            {/* 5. Button with arrows */}
            <Link
              to="/map"
              className="inline-flex items-center gap-2 bg-[#7bc4f0] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#6ab3e0] transition-all duration-300 w-fit"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Busca tu ruta
              <span className="text-xl">»</span>
              <span className="text-xl">»</span>
            </Link>
          </div>

          {/* Top Right Column - 3D Elements (Wider) */}
          <div className="col-span-7 relative min-h-[600px]">
            {/* Cilindro Celeste - Top left */}
            <img
              src="/cilindroCeleste.png"
              alt="Cilindro Celeste"
              className="absolute top-0 left-8 z-5 hover:scale-105 transition-transform duration-300"
              style={{ width: '260px', height: '260px' }}
            />

            {/* Cilindro Blanco - Right of cilindroCeleste, at middle height */}
            <img
              src="/cilindroBlanco.png"
              alt="Cilindro Blanco"
              className="absolute top-22 left-70 z-5 hover:scale-105 transition-transform duration-300"
              style={{ width: '125px', height: '100px' }}
            />

            {/* Barra Azul - Below cilindroCeleste */}
            <img
              src="/barraAzul.png"
              alt="Barra Azul"
              className="absolute top-64 left-16 z-5 transform -rotate-12 hover:scale-105 transition-transform duration-300"
              style={{ width: '100px', height: '80px' }}
            />

            {/* Bus - Between cilindroBlanco and barraAzul, lower part */}
            <img
              src="/bus.png"
              alt="Bus"
              className="absolute z-4 top-30 left-52 transform rotate-2 hover:scale-105 transition-transform duration-300"
              style={{ width: '500px', height: 'auto' }}
            />

            {/* Estrella Violeta - Bottom right corner */}
            <img
              src="/estrellaVioleta.png"
              alt="Estrella Violeta"
              className="absolute bottom-8 right-8 z-5 hover:scale-105 transition-transform duration-300"
              style={{ width: '150px', height: '150px' }}
            />
          </div>
        </div>

        {/* Bottom Section - Two Columns */}
        <div className="grid grid-cols-12 gap-12 items-start mt-20">
          {/* Left Column - Icons in 2x2 Grid */}
          <div className="col-span-7">
            <div className="grid grid-cols-2 gap-6">
              {/* Large icon - Route/Map (Top-left, spans 2 rows) */}
              <div className="row-span-2 bg-[#1C2039] rounded-xl transition-all duration-300 h-[400px] flex items-center justify-center p-2">
                <img
                  src="/icon_route.png?v=2"
                  alt="Ruta eficiente"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Top-right icon - Clock with checkmark */}
              <div className="bg-[#1C2039] rounded-xl transition-all duration-300 h-[187px] flex items-center justify-center p-2">
                <img
                  src="/icon_time.png?v=2"
                  alt="Tiempo exacto"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Bottom-right icon - Monitor with magnifying glass */}
              <div className="bg-[#1C2039] rounded-xl transition-all duration-300 h-[187px] flex items-center justify-center p-2">
                <img
                  src="/icon_monitor.png?v=2"
                  alt="Monitoreo constante"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Text Content */}
          <div className="col-span-5 flex flex-col justify-center">
            {/* Title */}
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Viaja, monitorea,<br />
              llega a tiempo.
            </h2>

            {/* Paragraph */}
            <p className="text-white text-base leading-relaxed" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Cada minuto cuenta. Por eso te ofrecemos datos actualizados al instante para que sepas qué bus
              tomar, en qué momento estará en tu parada y cuál es la mejor ruta para llegar a tu destino sin
              complicaciones. Nuestra misión es que moverte en transporte público sea tan confiable como
              mirar el reloj.
            </p>
          </div>
        </div>
      </main>
      
      {/* Footer con enlace discreto a admin */}
      <footer className="mt-16 py-4 text-center text-slate-500 text-sm">
        <p>BusTrackSV - Sistema de Transporte Público de El Salvador</p>
        <Link 
          to="/admin/login" 
          className="text-slate-600 hover:text-slate-400 mt-2 inline-block text-xs"
        >
          Acceso Gobierno
        </Link>
      </footer>
    </div>
  );
};

export default IndexPage;
