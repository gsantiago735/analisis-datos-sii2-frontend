import Link from 'next/link'
import { ArrowLeft, Bot, ChevronLeft, ChevronRight, Database, FileSpreadsheet, Rows3, Table2 } from 'lucide-react'
import { getDatasetContentAction } from '@/app/actions/datasets'
import DatasetCreatedNotice from '@/components/datasets/DatasetCreatedNotice'

// Props recibidas por la ruta dinamica /datasets/[datasetId].
// `created` se usa solo para mostrar el aviso temporal despues de una carga exitosa.
type DatasetViewPageProps = {
  params: Promise<{
    datasetId: string
  }>
  searchParams?: Promise<{
    created?: string
    page?: string
    number_of_records?: string
  }>
}

// Formatea cantidades grandes como filas, columnas o registros visibles.
function formatNumber(value: number) {
  return new Intl.NumberFormat('es-CO').format(value)
}

// Normaliza valores de celda para renderizarlos como texto en la tabla.
// Los nulos se muestran como N/D para evitar celdas visualmente vacias.
function formatCellValue(value: string | number | boolean | null) {
  if (value === null) return 'N/D'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'

  return String(value)
}

// Mantiene los parametros de paginacion dentro de rangos razonables antes de
// enviarlos al backend.
function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

// Construye URLs de paginacion conservando el tamaño de pagina seleccionado.
function datasetPageHref(datasetId: number, page: number, numberOfRecords: number) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('number_of_records', String(numberOfRecords))

  return `/datasets/${datasetId}?${params.toString()}`
}

