'use server'

import { cookies } from 'next/headers'

const API_URL = process.env.BACKEND_URL || 'http://backend:8000'

export type AssistantAnswer = {
  dataset_id: number
  question: string
  answer: string
  model: string
}

export async function askAssistantAction(datasetId: number, question: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return { error: 'No estás autenticado.' }
  }

  if (!Number.isInteger(datasetId) || datasetId <= 0) {
    return { error: 'Selecciona un dataset válido.' }
  }

  const cleanQuestion = question.trim()
  if (!cleanQuestion) {
    return { error: 'Escribe una pregunta para el asistente.' }
  }

  try {
    const res = await fetch(`${API_URL}/asistente/preguntar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dataset_id: datasetId,
        question: cleanQuestion,
      }),
      cache: 'no-store',
    })

    if (!res.ok) {
      if (res.status === 401) {
        cookieStore.delete('token')
        cookieStore.delete('role')
        return { error: 'Tu sesión ha expirado.' }
      }

      const errorData = await res.json().catch(() => null)
      return { error: errorData?.detail || 'No se pudo consultar el asistente.' }
    }

    const answer = await res.json()
    return { answer: answer as AssistantAnswer }
  } catch (error) {
    console.error('Assistant Error:', error)
    return { error: 'Error de conexión con el servidor.' }
  }
}
