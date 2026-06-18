
import Logo from '@/components/UI/Logo';

interface LogoLoaderProps {
  className?: string;
}

const LogoLoader = ({ className = "fixed inset-0 z-50 bg-black flex items-center justify-center" }: LogoLoaderProps) => {
  return (
    <div className={className}>
        <div className="relative">
             {/* Glow Effect */}
             <div className="absolute inset-0 bg-brand-orange/20 blur-xl rounded-full animate-pulse" />
             
             {/* Logo */}
             <Logo className="text-4xl relative z-10 animate-pulse" />
        </div>
    </div>
  );
};

export default LogoLoader;
