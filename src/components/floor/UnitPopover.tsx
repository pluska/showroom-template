import type { Unit } from '../../data/floors';
import UnitCard from './UnitCard';

interface UnitPopoverProps {
  unit: Unit;
  floorId: string;
  scale: number;
  onMouseEnter: (unit: Unit) => void;
  onMouseLeave: () => void;
  onOpenConsultation: (e: React.MouseEvent, unitId: string) => void;
  onNavigate: (path: string) => void;
}

const UnitPopover = ({
  unit,
  floorId,
  scale,
  onMouseEnter,
  onMouseLeave,
  onOpenConsultation,
  onNavigate
}: UnitPopoverProps) => {
  return (
    <div 
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-72 bg-white rounded-xl shadow-2xl overflow-hidden animate-fade-in-up origin-bottom cursor-auto hidden xl:block"
        style={{ 
            transform: `translateX(-50%) scale(${1/scale})`, 
            transformOrigin: 'bottom center'
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
        
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-r border-b border-gray-100 shadow-sm z-0"></div>
    </div>
  );
};

export default UnitPopover;
