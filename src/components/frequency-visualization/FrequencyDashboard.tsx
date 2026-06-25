"use client";

import { useMemo, useState } from "react";
import type { VariableSummary } from "./types";
import { mockVariables } from "./mockData";
import { VariableCard } from "./VariableCard";
import { VariableDetailModal } from "./VariableDetailModal";
import { SearchIcon, AlertIcon, LayersIcon, ChevronDownIcon } from "./icons";

/**
 * Versión liviana de un dataset para poblar el selector. Se define aquí
 * (en vez de importar el tipo real del backend, ej. `DatasetItem`) para
 * que este componente siga siendo independiente de tu API: en `page.tsx`
 * simplemente mapeas tus `DatasetItem[]` a esta forma mínima.
 */
export interface DatasetOption {
  id: number;
  nombre: string;
  nombreArchivo?: string | null;
}

export interface FrequencyDashboardProps {
  /** Lista de variables a mostrar. Por defecto usa datos de ejemplo. */
  variables?: VariableSummary[];
  title?: string;
  subtitle?: string;
  /**
   * Llamado cuando el analista selecciona una variable (paso 1 del CU04).
   * Úsalo para pedirle al backend el cálculo real si no quieres precalcular
   * todo de antemano. Debe resolver con el VariableSummary actualizado.
   */
  onSelectVariable?: (variable: VariableSummary) => Promise<VariableSummary> | VariableSummary;
  /**
   * Datasets disponibles para el selector. Si se omite o llega vacío, el
   * selector no se muestra (comportamiento idéntico al de antes).
   */
  datasets?: DatasetOption[];
  /** Id del dataset actualmente seleccionado (controlado desde afuera). */
  selectedDatasetId?: number | null;
  /**
   * Llamado cuando el analista elige otro dataset en el selector. Quien use
   * este componente decide qué hacer (normalmente: volver a pedir el
   * perfilado de ese dataset al backend).
   */
  onSelectDataset?: (datasetId: number) => void;
  /** Muestra un estado de carga sobre la grilla mientras cambias de dataset. */
  isLoadingDataset?: boolean;
}

export function FrequencyDashboard({
  variables = mockVariables,
  title = "Visualizar Frecuencias",
  subtitle = "Distribución de variables del dataset mediante tablas de frecuencia y diagramas de barras.",
  onSelectVariable,
  datasets,
  selectedDatasetId,
  onSelectDataset,
  isLoadingDataset = false,
}: FrequencyDashboardProps) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<VariableSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return variables;
    return variables.filter((v) => v.name.toLowerCase().includes(q));
  }, [variables, query]);

  async function handleOpen(variable: VariableSummary) {
    if (!onSelectVariable) {
      setActive(variable);
      return;
    }
    setIsLoading(true);
    setActive(variable);
    try {
      const resolved = await onSelectVariable(variable);
      setActive(resolved);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-full w-full bg-slate-50">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        {/* Encabezado */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-1 max-w-xl text-[13px] text-slate-500">{subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-right shadow-sm">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Variables</p>
              <p className="font-mono text-[15px] font-semibold tabular-nums text-slate-800">{variables.length}</p>
            </div>
          </div>
        </div>

        {/* Panel de control: dataset + buscador de variable */}
        <div className="mt-6 flex items-stretch gap-4 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <LayersIcon className="h-5 w-5" />
          </div>

          {datasets && datasets.length > 0 && (
            <div className="min-w-0 flex-1">
              <label htmlFor="dataset-select" className="block text-[11px] font-medium text-slate-400">
                Dataset seleccionado
              </label>
              <div className="relative mt-1">
                <select
                  id="dataset-select"
                  value={selectedDatasetId ?? ""}
                  onChange={(e) => onSelectDataset?.(Number(e.target.value))}
                  disabled={isLoadingDataset}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-[13.5px] font-semibold text-slate-800 outline-none transition-colors focus:border-teal-400 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {datasets.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nombre}
                      {d.nombreArchivo ? ` · ${d.nombreArchivo}` : ""}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <label htmlFor="variable-search" className="block text-[11px] font-medium text-slate-400">
              Buscar variable
            </label>
            <div className="relative mt-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                id="variable-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ej. Age, Cholesterol…"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-[13.5px] font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 outline-none transition-colors focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>
        </div>

        {/* Grid de variables */}
        <div className="relative">
          {isLoadingDataset && (
            <div className="absolute inset-0 z-10 flex items-start justify-center rounded-xl bg-slate-50/70 pt-16 backdrop-blur-[1px]">
              <p className="text-[13px] font-medium text-slate-500 animate-pulse">Cargando dataset…</p>
            </div>
          )}
          {filtered.length > 0 ? (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {filtered.map((variable) => (
                <VariableCard key={variable.id} variable={variable} onOpen={handleOpen} />
              ))}
            </div>
          ) : (
            <EmptyState query={query} />
          )}
        </div>
      </div>

      <VariableDetailModal variable={active} isLoading={isLoading} onClose={() => setActive(null)} />
    </div>
  );
}

/** Excepción 1.1 del CU04: si la variable no existe, se muestra un mensaje claro. */
function EmptyState({ query }: { query: string }) {
  return (
    <div className="mt-16 flex flex-col items-center justify-center text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-500">
        <AlertIcon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-[14px] font-semibold text-slate-700">No se encontró la variable &quot;{query}&quot;</h3>
      <p className="mt-1 max-w-xs text-[12.5px] text-slate-400">
        Verifica el nombre o revisa que el dataset cargado contenga esta columna.
      </p>
    </div>
  );
}