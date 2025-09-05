import type { Usuario } from '@/types'
import { useGSAPAnimations } from '@/hooks/useGSAPAnimations'
import { initLoginAnimations } from '@/utils/animations/clock-animations'
import { LoginForm } from '@/components/forms/LoginForm'

interface LoginPageProps {
  onLogin: (usuario: Usuario) => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  useGSAPAnimations({ animations: [initLoginAnimations], delay: 100 })

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 lg:py-0 relative overflow-hidden"
         style={{ fontFamily: 'Aileron, Inter, system-ui, sans-serif' }}>
      {/* brand gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-azul-profundo via-[#123243] to-teal" />
      {/* soft radial accents */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(900px_600px_at_15%_-10%,rgba(76,188,197,.22),transparent_60%),radial-gradient(1000px_600px_at_90%_110%,rgba(238,111,69,.15),transparent_60%)]" />

      {/* Content card */}
      <div className="relative w-full max-w-[1100px]">
        <div className="rounded-[26px] border border-white/10 bg-white/85 backdrop-blur-xl shadow-2xl">
          {/* 2-column at lg; stacked on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* LEFT: Big logo + title */}
            <div className="flex items-center justify-center p-8 lg:p-12">
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
                <img
                  src="/assets/img/logos/logo-full.webp"
                  alt="Galaga Agency"
                  className="w-48 h-auto drop-shadow-2xl lg:w-64"
                />
                <div className="flex flex-col gap-2">
                  <h1 className="text-3xl lg:text-5xl font-extrabold leading-tight text-azul-profundo">
                    Reloj Laboral
                  </h1>
                  <p className="text-[#3b556b] text-base lg:text-lg">
                    Sistema de fichaje
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT: Form */}
            <div className="p-6 sm:p-8 lg:p-12">
              <LoginForm onLogin={onLogin} />
              <div className="mt-6 text-center lg:text-left text-xs text-[#3b556b]/80">
                <p>Sistema de fichaje para el equipo de Galaga Agency</p>
                <p className="mt-1">¿No tienes credenciales? Contacta con el administrador.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
