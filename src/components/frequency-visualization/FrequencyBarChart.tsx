"use client";

import { useMemo, useState } from "react";
import type { FrequencyBin } from "./types";
import { formatNumber, formatPercent } from "./utils";

interface BarChartProps {
  bins: FrequencyBin[];
  totalCount: number;
  /** "compact" para la tarjeta, "large" para el modal de detalle. */
  size?: "compact" | "large";
}

export function FrequencyBarChart({ bins, totalCount, size = "compact" }: BarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = useMemo(() => Math.max(...bins.map((b) => b.count), 1), [bins]);
  const height = size === "large" ? 180 : 92;

  return (
    <div className="relative">
      <div
        className="flex items-end gap-1"
        style={{ height }}
        role="img"
        aria-label="Diagrama de barras de frecuencias"
      >
        {bins.map((bin, i) => {
          const pct = (bin.count / max) * 100;
          const isHovered = hovered === i;
          return (
            <div
              key={bin.label + i}
              className="group relative flex-1 flex flex-col items-center justify-end h-full"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
            >
              {isHovered && (
                <div className="absolute bottom-full mb-1.5 z-10 -translate-x-1/2 left-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-[11px] font-medium text-white shadow-lg">
                  <div className="font-mono tabular-nums">{formatNumber(bin.count, 0)} reg.</div>
                  <div className="text-slate-300">
                    {bin.label} · {formatPercent((bin.count / totalCount) * 100)}
                  </div>
                  <div className="absolute left-1/2 top-full h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-slate-800" />
                </div>
              )}
              <div
                className={`w-full rounded-t-[3px] transition-all duration-300 ease-out ${
                  isHovered ? "bg-teal-700" : "bg-teal-500/90 group-hover:bg-teal-600"
                }`}
                style={{
                  height: `${Math.max(pct, bin.count > 0 ? 3 : 0)}%`,
                  transitionProperty: "height, background-color",
                }}
              />
            </div>
          );
        })}
      </div>
      {size === "large" && (
        <div className="mt-2 flex gap-1">
          {bins.map((bin, i) => (
            <div
              key={bin.label + i}
              className="flex-1 truncate text-center text-[10px] text-slate-400"
              title={bin.label}
            >
              {bin.label}
            </div>
          ))}
        </div>
      )}
      {size === "compact" && bins.length > 0 && (
        <div className="mt-1.5 flex justify-between text-[10px] text-slate-400 font-mono tabular-nums">
          <span>{bins[0].label}</span>
          {bins.length > 1 && <span>{bins[bins.length - 1].label}</span>}
        </div>
      )}
    </div>
  );
}
