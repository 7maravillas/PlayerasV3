import Link from 'next/link';
import { HoverBorderGradient } from './ui/HoverBorderGradient';

const STREET_STYLE_COLORS = ["#f8c889", "#fbc57d", "#e63946", "#780000", "#f8c889"];
const RETRO_KITS_COLORS = ["#f8c889", "#fbc57d", "#00f0ff", "#0080ff", "#f8c889"];

const TrendingSection = () => (
  <section className="pb-6 px-6">
    <div className="container mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Card 1: Street Style */}
        <Link href="/collections/street-style" className="group relative w-full h-[600px] bg-theme-surface overflow-hidden cursor-pointer block rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://res.cloudinary.com/dcwyl56kj/image/upload/v1772738059/page-07682079-focus-0-0-1200-600_j6ojwg.webp"
            alt="Street Style"
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
          />
          <div className="absolute bottom-12 w-full text-center">
            <h4 className="text-3xl font-heading uppercase tracking-tight text-white drop-shadow-md">Street Style</h4>
            <p className="text-gray-300 mt-2 mb-4 font-medium drop-shadow-sm">Del estadio a las calles.</p>
            <HoverBorderGradient
              as="span"
              containerClassName="cursor-pointer"
              className="text-black font-semibold text-sm px-14 py-2.5"
              gradientColors={STREET_STYLE_COLORS}
            >
              Comprar
            </HoverBorderGradient>
          </div>
        </Link>

        {/* Card 2: Retro Kits */}
        <Link href="/collections/retro" className="group relative w-full h-[600px] bg-theme-surface overflow-hidden cursor-pointer block rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://res.cloudinary.com/dcwyl56kj/image/upload/v1772738188/adi-retro-feds-6-min_lmgrb5.jpg"
            alt="Retro / Vintage Kits"
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
          />
          <div className="absolute bottom-12 w-full text-center">
            <h4 className="text-3xl font-heading uppercase tracking-tight text-white drop-shadow-md">Retro Kits</h4>
            <p className="text-gray-300 mt-2 mb-4 font-medium drop-shadow-sm">Volver al Pasado.</p>
            <HoverBorderGradient
              as="span"
              containerClassName="cursor-pointer"
              className="text-black font-semibold text-sm px-14 py-2.5"
              gradientColors={RETRO_KITS_COLORS}
            >
              Comprar
            </HoverBorderGradient>
          </div>
        </Link>

      </div>
    </div>
  </section>
);

export default TrendingSection;
