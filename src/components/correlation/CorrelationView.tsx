'use client'

import { useState, useTransition, useMemo } from 'react'
import { AlertTriangle, Loader2, Play, Star, TrendingUp } from 'lucide-react'
import { generateCorrelationAction } from '@/app/actions/correlation'
import type { CorrelationResult } from '@/app/actions/correlation'
import type { DatasetItem } from '@/app/actions/datasets'

type Props = {
  datasets: DatasetItem[]
}

type HoveredCell = { x: string; y: string; value: number }

const CELL = 44

function valueToColor(value: number): string {
  const v = Math.max(-1, Math.min(1, value))
  if (v >= 0) {
    // slate-100 (#f1f5f9) → blue-600 (#2563eb)
    const t = v
    return `rgb(${Math.round(241 * (1 - t) + 37 * t)},${Math.round(245 * (1 - t) + 99 * t)},${Math.round(249 * (1 - t) + 235 * t)})`
  } else {
    // slate-100 (#f1f5f9) → red-600 (#dc2626)
    const t = -v
    return `rgb(${Math.round(241 * (1 - t) + 220 * t)},${Math.round(245 * (1 - t) + 38 * t)},${Math.round(249 * (1 - t) + 38 * t)})`
  }
}

function cellTextColor(value: number): string {
  return Math.abs(value) > 0.45 ? 'white' : '#334155'
}

