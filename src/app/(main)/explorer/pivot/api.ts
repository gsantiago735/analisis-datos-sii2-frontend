'use server';

import { cookies } from 'next/headers';

import type { DatasetItem, PerfiladoResponse, PivotRequest, PivotResponse, ResultadoApi } from './types';

// AJUSTA ESTO si tu backend no vive detrás de esta variable de entorno.
// Al ser consumida solo en el servidor, NO necesita el prefijo NEXT_PUBLIC_.
const API_BASE_URL =process.env.BACKEND_URL || 'http://backend:8000'

async function apiFetch<T>(path: string, init?: RequestInit): Promise<ResultadoApi<T>> {
  // Igual que en tu server action de datasets: lee la cookie httpOnly sin
  // exponer el token al JavaScript del navegador.
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value; // AJUSTA el nombre de la cookie si es distinto

  if (!token) {
    return { error: 'No estás autenticado.' };
  }

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
      cache: 'no-store', // son datos por usuario/dataset, nunca deben cachearse
    });

    if (!res.ok) {
      let detail = `Error ${res.status}`;
      try {
        const body = (await res.json()) as { detail?: string };
        if (body?.detail) detail = body.detail;
      } catch {
        // el cuerpo de error no era JSON, usamos el mensaje genérico
      }
      return { error: detail };
    }

    const data = (await res.json()) as T;
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error de red desconocido.' };
  }
}

// Lista los datasets del usuario autenticado para poblar el <select> de
// TablaDinamicaBuilder. A diferencia de apiFetch, devuelve { datasets, error }
// en vez de { data, error } porque así ya lo tenías implementado en el resto
// de la app (p.ej. en la pantalla de "Carga de datos"); se mantiene esa forma
// aquí para no romper esa convención.
export async function getUserDatasetsAction(): Promise<{ error?: string; datasets: DatasetItem[] }> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return { error: 'No estás autenticado.', datasets: [] };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/carga/datasets`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 401) {
        cookieStore.delete('token');
        cookieStore.delete('role');
        return { error: 'Tu sesión ha expirado.', datasets: [] };
      }

      const errorData = await res.json().catch(() => null);
      return { error: errorData?.detail || 'No se pudieron cargar los datasets.', datasets: [] };
    }

    const datasets = await res.json();
    return { datasets: datasets as DatasetItem[] };
  } catch (error) {
    console.error('Datasets Error:', error);
    return { error: 'Error de conexión con el servidor.', datasets: [] };
  }
}

export async function obtenerPerfilado(datasetId: number): Promise<ResultadoApi<PerfiladoResponse>> {
  return apiFetch<PerfiladoResponse>(`/perfilado/datasets/${datasetId}`);
}

export async function generarTablaDinamica(request: PivotRequest): Promise<ResultadoApi<PivotResponse>> {
  return apiFetch<PivotResponse>('/tablas-dinamicas/generar', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}
