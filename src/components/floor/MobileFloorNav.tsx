import { useRouter } from 'next/navigation';
import { floorsData } from '@/data/floors';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface MobileFloorNavProps {
    currentFloorId: string;
}

const MobileFloorNav = ({ currentFloorId }: MobileFloorNavProps) => {
    const router = useRouter();
    const setFloor = useStore(state => state.setFloor);

    // Sort floors: 9, 8, ... 1, PB (Top to Bottom visually)
    // We want "Up" to go to a higher index in this sorted array? 
    // Wait. "Up" arrow means "Go to Next Floor UP". 
    // If we have [9, 8, ... 1, PB], and we are at 8. 
    // "Up" should go to 9. 
    // "Down" should go to 7.

    // Let's sort simply by numerical value to find neighbors easily
    // Standard sort: PB (0), 1, 2, ... 9.
    const sortedFloorsAsc = [...floorsData].sort((a, b) => {
        const getVal = (id: string) => id.toLowerCase() === 'pb' ? 0 : Number(id);
        return getVal(a.id) - getVal(b.id);
    });

    const currentIndex = sortedFloorsAsc.findIndex(f => f.id === currentFloorId);
    
    // Safety check
    if (currentIndex === -1) return null;

    const nextFloorUp = currentIndex < sortedFloorsAsc.length - 1 ? sortedFloorsAsc[currentIndex + 1] : null;
    const nextFloorDown = currentIndex > 0 ? sortedFloorsAsc[currentIndex - 1] : null;

    const handleNavigate = (floorId: string) => {
        setFloor(floorId);
        router.push(`/plantas/${floorId}`);
    };

    const currentFloor = sortedFloorsAsc[currentIndex];

    return (
        <div className="fixed top-1/2 right-6 -translate-y-1/2 z-40 flex flex-col items-center gap-4 xl:hidden pointer-events-none">
             {/* Add pointer-events-none to container vs auto on buttons if needed, but flex gap implies invisible container spaces. Safe to leave as is or adjust z-index */}
            
            {/* Up Arrow */}
            <div className="h-10 w-10 flex items-center justify-center pointer-events-auto">
                {nextFloorUp && (
                    <button 
                        onClick={() => handleNavigate(nextFloorUp.id)}
                        className="p-2 bg-brand-primary/90 text-white rounded-full shadow-lg backdrop-blur-sm border border-white/20 active:scale-95 transition-all"
                    >
                        <ChevronUp size={24} />
                    </button>
                )}
            </div>

            {/* Current Floor Label */}
            <div className="bg-gray-800/90 text-white font-bold text-lg rounded-xl h-12 w-12 flex items-center justify-center shadow-xl border border-white/10 pointer-events-auto">
                {currentFloor.name}
            </div>

            {/* Down Arrow */}
             <div className="h-10 w-10 flex items-center justify-center pointer-events-auto">
                {nextFloorDown && (
                    <button 
                        onClick={() => handleNavigate(nextFloorDown.id)}
                        className="p-2 bg-brand-primary/90 text-white rounded-full shadow-lg backdrop-blur-sm border border-white/20 active:scale-95 transition-all"
                    >
                        <ChevronDown size={24} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default MobileFloorNav;
