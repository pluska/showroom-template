import { X, Download, FileText } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { getAssetUrl } from '../../utils/assets';

const BROCHURE_URL = getAssetUrl('brochure/brochure.pdf');

const BrochureModal = () => {
    const isOpen = useStore(state => state.isBrochureOpen);
    const close = useStore(state => state.toggleBrochure);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-white w-full h-full max-w-6xl rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
                
                {/* Header */}
                <div className="bg-neutral-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-gold flex items-center justify-center text-neutral-900">
                            <FileText size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg font-medium tracking-wide">Brochure Digital</h2>
                            <p className="text-xs text-gray-400">Showroom Virtual Santa Fe</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <a 
                            href={BROCHURE_URL} 
                            download="Showroom_SantaFe_Brochure.pdf"
                            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white text-neutral-900 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors"
                        >
                            <Download size={16} />
                            Download PDF
                        </a>
                        <button 
                            onClick={() => close(false)}
                            className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-neutral-700 transition-colors text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-neutral-200 relative">
                    <iframe 
                        src={BROCHURE_URL} 
                        className="w-full h-full border-0"
                        title="Brochure PDF Preview"
                    />
                    
                    {/* Mobile Download FAB (Floating Action Button) if header button hidden */}
                    <a 
                        href={BROCHURE_URL} 
                        download
                        className="sm:hidden absolute bottom-6 right-6 w-14 h-14 bg-brand-primary text-white rounded-full shadow-xl flex items-center justify-center hover:bg-brand-dark-orange transition-colors z-10"
                    >
                        <Download size={24} />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default BrochureModal;
