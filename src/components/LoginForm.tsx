'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { loginAction } from '@/app/actions/auth'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'

export default function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    // Usa el server action para mantener la validación y la sesión fuera del componente visual.
    const formData = new FormData(e.currentTarget)
    const result = await loginAction(null, formData)

    if (result?.error) {
      setError(result.error)
      setIsPending(false)
    } else if (result?.success) {
      // La navegación a la vista del dashboard ocurre solo cuando el action confirma que la sesión quedó creada.
      router.push('/dashboard')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      {/* Sección: encabezado del formulario */}
      <div className="text-center">
        <h1 className="text-2xl font-black tracking-normal text-gray-950">Bienvenido de nuevo</h1>
        <p className="mx-auto mt-2 max-w-72 text-sm leading-5 text-gray-500">
          Ingresa tus credenciales para acceder al espacio de análisis.
        </p>
      </div>

      {/* Sección: mensaje de error de autenticación */}
      {error && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* Sección: campos de credenciales */}
      <div className="mt-6 space-y-4">
        {/* Campo: correo electrónico */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-900" htmlFor="email">
            Correo electrónico
          </label>
          <div className="flex h-12 items-center rounded-lg border border-gray-300 bg-white px-3 transition-all focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100">
            <Mail className="mr-3 h-4 w-4 text-gray-500" />
            <input
              id="email"
              name="email"
              type="email"
              required
              className="h-full w-full bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400"
              placeholder="analista@appdata.com"
            />
          </div>
        </div>

        {/* Campo: contraseña con control para mostrar u ocultar el valor */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-900" htmlFor="password">
            Contraseña
          </label>
          <div className="flex h-12 items-center rounded-lg border border-gray-300 bg-white px-3 transition-all focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100">
            <Lock className="mr-3 h-4 w-4 text-gray-500" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              className="h-full w-full bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400"
              placeholder="••••••••••••"
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onClick={() => setShowPassword((value) => !value)}
              className="ml-2 rounded-full p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Sección: recuperación de contraseña */}
      <div className="flex justify-end">
        <button type="button" className="mt-3 text-xs font-semibold text-teal-700 transition hover:text-teal-600">
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      {/* Sección: acciones principales y enlace al registro */}
      <div className="mt-auto pt-8">
        <button
          type="submit"
          disabled={isPending}
          className="h-12 w-full rounded-lg bg-[#84A9AC] px-4 text-sm font-bold text-white transition-colors hover:bg-[#3B6978] focus:outline-none focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>

        <p className="pt-4 text-center text-xs text-gray-500">
          ¿No tienes una cuenta?{' '}
          <Link href="/register" className="font-bold text-teal-700 transition hover:text-teal-600">
            Regístrate
          </Link>
        </p>
      </div>
    </form>
  )
}
