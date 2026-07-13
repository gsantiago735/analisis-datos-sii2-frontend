'use server'

import { cookies } from 'next/headers'

const API_URL = process.env.BACKEND_URL || 'http://backend:8000'

export type PivotParams = {
  dataset_id: number
  filas: string[]
  columnas: string[]
  valores: string
  funcion_agregacion: string
}

export type PivotResult = {
  dataset_id: number
  configuracion: Record<string, unknown>
  datos_pivot: Record<string, unknown>[]
  mensaje: string
}

export async function generatePivotAction(params: PivotParams) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return { error: 'No estás autenticado.' }

  try {
    const res = await fetch(`${API_URL}/tablas-dinamicas/generar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      cache: 'no-store',
    })

    if (!res.ok) {
      if (res.status === 401) {
        cookieStore.delete('token')
        cookieStore.delete('role')
        return { error: 'Tu sesión ha expirado.' }
      }
      const rawText = await res.text().catch(() => '')
      console.error(`Pivot [${res.status}]:`, rawText)
      let detail: string | null = null
      try {
        const errorData = JSON.parse(rawText)
        if (typeof errorData?.detail === 'string') detail = errorData.detail
        else if (Array.isArray(errorData?.detail)) detail = errorData.detail.map((e: { msg?: string }) => e.msg).join(', ')
        else if (typeof errorData?.message === 'string') detail = errorData.message
        else if (typeof errorData?.error === 'string') detail = errorData.error
      } catch { /* rawText no es JSON */ }
      return { error: detail || `Error ${res.status}: ${rawText.slice(0, 200) || 'No se pudo generar la tabla dinámica.'}` }
    }

    const data = await res.json()
    return { result: data as PivotResult }
  } catch (error) {
    console.error('Pivot Error:', error)
    return { error: 'Error de conexión con el servidor.' }
  }
}

export async function getDatasetColumnsAction(datasetId: number): Promise<{ columns?: string[]; error?: string }> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return { error: 'No estás autenticado.' }

  try {
    const res = await fetch(
      `${API_URL}/carga/datasets/${datasetId}/contenido?page=1&current_page=1&number_of_records=1`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    )

    if (!res.ok) {
      if (res.status === 401) {
        cookieStore.delete('token')
        cookieStore.delete('role')
        return { error: 'Tu sesión ha expirado.' }
      }
      const errorData = await res.json().catch(() => null)
      return { error: errorData?.detail || 'No se pudieron cargar las columnas del dataset.' }
    }

    const data = await res.json()
    return { columns: data.columnas as string[] }
  } catch (error) {
    console.error('Columns Error:', error)
    return { error: 'Error de conexión con el servidor.' }
  }
}
