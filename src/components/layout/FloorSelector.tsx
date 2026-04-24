"use client";
import { useRouter, useParams } from 'next/navigation';
import { floorsData } from '../../data/floors';
import { Maximize2 } from 'lucide-react';
import { useStore } from '../../store/useStore';

const FloorSelector = () => {
    const router = useRouter();
    const params = useParams();
    const floorId = params.floorId as string;

    // Sort floors descending (e.g. 9 down to 1, then PB)
    const sortedFloors = [...floorsData].sort((a, b) => {
        const getVal = (id: string) => id.toLowerCase() === 'pb' ? 0 : Number(id);
        return getVal(b.id) - getVal(a.id);
    });
    
    // Store Actions
    const setFloor = useStore(state => state.setFloor);

    return (
        <div className="hidden xl:flex fixed bottom-0 left-0 w-full h-16 md:h-full md:w-20 md:left-auto md:right-0 md:top-0 bg-[#2C3440] text-white flex-row md:flex-col items-center justify-between md:justify-start px-4 md:px-0 py-2 md:py-6 z-40 shadow-2xl">
            {/* Close Button - Hidden on mobile, or maybe top right? Keeping simple for now code structure */}
            <button 
                onClick={() => router.push('/showroom')} 
                className="hidden md:block mb-8 p-1 text-gray-300 hover:text-white transition-colors"
                aria-label="Close floor selector"
            >
                <Maximize2 size={28} strokeWidth={1.5} />
            </button>

            {/* Scrollable List - Scrollbar hidden */}
            <div className="flex-1 w-full overflow-x-auto md:overflow-y-auto flex flex-row md:flex-col items-center gap-4 md:gap-2 px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                {sortedFloors.map(floor => {
                    const isActive = floorId === floor.id;
                    return (
                        <button
                            key={floor.id}
                            onClick={() => {
                                if (!isActive) {
                                    setFloor(floor.id);
                                    router.push(`/plantas/${floor.id}`);
                                }
                            }}
                            className={`
                                px-4 py-2 md:w-full md:py-2 flex items-center justify-center text-sm transition-all shrink-0 whitespace-nowrap
                                ${isActive 
                                    ? 'bg-gray-100 text-slate-900 font-bold rounded-full shadow-md scale-100 mx-1' 
                                    : 'text-gray-300 hover:text-white font-medium hover:bg-white/5 rounded-full'
                                }
                            `}
                        >
                            <span className="md:hidden">Piso {floor.name}</span>
                            <span className="hidden md:inline">{floor.name}</span>
                        </button>
                    );
                })}
            </div>
            
            {/* Mobile Close / Back */}
            <button 
                onClick={() => router.push('/showroom')}
                className="md:hidden p-2 text-gray-300 hover:text-white"
            >
                 <Maximize2 size={20} />
            </button>
        </div>
    );
};

export default FloorSelector;
