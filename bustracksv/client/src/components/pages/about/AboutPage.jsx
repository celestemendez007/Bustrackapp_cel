import Header from '../../layout/Header';
import ContentBox from '../../layout/ContentBox';
import { aboutData } from '../../../data/aboutData';

const AboutPage = () => {
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
      
      {/* Header */}
      <Header />
      
        {/* Main Content */}
        <main className="relative z-10 w-full px-6 md:px-8 flex-1 flex items-center justify-center py-4">
          <ContentBox data={aboutData} />
        </main>
      </div>
    </>
  );
};

export default AboutPage;
