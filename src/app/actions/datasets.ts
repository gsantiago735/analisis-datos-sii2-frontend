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