export default function CorrelationView({ datasets }: Props) {
  const [datasetId, setDatasetId] = useState(datasets[0]?.id ?? 0)
  const [metodo, setMetodo] = useState<'pearson' | 'spearman' | 'kendall'>('pearson')
  const [estrategia, setEstrategia] = useState<'ignorar' | 'eliminar'>('ignorar')
  const [result, setResult] = useState<CorrelationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hovered, setHovered] = useState<HoveredCell | null>(null)
  const [isPending, startTransition] = useTransition()

  const variables = useMemo(() => {
    if (!result) return []
    return [...new Set(result.matriz_calor.map((c) => c.id_x))]
  }, [result])

  const cellMap = useMemo(() => {
    if (!result) return {}
    return Object.fromEntries(result.matriz_calor.map((c) => [`${c.id_x}||${c.id_y}`, c.valor]))
  }, [result])

  const handleGenerate = () => {
    startTransition(async () => {
      setError(null)
      setResult(null)
      const res = await generateCorrelationAction({ dataset_id: datasetId, metodo, estrategia_nulos: estrategia })
      if (res.error) setError(res.error)
      else if (res.result) setResult(res.result)
    })
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[#f4f7fb] xl:grid-cols-[300px_1fr]">
      {/* Sidebar */}
      <aside className="border-b border-slate-200 bg-white p-6 xl:border-b-0 xl:border-r">
        <h1 className="text-xl font-black text-slate-900">Matriz de Correlación</h1>
        <p className="mt-1 text-sm text-slate-400">Configura y genera el análisis</p>

        <div className="mt-8 space-y-5">
          <div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase text-slate-400">Dataset</span>
              <select
                value={datasetId}
                onChange={(e) => setDatasetId(Number(e.target.value))}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>{d.nombre} · ID {d.id}</option>
                ))}
              </select>
            </label>
            {(() => {
              const ds = datasets.find((d) => d.id === datasetId)
              if (!ds) return null
              return (
                <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 space-y-1">
                  {ds.descripcion && (
                    <p className="text-xs text-slate-500 leading-relaxed">{ds.descripcion}</p>
                  )}
                  {ds.nombre_archivo && (
                    <p className="text-[11px] font-semibold text-slate-400">{ds.nombre_archivo}</p>
                  )}
                  <p className="text-[11px] font-semibold text-slate-400">
                    {(ds.peso_bytes / 1024).toFixed(1)} KB · {ds.formato.toUpperCase()}
                  </p>
                </div>
              )
            })()}
          </div>

          <div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase text-slate-400">Método</span>
              <select
                value={metodo}
                onChange={(e) => setMetodo(e.target.value as typeof metodo)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="pearson">Pearson</option>
                <option value="spearman">Spearman</option>
                <option value="kendall">Kendall</option>
              </select>
            </label>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              {metodo === 'pearson' && 'Mide relaciones lineales entre variables numéricas continuas. Ideal cuando los datos siguen una distribución normal.'}
              {metodo === 'spearman' && 'Mide relaciones monotónicas usando rangos. Más robusto ante valores atípicos y datos no normales.'}
              {metodo === 'kendall' && 'Mide concordancia entre pares de observaciones. Recomendado para muestras pequeñas o con muchos empates.'}
            </p>
          </div>

          <div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase text-slate-400">Estrategia de nulos</span>
              <select
                value={estrategia}
                onChange={(e) => setEstrategia(e.target.value as typeof estrategia)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ignorar">Ignorar</option>
                <option value="eliminar">Eliminar</option>
              </select>
            </label>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              {estrategia === 'ignorar' && 'Calcula cada par de variables usando solo las filas con valores completos en ambas. Conserva más datos.'}
              {estrategia === 'eliminar' && 'Elimina todas las filas que tengan al menos un valor nulo. Garantiza consistencia pero puede reducir la muestra.'}
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isPending || !datasetId}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {isPending ? 'Generando...' : 'Generar'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="p-6 lg:p-8">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {!result && !isPending && (
          <div className="flex h-64 items-center justify-center text-sm font-semibold text-slate-400">
            Selecciona un dataset y presiona Generar
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {result.aviso_omision && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {result.aviso_omision}
              </div>
            )}

            {/* Heatmap */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-black text-slate-900">Mapa de Calor</h2>
                  <p className="mt-0.5 text-xs font-medium text-slate-400 capitalize">Método: {metodo}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div
                    className="h-3 w-44 rounded-full border border-slate-200"
                    style={{ background: 'linear-gradient(to right, rgb(220,38,38), rgb(241,245,249), rgb(37,99,235))' }}
                  />
                  <div className="flex w-44 justify-between text-[10px] font-bold text-slate-400">
                    <span>−1 negativa</span>
                    <span>0</span>
                    <span>+1 positiva</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div style={{ display: 'inline-block', minWidth: 'max-content' }}>
                  {/* Column headers */}
                  <div className="flex" style={{ marginLeft: 144 }}>
                    {variables.map((v) => (
                      <div
                        key={v}
                        style={{ width: CELL, height: 120, flexShrink: 0 }}
                        className="flex items-end justify-center pb-1 overflow-hidden"
                      >
                        <span
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: 112 }}
                          className="text-[11px] font-bold text-slate-500 truncate"
                          title={v}
                        >
                          {v}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Rows */}
                  <div className="flex flex-col gap-0.5">
                    {variables.map((rowVar) => (
                      <div key={rowVar} className="flex items-center gap-0.5">
                        <div
                          style={{ width: 140, flexShrink: 0 }}
                          className="truncate pr-3 text-right text-[11px] font-bold text-slate-500"
                          title={rowVar}
                        >
                          {rowVar}
                        </div>
                        {variables.map((colVar) => {
                          const val = cellMap[`${rowVar}||${colVar}`] ?? 0
                          const isHovered = hovered?.x === rowVar && hovered?.y === colVar
                          return (
                            <div
                              key={colVar}
                              style={{
                                width: CELL,
                                height: CELL,
                                flexShrink: 0,
                                backgroundColor: valueToColor(val),
                                borderRadius: 6,
                                transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                                boxShadow: isHovered ? '0 0 0 2px white' : 'none',
                                transition: 'transform 0.12s ease, box-shadow 0.12s ease',
                                position: 'relative',
                                zIndex: isHovered ? 10 : 1,
                                cursor: 'default',
                              }}
                              onMouseEnter={() => setHovered({ x: rowVar, y: colVar, value: val })}
                              onMouseLeave={() => setHovered(null)}
                              className="flex items-center justify-center"
                            >
                              <span
                                className="select-none text-[10px] font-black"
                                style={{ color: cellTextColor(val) }}
                              >
                                {val.toFixed(2)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tooltip bar */}
              <div className="mt-5 h-9 rounded-lg bg-slate-100 px-4 flex items-center border border-slate-200">
                {hovered ? (
                  <p className="text-xs font-semibold text-slate-500">
                    <span className="font-black text-slate-900">{hovered.x}</span>
                    <span className="mx-1.5 text-slate-400">↔</span>
                    <span className="font-black text-slate-900">{hovered.y}</span>
                    <span className="mx-2 text-slate-300">·</span>
                    <span>Coeficiente:</span>
                    <span className="ml-1.5 font-black text-slate-900">
                      {hovered.value > 0 ? '+' : ''}{hovered.value.toFixed(4)}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-slate-400">Pasa el cursor sobre una celda para ver el detalle</p>
                )}
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Relaciones fuertes */}
              {result.relaciones_fuertes.length > 0 && (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-1 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-slate-400" />
                    <h3 className="text-sm font-black uppercase text-slate-400">Relaciones fuertes</h3>
                  </div>
                  <p className="mb-4 text-xs text-slate-400 leading-relaxed">
                    Pares de variables cuyo coeficiente supera un umbral significativo. Indican que ambas variables se mueven de forma conjunta (positiva o negativamente) y pueden revelar dependencias importantes en los datos.
                  </p>
                  <ul className="space-y-2.5">
                    {result.relaciones_fuertes.map((r, i) => (
                      <li key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {r.variable_1} <span className="text-slate-400">↔</span> {r.variable_2}
                          </p>
                          <p className="mt-0.5 text-xs font-semibold capitalize text-slate-400">{r.tipo}</p>
                        </div>
                        <span
                          className="rounded-full px-3 py-1 text-xs font-black text-white"
                          style={{ backgroundColor: valueToColor(r.coeficiente) }}
                        >
                          {r.coeficiente > 0 ? '+' : ''}{r.coeficiente.toFixed(3)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Variables clave */}
              {result.variables_claves.length > 0 && (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-1 flex items-center gap-2">
                    <Star className="h-4 w-4 text-slate-400" />
                    <h3 className="text-sm font-black uppercase text-slate-400">Variables clave</h3>
                  </div>
                  <p className="mb-4 text-xs text-slate-400 leading-relaxed">
                    Variables que presentan correlaciones fuertes con múltiples columnas del dataset. Son candidatas a ser predictores relevantes o factores de confusión en análisis posteriores.
                  </p>
                  <ul className="space-y-2">
                    {result.variables_claves.map((v, i) => (
                      <li key={i} className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-2.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-black text-blue-600">
                          {i + 1}
                        </span>
                        <span className="text-sm font-semibold text-slate-800">{v}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
