import { useState, useEffect } from 'react'
import type { Usuario, RegistroTiempo, EstadoTrabajo, VistaNavegacion } from '@/types'
import { RelojPrincipal } from '@/components/RelojPrincipal'
import { HistorialTrabajo } from '@/components/HistorialTrabajo'
import { ConfiguracionSimulacion } from '@/components/ConfiguracionSimulacion'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useGSAPAnimations } from '@/hooks/useGSAPAnimations'
import { initDashboardAnimations } from '@/utils/animations/clock-animations'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { FiClock, FiList, FiSettings, FiLogOut } from 'react-icons/fi'

interface DashboardPageProps {
  usuario: Usuario
  onLogout: () => void
}

export function DashboardPage({ usuario, onLogout }: DashboardPageProps) {
  const [registros, setRegistros] = useLocalStorage<RegistroTiempo[]>('registros_tiempo', [])
  const [vistaActual, setVistaActual] = useState<VistaNavegacion>('reloj')
  const [estadoActual, setEstadoActual] = useState<EstadoTrabajo>('desconectado')

  useGSAPAnimations({ animations: [initDashboardAnimations], delay: 100 })

  useEffect(() => {
    const ultimoRegistro = registros
      .filter(r => r.usuarioId === usuario.id)
      .sort((a, b) => new Date(b.fechaEntrada).getTime() - new Date(a.fechaEntrada).getTime())[0]

    if (ultimoRegistro) {
      if (ultimoRegistro.tipoRegistro === 'entrada' && !ultimoRegistro.fechaSalida) setEstadoActual('trabajando')
      else if (ultimoRegistro.tipoRegistro === 'descanso_inicio' && !ultimoRegistro.fechaSalida) setEstadoActual('descanso')
      else setEstadoActual('desconectado')
    }
  }, [registros, usuario.id])

  const agregarRegistro = (nuevo: Omit<RegistroTiempo, 'id' | 'usuarioId'>) => {
    const registro: RegistroTiempo = { ...nuevo, id: crypto.randomUUID(), usuarioId: usuario.id }
    setRegistros(prev => [...prev, registro])
  }

  const tabs = [
    { id: 'reloj' as const, label: 'Fichaje', icon: <FiClock className="w-5 h-5" /> },
    { id: 'historial' as const, label: 'Historial', icon: <FiList className="w-5 h-5" /> },
    { id: 'configuracion' as const, label: 'Config', icon: <FiSettings className="w-5 h-5" /> }
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-azul-profundo via-[#123243] to-teal">
      {/* HEADER */}
      <header className="bg-blanco/90 backdrop-blur border-b border-hielo">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-turquesa to-hielo flex items-center justify-center">
              <img src="/assets/img/logos/logo-full-white.webp" alt="Galaga" className="w-7 h-auto" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-azul-profundo">Reloj Laboral</h1>
              <p className="text-xs text-azul-profundo/70">
                {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <p className="text-sm font-medium text-azul-profundo">{usuario.nombre}</p>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${
                    estadoActual === 'trabajando'
                      ? 'bg-activo'
                      : estadoActual === 'descanso'
                      ? 'bg-descanso'
                      : 'bg-inactivo'
                  }`}
                />
                <span className="text-xs text-azul-profundo/70 capitalize">{estadoActual}</span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-azul-profundo hover:text-naranja-tostado transition-colors"
            >
              <FiLogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* NAV */}
      <nav className="bg-blanco/90 backdrop-blur border-b border-hielo">
        <div className="mx-auto max-w-6xl px-4 flex gap-6">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setVistaActual(t.id)}
              className={`flex items-center gap-2 py-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                vistaActual === t.id
                  ? 'border-teal text-teal'
                  : 'border-transparent text-azul-profundo/70 hover:text-azul-profundo hover:border-hielo'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* MAIN */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
        {vistaActual === 'reloj' && (
          <RelojPrincipal
            usuario={usuario}
            estadoActual={estadoActual}
            onRegistro={agregarRegistro}
            registros={registros}
          />
        )}
        {vistaActual === 'historial' && (
          <HistorialTrabajo registros={registros.filter(r => r.usuarioId === usuario.id)} />
        )}
        {vistaActual === 'configuracion' && (
          <ConfiguracionSimulacion
            usuario={usuario}
            onRegistrosSimulados={(nuevos) => setRegistros(prev => [...prev, ...nuevos])}
          />
        )}
      </main>
    </div>
  )
}
