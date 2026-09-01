import React from 'react';

interface RadialConcentricChartProps {
  data: {
    label: string;
    value: number;
    color: string;
  }[];
}

export default function RadialConcentricChart({ data }: RadialConcentricChartProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;

  // Configuration for the donut
  const center = 100;
  const radius = 65;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  const gapSize = 5; // Gap size in px along the circumference

  // Pre-calculate slice segments
  let currentOffset = 0;
  const slices = data.map(item => {
    const share = item.value / total;
    // Calculate drawn length subtracting gap
    const drawnLength = Math.max(0, (circumference - data.length * gapSize) * share);
    const offset = currentOffset;
    
    // Accumulate offset for next slice
    currentOffset += drawnLength + gapSize;

    return {
      ...item,
      drawnLength,
      offset: -offset // SVG stroke-dashoffset goes backwards
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-8 p-4">
      {/* SVG Donut Chart */}
      <div className="relative" style={{ width: '200px', height: '200px' }}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          {slices.map((slice, idx) => {
            if (slice.value === 0) return null;

            return (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${slice.drawnLength} ${circumference - slice.drawnLength}`}
                strokeDashoffset={slice.offset}
                strokeLinecap="butt"
                className="transition-all duration-1000 ease-out"
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-gray-400 text-[10px] uppercase tracking-widest font-medium">Total</span>
          <span className="text-2xl font-bold text-slate-800 mt-0.5">
            {total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-3 justify-center min-w-[140px]">
        {slices.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            {/* Simple colored circle indicator */}
            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: item.color }} />

            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-medium leading-none">{item.label}</span>
              <div className="flex items-baseline gap-1.5 mt-0.5 font-mono">
                <span className="text-sm font-bold text-slate-700 leading-none">
                  {item.value.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-405 font-medium leading-none">
                  ({Math.round((item.value / total) * 100)}%)
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
