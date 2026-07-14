'use client'

import { useState, useTransition, useEffect } from 'react'
import { AlertTriangle, Loader2, Play, TableProperties } from 'lucide-react'
import { generatePivotAction, getDatasetColumnsAction } from '@/app/actions/pivot'
import type { PivotResult } from '@/app/actions/pivot'
import type { DatasetItem } from '@/app/actions/datasets'

type Props = {
  datasets: DatasetItem[]
}

const FUNCIONES = [
  { value: 'sum', label: 'Suma' },
  { value: 'mean', label: 'Promedio' },
  { value: 'count', label: 'Conteo' },
  { value: 'min', label: 'Mínimo' },
  { value: 'max', label: 'Máximo' },
  { value: 'median', label: 'Mediana' },
]

function formatCellValue(val: unknown): string | null {
  if (val === null || val === undefined) return null
  if (typeof val === 'number') {
    return Number.isInteger(val) ? val.toLocaleString('es-CL') : val.toFixed(2)
  }
  return String(val)
}

export default function PivotView({ datasets }: Props) {
  const [datasetId, setDatasetId] = useState(datasets[0]?.id ?? 0)
  const [columns, setColumns] = useState<string[]>([])
  const [loadingCols, setLoadingCols] = useState(false)
  const [colsError, setColsError] = useState<string | null>(null)

  const [filas, setFilas] = useState<string[]>([])
  const [columnas, setColumnas] = useState<string[]>([])
  const [valores, setValores] = useState('')
  const [funcion, setFuncion] = useState('sum')

  const [result, setResult] = useState<PivotResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!datasetId) return
    setLoadingCols(true)
    setColsError(null)
    setColumns([])
    setFilas([])
    setColumnas([])
    setValores('')
    setResult(null)
    setError(null)

    getDatasetColumnsAction(datasetId).then(({ columns: cols, error: err }) => {
      setLoadingCols(false)
      if (err) { setColsError(err); return }
      setColumns(cols ?? [])
    })
  }, [datasetId])

  const toggleFilas = (col: string) => {
    setFilas(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col])
    setColumnas(prev => prev.filter(c => c !== col))
  }

  const toggleColumnas = (col: string) => {
    setColumnas(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col])
    setFilas(prev => prev.filter(c => c !== col))
  }

  const canGenerate = filas.length > 0 && !!valores && !isPending && !loadingCols

  const handleGenerate = () => {
    startTransition(async () => {
      setError(null)
      setResult(null)
      const res = await generatePivotAction({
        dataset_id: datasetId,
        filas,
        columnas,
        valores,
        funcion_agregacion: funcion,
      })
      if (res.error) setError(res.error)
      else if (res.result) setResult(res.result)
    })
  }

  const tableHeaders = result?.datos_pivot.length ? Object.keys(result.datos_pivot[0]) : []
  const rowDimensions = tableHeaders.filter(h => filas.includes(h))
  const valueColumns = tableHeaders.filter(h => !filas.includes(h))
  const orderedHeaders = [...rowDimensions, ...valueColumns]

  const selectedDataset = datasets.find(d => d.id === datasetId)
  const funcionLabel = FUNCIONES.find(f => f.value === funcion)?.label ?? funcion

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[#f4f7fb] xl:grid-cols-[320px_1fr]">
      {/* Config panel */}
      <aside className="border-b border-slate-200 bg-white xl:border-b-0 xl:border-r xl:overflow-y-auto xl:h-screen xl:sticky xl:top-0">
        <div className="p-6">
          <h1 className="text-xl font-black text-slate-900">Tablas Dinámicas</h1>
          <p className="mt-1 text-sm text-slate-400">Configura y genera el análisis</p>

          <div className="mt-8 space-y-6">
            {/* Dataset selector */}
            <div>
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase text-slate-400">Dataset</span>
                <select
                  value={datasetId}
                  onChange={e => setDatasetId(Number(e.target.value))}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {datasets.map(d => (
                    <option key={d.id} value={d.id}>{d.nombre} · ID {d.id}</option>
                  ))}
                </select>
              </label>
              {selectedDataset && (
                <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 space-y-1">
                  {selectedDataset.descripcion && (
                    <p className="text-xs text-slate-500 leading-relaxed">{selectedDataset.descripcion}</p>
                  )}
                  {selectedDataset.nombre_archivo && (
                    <p className="text-[11px] font-semibold text-slate-400">{selectedDataset.nombre_archivo}</p>
                  )}
                  <p className="text-[11px] font-semibold text-slate-400">
                    {(selectedDataset.peso_bytes / 1024).toFixed(1)} KB · {selectedDataset.formato.toUpperCase()}
                  </p>
                </div>
              )}
            </div>

            {loadingCols && (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Cargando columnas...
              </div>
            )}

            {colsError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-600">
                {colsError}
              </div>
            )}

            {columns.length > 0 && (
              <>
                {/* Filas */}
                <div>
                  <span className="mb-1 block text-xs font-black uppercase text-slate-400">
                    Dimensiones de Filas <span className="text-red-400">*</span>
                  </span>
                  <p className="mb-2 text-[11px] text-slate-400 leading-relaxed">
                    Columnas que identificarán cada fila de la tabla.
                  </p>
                  <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 space-y-0.5">
                    {columns.map(col => (
                      <label key={col} className="flex items-center gap-2 cursor-pointer rounded px-2 py-1 hover:bg-white transition-colors">
                        <input
                          type="checkbox"
                          checked={filas.includes(col)}
                          onChange={() => toggleFilas(col)}
                          className="h-3.5 w-3.5 rounded accent-blue-600 shrink-0"
                        />
                        <span className="text-xs font-semibold text-slate-700 truncate" title={col}>{col}</span>
                      </label>
                    ))}
                  </div>
                  {filas.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {filas.map(f => (
                        <span key={f} className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          {f}
                          <button onClick={() => toggleFilas(f)} className="ml-0.5 text-blue-400 hover:text-blue-700 leading-none">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Columnas */}
                <div>
                  <span className="mb-1 block text-xs font-black uppercase text-slate-400">
                    Columnas Pivote{' '}
                    <span className="normal-case text-[10px] font-semibold text-slate-300">(opcional)</span>
                  </span>
                  <p className="mb-2 text-[11px] text-slate-400 leading-relaxed">
                    Sus valores únicos se convierten en encabezados de columna.
                  </p>
                  <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 space-y-0.5">
                    {columns.map(col => (
                      <label key={col} className="flex items-center gap-2 cursor-pointer rounded px-2 py-1 hover:bg-white transition-colors">
                        <input
                          type="checkbox"
                          checked={columnas.includes(col)}
                          onChange={() => toggleColumnas(col)}
                          className="h-3.5 w-3.5 rounded accent-violet-600 shrink-0"
                        />
                        <span className="text-xs font-semibold text-slate-700 truncate" title={col}>{col}</span>
                      </label>
                    ))}
                  </div>
                  {columnas.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {columnas.map(c => (
                        <span key={c} className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                          {c}
                          <button onClick={() => toggleColumnas(c)} className="ml-0.5 text-violet-400 hover:text-violet-700 leading-none">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Valores */}
                <div>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-black uppercase text-slate-400">
                      Columna de Valores <span className="text-red-400">*</span>
                    </span>
                    <select
                      value={valores}
                      onChange={e => setValores(e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Seleccionar columna...</option>
                      {columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Función de agregación */}
                <div>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-black uppercase text-slate-400">Función de Agregación</span>
                    <select
                      value={funcion}
                      onChange={e => setFuncion(e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      {FUNCIONES.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </>
            )}

            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isPending ? 'Generando...' : 'Generar'}
            </button>
          </div>
        </div>
      </aside>

      {/* Results panel */}
      <main className="p-6 lg:p-8">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {!result && !isPending && (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <TableProperties className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-400">
              Selecciona filas, valores y presiona Generar
            </p>
          </div>
        )}

        {isPending && (
          <div className="flex h-64 items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <p className="text-sm font-semibold text-slate-400">Generando tabla dinámica...</p>
          </div>
        )}

        {result && !isPending && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">Resultado</h2>
                <p className="mt-0.5 text-xs font-semibold text-emerald-600">{result.mensaje}</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
                {result.datos_pivot.length} {result.datos_pivot.length === 1 ? 'fila' : 'filas'}
              </span>
            </div>

            {/* Pivot table */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4">
                <h3 className="text-sm font-black text-slate-900">Tabla Dinámica</h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  <span className="font-semibold text-slate-500">Filas:</span> {filas.join(', ')}
                  {columnas.length > 0 && (
                    <> · <span className="font-semibold text-slate-500">Columnas:</span> {columnas.join(', ')}</>
                  )}
                  {' '}· <span className="font-semibold text-slate-500">Valores:</span> {valores} ({funcionLabel})
                </p>
              </div>

              {result.datos_pivot.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-sm font-semibold text-slate-400">
                  No se obtuvieron datos con la configuración aplicada.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {orderedHeaders.map((h, i) => (
                          <th
                            key={h}
                            className={`px-4 py-3 text-left text-xs font-black uppercase whitespace-nowrap ${
                              i < rowDimensions.length
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-slate-50 text-slate-500'
                            }`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.datos_pivot.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          {orderedHeaders.map((h, j) => {
                            const val = formatCellValue(row[h])
                            const isIndex = j < rowDimensions.length
                            return (
                              <td
                                key={h}
                                className={`px-4 py-2.5 whitespace-nowrap ${
                                  isIndex
                                    ? 'text-sm font-bold text-slate-900'
                                    : 'text-sm font-semibold text-slate-600 tabular-nums'
                                }`}
                              >
                                {val === null ? (
                                  <span className="text-slate-300">—</span>
                                ) : val}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="border-t border-slate-100 px-6 py-3">
                <p className="text-xs font-semibold text-slate-400">
                  {result.datos_pivot.length} {result.datos_pivot.length === 1 ? 'registro' : 'registros'}
                </p>
              </div>
            </section>

            {/* Config summary */}
            {Object.keys(result.configuracion).length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-3 text-sm font-black text-slate-900">Configuración aplicada</h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(result.configuracion).map(([key, val]) => (
                    <div key={key} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                      <p className="text-[10px] font-black uppercase text-slate-400">{key}</p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-700 truncate" title={String(val)}>
                        {Array.isArray(val) ? val.join(', ') : String(val)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
