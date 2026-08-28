import type { Unit } from '../../data/floors';
import UnitCard from './UnitCard';

interface UnitPopoverProps {
  unit: Unit;
  floorId: string;
  scale: number;
  onMouseEnter: (unit: Unit) => void;
  onMouseLeave: () => void;
  onOpenConsultation: (e: React.MouseEvent, unitId: string, unitIdentifier?: string) => void;
  onNavigate: (path: string) => void;
  openDirection?: 'up' | 'down';
}

const UnitPopover = ({
  unit,
  floorId,
  scale,
  onMouseEnter,
  onMouseLeave,
  onOpenConsultation,
  onNavigate,
  openDirection = 'up'
}: UnitPopoverProps) => {
  const isUp = openDirection === 'up';

  return (
    <div 
        className={`absolute left-1/2 -translate-x-1/2 w-72 bg-white rounded-xl shadow-2xl overflow-hidden cursor-auto hidden xl:block z-50 animate-fade-in
            ${isUp 
                ? 'bottom-full mb-4 origin-bottom' 
                : 'top-full mt-4 origin-top'
            }
        `}
        style={{ 
            transform: `translateX(-50%) scale(${1/scale})`, 
            transformOrigin: isUp ? 'bottom center' : 'top center'
        }}
        onMouseEnter={() => onMouseEnter(unit)}
        onMouseLeave={onMouseLeave}
    >
        <UnitCard 
            unit={unit}
            floorId={floorId}
            onOpenConsultation={onOpenConsultation}
            onNavigate={onNavigate}
        />
        
        <div className={`absolute w-3 h-3 bg-white rotate-45 shadow-sm z-0 left-1/2 -translate-x-1/2
            ${isUp 
                ? '-bottom-1.5 border-r border-b border-gray-100' 
                : '-top-1.5 border-l border-t border-gray-100'
            }
        `}></div>
    </div>
  );
};

export default UnitPopover;
