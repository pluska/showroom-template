import { ArrowLeft } from 'lucide-react';

interface TourHeaderProps {
    title: string;
    subtitle: string;
    onBack: () => void;
}

// A floating pill rather than a full-width bar: a solid header band cuts a black
// stripe across the top of the 360 viewer and hides the panorama behind it.
// Positions itself against the nearest relative ancestor.
const TourHeader = ({ title, subtitle, onBack }: TourHeaderProps) => {
    return (
        <button
            onClick={onBack}
            aria-label="Volver"
            className="group absolute top-4 left-4 z-50 flex items-center gap-3 py-2 pl-2 pr-5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white border border-white/10 shadow-lg transition-all cursor-pointer"
        >
            <span className="p-2 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </span>
            <span className="text-left">
                <span className="block font-serif text-base leading-none">{title}</span>
                {subtitle && (
                    <span className="block text-white/60 text-xs font-sans leading-none mt-1">{subtitle}</span>
                )}
            </span>
        </button>
    );
};

export default TourHeader;
