'use server'

import { cookies } from 'next/headers'

export async function uploadDatasetAction(prevState: any, formData: FormData) {
  try {
    const file = formData.get('file') as File;


    if (!file || file.size === 0) {
      return { error: 'Debes seleccionar un archivo válido.' }
    }

    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return { sessionExpired: true }
    }

    const apiFormData = new FormData();
    apiFormData.append('file', file);
    apiFormData.append('nombre', formData.get('nombre') as string);
    apiFormData.append('descripcion', formData.get('descripcion') as string || '');

    const res = await fetch('http://backend:8000/carga/cargar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: apiFormData,
    })

    if (!res.ok) {
      if (res.status === 401) {
        cookieStore.delete('token')
        cookieStore.delete('role')
        return { sessionExpired: true }
      }
      const errorData = await res.json().catch(() => null)
      return { error: errorData?.detail || 'Error al procesar el archivo en el servidor.' }
    }

    const data = await res.json()
    return { success: true, data: data }

  } catch (error) {
    console.error('Upload Error:', error)
    return { error: 'Ocurrió un error inesperado al subir el archivo.' }
  }
}
