import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import ProductCarousel from '../components/ProductCarousel';
import FootballSlider from '../components/FootballSlider';
import TrendingSection from '../components/TrendingSection';
import Newsletter from '../components/Newsletter';
import Footer from '../components/Footer';

// Divisor de sección reutilizable
const SectionDivider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-6 px-6 py-4 container mx-auto">
    <div className="flex-grow border-t-2 border-[#F8C37C] opacity-50" />
    <span className="text-[#F8C37C] italic uppercase text-base font-bold tracking-[0.3em] whitespace-nowrap px-100">
      {label}
    </span>
    <div className="flex-grow border-t-2 border-[#F8C37C] opacity-50" />
  </div>
);

export default function HomePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        :root, html, body {
          --bg: 13 13 13 !important;
          --bg-surface: 28 29 33 !important;
          --bg-card: 36 36 36 !important;
          --text-primary: 242 242 242 !important;
          --text-secondary: 160 160 160 !important;
          --border: 255 255 255 !important;
          background-color: rgb(13 13 13) !important;
          color: rgb(242 242 242) !important;
        }
      `}} />
      <main className="min-h-screen flex flex-col bg-theme-bg text-th-primary transition-colors duration-300">
        <Navbar />
        <Hero />

        <div className="-mt-2">
          <SectionDivider label="Trending Now" />
        </div>
        <TrendingSection />

        <SectionDivider label="Más Vendidos" />
        <ProductCarousel />

        <SectionDivider label="Clubes de Leyenda" />
        <FootballSlider />

        <SectionDivider label="Suscríbete a Nuestro Catálogo" />
        <Newsletter />

        <Footer />
      </main>
    </>
  );
}