import Link from 'next/link'
import {
  AlertTriangle,
  CheckCircle2,
  Columns3,
  Database,
  FileSearch,
  Maximize2,
  RefreshCw,
  Search,
  ShieldCheck,
  Table2,
} from 'lucide-react'
import { getUserDatasetsAction } from '@/app/actions/datasets'
import { getDatasetProfileAction } from '@/app/actions/profile'
import ProfileSelectors from '@/components/profile/ProfileSelectors'

type ProfilingPageProps = {
  searchParams?: Promise<{
    datasetId?: string
    variable?: string
  }>
}

function formatNumber(value: number) {
  // Aplica formato local a cantidades grandes como registros, nulos y atipicos.
  return new Intl.NumberFormat('es-CO').format(value)
}

function formatDateTime(value: string) {
  // Convierte la fecha ISO del backend en una etiqueta compacta para el header.
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function typeBadgeClass(type: string) {
  // Centraliza los colores de badges para que tabla y panel lateral coincidan.
  if (type === 'Numérica') return 'bg-blue-50 text-blue-700'
  if (type === 'Temporal') return 'bg-emerald-50 text-emerald-700'
  return 'bg-violet-50 text-violet-700'
}

export default async function FrequenciesPage({ searchParams }: ProfilingPageProps) {
  const params = await searchParams
  const { datasets, error: datasetsError } = await getUserDatasetsAction()
  const fallbackDatasetId = datasets[0]?.id ?? 0
  const requestedDatasetId = Number(params?.datasetId || fallbackDatasetId)
  const selectedDatasetId = datasets.some((dataset) => dataset.id === requestedDatasetId) ? requestedDatasetId : fallbackDatasetId

  if (datasetsError) {
    return <div className="p-8 text-sm font-semibold text-red-600">{datasetsError}</div>
  }

  if (!datasets.length) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Database className="mx-auto h-10 w-10 text-slate-300" />
          <h1 className="mt-4 text-2xl font-black text-slate-900">No hay datasets para perfilar</h1>
          <p className="mt-2 text-sm text-slate-500">Carga un dataset antes de ejecutar el diagnóstico de estructura y calidad.</p>
          <Link href="/upload" className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700">
            Cargar dataset
          </Link>
        </div>
      </div>
    )
  }

  const { profile, error: profileError } = await getDatasetProfileAction(selectedDatasetId, params?.variable)
  const selectedVariable = params?.variable || profile?.variable_detalle?.nombre

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <main className="px-8 py-7">
        <header className="mb-6 flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-400">
              <span>Datasets</span>
              <span>/</span>
              <span className="font-black text-slate-600">{profile?.dataset_nombre || 'Dataset'}</span>
              <span>/</span>
              <span>Perfilado</span>
            </div>
            <h1 className="text-4xl font-black tracking-normal text-slate-900">Perfilado de datos</h1>
            <p className="mt-2 text-base font-medium text-slate-500">
              Diagnóstico automático de la estructura, calidad y distribución del dataset.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 ring-1 ring-emerald-100">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Perfilado completado
            </span>
            <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600 shadow-sm" title="Expandir vista">
              <Maximize2 className="h-5 w-5" />
            </button>
          </div>
        </header>

        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Database className="h-6 w-6" />
              </div>
              <ProfileSelectors
                datasets={datasets}
                variables={profile?.variables || []}
                selectedDatasetId={selectedDatasetId}
                selectedVariable={selectedVariable}
              />
            </div>

            <div className="flex items-center gap-5">
              <div className="border-l border-slate-200 pl-5">
                <p className="text-xs font-semibold text-slate-400">Última actualización</p>
                <p className="text-sm font-black text-slate-700">{profile ? formatDateTime(profile.fecha_subida) : 'N/D'}</p>
              </div>
              <Link href="/dashboard" className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50">
                Ver detalles del dataset
              </Link>
              <Link href={`/explorer/frequencies?datasetId=${selectedDatasetId}`} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700">
                <RefreshCw className="h-4 w-4" />
                Actualizar perfilado
              </Link>
            </div>
          </div>
        </section>

        {profileError || !profile ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700">
            {profileError || 'No se pudo cargar el perfilado.'}
          </div>
        ) : (
          <>
            <section className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-5">
              {[
                { label: 'Registros', value: formatNumber(profile.resumen.registros), detail: 'Filas analizadas', icon: Table2, tone: 'blue' },
                { label: 'Variables', value: formatNumber(profile.resumen.variables), detail: `${profile.resumen.numericas} numéricas · ${profile.resumen.categoricas} categóricas · ${profile.resumen.temporales} temporales`, icon: Columns3, tone: 'blue' },
                { label: 'Completitud', value: `${profile.resumen.completitud}%`, detail: 'Calidad general del dataset', icon: CheckCircle2, tone: 'emerald' },
                { label: 'Registros nulos', value: formatNumber(profile.resumen.registros_nulos), detail: 'Valores faltantes detectados', icon: AlertTriangle, tone: 'orange' },
                { label: 'Valores atípicos', value: formatNumber(profile.resumen.valores_atipicos), detail: 'Detectados con método IQR', icon: ShieldCheck, tone: 'red' },
              ].map((metric) => {
                const Icon = metric.icon
                const toneClass = metric.tone === 'emerald' ? 'bg-emerald-50 text-emerald-600' : metric.tone === 'orange' ? 'bg-orange-50 text-orange-600' : metric.tone === 'red' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'

                return (
                  <article key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-black text-slate-400">{metric.label}</p>
                        <p className="mt-3 text-3xl font-black tracking-normal text-slate-900">{metric.value}</p>
                        <p className="mt-1 text-xs font-medium text-slate-400">{metric.detail}</p>
                      </div>
                      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClass}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                    </div>
                  </article>
                )
              })}
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_460px]">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Variables del dataset</h2>
                    <p className="mt-1 text-sm font-medium text-slate-400">Selecciona una variable para consultar su detalle.</p>
                  </div>
                  <div className="flex h-10 w-56 items-center gap-2 rounded-lg border border-slate-300 px-3 text-slate-400">
                    <Search className="h-4 w-4" />
                    <span className="text-sm">Buscar variable</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-6 py-4">Variable</th>
                        <th className="px-6 py-4">Tipo</th>
                        <th className="px-6 py-4">Nulos</th>
                        <th className="px-6 py-4">Atípicos</th>
                        <th className="px-6 py-4">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {profile.variables.map((variable) => {
                        const isActive = variable.nombre === profile.variable_detalle?.nombre
                        return (
                          <tr key={variable.nombre} className={isActive ? 'bg-blue-50/55' : 'bg-white'}>
                            <td className={`px-6 py-4 ${isActive ? 'border-l-4 border-blue-600' : ''}`}>
                              <Link href={`/explorer/frequencies?datasetId=${selectedDatasetId}&variable=${encodeURIComponent(variable.nombre)}`} className="font-black text-slate-800">
                                {variable.nombre}
                              </Link>
                              <p className="text-xs font-medium text-slate-400">{formatNumber(variable.validos)} valores válidos</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`rounded-full px-3 py-1 text-xs font-black ${typeBadgeClass(variable.tipo)}`}>{variable.tipo}</span>
                            </td>
                            <td className={`px-6 py-4 text-sm font-black ${variable.nulos > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                              {formatNumber(variable.nulos)} · {variable.porcentaje_nulos}%
                            </td>
                            <td className={`px-6 py-4 text-sm font-black ${(variable.atipicos || 0) > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                              {variable.atipicos ?? '—'}{variable.atipicos ? ' · IQR' : ''}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`rounded-full px-3 py-1 text-xs font-black ${variable.estado === 'Correcta' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
                                {variable.estado}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-slate-100 px-6 py-4 text-sm font-medium text-slate-400">
                  Mostrando {profile.variables.length} de {profile.variables.length} variables
                </div>
              </div>

              {profile.variable_detalle && (
                <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">{profile.variable_detalle.nombre}</h2>
                      <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
                        <span className={`rounded-full px-3 py-1 font-black ${typeBadgeClass(profile.variable_detalle.tipo)}`}>{profile.variable_detalle.tipo}</span>
                        <span>{formatNumber(profile.variable_detalle.validos)} válidos</span>
                        <span>·</span>
                        <span>{formatNumber(profile.variable_detalle.nulos)} nulos</span>
                      </div>
                    </div>
                    <FileSearch className="h-5 w-5 text-slate-400" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {profile.variable_detalle.estadisticas.map((stat) => (
                      <div key={stat.etiqueta} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                        <p className="text-xs font-bold text-slate-400">{stat.etiqueta}</p>
                        <p className="mt-2 text-sm font-black text-slate-900">{stat.valor}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <h3 className="text-sm font-black text-slate-900">Distribución por rangos</h3>
                    <div className="mt-4 space-y-3">
                      {profile.variable_detalle.distribucion.map((item) => (
                        <div key={item.rango} className="grid grid-cols-[88px_1fr_42px] items-center gap-3 text-xs">
                          <span className="truncate font-medium text-slate-500">{item.rango}</span>
                          <div className="h-2 rounded-full bg-slate-100">
                            <div className="h-2 rounded-full bg-blue-600" style={{ width: `${Math.min(item.porcentaje, 100)}%` }} />
                          </div>
                          <span className="text-right font-black text-slate-600">{item.porcentaje}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-sm font-black text-slate-900">Valores y porcentajes</h3>
                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-100">
                      {profile.variable_detalle.porcentajes.map((item) => (
                        <div key={item.rango} className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-b-0">
                          <span className="max-w-56 truncate text-xs font-semibold text-slate-500">{item.rango}</span>
                          <span className="text-xs font-black text-blue-600">{item.porcentaje}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </aside>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
