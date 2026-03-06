"use client";

import type React from "react";
import { useState, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";

const defaultWeekData = [
  { day: "Sun", value: 450 },
  { day: "Mon", value: 520 },
  { day: "Tue", value: 680 },
  { day: "Wed", value: 750 },
  { day: "Thu", value: 620 },
  { day: "Fri", value: 780 },
  { day: "Sat", value: 920 },
];

export interface BudgetCardProps {
  title?: string;
  amount?: string;
  trendLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  weekData?: { day: string; value: number }[];
  icon?: React.ElementType;
  className?: string;
}

export function BudgetCard({
  title = "Budget",
  amount = "$30.739",
  trendLabel = "+ 20%",
  trend = "up",
  weekData = defaultWeekData,
  icon: Icon,
  className
}: BudgetCardProps = {}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(3);
  const chartRef = useRef<SVGSVGElement>(null);

  const maxValue = Math.max(...weekData.map((d) => d.value));
  const minValue = Math.min(...weekData.map((d) => d.value));
  const chartHeight = 160;
  const chartWidth = 360;
  const padding = { top: 40, bottom: 35, left: 10, right: 10 };

  const getY = (value: number) => {
    const range = maxValue - minValue;
    const normalized = (value - minValue) / range;
    return (
      chartHeight -
      padding.bottom -
      normalized * (chartHeight - padding.top - padding.bottom)
    );
  };

  const getX = (index: number) => {
    return (
      padding.left +
      (index / (weekData.length - 1)) * (chartWidth - padding.left - padding.right)
    );
  };

  const generatePath = () => {
    const points = weekData.map((d, i) => ({ x: getX(i), y: getY(d.value) }));

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const tension = 0.35;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
  };

  const generateAreaPath = () => {
    const linePath = generatePath();
    const lastPoint = weekData.length - 1;
    return `${linePath} L ${getX(lastPoint)} ${chartHeight - padding.bottom} L ${getX(
      0
    )} ${chartHeight - padding.bottom} Z`;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const relativeX = (x / rect.width) * chartWidth;

    let closestIndex = 0;
    let closestDist = Number.POSITIVE_INFINITY;
    weekData.forEach((_, i) => {
      const dist = Math.abs(getX(i) - relativeX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    });
    setHoveredIndex(closestIndex);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(3);
  };

  const scatteredDots = useMemo(
    () =>
      Array.from({ length: 35 }, (_, i) => ({
        x: 40 + (i % 7) * 42 + (Math.random() - 0.5) * 30,
        y: padding.top + 15 + Math.floor(i / 7) * 15 + (Math.random() - 0.5) * 10,
        opacity: 0.4 + Math.random() * 0.4,
        size: 1.2 + Math.random() * 1.8,
      })),
    []
  );

  // Determine colors based on trend
  const strokeColor = trend === 'up' ? '#00FA9A' : trend === 'down' ? '#FF4444' : '#8A2BE2';
  const glowShadow = trend === 'up' ? 'rgba(0,250,154,0.3)' : trend === 'down' ? 'rgba(255,68,68,0.3)' : 'rgba(138,43,226,0.3)';

  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-[#09090b] p-5 pb-4 shadow-[0_2px_8px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] border border-white/5 h-full flex flex-col justify-between", className)}>
      {/* Inner highlight */}
      <div className="absolute inset-[1px] rounded-[7px] bg-transparent pointer-events-none" />

      {/* Header Section */}
      <div className="flex items-start justify-between relative z-10 w-full mb-1">
        <div className="flex flex-col w-full">
          <p className="flex items-center gap-2 text-[12px] font-bold tracking-wide text-[var(--color-brand-muted)] mb-2">
            {Icon && <span className="flex items-center justify-center p-1.5 rounded-lg bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)]"><Icon size={14} /></span>}
            {title}
          </p>
          <div className="flex items-center justify-between w-full">
             <h2 className="text-[26px] xl:text-[30px] font-black leading-[1] tracking-tight text-white mb-0">
               {amount}
             </h2>
             <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/5 px-2 py-1 shadow-sm">
               <span className="text-[10px] font-bold text-white tracking-wider whitespace-nowrap">{trendLabel}</span>
               <svg
                 width="12"
                 height="12"
                 viewBox="0 0 16 16"
                 fill="none"
                 className="text-foreground"
               >
                 <path
                   d={trend === 'up' ? "M2 11L6 7L9 10L14 4" : "M2 4L6 8L9 5L14 11"}
                   stroke={trend === 'up' ? "#00FA9A" : trend === 'down' ? "#FF4444" : "#8A2BE2"}
                   strokeWidth="2"
                   strokeLinecap="round"
                   strokeLinejoin="round"
                 />
                 <path
                   d={trend === 'up' ? "M10 4H14V8" : "M10 11H14V7"}
                   stroke={trend === 'up' ? "#00FA9A" : trend === 'down' ? "#FF4444" : "#8A2BE2"}
                   strokeWidth="2"
                   strokeLinecap="round"
                   strokeLinejoin="round"
                 />
               </svg>
             </div>
          </div>
        </div>
        
        <div className="absolute -right-4 -top-8 h-[130px] w-[150px] opacity-20 mix-blend-luminosity">
          <MoneyIllustration />
        </div>
      </div>

        {/* Chart Section */}
        <div className="relative mt-8 h-[75px] w-full origin-bottom scale-y-110">
          <svg
            ref={chartRef}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full absolute bottom-0 left-0"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: "default" }}
          >
            <defs>
              <linearGradient id={`lineGradient-${trend}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={strokeColor} />
                <stop offset="100%" stopColor={strokeColor} />
              </linearGradient>
              <filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5B52E5" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#5B52E5" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Area fill - subdued */}
            <path
              d={generateAreaPath()}
              fill="url(#areaGradient)"
              className="transition-all duration-300"
            />

            {/* Main curve line */}
            <path
              d={generatePath()}
              fill="none"
              stroke={`url(#lineGradient-${trend})`}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: `drop-shadow(0 0 8px ${glowShadow})` }}
            />

            {/* Hover data point */}
            {hoveredIndex !== null && (
              <g className="transition-all duration-150 ease-out">
                {/* Glow ring */}
                <circle
                  cx={getX(hoveredIndex)}
                  cy={getY(weekData[hoveredIndex].value)}
                  r="16"
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2"
                  opacity="0.3"
                  filter="url(#dotGlow)"
                />
                <circle
                  cx={getX(hoveredIndex)}
                  cy={getY(weekData[hoveredIndex].value)}
                  r="6"
                  className="fill-[#09090b]"
                  stroke={strokeColor}
                  strokeWidth="3.5"
                />
              </g>
            )}

            {/* Day labels (only shown initially if not hovering, or shown conditionally) */}
            <g opacity="0.3">
               {weekData.map((d, i) => (
                 <text
                   key={i}
                   x={getX(i)}
                   y={chartHeight - 8}
                   textAnchor="middle"
                   className="text-[10px] font-bold fill-[var(--color-brand-muted)] uppercase tracking-widest"
                 >
                   {d.day}
                 </text>
               ))}
            </g>
          </svg>

          {/* Floating tooltip */}
          {hoveredIndex !== null && (
            <div
              className="pointer-events-none absolute transition-all duration-150 ease-out"
              style={{
                left: `${(getX(hoveredIndex) / chartWidth) * 100}%`,
                top: `${(getY(weekData[hoveredIndex].value) / chartHeight) * 100}%`,
                transform: "translate(-50%, -140%)",
              }}
            >
              <div 
                 className="relative rounded-lg px-3 py-1.5"
                 style={{ backgroundColor: strokeColor, boxShadow: `0 4px 16px ${glowShadow}` }}
              >
                <span className="text-[12px] font-bold text-black tracking-tight" style={{ color: '#000' }}>
                  ${weekData[hoveredIndex].value}
                </span>
                {/* Tooltip arrow */}
                <div 
                   className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent" 
                   style={{ borderTopColor: strokeColor }}
                />
              </div>
            </div>
          )}
        </div>
    </div>
  );
}

function MoneyIllustration() {
  return (
    <svg viewBox="0 0 130 110" className="h-full w-full drop-shadow-lg">
      <defs>
        <linearGradient id="bill1" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="oklch(from var(--card) l c h)" />
          <stop offset="40%" stopColor="oklch(from var(--muted) l c h / 0.8)" />
          <stop offset="100%" stopColor="oklch(from var(--muted) l c h / 0.6)" />
        </linearGradient>
        <linearGradient id="bill2" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor="oklch(from var(--card) l c h)" />
          <stop offset="50%" stopColor="oklch(from var(--card) l c h / 0.95)" />
          <stop offset="100%" stopColor="oklch(from var(--muted) l c h / 0.7)" />
        </linearGradient>
        <linearGradient id="bill3" x1="0" y1="0" x2="0.1" y2="1">
          <stop offset="0%" stopColor="oklch(from var(--card) l c h)" />
          <stop offset="100%" stopColor="oklch(from var(--muted) l c h / 0.85)" />
        </linearGradient>
        <linearGradient id="holeGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(from var(--border) l c h / 0.8)" />
          <stop offset="100%" stopColor="oklch(from var(--border) l c h / 0.6)" />
        </linearGradient>
        <filter id="billShadow1" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#000" floodOpacity="0.05" />
        </filter>
        <filter id="billShadow2" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.1" />
        </filter>
        <filter id="billShadow3" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.08" />
        </filter>
        <filter id="innerShadow">
          <feOffset dx="0" dy="1" />
          <feGaussianBlur stdDeviation="1" result="shadow" />
          <feComposite in="SourceGraphic" in2="shadow" operator="over" />
        </filter>
      </defs>

      {/* Back bill - most tilted */}
      <g transform="translate(8, 12) rotate(-20, 40, 25)" filter="url(#billShadow1)">
        <rect x="0" y="0" width="80" height="48" rx="6" fill="url(#bill1)" />
        {/* Circles - filled to match reference */}
        <circle cx="62" cy="14" r="7" fill="url(#holeGrad)" />
        <circle cx="62" cy="34" r="5" fill="url(#holeGrad)" />
      </g>

      {/* Middle bill */}
      <g transform="translate(22, 28) rotate(-10, 40, 25)" filter="url(#billShadow2)">
        <rect x="0" y="0" width="80" height="48" rx="6" fill="url(#bill2)" />
        <circle cx="62" cy="14" r="7" fill="url(#holeGrad)" />
        <circle cx="62" cy="34" r="5" fill="url(#holeGrad)" />
      </g>

      {/* Front bill - least tilted */}
      <g transform="translate(38, 44) rotate(-2, 40, 25)" filter="url(#billShadow3)">
        <rect x="0" y="0" width="80" height="48" rx="6" fill="url(#bill3)" />
        <circle cx="62" cy="14" r="7" fill="url(#holeGrad)" />
        <circle cx="62" cy="34" r="5" fill="url(#holeGrad)" />
      </g>
    </svg>
  );
}
