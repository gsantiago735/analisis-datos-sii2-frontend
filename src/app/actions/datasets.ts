'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const API_URL = process.env.BACKEND_URL || 'http://backend:8000'

// Representa el contrato mínimo que el frontend necesita para listar datasets.
// Los nombres siguen el formato del backend para evitar mapeos innecesarios en
// cada componente que consuma esta acción.
export type DatasetItem = {
  id: number
  nombre: string
  descripcion?: string | null
  nombre_archivo?: string | null
  peso_bytes: number
  fecha_subida: string
  formato: string
  estado: string
  resumen_ejecutivo_disponible: boolean
  resumen_ejecutivo_url?: string | null
}

export type DatasetContent = {
  id: number
  nombre: string
  descripcion?: string | null
  nombre_archivo?: string | null
  formato: string
  total_filas: number
  total_columnas: number
  current_page: number
  number_of_records: number
  total_pages: number
  has_previous_page: boolean
  has_next_page: boolean
  columnas: string[]
  filas: Record<string, string | number | boolean | null>[]
  resumen_ejecutivo_disponible: boolean
  resumen_ejecutivo_url?: string | null
}

export type ExecutiveSummaryActionResult = {
  success?: boolean
  error?: string
  errorCode?: 'profile_required' | 'service_unavailable' | 'unknown'
  downloadUrl?: string
}

export type DatasetContentParams = {
  page?: number
  numberOfRecords?: number
}

export async function getUserDatasetsAction() {
  // Al ser una server action, puede leer cookies httpOnly sin exponer el token
  // al JavaScript del navegador.
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  // Si no hay token, la UI recibe una lista vacía y un mensaje claro en vez de
  // hacer una petición que inevitablemente será rechazada por el backend.
  if (!token) {
    return { error: 'No estás autenticado.', datasets: [] as DatasetItem[] }
  }

  try {
    // Se consulta el backend con el token de sesión del usuario actual. El
    // no-store evita entregar una lista cacheada entre usuarios o sesiones.
    const res = await fetch(`${API_URL}/carga/datasets`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      // Un 401 indica que el token ya no es válido. Se limpian las cookies para
      // que el resto de la app deje de tratar la sesión como autenticada.
      if (res.status === 401) {
        cookieStore.delete('token')
        cookieStore.delete('role')
        return { error: 'Tu sesión ha expirado.', datasets: [] as DatasetItem[] }
      }

      // Para otros errores, se intenta mostrar el detalle del backend. Si la
      // respuesta no trae JSON válido, se usa un mensaje genérico estable.
      const errorData = await res.json().catch(() => null)
      return { error: errorData?.detail || 'No se pudieron cargar los datasets.', datasets: [] as DatasetItem[] }
    }

    // La respuesta exitosa se castea al tipo compartido por la UI. La validación
    // fuerte del shape queda del lado del contrato con el backend.
    const datasets = await res.json()
    return { datasets: datasets as DatasetItem[] }
  } catch (error) {
    // Este catch cubre fallos de red, backend caído o errores de infraestructura
    // que ocurren antes de obtener una respuesta HTTP utilizable.
    console.error('Datasets Error:', error)
    return { error: 'Error de conexión con el servidor.', datasets: [] as DatasetItem[] }
  }
}

export async function getDatasetContentAction(datasetId: number, params: DatasetContentParams = {}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return { error: 'No estás autenticado.' }
  }

  try {
    const query = new URLSearchParams()
    const page = params.page ?? 1
    const numberOfRecords = params.numberOfRecords ?? 25
    query.set('page', String(page))
    query.set('current_page', String(page))
    query.set('number_of_records', String(numberOfRecords))

    const res = await fetch(`${API_URL}/carga/datasets/${datasetId}/contenido?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      if (res.status === 401) {
        cookieStore.delete('token')
        cookieStore.delete('role')
        return { error: 'Tu sesión ha expirado.' }
      }

      const errorData = await res.json().catch(() => null)
      return { error: errorData?.detail || 'No se pudo cargar el contenido del dataset.' }
    }

    const dataset = await res.json()
    return { dataset: dataset as DatasetContent }
  } catch (error) {
    console.error('Dataset Content Error:', error)
    return { error: 'Error de conexión con el servidor.' }
  }
}

export async function deleteDatasetAction(formData: FormData) {
  const datasetId = formData.get('datasetId')

  if (!datasetId) {
    return { error: 'No se recibió el dataset a eliminar.' }
  }

  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return { error: 'No estás autenticado.' }
  }

  try {
    const res = await fetch(`${API_URL}/carga/datasets/${datasetId.toString()}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      if (res.status === 401) {
        cookieStore.delete('token')
        cookieStore.delete('role')
        return { error: 'Tu sesión ha expirado.' }
      }

      const errorData = await res.json().catch(() => null)
      return { error: errorData?.detail || 'No se pudo eliminar el dataset.' }
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Delete Dataset Error:', error)
    return { error: 'Error de conexión con el servidor.' }
  }
}

export async function generateExecutiveSummaryAction(datasetId: number): Promise<ExecutiveSummaryActionResult> {
  if (!Number.isInteger(datasetId) || datasetId <= 0) {
    return { error: 'El dataset no es válido.', errorCode: 'unknown' }
  }

  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return { error: 'No estás autenticado.', errorCode: 'unknown' }
  }

  try {
    const res = await fetch(`${API_URL}/resumen/datasets/${datasetId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (!res.ok) {
      if (res.status === 401) {
        cookieStore.delete('token')
        cookieStore.delete('role')
        return { error: 'Tu sesión ha expirado.', errorCode: 'unknown' }
      }

      const errorData = await res.json().catch(() => null)
      const errorCode = res.status === 409
        ? 'profile_required'
        : res.status === 503
          ? 'service_unavailable'
          : 'unknown'

      return {
        error: errorData?.detail || 'No se pudo generar el resumen ejecutivo.',
        errorCode,
      }
    }

    revalidatePath('/dashboard')
    revalidatePath(`/datasets/${datasetId}`)

    return {
      success: true,
      downloadUrl: `/api/datasets/${datasetId}/resumen-ejecutivo`,
    }
  } catch (error) {
    console.error('Executive Summary Error:', error)
    return {
      error: 'Error de conexión con el servidor.',
      errorCode: 'service_unavailable',
    }
  }
}
