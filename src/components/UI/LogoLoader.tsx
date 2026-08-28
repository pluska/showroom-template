
import config from '@/config/config';

interface LogoLoaderProps {
  className?: string;
}

const LogoLoader = ({ className = "fixed inset-0 z-50 bg-black flex items-center justify-center" }: LogoLoaderProps) => {
  return (
    <div className={className}>
        <div className="relative">
             {/* Glow Effect */}
             <div className="absolute inset-0 bg-brand-orange/20 blur-xl rounded-full animate-pulse" />
             
             {/* El logotipo es un lockup horizontal, no un isotipo cuadrado:
                 se le da ancho y se deja que la altura salga sola. */}
             <img
                src={config.logos.projectWhite}
                alt={config.company.buildingName}
                className="w-44 h-auto object-contain relative z-10 animate-pulse"
            />
        </div>
    </div>
  );
};

export default LogoLoader;
