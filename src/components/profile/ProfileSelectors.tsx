'use client'

import { useRouter } from 'next/navigation'
import type { DatasetItem } from '@/app/actions/datasets'
import type { ProfileVariable } from '@/app/actions/profile'

type ProfileSelectorsProps = {
  datasets: DatasetItem[]
  variables: ProfileVariable[]
  selectedDatasetId?: number
  selectedVariable?: string
}

export default function ProfileSelectors({
  datasets,
  variables,
  selectedDatasetId,
  selectedVariable,
}: ProfileSelectorsProps) {
  const router = useRouter()
  const currentDatasetId = selectedDatasetId ?? datasets[0]?.id

  const updateRoute = (datasetId: string, variable?: string) => {
    // Centraliza la navegacion del selector. Usamos query params para que la
    // pantalla pueda renderizarse en servidor con el dataset y variable elegidos.
    const params = new URLSearchParams()
    params.set('datasetId', datasetId)

    if (variable) {
      params.set('variable', variable)
    } else {
      params.delete('variable')
    }

    router.push(`/explorer/frequencies?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-slate-400">Dataset seleccionado</span>
        <select
          value={currentDatasetId ?? ''}
          onChange={(event) => updateRoute(event.target.value)}
          className="h-10 min-w-80 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          {datasets.map((dataset) => (
            <option key={dataset.id} value={dataset.id}>
              {dataset.nombre} · {dataset.nombre_archivo || 'archivo'}
            </option>
          ))}
        </select>
      </label>

      {variables.length > 0 && (
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-400">Variable de detalle</span>
          <select
            value={selectedVariable || variables[0]?.nombre || ''}
            onChange={(event) => updateRoute(String(currentDatasetId), event.target.value)}
            className="h-10 min-w-56 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {variables.map((variable) => (
              <option key={variable.nombre} value={variable.nombre}>
                {variable.nombre}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}
