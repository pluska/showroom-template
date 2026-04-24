import { useEffect } from 'react';
import { useStore } from '../store/useStore';

const SceneController = () => {
  const { currentFloor } = useStore();

  useEffect(() => {
    // Logic to update 3D scene based on currentFloor
    console.log('SceneController: Current Floor changed to:', currentFloor);
  }, [currentFloor]);

  return (
    <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white">
      {/* Placeholder for 3D Canvas */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Showroom 3D Scene</h2>
        <p>Current Floor: {currentFloor}</p>
        <p className="text-sm text-gray-400 mt-2">3D environment goes here.</p>
      </div>
    </div>
  );
};

export default SceneController;
