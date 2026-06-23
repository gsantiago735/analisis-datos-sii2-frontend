'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteDatasetAction } from '@/app/actions/datasets'

type DeleteDatasetButtonProps = {
  // Identificador del dataset que se enviara al backend para eliminarlo.
  datasetId: number
  // Nombre visible usado en el mensaje de confirmacion para evitar borrados accidentales.
  datasetName: string
}

export default function DeleteDatasetButton({ datasetId, datasetName }: DeleteDatasetButtonProps) {
  const router = useRouter()
  // useTransition permite mostrar estado pendiente sin bloquear la interfaz.
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleDelete = () => {
    // Confirmacion nativa antes de ejecutar una accion destructiva.
    const shouldDelete = window.confirm(`¿Eliminar el dataset "${datasetName}"? Esta acción no se puede deshacer.`)

    if (!shouldDelete) {
      return
    }

    // La server action espera FormData porque tambien puede ser usada desde un form HTML.
    const formData = new FormData()
    formData.append('datasetId', datasetId.toString())

    startTransition(async () => {
      setError(null)

      // Ejecuta la eliminacion en el servidor, donde se lee la cookie httpOnly
      // y se envia el token al backend sin exponerlo al navegador.
      const result = await deleteDatasetAction(formData)

      if (result?.error) {
        setError(result.error)
        return
      }

      // Refresca el Server Component del panel para pedir nuevamente la lista
      // de datasets y remover de la tabla el elemento eliminado.
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {/* Boton de accion destructiva para eliminar un dataset del usuario actual. */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-xs font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {isPending ? 'Eliminando...' : 'Eliminar'}
      </button>
      {/* Mensaje local si el backend rechaza la eliminacion o falla la conexion. */}
      {error && <span className="max-w-48 text-right text-[11px] font-semibold text-red-600">{error}</span>}
    </div>
  )
}
