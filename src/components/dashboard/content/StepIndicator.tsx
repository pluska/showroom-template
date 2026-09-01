import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number; // 1, 2, or 3
  finalStepLabel?: string; // "Editor Canvas" en modo manual, "Generación IA" en modo ia
}

export default function StepIndicator({ currentStep, finalStepLabel }: StepIndicatorProps) {
  const steps = [
    { id: 1, label: "Plantilla" },
    { id: 2, label: "Medios" },
    { id: 3, label: finalStepLabel || "Generación IA" },
  ];

  return (
    <div className="flex items-center justify-center w-full max-w-lg mx-auto mb-8 font-secondary">
      {steps.map((step, idx) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;
        
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center relative">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isCompleted 
                    ? "bg-green-500 text-white" 
                    : isActive 
                      ? "bg-brand-orange text-white ring-4 ring-orange-100" 
                      : "bg-gray-200 text-gray-400"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <span 
                className={`absolute top-10 whitespace-nowrap text-xs font-semibold ${
                  isActive ? "text-brand-orange" : isCompleted ? "text-green-600" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            
            {idx < steps.length - 1 && (
              <div 
                className={`flex-1 h-[2px] mx-4 transition-all duration-500 ${
                  isCompleted ? "bg-green-500" : "bg-gray-200"
                }`}
                style={{ marginTop: "-20px" }} // Align line with the numbers
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
