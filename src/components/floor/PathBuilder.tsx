

interface PathBuilderProps {
  generatedPath: string;
  onUndo: () => void;
  onClear: () => void;
}

const PathBuilder = ({ generatedPath, onUndo, onClear }: PathBuilderProps) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-xl w-64 text-xs space-y-2 border border-gray-200">
      <p className="font-bold text-gray-700">Generated Path:</p>
      <textarea 
        readOnly 
        value={generatedPath} 
        className="w-full h-20 bg-gray-50 border border-gray-200 p-2 rounded font-mono text-[10px] break-all select-all focus:outline-none focus:border-blue-500"
        onClick={(e) => e.currentTarget.select()}
      />
      <div className="flex gap-2">
        <button 
          onClick={onUndo}
          className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-medium"
        >
          Undo
        </button>
        <button 
          onClick={onClear}
          className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 rounded text-red-600 font-medium"
        >
          Clear
        </button>
      </div>
      <p className="text-[10px] text-gray-500 italic">
        Click corners on map. Copy string to 'floors.ts'.
      </p>
    </div>
  );
};

export default PathBuilder;
