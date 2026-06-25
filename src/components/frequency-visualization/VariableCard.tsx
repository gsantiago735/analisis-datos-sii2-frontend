"use client";

import type { VariableSummary } from "./types";
import { TypeBadge } from "./TypeBadge";
import { FrequencyBarChart } from "./FrequencyBarChart";
import { BoxPlotChart } from "./BoxPlotChart";
import { ExpandIcon } from "./icons";
import { formatNumber, smartDecimals } from "./utils";

interface VariableCardProps {
  variable: VariableSummary;
  onOpen: (variable: VariableSummary) => void;
}

export function VariableCard({ variable, onOpen }: VariableCardProps) {
  const isCategorical = variable.type === "STRING";

  return (
    <button
      type="button"
      onClick={() => onOpen(variable)}
      className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
    >
      <span className="pointer-events-none absolute right-3 top-3 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100">
        <ExpandIcon className="h-3.5 w-3.5" />
      </span>

      {/* Encabezado */}
      <div className="flex items-start justify-between gap-2 pr-4">
        <h3 className="truncate text-[13.5px] font-semibold text-slate-800">{variable.name}</h3>
        <TypeBadge type={variable.type} />
      </div>

      {/* Estadísticos */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        {isCategorical ? (
          <>
            <Stat label="Categorías" value={String(variable.distinctCount ?? variable.bins.length)} />
            <Stat label="Moda" value={variable.mode ?? "—"} truncate />
          </>
        ) : (
          <>
            <Stat
              label="Media"
              value={variable.mean !== null ? formatNumber(variable.mean, smartDecimals(variable.mean)) : "N/A"}
            />
            <Stat
              label="Desv. Est."
              value={variable.std !== null ? formatNumber(variable.std, smartDecimals(variable.std)) : "N/A"}
            />
          </>
        )}
      </div>

      {/* Frecuencia */}
      <div className="mt-4">
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">Frecuencia</p>
        {variable.bins.length > 0 ? (
          <>
            <FrequencyBarChart bins={variable.bins} totalCount={variable.totalCount} size="compact" />
            {variable.groupedOthers && (
              <p className="mt-1 text-[10px] text-amber-600">Categorías agrupadas en &quot;Otros&quot;</p>
            )}
          </>
        ) : (
          <div className="flex h-[92px] items-center justify-center rounded-lg border border-dashed border-slate-200 text-[11px] text-slate-400">
            Toca para calcular distribución
          </div>
        )}
      </div>

      {/* Boxplot */}
      <div className="mt-4">
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">Boxplot</p>
        {isCategorical ? (
          <div className="flex h-9 items-center text-[11px] text-slate-300">No aplica para texto</div>
        ) : variable.boxplot ? (
          <BoxPlotChart stats={variable.boxplot} size="compact" />
        ) : (
          <div className="flex h-9 items-center text-[11px] text-slate-300">Pendiente de calcular</div>
        )}
      </div>
    </button>
  );
}

function Stat({ label, value, truncate }: { label: string; value: string; truncate?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`font-mono text-[12.5px] tabular-nums text-slate-700 ${truncate ? "truncate" : ""}`} title={truncate ? value : undefined}>
        {value}
      </p>
    </div>
  );
}
