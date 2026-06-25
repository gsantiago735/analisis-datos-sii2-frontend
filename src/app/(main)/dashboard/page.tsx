import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Database, Eye, HelpCircle, Home, Sigma, Upload, Wand2 } from 'lucide-react'
import { getUserDatasetsAction } from '@/app/actions/datasets'
import DeleteDatasetButton from '@/components/datasets/DeleteDatasetButton'

// Formatea la fecha de subida para mostrar una lectura amigable en la tabla.
// Si el dataset acaba de cargarse, se muestra una referencia relativa breve.
function formatDate(value: string) {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) return 'Ahora'
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

// Módulos disponibles para el rol analista dentro del panel principal.
// Esta página no se comparte con administración; los accesos de admin viven en /admin.
const modules = [
  {
    title: 'Cargar dataset',
    description: 'Importa un archivo tabular y guárdalo en tu espacio de trabajo.',
    href: '/upload',
    icon: Upload,
  },
  {
    title: 'Perfilado de datos',
    description: 'Diagnostica tipos de variables, valores nulos, atípicos y calidad general.',
    href: '/explorer/frequencies',
    icon: Wand2,
  },
  {
    title: 'Estadísticas descriptivas',
    description: 'Calcula mínimos, máximos, cuartiles, promedio y desviación estándar.',
    href: '/report',
    icon: Sigma,
  },
]

export default async function DashboardPage() {
  // La cookie "role" se define durante el login en auth.ts. Aquí se usa como
  // primera barrera de autorización para decidir si este diseño puede mostrarse.
  const cookieStore = await cookies()
  const role = cookieStore.get('role')?.value

  // El panel con módulos, datasets y accesos de exploración corresponde al rol
  // "analista". Si un administrador entra a /panel-principal, se redirige a su vista.
  if (role === 'admin') {
    redirect('/admin')
  }

  // Cualquier rol ausente, expirado o desconocido se envía al login. Esto evita
  // renderizar información de trabajo si la sesión no tiene permisos claros.
  if (role !== 'analista') {
    redirect('/login')
  }

  // Una vez confirmado que el usuario es analista, se cargan sus datasets.
  // Esta llamada depende del token guardado en cookies y devuelve solo datos
  // asociados a la sesión actual.
  const { datasets, error } = await getUserDatasetsAction()
  const activeDataset = datasets[0]

  return (
    <div className="min-h-screen bg-[#f4fafb]">
      {/* Encabezado: identifica la vista actual y muestra el estado del usuario analista. */}
      <header className="border-b border-slate-200 bg-white/90 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-[#0b3d63]">Panel principal</h1>
            <p className="text-xs font-medium text-slate-400">Resumen del espacio de trabajo</p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-[#0b6685] transition hover:bg-slate-50" title="Ayuda">
              <HelpCircle className="h-4 w-4" />
            </button>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0b6685] text-sm font-black text-white">
                AN
              </div>
              <div>
                <p className="text-sm font-black text-[#0b3d63]">Analista</p>
                <p className="text-xs font-medium text-teal-600">En línea</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal: resumen de trabajo, accesos a módulos y listado de datasets. */}
      <main className="px-8 py-8">
        {/* Sección de bienvenida y dataset activo: orienta al analista dentro de su espacio. */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Home className="h-4 w-4" />
              Inicio
            </div>
            <h2 className="text-4xl font-black tracking-normal text-[#0b3d63]">Panel principal</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">Selecciona el módulo con el que deseas trabajar.</p>
          </div>

          {activeDataset && (
            <div className="flex min-w-64 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <span className="h-3 w-3 rounded-full bg-teal-500" />
              <div>
                <p className="text-sm font-black text-[#0b3d63]">{activeDataset.nombre}</p>
                <p className="text-xs font-medium text-slate-400">Dataset activo</p>
              </div>
            </div>
          )}
        </div>

        {/* Sección de módulos: tarjetas de navegación disponibles para el rol analista. */}
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon

            return (
              <article key={module.title} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="absolute -right-10 -top-12 h-28 w-28 rounded-full bg-teal-50" />
                <div className="relative">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 text-[#0b6685]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-black text-[#0b3d63]">{module.title}</h3>
                  <p className="mt-3 min-h-12 text-sm font-medium leading-6 text-slate-500">{module.description}</p>
                  <div className="mt-6 flex items-center justify-between">
                    <Link href={module.href} className="rounded-lg border border-cyan-200 px-4 py-2 text-sm font-black text-[#0b6685] transition hover:bg-cyan-50">
                      Abrir módulo
                    </Link>
                    <span className="text-xs font-black text-teal-600">Disponible</span>
                  </div>
                </div>
              </article>
            )
          })}
        </section>

        {/* Sección de datasets: lista los archivos cargados por el usuario autenticado. */}
        <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-[#0b6685]" />
              <h3 className="text-lg font-black text-[#0b3d63]">Datasets guardados</h3>
            </div>
            <span className="text-xs font-black text-slate-400">
              {datasets.length} {datasets.length === 1 ? 'dataset' : 'datasets'}
            </span>
          </div>

          {/* Estados de la tabla: error de carga, lista vacía o tabla con datasets. */}
          {error ? (
            <div className="px-6 py-8 text-sm font-semibold text-red-600">{error}</div>
          ) : datasets.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Database className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-4 text-sm font-black text-[#0b3d63]">Todavía no tienes datasets guardados</p>
              <p className="mt-1 text-sm text-slate-500">Carga tu primer archivo para verlo listado en este panel.</p>
              <Link href="/upload" className="mt-5 inline-flex rounded-lg bg-[#84A9AC] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#3B6978]">
                Cargar dataset
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Nombre</th>
                    <th className="px-6 py-4">Archivo</th>
                    <th className="px-6 py-4">Formato</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Actualización</th>
                    <th className="px-6 py-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {datasets.map((dataset) => (
                    <tr key={dataset.id} className="text-sm">
                      <td className="px-6 py-5 font-black text-[#0b3d63]">{dataset.nombre}</td>
                      <td className="px-6 py-5 font-medium text-slate-500">{dataset.nombre_archivo || 'Sin archivo'}</td>
                      <td className="px-6 py-5 font-semibold text-slate-500">{dataset.formato || 'N/D'}</td>
                      <td className="px-6 py-5">
                        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-black text-teal-700">
                          {dataset.estado}
                        </span>
                      </td>
                      <td className="px-6 py-5 font-medium text-slate-500">{formatDate(dataset.fecha_subida)}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/datasets/${dataset.id}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-[#0b6685] transition hover:bg-cyan-50"
                            title="Visualizar"
                            aria-label={`Visualizar ${dataset.nombre}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <DeleteDatasetButton datasetId={dataset.id} datasetName={dataset.nombre} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
