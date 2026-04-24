import { ArrowLeft } from 'lucide-react';

interface TourHeaderProps {
    title: string;
    subtitle: string;
    onBack: () => void;
}

const TourHeader = ({ title, subtitle, onBack }: TourHeaderProps) => {
    return (
        <div className="flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-sm absolute top-0 left-0 right-0 z-50">
           <div className="flex items-center gap-4">
               <button 
                 onClick={onBack}
                 className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors cursor-pointer group"
               >
                 <ArrowLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
               </button>
               <div>
                 <h2 className="text-white font-serif text-xl leading-none mb-1">{title}</h2>
                 <p className="text-white/60 text-sm font-sans leading-none">{subtitle}</p>
               </div>
           </div>
        </div>
    );
};

export default TourHeader;
