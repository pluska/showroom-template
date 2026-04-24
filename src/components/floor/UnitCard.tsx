import { Ruler, Bed, Bath } from 'lucide-react';
import { type Unit, UnitStatusString } from '@/data/floors';

interface UnitCardProps {
  unit: Unit;
  floorId: string;
  onOpenConsultation: (e: React.MouseEvent, unitId: string) => void;
  onNavigate: (path: string) => void;
}

const UnitCard = ({
  unit,
  floorId,
  onOpenConsultation,
  onNavigate
}: UnitCardProps) => {
  const statusColor = 
    unit.status === 'available' ? 'bg-green-500' : 
    unit.status === 'reserved' ? 'bg-amber-500' : 'bg-red-500';

  const isStorage = unit.type === 'storage' || (!unit.bedrooms && !unit.bathrooms);

  return (
    <div className="bg-white overflow-hidden w-full">
        <div className="p-3 border-b border-gray-100 flex justify-between items-start bg-gray-50">
           <div>
              {unit.subtitle !== 'Terraza' && (
              <div className="flex items-center gap-2 mb-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`}/>
                  <span className="text-[8px] font-bold tracking-widest uppercase text-gray-500">
                    {UnitStatusString[unit.status]}
                  </span>
              </div>
              )}
              <h2 className="text-lg font-light text-gray-900 leading-tight">{unit.id}</h2>
           </div>
        </div>
        
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center text-gray-600">
                {unit.subtitle !== 'Terraza' && (
                <div className="flex items-center gap-1.5">
                    <Ruler size={14} strokeWidth={1.5} />
                    <span className="text-xs font-medium">{unit.dimensions} m²</span>
                </div>
                )}
                
                {!isStorage && (
                <>
                    <div className="flex items-center gap-1.5">
                        <Bed size={14} strokeWidth={1.5} />
                        <span className="text-xs font-medium">{unit.bedrooms}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Bath size={14} strokeWidth={1.5} />
                        <span className="text-xs font-medium">{unit.bathrooms}</span>
                    </div>
                </>
                )}
            </div>
            
            <div className="flex gap-2 pt-1">
                <button 
                    onClick={(e) => {
                        if (unit.subtitle === 'Terraza') {
                            e.stopPropagation();
                            onNavigate(`/unidad/${unit.id}`);
                        } else {
                            onOpenConsultation(e, unit.id);
                        }
                    }}
                    className="flex-1 py-2 px-2 rounded bg-gray-100 hover:bg-gray-200 text-[10px] font-bold uppercase tracking-wider transition-colors text-gray-700"
                >
                    {unit.subtitle === 'Terraza' ? 'Ver detalles' : 'Consultar'}
                </button>
                
                {!isStorage && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onNavigate(`/unidad/${unit.id}`);
                        }}
                        className="flex-1 py-2 px-2 rounded bg-brand-primary hover:bg-brand-primary/90 text-white text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm"
                    >
                        Ver Detalles
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};

export default UnitCard;
