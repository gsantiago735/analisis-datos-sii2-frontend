import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 1. Obtener el token y el rol guardados en las cookies tras el login
  const token = request.cookies.get('token')?.value
  const userRole = request.cookies.get('role')?.value

  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin')

  // Si no está logueado y quiere entrar a la app o al admin, al login
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si es un analista común e intenta entrar a /admin, lo rebotamos al dashboard
  if (isAdminPage && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// Configura qué rutas va a proteger este middleware
export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/explorer/:path*', '/assistant/:path*', '/report/:path*'],
}
