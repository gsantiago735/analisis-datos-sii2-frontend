'use client'

import { useState } from 'react'
import { BarChart3, CheckCircle2, Database, FileCheck2, FileText, Sparkles } from 'lucide-react'
import type { DatasetItem } from '@/app/actions/datasets'
import ExecutiveSummaryButton from '@/components/datasets/ExecutiveSummaryButton'

type ExecutiveSummaryWorkspaceProps = {
  // Datasets pertenecientes al usuario que pueden seleccionarse para generar o
  // descargar su resumen ejecutivo.
  datasets: DatasetItem[]
}

export default function ExecutiveSummaryWorkspace({ datasets }: ExecutiveSummaryWorkspaceProps) {
  // Al abrir el espacio de trabajo se selecciona el primer dataset disponible.
  // El valor 0 funciona únicamente como respaldo cuando la colección está vacía.
  const [selectedDatasetId, setSelectedDatasetId] = useState(datasets[0]?.id ?? 0)

  // Si la colección cambia y ya no contiene el identificador seleccionado, se
  // usa el primer elemento para evitar que la interfaz quede sin referencia.
  const selectedDataset = datasets.find((dataset) => dataset.id === selectedDatasetId) || datasets[0]

  // El componente padre se encarga de mostrar el estado vacío; este workspace
  // solo se renderiza cuando existe al menos un dataset con el cual trabajar.
  if (!selectedDataset) return null

  // La misma ruta autenticada sirve el documento en modo embebido. El enlace
  // de descarga omite este parámetro y conserva Content-Disposition: attachment.
  const previewUrl = `/api/datasets/${selectedDataset.id}/resumen-ejecutivo?disposition=inline`

  return (
    <div className="space-y-6">
      {/* Selector principal y acción contextual del dataset activo. */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex-1">
            <label htmlFor="executive-summary-dataset" className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-400">
              Dataset para el informe
            </label>
            <select
              id="executive-summary-dataset"
              value={selectedDataset.id}
              onChange={(event) => setSelectedDatasetId(Number(event.target.value))}
              className="w-full max-w-2xl rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-[#0b3d63] outline-none transition focus:border-[#0b6685] focus:ring-2 focus:ring-cyan-100"
            >
              {datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.nombre} · {dataset.nombre_archivo || 'Archivo sin nombre'}
                </option>
              ))}
            </select>
          </div>

          {/* La clave reinicia el estado local del botón cuando cambia el
              dataset o su disponibilidad después de generar el informe. */}
          <ExecutiveSummaryButton
            key={`${selectedDataset.id}-${selectedDataset.resumen_ejecutivo_disponible}`}
            datasetId={selectedDataset.id}
            available={selectedDataset.resumen_ejecutivo_disponible}
          />
        </div>
      </section>

      {selectedDataset.resumen_ejecutivo_disponible && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-black text-[#0b3d63]">Vista previa del resumen ejecutivo</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Consulta el documento en pantalla o utiliza la opción de descarga disponible arriba.
            </p>
          </div>
          <iframe
            key={selectedDataset.id}
            src={previewUrl}
            title={`Resumen ejecutivo de ${selectedDataset.nombre}`}
            className="h-[75vh] min-h-[640px] w-full bg-slate-100"
          />
        </section>
      )}

      {/* Resumen de metadatos y explicación sobre el documento definitivo. */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">Dataset seleccionado</p>
              <h2 className="mt-2 text-2xl font-black text-[#0b3d63]">{selectedDataset.nombre}</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                {selectedDataset.descripcion || 'Sin descripción registrada.'}
              </p>
            </div>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-[#0b6685]">
              <Database className="h-5 w-5" />
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Los valores de respaldo mantienen completas las tarjetas cuando
                algún metadato opcional no fue registrado. */}
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-400">Archivo</p>
              <p className="mt-1 truncate text-sm font-black text-slate-700">{selectedDataset.nombre_archivo || 'N/D'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-400">Formato</p>
              <p className="mt-1 text-sm font-black text-slate-700">{selectedDataset.formato || 'N/D'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-400">Resumen ejecutivo</p>
              <p className={`mt-1 text-sm font-black ${selectedDataset.resumen_ejecutivo_disponible ? 'text-emerald-700' : 'text-amber-700'}`}>
                {selectedDataset.resumen_ejecutivo_disponible ? 'Disponible' : 'Pendiente de generación'}
              </p>
            </div>
          </div>
        </article>

        <aside className="rounded-2xl border border-slate-200 bg-[#0b3d63] p-6 text-white shadow-sm">
          <FileCheck2 className="h-6 w-6 text-cyan-200" />
          <h2 className="mt-4 text-xl font-black">Documento definitivo</h2>
          <p className="mt-3 text-sm font-medium leading-6 text-cyan-50/80">
            Una vez generado, el PDF no se modifica ni se reemplaza mientras el dataset permanezca sin cambios.
          </p>
        </aside>
      </section>

      {/* Presenta al usuario los componentes y requisitos previos del informe. */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-black text-[#0b3d63]">Contenido del resumen</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">El informe transforma el perfilado existente en una lectura orientada a decisiones.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { icon: BarChart3, title: 'Frecuencias diversas', text: 'Selecciona dimensiones con correlaciones bajas o moderadas para reducir información redundante.' },
            { icon: Sparkles, title: 'Interpretación con IA', text: 'Describe el contexto de los datos, evalúa escenarios condicionales de balance y explica riesgos y recomendaciones.' },
            { icon: FileText, title: 'Presentación corporativa', text: 'Organiza indicadores, hallazgos, gráficas y variables en un PDF listo para compartir.' },
          ].map((item) => {
            // La referencia del icono se convierte en un componente para poder
            // describir todas las tarjetas desde una única colección de datos.
            const Icon = item.icon
            return (
              <article key={item.title} className="rounded-xl border border-slate-100 bg-slate-50/70 p-5">
                <Icon className="h-5 w-5 text-[#0b6685]" />
                <h3 className="mt-3 text-sm font-black text-[#0b3d63]">{item.title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{item.text}</p>
              </article>
            )
          })}
        </div>
        {/* Recordatorio funcional para evitar solicitar un resumen sin perfilado. */}
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="font-semibold">El dataset debe tener un perfilado válido antes de solicitar el resumen ejecutivo.</p>
        </div>
      </section>
    </div>
  )
}
