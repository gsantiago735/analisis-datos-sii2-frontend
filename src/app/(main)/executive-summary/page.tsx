import Link from 'next/link'
import { Database, FileText } from 'lucide-react'
import { getUserDatasetsAction } from '@/app/actions/datasets'
import ExecutiveSummaryWorkspace from '@/components/executive-summary/ExecutiveSummaryWorkspace'

export default async function ExecutiveSummaryPage() {
  const { datasets, error } = await getUserDatasetsAction()

  return (
    <div className="min-h-screen bg-[#f4fafb] text-slate-900">
      <main className="px-8 py-8">
        <header className="mb-7">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-400">
            <FileText className="h-4 w-4" />
            Informes
          </div>
          <h1 className="text-4xl font-black tracking-normal text-[#0b3d63]">Resumen ejecutivo</h1>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
            Genera una síntesis definitiva del perfilado, con interpretación en lenguaje natural y visualizaciones seleccionadas para cubrir dimensiones diferentes del dataset.
          </p>
        </header>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">{error}</div>
        ) : datasets.length === 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <Database className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-4 text-xl font-black text-[#0b3d63]">No hay datasets disponibles</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">Carga y perfila un dataset antes de generar su resumen ejecutivo.</p>
            <Link href="/upload" className="mt-5 inline-flex rounded-lg bg-[#0b6685] px-5 py-3 text-sm font-black text-white">
              Cargar dataset
            </Link>
          </section>
        ) : (
          <ExecutiveSummaryWorkspace datasets={datasets} />
        )}
      </main>
    </div>
  )
}
