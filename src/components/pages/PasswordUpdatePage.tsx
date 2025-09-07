import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthService } from '@/services/auth-service'
import type { Usuario } from '@/types'
import { useGSAPAnimations } from '@/hooks/useGSAPAnimations'
import PrimaryButton from '@/components/ui/PrimaryButton'
import { initLoginAnimations } from '@/utils/animations/login-animations'

interface PasswordUpdatePageProps {
  usuario: Usuario
  onPasswordUpdated: () => void
}

interface PasswordFormData {
  newPassword: string
  confirmPassword: string
}

export function PasswordUpdatePage({ usuario, onPasswordUpdated }: PasswordUpdatePageProps) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useGSAPAnimations({ animations: [initLoginAnimations], delay: 100 })

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<PasswordFormData>({
    mode: 'onChange'
  })

  const newPassword = watch('newPassword')

  const onSubmit = async (data: PasswordFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      await AuthService.updatePassword(data.newPassword)
      onPasswordUpdated()
      navigate('/panel')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="login-logo text-center pb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-mandarina to-naranja-tostado rounded-2xl pb-4 shadow-2xl">
            <span className="text-2xl font-bold text-blanco">🔒</span>
          </div>
          <h1 className="text-3xl font-bold text-blanco pb-2">Actualizar Contraseña</h1>
          <p className="text-hielo text-lg">Bienvenido/a, {usuario.nombre}</p>
        </div>

        <div className="login-form bg-blanco/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-azul-profundo pb-4 text-center">
            Primera conexión
          </h2>
          
          <div className="pb-6 p-4 bg-mandarina/10 border border-mandarina/30 rounded-lg">
            <p className="text-sm text-azul-profundo">
              Por seguridad, debes cambiar tu contraseña temporal antes de continuar.
            </p>
          </div>

          {error && (
            <div className="pb-6 p-4 bg-inactivo/10 border border-inactivo/30 rounded-lg">
              <p className="text-sm text-inactivo font-medium">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="newPassword" className="block text-sm font-medium text-azul-profundo">
                Nueva contraseña
              </label>
              <input
                type="password"
                id="newPassword"
                {...register('newPassword', {
                  required: 'La nueva contraseña es obligatoria',
                  minLength: {
                    value: 8,
                    message: 'La contraseña debe tener al menos 8 caracteres'
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Debe contener al menos una mayúscula, una minúscula y un número'
                  }
                })}
                className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:ring-2 focus:ring-teal focus:border-teal ${
                  errors.newPassword ? 'border-inactivo bg-inactivo/5' : 'border-hielo'
                }`}
                placeholder="Mínimo 8 caracteres"
                disabled={isLoading}
              />
              {errors.newPassword && (
                <p className="text-sm text-inactivo">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-azul-profundo">
                Confirmar contraseña
              </label>
              <input
                type="password"
                id="confirmPassword"
                {...register('confirmPassword', {
                  required: 'Debes confirmar la contraseña',
                  validate: (value) => value === newPassword || 'Las contraseñas no coinciden'
                })}
                className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:ring-2 focus:ring-teal focus:border-teal ${
                  errors.confirmPassword ? 'border-inactivo bg-inactivo/5' : 'border-hielo'
                }`}
                placeholder="Repite la nueva contraseña"
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-inactivo">{errors.confirmPassword.message}</p>
              )}
            </div>

            <PrimaryButton
              disabled={isLoading || !isValid}
              className="w-full"
            >
              {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </PrimaryButton>
          </form>

          <div className="pt-6 text-center">
            <p className="text-xs text-azul-profundo/60">
              Una vez actualizada, podrás acceder al sistema de fichaje.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}