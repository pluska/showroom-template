"use client";

import { useState } from "react";
import { updateFeature, reorderFeatures, SidebarFeature } from "@/app/actions/features";
import { Loader2, Check, ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableFeatureRow({
  feature,
  index,
  isLoading,
  handleToggle,
  handleLabelChange,
  moveItem,
  isReordering,
  totalItems
}: {
  feature: SidebarFeature,
  index: number,
  isLoading: boolean,
  handleToggle: (id: string, currentActive: boolean) => void,
  handleLabelChange: (id: string, newLabel: string) => void,
  moveItem: (index: number, direction: 'up' | 'down') => void,
  isReordering: boolean,
  totalItems: number
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: feature.id });

  const [localLabel, setLocalLabel] = useState(feature.label);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: 'relative' as const,
  };

  const onBlurLabel = () => {
    if (localLabel !== feature.label) {
      handleLabelChange(feature.id, localLabel);
    }
  };

  return (
    <tr ref={setNodeRef} style={style} className={`bg-base-100 border-b border-base-200 hover:bg-base-50/50 transition-colors ${isDragging ? 'opacity-50 shadow-lg' : ''}`}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            {...attributes}
            {...listeners}
            className="p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-orange rounded"
          >
            <GripVertical className="w-5 h-5" />
          </button>
          <span className="font-semibold text-gray-900 capitalize w-24">
            {feature.id}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <input 
          type="text" 
          value={localLabel} 
          onChange={(e) => setLocalLabel(e.target.value)}
          onBlur={onBlurLabel}
          className="bg-base-100 border border-base-300 text-gray-900 text-sm rounded-lg focus:ring-brand-orange focus:border-brand-orange block w-full p-2 font-medium"
        />
      </td>
      <td className="px-6 py-4">
        <span className="text-gray-700 font-mono text-xs bg-base-200 px-2.5 py-1 rounded-md font-medium">
          {feature.path || feature.action || '#'}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${feature.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {feature.active ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          <button
            onClick={() => moveItem(index, 'up')}
            disabled={index === 0 || isReordering}
            className={`p-1.5 rounded-md bg-base-200 text-gray-500 hover:bg-base-300 hover:text-gray-900 transition-colors ${(index === 0 || isReordering) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => moveItem(index, 'down')}
            disabled={index === totalItems - 1 || isReordering}
            className={`p-1.5 rounded-md bg-base-200 text-gray-500 hover:bg-base-300 hover:text-gray-900 transition-colors ${(index === totalItems - 1 || isReordering) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <button
          onClick={() => handleToggle(feature.id, feature.active)}
          disabled={isLoading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 ${feature.active ? "bg-brand-orange" : "bg-gray-200"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span className="sr-only">Toggle {feature.id}</span>
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${feature.active ? "translate-x-6" : "translate-x-1"
              } flex items-center justify-center`}
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 text-brand-orange animate-spin" />
            ) : feature.active ? (
              <Check className="w-3 h-3 text-brand-orange" />
            ) : null}
          </span>
        </button>
      </td>
    </tr>
  );
}

export default function FeaturesClient({ initialFeatures }: { initialFeatures: SidebarFeature[] }) {
  const [features, setFeatures] = useState<SidebarFeature[]>(initialFeatures);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleToggle = async (id: string, currentValue: boolean) => {
    setLoadingKey(id);
    try {
      await updateFeature(id, { active: !currentValue });
      setFeatures(features.map(f => f.id === id ? { ...f, active: !currentValue } : f));
      showToast('Estado actualizado con éxito', 'success');
    } catch (error) {
      console.error("Failed to update feature", error);
      showToast("Error al actualizar el estado.", 'error');
    } finally {
      setLoadingKey(null);
    }
  };

  const handleLabelChange = async (id: string, newLabel: string) => {
    setLoadingKey(id);
    try {
      await updateFeature(id, { label: newLabel });
      setFeatures(features.map(f => f.id === id ? { ...f, label: newLabel } : f));
      showToast('Nombre actualizado con éxito', 'success');
    } catch (error) {
      console.error("Failed to update feature label", error);
      showToast("Error al actualizar el nombre.", 'error');
    } finally {
      setLoadingKey(null);
    }
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === features.length - 1)
    ) return;

    const newOrder = [...features];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];

    const oldFeatures = [...features];
    setFeatures(newOrder);
    setIsReordering(true);

    try {
      await reorderFeatures(newOrder);
      showToast('Orden actualizado con éxito', 'success');
    } catch (error) {
      console.error("Failed to reorder features", error);
      showToast("Error al reordenar. Se revertirá a la posición inicial.", 'error');
      setFeatures(oldFeatures);
    } finally {
      setIsReordering(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = features.findIndex(f => f.id === active.id);
      const newIndex = features.findIndex(f => f.id === over.id);
      
      const newOrder = arrayMove(features, oldIndex, newIndex);
      
      const oldFeatures = [...features];
      setFeatures(newOrder);
      setIsReordering(true);

      try {
        await reorderFeatures(newOrder);
        showToast('Orden actualizado con éxito', 'success');
      } catch (error) {
        console.error("Failed to reorder features", error);
        showToast("Error al reordenar. Se revertirá a la posición inicial.", 'error');
        setFeatures(oldFeatures);
      } finally {
        setIsReordering(false);
      }
    }
  };

  return (
    <div className="bg-base-100 rounded-lg shadow-sm border border-base-200 overflow-hidden w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 bg-base-100">
          <thead className="text-xs text-gray-700 uppercase bg-base-200">
            <tr>
              <th scope="col" className="px-6 py-4 font-primary">Módulo</th>
              <th scope="col" className="px-6 py-4 font-primary">Nombre (Label)</th>
              <th scope="col" className="px-6 py-4 font-primary">Ruta (Path)</th>
              <th scope="col" className="px-6 py-4 font-primary">Estado</th>
              <th scope="col" className="px-6 py-4 font-primary text-right">Orden</th>
              <th scope="col" className="px-6 py-4 font-primary text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={features.map(f => f.id)}
                strategy={verticalListSortingStrategy}
              >
                {features.map((feature, index) => {
                  const isLoading = loadingKey === feature.id;

                  return (
                    <SortableFeatureRow
                      key={feature.id}
                      feature={feature}
                      index={index}
                      isLoading={isLoading}
                      handleToggle={handleToggle}
                      handleLabelChange={handleLabelChange}
                      moveItem={moveItem}
                      isReordering={isReordering}
                      totalItems={features.length}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
          </tbody>
        </table>
      </div>
      
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
          <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 text-sm font-medium text-white ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {toast.type === 'success' ? <Check className="w-4 h-4" /> : null}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
