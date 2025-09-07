import type { Usuario } from '@/types'
import { useNavigate } from 'react-router-dom'
import { useGSAPAnimations } from '@/hooks/useGSAPAnimations'
import { LoginForm } from '@/components/forms/LoginForm'
import { initLoginAnimations } from '@/utils/animations/login-animations'

interface LoginPageProps {
  onLogin: (usuario: Usuario) => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate()
  useGSAPAnimations({ animations: [initLoginAnimations], delay: 100 })

  const handleLogin = (usuario: Usuario) => {
    onLogin(usuario)
    if (usuario.firstLogin) {
      navigate('/actualizar-contrasena')
    } else {
      navigate('/panel')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-azul-profundo to-teal relative">
      
      <div className="hidden lg:flex min-h-screen">
        <div className="flex-1 flex items-center justify-center px-20">
          <div className="max-w-2xl">
            <img
              src="/assets/img/logos/logo-full.webp"
              alt="Galaga Agency"
              className="login-logo absolute top-6 left-6 w-48 h-auto pb-16"
            />
            <h1 className="login-title text-8xl font-semibold text-white pb-8 leading-none">
              Reloj Laboral
            </h1>
            <p className="login-subtitle text-3xl text-white/90 font-light">
              Sistema de fichaje para el equipo
            </p>
          </div>
        </div>

        <div className="w-2/5 bg-black/20 backdrop-blur-xl flex items-center justify-center px-16">
          <div className="w-full max-w-lg">
            <div className="login-form">
              <LoginForm onLogin={handleLogin} />
            </div>
            <div className="login-credentials pt-8 text-center">
              <p className="text-white/70 text-sm">¿No tienes credenciales? Contacta con el administrador.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden min-h-screen flex flex-col justify-center px-6">
        <div className="text-center pb-16">
          <img
            src="/assets/img/logos/logo-full.webp"
            alt="Galaga Agency"
            className="mobile-login-logo w-48 h-auto mx-auto pb-12"
          />
          <h1 className="mobile-login-title text-6xl font-semibold text-white pb-6 leading-none">
             Reloj Laboral
          </h1>
          <p className="mobile-login-subtitle text-xl text-white/90">Sistema de fichaje para el equipo</p>
        </div>
        
        <div className="max-w-md mx-auto w-full">
          <div className="mobile-login-form">
            <LoginForm onLogin={handleLogin} />
          </div>
          <div className="mobile-login-credentials pt-8 text-center">
            <p className="text-white/70 text-sm">¿No tienes credenciales? Contacta con el administrador.</p>
          </div>
        </div>
      </div>

    </div>
  )
}