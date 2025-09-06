import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { FiLogOut } from 'react-icons/fi'
import type { Usuario, EstadoTrabajo } from '@/types'
import SecondaryButton from './ui/SecondaryButton'

interface DashboardHeaderProps {
  usuario: Usuario
  estadoActual: EstadoTrabajo
  onLogout: () => void
}

export function DashboardHeader({ usuario, estadoActual, onLogout }: DashboardHeaderProps) {
  return (
    <header className="bg-blanco border-b border-hielo/30">
      <div className="px-4 py-4 md:px-6 md:py-5 lg:px-10 lg:py-7">
        
        {/* Mobile: Just logo, user name, status dot, and logout */}
        <div className="flex items-center justify-between md:hidden">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/img/logos/logo-mobile.webp" 
              alt="Galaga" 
              className="h-8" 
            />
            <div className="flex items-center gap-2">
              <span className="font-bold text-azul-profundo">{usuario.nombre}</span>
              <div className={`w-2 h-2 rounded-full ${
                estadoActual === 'trabajando' ? 'bg-activo' :
                estadoActual === 'descanso' ? 'bg-descanso' : 'bg-inactivo'
              }`} />
            </div>
          </div>
          
          <button
            onClick={onLogout}
            className="p-2 rounded-lg border border-teal text-teal"
          >
            <FiLogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop: Original layout */}
        <div className="hidden md:flex md:items-center md:justify-between">
          <div className="flex items-center gap-6">
            <img 
              src="/assets/img/logos/logo-mobile.webp" 
              alt="Galaga" 
              className="h-12 lg:h-16" 
            />
            <div>
              <h1 className="text-xl font-bold text-azul-profundo lg:text-3xl">Reloj Laboral</h1>
              <p className="text-base font-medium mt-1 text-teal">
                {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-right">
              <p className="text-xl font-bold text-azul-profundo">
                {usuario.nombre}
              </p>
              <div className="flex items-center justify-end gap-3 mt-2">
                <div className={`w-3 h-3 rounded-full ${
                  estadoActual === 'trabajando' ? 'bg-activo' :
                  estadoActual === 'descanso' ? 'bg-descanso' : 'bg-inactivo'
                }`} />
                <span className="text-azul-profundo/70 font-medium capitalize">
                  {estadoActual === 'trabajando' ? 'Trabajando' :
                   estadoActual === 'descanso' ? 'En descanso' : 'Desconectado'}
                </span>
              </div>
            </div>

            <SecondaryButton
              onClick={onLogout}
              size="sm"
              borderColor="teal"
            >
              <FiLogOut className="w-4 h-4" />
              Cerrar Sesión
            </SecondaryButton>
          </div>
        </div>
      </div>
    </header>
  )
}