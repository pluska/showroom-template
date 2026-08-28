import React, { useState } from 'react';

interface StackedBarChartProps {
  labels: string[];
  series: {
    name: string;
    data: number[];
    color: string;
  }[];
  height?: number;
}

export default function StackedBarChart({ labels, series, height = 200 }: StackedBarChartProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  // Calculate dynamic width based on the number of labels (minimum 600px, 90px per item)
  const width = Math.max(300, labels.length * 90);
  const viewHeight = height;

  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = viewHeight - paddingTop - paddingBottom;

  const colWidth = graphWidth / labels.length;
  const getBarX = (idx: number) => paddingLeft + (idx + 0.5) * colWidth;

  const stackTotals = labels.map((_, idx) => {
    return series.reduce((sum, s) => sum + (s.data[idx] || 0), 0);
  });
  const maxVal = Math.max(...stackTotals, 5);

  const barWidth = Math.min(24, Math.max(8, (graphWidth / labels.length) * 0.4));

  return (
    <div className="w-full flex flex-col bg-base-100 border border-base-200 p-6 rounded-2xl shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <span className="text-sm font-semibold tracking-wider text-slate-700">Distribución de Citas</span>
        <div className="flex items-center gap-3">
          {series.map((s, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-[10px] text-slate-500 font-medium">{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Overflow-x scroll container */}
      <div className="w-full overflow-x-auto scrollbar-thin">
        <div className="relative" style={{ width: `${width}px`, height: `${viewHeight}px` }}>
          <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${viewHeight}`} preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
              const y = paddingTop + r * graphHeight;
              const gridVal = Math.round(maxVal * (1 - r));
              return (
                <g key={idx}>
                  <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(0, 0, 0, 0.05)" />
                  <text x={paddingLeft - 8} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px] font-mono">
                    {gridVal}
                  </text>
                </g>
              );
            })}

            {/* Stacked bars */}
            {labels.map((_, idx) => {
              const x = getBarX(idx);
              let currentY = paddingTop + graphHeight;

              return (
                <g
                  key={idx}
                  onMouseEnter={() => setActiveIdx(idx)}
                  onMouseLeave={() => setActiveIdx(null)}
                  className="cursor-pointer"
                >
                  {activeIdx === idx && (
                    <rect
                      x={x - barWidth - 4}
                      y={paddingTop}
                      width={barWidth * 2 + 8}
                      height={graphHeight}
                      fill="rgba(0, 0, 0, 0.02)"
                      rx="4"
                    />
                  )}

                  {series.map((s, sIdx) => {
                    const val = s.data[idx] || 0;
                    if (val === 0) return null;

                    const barHeight = (val / maxVal) * graphHeight;
                    const y = currentY - barHeight;
                    const rX = x - barWidth / 2;

                    currentY = y;

                    return (
                      <rect
                        key={sIdx}
                        x={rX}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill={s.color}
                        rx={sIdx === series.length - 1 ? 3 : 0}
                        className="transition-all duration-500 ease-out"
                      />
                    );
                  })}

                  <rect
                    x={x - colWidth / 2}
                    y={paddingTop}
                    width={colWidth}
                    height={graphHeight}
                    fill="transparent"
                  />
                </g>
              );
            })}

            {/* X Axis Labels */}
            {labels.map((lbl, idx) => {
              const x = getBarX(idx);
              return (
                <text key={idx} x={x} y={viewHeight - 8} textAnchor="middle" className="fill-slate-400 text-[9px] font-mono">
                  {lbl.length > 12 ? `${lbl.slice(0, 10)}...` : lbl}
                </text>
              );
            })}
          </svg>

          {activeIdx !== null && (
            <div
              className="absolute bg-base-100 border border-base-300 text-slate-800 p-2.5 rounded-lg text-xs shadow-xl z-50 pointer-events-none"
              style={{
                left: `${Math.min(getBarX(activeIdx) + 15, width - 140)}px`,
                top: `${paddingTop}px`,
              }}
            >
              <div className="text-slate-500 font-medium mb-1 border-b border-base-200 pb-1 font-mono">{labels[activeIdx]}</div>
              {series.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 my-0.5">
                  <span className="text-slate-550 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </span>
                  <span className="font-bold font-mono">{s.data[activeIdx] || 0}</span>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 mt-1 pt-1 border-t border-base-200 font-semibold">
                <span className="text-slate-600">Total:</span>
                <span className="font-mono text-cyan-600">{stackTotals[activeIdx]}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
