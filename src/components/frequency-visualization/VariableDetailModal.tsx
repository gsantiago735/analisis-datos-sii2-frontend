"use client";

import { useEffect, useMemo } from "react";
import type { VariableSummary } from "./types";
import { TypeBadge } from "./TypeBadge";
import { FrequencyBarChart } from "./FrequencyBarChart";
import { BoxPlotChart } from "./BoxPlotChart";
import { CloseIcon, SparkleIcon } from "./icons";
import { formatNumber, formatPercent, smartDecimals } from "./utils";

interface VariableDetailModalProps {
  variable: VariableSummary | null;
  isLoading: boolean;
  onClose: () => void;
}

export function VariableDetailModal({ variable, isLoading, onClose }: VariableDetailModalProps) {
  useEffect(() => {
    if (!variable && !isLoading) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [variable, isLoading, onClose]);

  if (!variable && !isLoading) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5">
        {isLoading || !variable ? <ModalSkeleton /> : <ModalContent variable={variable} onClose={onClose} />}
      </div>
    </div>
  );
}

function ModalContent({ variable, onClose }: { variable: VariableSummary; onClose: () => void }) {
  const isCategorical = variable.type === "STRING";
  const insight = useMemo(() => buildInsight(variable), [variable]);

  const rows = useMemo(() => {
    let cumulative = 0;
    return variable.bins.map((bin) => {
      cumulative += bin.count;
      return {
        ...bin,
        pct: (bin.count / variable.totalCount) * 100,
        cumPct: (cumulative / variable.totalCount) * 100,
      };
    });
  }, [variable]);

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">{variable.name}</h2>
            <TypeBadge type={variable.type} />
          </div>
          <p className="mt-0.5 text-[12.5px] text-slate-400">
            {formatNumber(variable.totalCount, 0)} observaciones consideradas
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      {variable.groupedOthers && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-700">
          Esta variable tiene {variable.distinctCount} categorías. Para mantener la lectura clara, las menos
          frecuentes se agruparon en &quot;Otros&quot;.{" "}
          <span className="underline cursor-pointer">Ver todas sin agrupar</span>
        </div>
      )}

      <div className="mt-5 grid gap-6 sm:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">Frecuencia</p>
          <FrequencyBarChart bins={variable.bins} totalCount={variable.totalCount} size="large" />

          {variable.boxplot && (
            <div className="mt-6">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">Diagrama de caja</p>
              <BoxPlotChart stats={variable.boxplot} size="large" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {!isCategorical ? (
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <ModalStat label="Media" value={formatNumber(variable.mean ?? 0, smartDecimals(variable.mean ?? 0))} />
              <ModalStat label="Desv. Est." value={formatNumber(variable.std ?? 0, smartDecimals(variable.std ?? 0))} />
              {variable.boxplot && (
                <>
                  <ModalStat
                    label="Mediana"
                    value={formatNumber(variable.boxplot.median, smartDecimals(variable.boxplot.median))}
                  />
                  <ModalStat
                    label="Rango"
                    value={`${formatNumber(variable.boxplot.min, 0)} – ${formatNumber(variable.boxplot.max, 0)}`}
                  />
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <ModalStat label="Categorías" value={String(variable.distinctCount ?? variable.bins.length)} />
              <ModalStat label="Moda" value={variable.mode ?? "—"} />
            </div>
          )}

          <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-teal-700">
              <SparkleIcon className="h-3 w-3" />
              Patrón de concentración
            </div>
            <p className="text-[12.5px] leading-snug text-teal-900">{insight}</p>
          </div>
        </div>
      </div>

      {/* Tabla de frecuencias */}
      <div className="mt-6">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">Tabla de frecuencias</p>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                <th className="px-3 py-2 font-medium">{isCategorical ? "Categoría" : "Rango"}</th>
                <th className="px-3 py-2 font-medium text-right">Frecuencia</th>
                <th className="px-3 py-2 font-medium text-right">%</th>
                <th className="px-3 py-2 font-medium text-right">% acumulado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.label + i} className="border-t border-slate-100">
                  <td className="px-3 py-1.5 text-slate-700">{row.label}</td>
                  <td className="px-3 py-1.5 text-right font-mono tabular-nums text-slate-700">
                    {formatNumber(row.count, 0)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono tabular-nums text-slate-500">
                    {formatPercent(row.pct)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono tabular-nums text-slate-400">
                    {formatPercent(row.cumPct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ModalStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="truncate font-mono text-[13px] tabular-nums text-slate-800" title={value}>
        {value}
      </p>
    </div>
  );
}

function ModalSkeleton() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-7 w-7 animate-pulse rounded-full bg-slate-200" />
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-[1.3fr_1fr]">
        <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
      </div>
      <div className="mt-6 h-40 animate-pulse rounded-xl bg-slate-100" />
      <p className="mt-4 text-center text-[12px] text-slate-400">Calculando frecuencias…</p>
    </div>
  );
}

/** Genera, a partir de los bins, una frase de interpretación (paso 5 del CU04). */
function buildInsight(variable: VariableSummary): string {
  if (variable.bins.length === 0) return "No hay suficientes datos para identificar un patrón.";

  const sorted = [...variable.bins].sort((a, b) => b.count - a.count);
  const top = sorted[0];
  const topPct = (top.count / variable.totalCount) * 100;

  if (variable.type === "STRING") {
    return `El ${formatPercent(topPct)} de los registros corresponde a "${top.label}", lo que la convierte en la categoría dominante de esta variable.`;
  }

  if (variable.std === 0) {
    return `Todos los valores son iguales a ${formatNumber(variable.mean ?? 0, 0)} — no hay variabilidad en esta variable.`;
  }

  if (topPct >= 50) {
    return `El ${formatPercent(topPct)} de los valores se concentra en el rango "${top.label}", lo que indica una distribución muy homogénea con poca dispersión.`;
  }

  if (variable.boxplot && variable.boxplot.outliers.length > 0) {
    return `La mayoría de los valores se ubica entre ${formatNumber(variable.boxplot.q1, smartDecimals(variable.boxplot.q1))} y ${formatNumber(variable.boxplot.q3, smartDecimals(variable.boxplot.q3))}, con ${variable.boxplot.outliers.length} valor(es) atípico(s) que se alejan del resto.`;
  }

  return `Los valores se distribuyen de forma relativamente pareja, con mayor concentración en el rango "${top.label}" (${formatPercent(topPct)}).`;
}
