import { ArrowLeft } from 'lucide-react';

interface TourHeaderProps {
    title: string;
    subtitle: string;
    onBack: () => void;
}

const TourHeader = ({ title, subtitle, onBack }: TourHeaderProps) => {
    return (
        <div className="absolute top-16 left-6 z-50 flex items-center gap-3 group">
           <button
             onClick={onBack}
             className="p-3 bg-black/60 backdrop-blur-sm rounded-full text-white hover:bg-black/80 transition-colors cursor-pointer shadow-lg"
             title={title}
           >
             <ArrowLeft size={22} className="group-hover:-translate-x-0.5 transition-transform" />
           </button>
        </div>
    );
};

export default TourHeader;
