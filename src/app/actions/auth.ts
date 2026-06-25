'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const API_URL = process.env.BACKEND_URL || 'http://backend:8000'

export async function loginAction(prevState: any, formData: FormData) {
  // Las server actions reciben FormData directamente desde el formulario.
  // Se validan los campos mínimos antes de llamar al backend para evitar
  // peticiones innecesarias y devolver errores rápidos a la interfaz.
  const email = formData.get('email')
  const password = formData.get('password')

  if (!email || !password) {
    return { error: 'Por favor ingresa correo y contraseña' }
  }

  try {
    // El Backend  espera application/x-www-form-urlencoded
    // y usa el campo "username" aunque la UI solicite un correo electrónico.
    const urlParams = new URLSearchParams()
    urlParams.append('username', email.toString())
    urlParams.append('password', password.toString())

    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: urlParams.toString(),
    })

    // Si la autenticación falla, se intenta reutilizar el mensaje del backend.
    // pero maneja un mensaje genérico si no hay detalle,
    // con el fin de no exponer información sensible en el mensaje de error.
    if (!loginRes.ok) {
      const errorData = await loginRes.json().catch(() => null)
      return { error: errorData?.detail || 'Credenciales inválidas' }
    }

    const loginData = await loginRes.json()
    const token = loginData.access_token

    // El token confirma la identidad, pero el frontend también necesita el rol
    // para decidir qué vistas o permisos habilitar después del login.
    const meRes = await fetch(`${API_URL}/usuarios/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!meRes.ok) {
      return { error: 'Error al obtener perfil del usuario' }
    }

    const userData = await meRes.json()
    const role = userData.rol

    // Las cookies se escriben desde el servidor para mantener el token fuera
    // del JavaScript del navegador. "path: /" permite usarlas en toda la app.
    const cookieStore = await cookies()
    cookieStore.set('token', token, { httpOnly: true, path: '/' })
    cookieStore.set('role', role, { httpOnly: true, path: '/' })

    return { success: true, role }
  } catch (error) {
    console.error('Error logging in:', error)
    return { error: 'Error de conexión con el servidor' }
  }
}

export async function registerAction(prevState: any, formData: FormData) {
  // El registro valida primero la consistencia del formulario en el servidor.
  // Aunque el cliente tenga required/minLength, esta capa protege la acción si
  // se invoca desde otro cliente o con datos manipulados.
  const email = formData.get('email')
  const password = formData.get('password')
  const confirmPassword = formData.get('confirmPassword')

  if (!email || !password || !confirmPassword) {
    return { error: 'Por favor completa todos los campos' }
  }

  if (password.toString().length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres' }
  }

  if (password.toString() !== confirmPassword.toString()) {
    return { error: 'Las contraseñas no coinciden' }
  }

  try {
    // El endpoint de registro acepta JSON con email y password. La confirmación
    // de contraseña solo existe para la UI y no se envía al backend.
    const registerRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email.toString(),
        password: password.toString()
      }),
    })

    // Se conserva el detalle del backend cuando existe, por ejemplo si el
    // correo ya está registrado o la política de contraseña cambia.
    if (!registerRes.ok) {
      const errorData = await registerRes.json().catch(() => null)
      return { error: errorData?.detail || 'No se pudo crear la cuenta' }
    }

    // Después de crear la cuenta se reutiliza el flujo de login para obtener
    // token, rol y cookies con una sola fuente de verdad.
    return loginAction(prevState, formData)
  } catch (error) {
    console.error('Error registering:', error)
    return { error: 'Error de conexión con el servidor' }
  }
}

export async function logoutAction() {
  // El cierre de sesión borra las cookies de autenticación y fuerza la salida
  // hacia login desde el servidor, evitando que queden vistas protegidas activas.
  const cookieStore = await cookies()
  cookieStore.delete('token')
  cookieStore.delete('role')
  redirect('/login')
}
