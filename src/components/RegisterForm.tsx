'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { registerAction } from '@/app/actions/auth'
import { Eye, EyeOff, Lock, Mail, UserPlus } from 'lucide-react'

export default function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    // Usa el server action para centralizar creación de usuario, validación y manejo de sesión.
    const formData = new FormData(e.currentTarget)
    const result = await registerAction(null, formData)

    if (result?.error) {
      setError(result.error)
      setIsPending(false)
    } else if (result?.success) {
      router.push('/dashboard')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      {/* Sección: encabezado del formulario de registro */}
      <div className="text-center">
        <h1 className="text-2xl font-black tracking-normal text-gray-950">Crea tu cuenta</h1>
        <p className="mx-auto mt-2 max-w-72 text-sm leading-5 text-gray-500">
          Regístrate para gestionar datasets y acceder al espacio de análisis.
        </p>
      </div>

      {/* Sección: mensaje de error del registro, en caso de que ocurra */}
      {error && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* Sección: campos de datos para crear la cuenta */}
      <div className="mt-6 space-y-3">
        {/* Campo: correo electrónico del nuevo usuario */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-900" htmlFor="email">
            Correo electrónico
          </label>
          <div className="flex h-11 items-center rounded-lg border border-gray-300 bg-white px-3 transition-all focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100">
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

        {/* Campo: contraseña del nuevo usuario */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-900" htmlFor="password">
            Contraseña
          </label>
          <div className="flex h-11 items-center rounded-lg border border-gray-300 bg-white px-3 transition-all focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100">
            <Lock className="mr-3 h-4 w-4 text-gray-500" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              className="h-full w-full bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400"
              placeholder="Mínimo 6 caracteres"
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

        {/* Campo: confirmación de contraseña */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-900" htmlFor="confirmPassword">
            Confirmar contraseña
          </label>
          <div className="flex h-11 items-center rounded-lg border border-gray-300 bg-white px-3 transition-all focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100">
            <Lock className="mr-3 h-4 w-4 text-gray-500" />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              minLength={6}
              className="h-full w-full bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400"
              placeholder="Repite tu contraseña"
            />
            <button
              type="button"
              aria-label={showConfirmPassword ? 'Ocultar confirmación' : 'Mostrar confirmación'}
              title={showConfirmPassword ? 'Ocultar confirmación' : 'Mostrar confirmación'}
              onClick={() => setShowConfirmPassword((value) => !value)}
              className="ml-2 rounded-full p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Sección: acciones del registro y enlace al inicio de sesión */}
      <div className="mt-auto pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#84A9AC] px-4 text-sm font-bold text-white transition-colors hover:bg-[#3B6978] focus:outline-none focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <UserPlus className="h-4 w-4" />
          {isPending ? 'Creando cuenta...' : 'Registrarme'}
        </button>

        <p className="pt-4 text-center text-xs text-gray-500">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="font-bold text-teal-700 transition hover:text-teal-600">
            Inicia sesión
          </Link>
        </p>
      </div>
    </form>
  )
}
