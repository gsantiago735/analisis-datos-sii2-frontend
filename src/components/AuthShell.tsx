import type { PropsWithChildren } from 'react'
import { BarChart3, Check, CircleDot, ShieldCheck, Sparkles } from 'lucide-react'

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center ${compact ? 'justify-center' : 'gap-3'}`}>
      {/* Marca reutilizable: en modo compacto funciona como sello dentro de la tarjeta. */}
      <div className={`${compact ? 'h-14 w-14' : 'h-12 w-12'} flex items-center justify-center rounded-full border border-teal-200 bg-teal-50 shadow-sm`}>
        <div className="relative h-9 w-9">
          <BarChart3 className="absolute left-0 top-1 h-7 w-7 text-teal-700" strokeWidth={2.2} />
          <Sparkles className="absolute right-0 top-0 h-4 w-4 text-teal-500" strokeWidth={2.3} />
          <CircleDot className="absolute bottom-0 right-1 h-4 w-4 text-sky-700" strokeWidth={2.1} />
        </div>
      </div>
      {!compact && (
        <div>
          <p className="text-base font-black tracking-wide text-blue-600">SII2 Data</p>
          <p className="text-xs font-medium text-gray-500">Plataforma para analistas</p>
        </div>
      )}
    </div>
  )
}

export default function AuthShell({ children }: PropsWithChildren) {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="absolute inset-x-0 top-0 h-px bg-gray-200" />

      {/* Layout compartido para login y registro: conserva el relato del login con líneas y colores del módulo de carga. */}
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 items-center gap-8 px-6 py-8 lg:grid-cols-[1fr_460px] lg:px-10 xl:px-14">
        <section className="mx-auto flex w-full max-w-2xl flex-col justify-center lg:min-h-[620px]">
          <BrandMark />

          {/* Resumen lateral visible en escritorio para reforzar el contexto antes de autenticar. */}
          <div className="mt-20 hidden max-w-xl lg:block">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700">
              <span className="h-2 w-2 rounded-full bg-teal-500" />
              Entorno unificado de análisis
            </div>
            <h1 className="max-w-xl text-5xl font-black leading-[0.98] tracking-normal text-gray-950 xl:text-6xl">
              De los datos a una visión accionable.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-gray-500">
              Gestiona datasets, evalúa su calidad y genera análisis descriptivos en una plataforma diseñada para el trabajo del analista.
            </p>

            <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
              {[
                ['PROCESAMIENTO', 'Ágil', 'Flujo centralizado'],
                ['MÓDULOS', '3', 'Primera versión'],
                ['ACCESO', 'Seguro', 'Sesión personal'],
              ].map(([label, value, detail]) => (
                <div key={label} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</p>
                  <p className="mt-1 text-2xl font-black text-gray-950">{value}</p>
                  <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-gray-500">
                    <Check className="h-3 w-3 text-teal-600" />
                    {detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[430px]">
          {/* Tarjeta con proporción fija para que registro y login ocupen el mismo espacio visual. */}
          <div className="flex min-h-[590px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm">
            <div className="border-b border-gray-100 px-8 py-6">
              <div className="flex justify-center">
                <BrandMark compact />
              </div>
            </div>
            <div className="flex flex-1 flex-col px-8 py-6">
              {children}
            </div>
            <div className="border-t border-gray-100 px-8 py-4">
              <p className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
                Conexión protegida para tu sesión
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
