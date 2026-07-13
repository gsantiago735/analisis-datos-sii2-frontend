'use server'

import { cookies } from 'next/headers'

const API_URL = process.env.BACKEND_URL || 'http://backend:8000'

export type CorrelationCell = {
  id_x: string
  id_y: string
  valor: number
}

export type StrongRelation = {
  variable_1: string
  variable_2: string
  coeficiente: number
  tipo: string
}

export type CorrelationResult = {
  configuracion: Record<string, string>
  aviso_omision: string
  matriz_calor: CorrelationCell[]
  relaciones_fuertes: StrongRelation[]
  variables_claves: string[]
  matriz_significancia: Record<string, Record<string, number>>
}

export type CorrelationParams = {
  dataset_id: number
  estrategia_nulos: 'ignorar' | 'eliminar'
  metodo: 'pearson' | 'spearman' | 'kendall'
}

export async function generateCorrelationAction(params: CorrelationParams) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return { error: 'No estás autenticado.' }
  }

  try {
    const res = await fetch(`${API_URL}/correlacion/generar`, {
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
      const errorData = await res.json().catch(() => null)
      return { error: errorData?.detail || 'No se pudo generar la matriz de correlación.' }
    }

    const data = await res.json()
    return { result: data as CorrelationResult }
  } catch (error) {
    console.error('Correlation Error:', error)
    return { error: 'Error de conexión con el servidor.' }
  }
}
