import React, { useState } from 'react';

interface MultiAreaChartProps {
  labels: string[];
  series: {
    name: string;
    data: number[];
    color: string;
  }[];
  height?: number;
}

export default function MultiAreaChart({ labels, series, height = 200 }: MultiAreaChartProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;
  const width = 600;
  const viewHeight = height;

  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = viewHeight - paddingTop - paddingBottom;

  const allValues = series.flatMap(s => s.data);
  const maxVal = Math.max(...allValues, 10);
  
  const getCoordinates = (val: number, idx: number, total: number) => {
    const x = paddingLeft + (idx / (total - 1 || 1)) * graphWidth;
    const y = paddingTop + graphHeight - (val / maxVal) * graphHeight;
    return { x, y };
  };

  const linePath = (data: number[]) => {
    if (data.length === 0) return '';
    const points = data.map((val, idx) => getCoordinates(val, idx, data.length));
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 3;
      const cpY1 = curr.y;
      const cpX2 = curr.x + 2 * (next.x - curr.x) / 3;
      const cpY2 = next.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
    return path;
  };

  const areaPath = (data: number[]) => {
    if (data.length === 0) return '';
    const points = data.map((val, idx) => getCoordinates(val, idx, data.length));
    const mainLine = linePath(data);
    const bottomY = paddingTop + graphHeight;
    return `${mainLine} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;
  };

  return (
    <div className="w-full flex flex-col bg-base-100 border border-base-200 p-6 rounded-2xl shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <span className="text-sm font-semibold tracking-wider text-slate-700">Estadísticas Comparativas</span>
        <div className="flex items-center gap-4">
          {series.map((s, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color, boxShadow: `0 0 6px ${s.color}80` }} />
              <span className="text-xs text-slate-500 font-medium">{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative w-full" style={{ height: `${viewHeight}px` }}>
        <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${viewHeight}`} preserveAspectRatio="none">
          <defs>
            {series.map((s, idx) => (
              <linearGradient key={idx} id={`gradient-area-${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
              </linearGradient>
            ))}
            <filter id="glow-line" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
            const y = paddingTop + r * graphHeight;
            const gridVal = Math.round(maxVal * (1 - r));
            return (
              <g key={idx}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(0, 0, 0, 0.05)" strokeDasharray="4 4" />
                <text x={paddingLeft - 8} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px] font-mono">
                  {gridVal}
                </text>
              </g>
            );
          })}

          {/* Area under curves */}
          {series.map((s, idx) => (
            <path
              key={`area-${idx}`}
              d={areaPath(s.data)}
              fill={`url(#gradient-area-${idx})`}
              className="transition-all duration-700 ease-out"
            />
          ))}

          {/* Stroke curves */}
          {series.map((s, idx) => (
            <path
              key={`stroke-${idx}`}
              d={linePath(s.data)}
              fill="transparent"
              stroke={s.color}
              strokeWidth="2.5"
              filter="url(#glow-line)"
              className="transition-all duration-700 ease-out"
            />
          ))}

          {/* X Axis Labels */}
          {labels.map((lbl, idx) => {
            const x = paddingLeft + (idx / (labels.length - 1 || 1)) * graphWidth;
            return (
              <text key={idx} x={x} y={viewHeight - 8} textAnchor="middle" className="fill-slate-400 text-[9px] font-mono">
                {lbl}
              </text>
            );
          })}

          {/* Interactive hover lines */}
          {labels.map((_, idx) => {
            const x = paddingLeft + (idx / (labels.length - 1 || 1)) * graphWidth;
            return (
              <g key={idx} onMouseEnter={() => setActiveIdx(idx)} onMouseLeave={() => setActiveIdx(null)} className="cursor-pointer">
                {activeIdx === idx && (
                  <line x1={x} y1={paddingTop} x2={x} y2={paddingTop + graphHeight} stroke="rgba(0, 0, 0, 0.1)" strokeWidth="1" strokeDasharray="3 3" />
                )}
                <rect
                  x={x - (graphWidth / (labels.length - 1 || 1)) / 2}
                  y={paddingTop}
                  width={graphWidth / (labels.length - 1 || 1)}
                  height={graphHeight}
                  fill="transparent"
                />
                {activeIdx === idx && series.map((s, sIdx) => {
                  const pt = getCoordinates(s.data[idx], idx, labels.length);
                  return (
                    <circle
                      key={sIdx}
                      cx={pt.x}
                      cy={pt.y}
                      r="5"
                      fill={s.color}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Tooltip Overlay */}
        {activeIdx !== null && (
          <div
            className="absolute bg-base-100 border border-base-300 text-slate-800 p-2.5 rounded-lg text-xs shadow-xl flex flex-col gap-1 z-50 pointer-events-none"
            style={{
              left: `${Math.min(paddingLeft + (activeIdx / (labels.length - 1 || 1)) * graphWidth + 15, width - 130)}px`,
              top: `${paddingTop}px`,
            }}
          >
            <div className="font-bold text-slate-700 border-b border-base-200 pb-1 mb-1 font-mono">
              {labels[activeIdx]}
            </div>
            {series.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}
                </span>
                <span className="font-bold font-mono">{s.data[activeIdx]?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
