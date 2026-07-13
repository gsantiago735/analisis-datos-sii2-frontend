import { Database } from 'lucide-react'
import Link from 'next/link'
import { getUserDatasetsAction } from '@/app/actions/datasets'
import PivotView from '@/components/pivot/PivotView'

export default async function PivotPage() {
  const { datasets, error } = await getUserDatasetsAction()

  if (error) {
    return <div className="p-8 text-sm font-semibold text-red-600">{error}</div>
  }

  if (!datasets.length) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Database className="mx-auto h-10 w-10 text-slate-300" />
          <h1 className="mt-4 text-2xl font-black text-slate-900">No hay datasets disponibles</h1>
          <p className="mt-2 text-sm text-slate-500">Carga un dataset para poder generar tablas dinámicas.</p>
          <Link
            href="/upload"
            className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Cargar dataset
          </Link>
        </div>
      </div>
    )
  }

  return <PivotView datasets={datasets} />
}
