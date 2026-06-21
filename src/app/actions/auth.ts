'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email')
  const password = formData.get('password')

  if (!email || !password) {
    return { error: 'Por favor ingresa correo y contraseña' }
  }

  try {
    // FastAPI's OAuth2PasswordRequestForm expects application/x-www-form-urlencoded
    const urlParams = new URLSearchParams()
    urlParams.append('username', email.toString())
    urlParams.append('password', password.toString())

    const loginRes = await fetch('http://backend:8000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: urlParams.toString(),
    })

    if (!loginRes.ok) {
      const errorData = await loginRes.json().catch(() => null)
      return { error: errorData?.detail || 'Credenciales inválidas' }
    }

    const loginData = await loginRes.json()
    const token = loginData.access_token

    // Fetch user details to get the role
    const meRes = await fetch('http://backend:8000/usuarios/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!meRes.ok) {
      return { error: 'Error al obtener perfil del usuario' }
    }

    const userData = await meRes.json()
    const role = userData.rol

    // Set cookies using Next.js 15+ async cookies()
    const cookieStore = await cookies()
    cookieStore.set('token', token, { httpOnly: true, path: '/' })
    cookieStore.set('role', role, { httpOnly: true, path: '/' })

    return { success: true, role }
  } catch (error) {
    console.error('Error logging in:', error)
    return { error: 'Error de conexión con el servidor' }
  }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('token')
  cookieStore.delete('role')
  redirect('/login')
}
