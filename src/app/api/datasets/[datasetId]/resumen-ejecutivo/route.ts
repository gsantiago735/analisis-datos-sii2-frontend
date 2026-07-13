import { cookies } from 'next/headers'

const API_URL = process.env.BACKEND_URL || 'http://backend:8000'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ datasetId: string }> },
) {
  const { datasetId } = await params
  const parsedDatasetId = Number(datasetId)

  if (!Number.isInteger(parsedDatasetId) || parsedDatasetId <= 0) {
    return Response.json({ detail: 'Dataset inválido' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return Response.json({ detail: 'No estás autenticado.' }, { status: 401 })
  }

  try {
    const backendResponse = await fetch(`${API_URL}/resumen/datasets/${parsedDatasetId}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => null)
      return Response.json(
        { detail: errorData?.detail || 'No se pudo descargar el resumen ejecutivo.' },
        { status: backendResponse.status },
      )
    }

    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Cache-Control', 'private, no-store')
    const backendDisposition = backendResponse.headers.get('content-disposition')
    const filename = backendDisposition?.match(/filename="?([^";]+)"?/i)?.[1]
      || `resumen_ejecutivo_${parsedDatasetId}.pdf`
    const shouldDisplayInline = new URL(request.url).searchParams.get('disposition') === 'inline'

    // El visor solicita `inline`; cualquier otra petición conserva el modo
    // attachment para que el enlace de descarga mantenga su comportamiento.
    headers.set(
      'Content-Disposition',
      `${shouldDisplayInline ? 'inline' : 'attachment'}; filename="${filename}"`,
    )

    const contentLength = backendResponse.headers.get('content-length')
    if (contentLength) headers.set('Content-Length', contentLength)

    return new Response(backendResponse.body, { status: 200, headers })
  } catch (error) {
    console.error('Executive Summary Download Error:', error)
    return Response.json({ detail: 'Error de conexión con el servidor.' }, { status: 503 })
  }
}
