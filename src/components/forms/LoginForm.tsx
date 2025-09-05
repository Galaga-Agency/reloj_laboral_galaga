import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Usuario } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import PrimaryButton from '@/components/ui/PrimaryButton'
import SecondaryButton from '@/components/ui/SecondaryButton'

interface LoginFormProps { onLogin: (usuario: Usuario) => void }
interface LoginFormData { email: string; password: string }

export function LoginForm({ onLogin }: LoginFormProps) {
  const { login, isLoading, error } = useAuth()
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState('')

  const { register, handleSubmit, formState: { errors, isValid } } =
    useForm<LoginFormData>({ mode: 'onChange' })

  const onSubmit = async (data: LoginFormData) => {
    try {
      const usuario = await login(data.email, data.password)
      onLogin(usuario)
    } catch {}
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail.trim()) return
    setResetLoading(true); setResetMessage('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      setResetMessage(error ? `Error: ${error.message}` : 'Se ha enviado un enlace de recuperación a tu correo electrónico.')
    } catch {
      setResetMessage('Error al enviar el correo de recuperación.')
    } finally {
      setResetLoading(false)
    }
  }

  if (showPasswordReset) {
    return (
      <div className="rounded-2xl bg-white/92 backdrop-blur p-6 border border-black/5 shadow-lg">
        <h2 className="text-2xl font-bold text-azul-profundo mb-6 text-center">Recuperar Contraseña</h2>

        {resetMessage && (
          <div className={`mb-6 p-4 rounded-lg ${resetMessage.startsWith('Error')
            ? 'bg-inactivo/10 border border-inactivo/30 text-inactivo'
            : 'bg-activo/10 border border-activo/30 text-activo'
          }`}>
            <p className="text-sm font-medium">{resetMessage}</p>
          </div>
        )}

        <form onSubmit={handlePasswordReset} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="resetEmail" className="text-sm font-medium text-azul-profundo">Correo electrónico</label>
            <input
              type="email"
              id="resetEmail"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full px-4 py-3 border border-hielo rounded-lg transition-all duration-200 focus:ring-2 focus:ring-teal focus:border-teal"
              placeholder="tu@galagaagency.com"
              required
              disabled={resetLoading}
            />
          </div>

          <div className="flex flex-col gap-3">
            <PrimaryButton
              disabled={resetLoading || !resetEmail.trim()}
              className="w-full"
            >
              {resetLoading ? 'Enviando…' : 'Enviar Enlace de Recuperación'}
            </PrimaryButton>

            <SecondaryButton
              onClick={() => setShowPasswordReset(false)}
              className="w-full"
              borderColor="teal"
            >
              Volver al inicio de sesión
            </SecondaryButton>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white/92 backdrop-blur p-6 border border-black/5 shadow-lg">
      <h2 className="text-2xl font-bold text-azul-profundo text-center mb-6">Iniciar Sesión</h2>

      {error && (
        <div className="mb-6 p-4 bg-inactivo/10 border border-inactivo/30 rounded-lg">
          <p className="text-sm text-inactivo font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Email */}
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-azul-profundo">Correo electrónico</label>
          <input
            type="email"
            id="email"
            {...register('email', {
              required: 'El correo electrónico es obligatorio',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Formato de correo inválido' }
            })}
            className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:ring-2 focus:ring-teal focus:border-teal ${
              errors.email ? 'border-inactivo bg-inactivo/5' : 'border-hielo'
            }`}
            placeholder="tu@galagaagency.com"
            disabled={isLoading}
          />
          {errors.email && <p className="text-sm text-inactivo">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium text-azul-profundo">Contraseña</label>
          <input
            type="password"
            id="password"
            {...register('password', {
              required: 'La contraseña es obligatoria',
              minLength: { value: 6, message: 'La contraseña debe tener al menos 6 caracteres' }
            })}
            className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:ring-2 focus:ring-teal focus:border-teal ${
              errors.password ? 'border-inactivo bg-inactivo/5' : 'border-hielo'
            }`}
            placeholder="Tu contraseña temporal"
            disabled={isLoading}
          />
          {errors.password && <p className="text-sm text-inactivo">{errors.password.message}</p>}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <PrimaryButton
            disabled={isLoading || !isValid}
          >
            {isLoading ? 'Verificando…' : 'Iniciar Sesión'}
          </PrimaryButton>

          <button
            type="button"
            onClick={() => setShowPasswordReset(true)}
            className="text-sm text-azul-profundo/70 hover:text-teal transition-colors duration-200"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </form>
    </div>
  )
}
