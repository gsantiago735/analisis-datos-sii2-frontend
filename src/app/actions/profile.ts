'use server'

import { cookies } from 'next/headers'

const API_URL = process.env.BACKEND_URL || 'http://backend:8000'

export type ProfileSummary = {
  registros: number
  variables: number
  completitud: number
  registros_nulos: number
  valores_atipicos: number
  numericas: number
  categoricas: number
  temporales: number
}

export type ProfileVariable = {
  nombre: string
  tipo: string
  validos: number
  nulos: number
  porcentaje_nulos: number
  atipicos?: number | null
  estado: string
}

export type ProfileRange = {
  rango: string
  porcentaje: number
}

export type ProfileDetail = {
  nombre: string
  tipo: string
  validos: number
  nulos: number
  estadisticas: { etiqueta: string; valor: string }[]
  distribucion: ProfileRange[]
  porcentajes: ProfileRange[]
}

export type ProfileResponse = {
  dataset_id: number
  dataset_nombre: string
  nombre_archivo?: string | null
  fecha_subida: string
  resumen: ProfileSummary
  variables: ProfileVariable[]
  variable_detalle?: ProfileDetail | null
}

export async function getDatasetProfileAction(datasetId: number, variable?: string) {
  // Esta accion corre en el servidor, por eso puede leer la cookie httpOnly
  // creada en login sin exponer el token al JavaScript del navegador.
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return { error: 'No estás autenticado.' }
  }

  try {
    // El backend valida que el dataset pertenezca al usuario del token. El
    // parametro `variable` solo cambia el detalle lateral seleccionado.
    const params = new URLSearchParams()
    if (variable) {
      params.set('variable', variable)
    }

    const res = await fetch(`${API_URL}/perfilado/datasets/${datasetId}?${params.toString()}`, {
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
      return { error: errorData?.detail || 'No se pudo generar el perfilado.' }
    }

    const profile = await res.json()
    return { profile: profile as ProfileResponse }
  } catch (error) {
    // Este catch cubre fallos de red o backend no disponible.
    console.error('Profile Error:', error)
    return { error: 'Error de conexión con el servidor.' }
  }
}
