'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Download, FileText, LoaderCircle } from 'lucide-react'
import { generateExecutiveSummaryAction } from '@/app/actions/datasets'

type ExecutiveSummaryButtonProps = {
  // Identifica el dataset en las solicitudes de generación y descarga.
  datasetId: number
  // Indica si el backend ya cuenta con un PDF definitivo para descargar.
  available: boolean
  // Reduce el control a un botón con icono para usarlo en espacios estrechos.
  compact?: boolean
}

export default function ExecutiveSummaryButton({ datasetId, available, compact = false }: ExecutiveSummaryButtonProps) {
  const router = useRouter()
  // useTransition mantiene la interfaz interactiva mientras la acción del
  // servidor genera el informe, que puede tardar por el análisis externo.
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)

  // Se inicializa con el dato recibido del servidor y se actualiza localmente
  // al terminar la generación para mostrar la descarga de inmediato.
  const [isAvailable, setIsAvailable] = useState(available)

  // La descarga pasa por una ruta interna para conservar el token de sesión en
  // el servidor y no exponerlo al JavaScript del navegador.
  const downloadUrl = `/api/datasets/${datasetId}/resumen-ejecutivo`

  const handleGenerate = () => {
    startTransition(async () => {
      // Cada intento comienza sin errores anteriores para no mostrar mensajes
      // que ya no corresponden a la solicitud actual.
      setError(null)
      setErrorCode(null)
      const result = await generateExecutiveSummaryAction(datasetId)

      if (result.error) {
        // El código permite ofrecer acciones específicas, como dirigir al
        // perfilado cuando es el requisito que impide crear el resumen.
        setError(result.error)
        setErrorCode(result.errorCode || 'unknown')
        return
      }

      // Tras una generación exitosa se sincroniza la vista para presentar el
      // visor del PDF y sustituir esta acción por el botón de descarga.
      setIsAvailable(true)
      router.refresh()
    })
  }

  // Si el informe ya existe, solo se presenta la acción directa de descarga.
  if (isAvailable) {
    return (
      <a
        href={downloadUrl}
        className={compact
          ? 'flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 text-emerald-700 transition hover:bg-emerald-50'
          : 'inline-flex items-center justify-center gap-2 rounded-lg bg-[#0b6685] px-5 py-3 text-sm font-black text-white transition hover:bg-[#084f68]'}
        title="Descargar resumen ejecutivo"
        aria-label="Descargar resumen ejecutivo"
      >
        <Download className="h-4 w-4" />
        {!compact && 'Descargar PDF'}
      </a>
    )
  }

  return (
    <div className={compact ? 'flex flex-col items-end gap-1' : 'flex flex-col items-start gap-2'}>
      {/* Mientras se genera, el botón se desactiva para evitar solicitudes duplicadas. */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isPending}
        className={compact
          ? 'flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-200 text-[#0b6685] transition hover:bg-cyan-50 disabled:cursor-wait disabled:opacity-60'
          : 'inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-200 bg-white px-5 py-3 text-sm font-black text-[#0b6685] transition hover:bg-cyan-50 disabled:cursor-wait disabled:opacity-60'}
        title="Generar resumen ejecutivo"
        aria-label="Generar resumen ejecutivo"
      >
        {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        {!compact && (isPending ? 'Generando resumen…' : 'Generar resumen ejecutivo')}
      </button>

      {error && (
        <div className={`${compact ? 'max-w-64 text-right' : 'max-w-xl'} text-xs font-semibold text-red-600`} role="alert">
          <p>{error}</p>
          {/* Un perfilado pendiente ofrece una salida concreta para resolver el requisito. */}
          {errorCode === 'profile_required' && (
            <Link href={`/explorer/frequencies?datasetId=${datasetId}`} className="mt-1 inline-block font-black text-[#0b6685] underline">
              Ejecutar perfilado de datos
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
