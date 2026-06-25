"use client";

import { useState } from "react";
import type { BoxplotStats } from "./types";
import { formatNumber, smartDecimals } from "./utils";

interface BoxPlotProps {
  stats: BoxplotStats;
  size?: "compact" | "large";
}

type HoverTarget = "min" | "q1" | "median" | "q3" | "max" | `outlier-${number}` | null;

export function BoxPlotChart({ stats, size = "compact" }: BoxPlotProps) {
  const [hover, setHover] = useState<HoverTarget>(null);
  const { min, q1, median, q3, max, outliers, outlierCount } = stats;
  // Caso de perfilamientos automáticos que solo dan el TOTAL de atípicos,
  // sin los valores puntuales: no inventamos puntos, mostramos un aviso.
  const hasUnlistedOutliers = outliers.length === 0 && !!outlierCount && outlierCount > 0;

  const domainMin = Math.min(min, ...outliers);
  const domainMax = Math.max(max, ...outliers);
  const span = domainMax - domainMin || 1;
  const toX = (v: number) => 4 + ((v - domainMin) / span) * 92; // % within a 0-100 viewbox, padded

  const height = size === "large" ? 64 : 36;
  const decimals = smartDecimals(median);

  const tooltipFor = (target: HoverTarget): { x: number; label: string; value: number } | null => {
    if (!target) return null;
    if (target === "min") return { x: toX(min), label: "Mín", value: min };
    if (target === "q1") return { x: toX(q1), label: "Q1", value: q1 };
    if (target === "median") return { x: toX(median), label: "Mediana", value: median };
    if (target === "q3") return { x: toX(q3), label: "Q3", value: q3 };
    if (target === "max") return { x: toX(max), label: "Máx", value: max };
    if (target.startsWith("outlier-")) {
      const idx = Number(target.split("-")[1]);
      return { x: toX(outliers[idx]), label: "Atípico", value: outliers[idx] };
    }
    return null;
  };

  const tip = tooltipFor(hover);

  return (
    <div className="relative">
      <svg viewBox="0 0 100 24" width="100%" height={height} preserveAspectRatio="none" className="overflow-visible">
        {/* línea base / bigotes */}
        <line x1={toX(min)} y1={12} x2={toX(q1)} y2={12} stroke="#94A3B8" strokeWidth={1.25} />
        <line x1={toX(q3)} y1={12} x2={toX(max)} y2={12} stroke="#94A3B8" strokeWidth={1.25} />
        {/* tapas de los bigotes */}
        <line x1={toX(min)} y1={8} x2={toX(min)} y2={16} stroke="#94A3B8" strokeWidth={1.25} />
        <line x1={toX(max)} y1={8} x2={toX(max)} y2={16} stroke="#94A3B8" strokeWidth={1.25} />
        {/* caja IQR */}
        <rect
          x={Math.min(toX(q1), toX(q3))}
          y={4}
          width={Math.max(Math.abs(toX(q3) - toX(q1)), 0.6)}
          height={16}
          rx={1.5}
          fill="#F1F5F9"
          stroke="#475569"
          strokeWidth={1.25}
        />
        {/* mediana */}
        <line x1={toX(median)} y1={4} x2={toX(median)} y2={20} stroke="#0D9488" strokeWidth={1.75} />
        {/* atípicos */}
        {outliers.map((o, i) => (
          <circle
            key={i}
            cx={toX(o)}
            cy={12}
            r={1.4}
            fill="#F59E0B"
            stroke="#B45309"
            strokeWidth={0.4}
            className="cursor-pointer"
            onMouseEnter={() => setHover(`outlier-${i}`)}
            onMouseLeave={() => setHover((h) => (h === `outlier-${i}` ? null : h))}
          />
        ))}
        {/* zonas interactivas invisibles (más fáciles de "agarrar" con el mouse) */}
        {([
          ["min", min],
          ["q1", q1],
          ["median", median],
          ["q3", q3],
          ["max", max],
        ] as const).map(([key, v]) => (
          <rect
            key={key}
            x={toX(v) - 2}
            y={0}
            width={4}
            height={24}
            fill="transparent"
            className="cursor-pointer"
            onMouseEnter={() => setHover(key)}
            onMouseLeave={() => setHover((h) => (h === key ? null : h))}
          />
        ))}
      </svg>

      {tip && (
        <div
          className="pointer-events-none absolute -top-9 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-[11px] font-medium text-white shadow-lg"
          style={{ left: `${tip.x}%` }}
        >
          <span className="text-slate-300">{tip.label}:</span>{" "}
          <span className="font-mono tabular-nums">{formatNumber(tip.value, decimals)}</span>
          <div className="absolute left-1/2 top-full h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-slate-800" />
        </div>
      )}

      <div className="mt-1 flex justify-between text-[10px] text-slate-400 font-mono tabular-nums">
        <span>{formatNumber(domainMin, decimals)}</span>
        <span>{formatNumber(domainMax, decimals)}</span>
      </div>

      {hasUnlistedOutliers && (
        <p className="mt-1 flex items-center gap-1 text-[10.5px] text-amber-600">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
          {outlierCount} valor{outlierCount === 1 ? "" : "es"} atípico{outlierCount === 1 ? "" : "s"} detectado
          {outlierCount === 1 ? "" : "s"} (no graficado{outlierCount === 1 ? "" : "s"} individualmente)
        </p>
      )}
    </div>
  );
}
