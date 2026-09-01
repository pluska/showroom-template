import React, { useState } from 'react';

interface GradientAreaChartProps {
  labels: string[];
  data: number[];
  colorStart?: string;
  colorEnd?: string;
  name: string;
  height?: number;
}

export default function GradientAreaChart({
  labels,
  data,
  colorStart = '#8b5cf6', // violet
  colorEnd = '#ec4899',   // pink
  name,
  height = 200
}: GradientAreaChartProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;
  const width = 600;
  const viewHeight = height;

  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = viewHeight - paddingTop - paddingBottom;

  const maxVal = Math.max(...data, 10);

  const getCoordinates = (val: number, idx: number, total: number) => {
    const x = paddingLeft + (idx / (total - 1 || 1)) * graphWidth;
    const y = paddingTop + graphHeight - (val / maxVal) * graphHeight;
    return { x, y };
  };

  const linePath = () => {
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

  const areaPath = () => {
    if (data.length === 0) return '';
    const points = data.map((val, idx) => getCoordinates(val, idx, data.length));
    const mainLine = linePath();
    const bottomY = paddingTop + graphHeight;
    return `${mainLine} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;
  };

  return (
    <div className="w-full flex flex-col bg-base-100 border border-base-200 p-6 rounded-2xl shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold tracking-wider text-slate-700">{name}</span>
        <span className="text-xs text-slate-400 font-mono">Tendencia del Periodo</span>
      </div>

      <div className="relative w-full" style={{ height: `${viewHeight}px` }}>
        <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${viewHeight}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="curveGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={colorStart} />
              <stop offset="100%" stopColor={colorEnd} />
            </linearGradient>
            
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colorStart} stopOpacity="0.2" />
              <stop offset="100%" stopColor={colorEnd} stopOpacity="0.0" />
            </linearGradient>

            <filter id="glow-profit" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

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

          {/* Area fill */}
          <path d={areaPath()} fill="url(#areaGradient)" />

          {/* Stroke path */}
          <path d={linePath()} fill="transparent" stroke="url(#curveGradient)" strokeWidth="3" filter="url(#glow-profit)" />

          {/* X Axis Labels */}
          {labels.map((lbl, idx) => {
            const x = paddingLeft + (idx / (labels.length - 1 || 1)) * graphWidth;
            return (
              <text key={idx} x={x} y={viewHeight - 8} textAnchor="middle" className="fill-slate-400 text-[9px] font-mono">
                {lbl}
              </text>
            );
          })}

          {/* Hover Column / Markers */}
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
                {activeIdx === idx && (
                  <circle
                    cx={getCoordinates(data[idx], idx, data.length).x}
                    cy={getCoordinates(data[idx], idx, data.length).y}
                    r="5"
                    fill="url(#curveGradient)"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {activeIdx !== null && (
          <div
            className="absolute bg-base-100 border border-base-300 text-slate-800 p-2.5 rounded-lg text-xs shadow-xl z-50 pointer-events-none"
            style={{
              left: `${Math.min(paddingLeft + (activeIdx / (labels.length - 1 || 1)) * graphWidth + 15, width - 110)}px`,
              top: `${paddingTop}px`,
            }}
          >
            <div className="text-slate-500 font-medium mb-0.5 font-mono">{labels[activeIdx]}</div>
            <div className="font-bold text-sm text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-pink-500">
              {data[activeIdx]?.toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