export default async function DatasetViewPage({ params, searchParams }: DatasetViewPageProps) {
  // Lectura de parametros de ruta y query string. Next los entrega como promesas
  // en esta version, por eso se resuelven antes de llamar al backend.
  const { datasetId } = await params
  const query = await searchParams
  const parsedDatasetId = Number(datasetId)
  const requestedPage = parsePositiveInteger(query?.page, 1)
  const requestedRecords = Math.min(parsePositiveInteger(query?.number_of_records, 25), 200)

  // Validacion temprana para evitar consultar el backend con ids invalidos.
  if (!Number.isInteger(parsedDatasetId) || parsedDatasetId <= 0) {
    return <div className="p-8 text-sm font-semibold text-red-600">Dataset inválido.</div>
  }

  // Carga del contenido del dataset desde el backend. La accion valida sesion
  // usando cookies httpOnly y devuelve solo datasets del usuario autenticado.
  const { dataset, error } = await getDatasetContentAction(parsedDatasetId, {
    page: requestedPage,
    numberOfRecords: requestedRecords,
  })

  // Estado de error: mantiene una salida navegable hacia el panel principal.
  if (error || !dataset) {
    return (
      <div className="min-h-screen bg-[#f4fafb] p-8">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm font-black text-[#0b6685]">
          <ArrowLeft className="h-4 w-4" />
          Volver al panel
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
          {error || 'No se pudo cargar el dataset.'}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4fafb] text-slate-900">
      <main className="px-8 py-8">
        {/* Navegacion secundaria para volver al listado de datasets. */}
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm font-black text-[#0b6685]">
          <ArrowLeft className="h-4 w-4" />
          Volver al panel
        </Link>

        {/* Aviso de creacion: solo aparece cuando la vista viene desde una carga exitosa. */}
        <DatasetCreatedNotice show={query?.created === '1'} />

        {/* Encabezado del dataset: nombre, descripcion y metadata visible del archivo. */}
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Database className="h-4 w-4" />
              Dataset
            </div>
            <h1 className="text-4xl font-black tracking-normal text-[#0b3d63]">{dataset.nombre}</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {dataset.descripcion || 'Vista previa del contenido tabular cargado.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/assistant?datasetId=${dataset.id}`} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700">
              <Bot className="h-4 w-4" />
              Preguntar
            </Link>
            <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-black text-[#0b3d63] shadow-sm">
              <FileSpreadsheet className="h-4 w-4 text-[#0b6685]" />
              {dataset.nombre_archivo || 'Archivo'}
            </span>
            <span className="rounded-lg border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm font-black text-[#0b6685]">
              {dataset.formato || 'N/D'}
            </span>
          </div>
        </header>

        {/* Resumen numerico para entender rapidamente el tamano del dataset. */}
        <section className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <Rows3 className="mb-3 h-5 w-5 text-[#0b6685]" />
            <p className="text-xs font-bold uppercase text-slate-400">Filas</p>
            <p className="mt-2 text-2xl font-black text-[#0b3d63]">{formatNumber(dataset.total_filas)}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <Table2 className="mb-3 h-5 w-5 text-[#0b6685]" />
            <p className="text-xs font-bold uppercase text-slate-400">Columnas</p>
            <p className="mt-2 text-2xl font-black text-[#0b3d63]">{formatNumber(dataset.total_columnas)}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <Database className="mb-3 h-5 w-5 text-[#0b6685]" />
            <p className="text-xs font-bold uppercase text-slate-400">Filas en página</p>
            <p className="mt-2 text-2xl font-black text-[#0b3d63]">{formatNumber(dataset.filas.length)}</p>
          </article>
        </section>

        {/* Tabla de inspeccion: muestra solo la pagina solicitada, no todo el dataset. */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-black text-[#0b3d63]">Contenido del dataset</h2>
              <p className="mt-1 text-sm font-medium text-slate-400">
                Página {formatNumber(dataset.current_page)} de {formatNumber(dataset.total_pages)} · {formatNumber(dataset.number_of_records)} registros por página
              </p>
            </div>
            <div className="flex items-center gap-2">
              {[10, 25, 50, 100].map((size) => (
                <Link
                  key={size}
                  href={datasetPageHref(dataset.id, 1, size)}
                  className={`rounded-lg border px-3 py-2 text-xs font-black transition ${
                    dataset.number_of_records === size
                      ? 'border-[#0b6685] bg-cyan-50 text-[#0b6685]'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {size}
                </Link>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wide text-slate-400">
                <tr>
                  {dataset.columnas.map((columna) => (
                    <th key={columna} className="whitespace-nowrap px-6 py-4">
                      {columna}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dataset.filas.map((fila, index) => (
                  <tr key={index} className="text-sm">
                    {/* Las columnas guian el orden de las celdas para que coincida con el archivo original. */}
                    {dataset.columnas.map((columna) => (
                      <td key={`${index}-${columna}`} className="max-w-72 truncate px-6 py-4 font-medium text-slate-600">
                        {formatCellValue(fila[columna])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Controles de paginacion manejados por URL para mantener la vista compartible. */}
          <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-medium text-slate-400">
              Mostrando {formatNumber(dataset.filas.length)} de {formatNumber(dataset.total_filas)} filas
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={datasetPageHref(dataset.id, Math.max(dataset.current_page - 1, 1), dataset.number_of_records)}
                aria-disabled={!dataset.has_previous_page}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-black transition ${
                  dataset.has_previous_page
                    ? 'border-slate-200 text-[#0b6685] hover:bg-cyan-50'
                    : 'pointer-events-none border-slate-100 text-slate-300'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Link>
              <span className="rounded-lg bg-slate-50 px-4 py-2 text-sm font-black text-[#0b3d63]">
                {formatNumber(dataset.current_page)}
              </span>
              <Link
                href={datasetPageHref(dataset.id, Math.min(dataset.current_page + 1, dataset.total_pages), dataset.number_of_records)}
                aria-disabled={!dataset.has_next_page}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-black transition ${
                  dataset.has_next_page
                    ? 'border-slate-200 text-[#0b6685] hover:bg-cyan-50'
                    : 'pointer-events-none border-slate-100 text-slate-300'
                }`}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
