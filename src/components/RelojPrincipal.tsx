import { useState, useEffect } from 'react'
import type { Usuario, RegistroTiempo, EstadoTrabajo } from '@/types'
import { format, differenceInMinutes } from 'date-fns'
import { es } from 'date-fns/locale'
import { useGSAPAnimations } from '@/hooks/useGSAPAnimations'
import { initClockAnimations } from '@/utils/animations/clock-animations'
import PrimaryButton from '@/components/ui/PrimaryButton'
import SecondaryButton from '@/components/ui/SecondaryButton'

interface Props {
  usuario: Usuario
  estadoActual: EstadoTrabajo
  onRegistro: (registro: Omit<RegistroTiempo, 'id' | 'usuarioId'>) => void
  registros: RegistroTiempo[]
}

export function RelojPrincipal({ usuario, estadoActual, onRegistro, registros }: Props) {
  const [horaActual, setHoraActual] = useState(new Date())
  const [tiempoTrabajado, setTiempoTrabajado] = useState('00:00')
  const [isLoading, setIsLoading] = useState(false)

  useGSAPAnimations({ animations: [initClockAnimations], delay: 100 })

  useEffect(() => {
    const timer = setInterval(() => setHoraActual(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const registrosHoy = registros.filter(r => {
      const f = new Date(r.fechaEntrada)
      return f.toDateString() === new Date().toDateString() && r.usuarioId === usuario.id
    })

    let totalMin = 0
    let entrada: Date | null = null

    registrosHoy.forEach(r => {
      if (r.tipoRegistro === 'entrada') entrada = new Date(r.fechaEntrada)
      else if (r.tipoRegistro === 'salida' && entrada) {
        const salida = r.fechaSalida ? new Date(r.fechaSalida) : new Date(r.fechaEntrada)
        totalMin += differenceInMinutes(salida, entrada)
        entrada = null
      }
    })

    if (entrada && estadoActual === 'trabajando') {
      totalMin += differenceInMinutes(new Date(), entrada)
    }

    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    setTiempoTrabajado(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }, [registros, estadoActual, horaActual, usuario.id])

  const manejarAccion = async (accion: 'entrada' | 'salida' | 'descanso_inicio' | 'descanso_fin') => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 500))
    const ahora = new Date()
    onRegistro({
      fechaEntrada: ahora,
      tipoRegistro: accion,
      fechaSalida: accion === 'salida' || accion === 'descanso_fin' ? ahora : undefined
    })
    setIsLoading(false)
  }

  const estadoInfo = (() => {
    switch (estadoActual) {
      case 'trabajando': return { texto: 'Trabajando', color: 'text-activo', bg: 'bg-activo/10', br: 'border-activo/30' }
      case 'descanso':   return { texto: 'En Descanso', color: 'text-descanso', bg: 'bg-descanso/10', br: 'border-descanso/30' }
      default:           return { texto: 'Desconectado', color: 'text-inactivo', bg: 'bg-inactivo/10', br: 'border-inactivo/30' }
    }
  })()

  return (
    <div className="flex flex-col gap-8">
      {/* CLOCK CARD */}
      <div className="max-w-3xl mx-auto bg-blanco/95 backdrop-blur rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-6">
        <div className="text-6xl font-mono font-bold text-azul-profundo">{format(horaActual, 'HH:mm:ss')}</div>
        <div className="text-lg text-azul-profundo/70">{format(horaActual, "EEEE, d 'de' MMMM", { locale: es })}</div>

        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 ${estadoInfo.bg} ${estadoInfo.br}`}>
          <span className={`w-3 h-3 rounded-full ${estadoInfo.color.replace('text-', 'bg-')}`} />
          <span className={`font-semibold ${estadoInfo.color}`}>{estadoInfo.texto}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="text-3xl font-bold text-azul-profundo">{tiempoTrabajado}</div>
          <div className="text-sm text-azul-profundo/60">Tiempo trabajado hoy</div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
        {estadoActual === 'desconectado' && (
          <PrimaryButton onClick={() => manejarAccion('entrada')} disabled={isLoading}>
            {isLoading ? 'Procesando…' : 'Entrar a Trabajar'}
          </PrimaryButton>
        )}

        {estadoActual === 'trabajando' && (
          <>
            <SecondaryButton onClick={() => manejarAccion('descanso_inicio')} disabled={isLoading}>
              Iniciar Descanso
            </SecondaryButton>
            <PrimaryButton
              onClick={() => manejarAccion('salida')}
              disabled={isLoading}
              className="bg-gradient-to-r from-inactivo to-red-600"
            >
              Finalizar Jornada
            </PrimaryButton>
          </>
        )}

        {estadoActual === 'descanso' && (
          <>
            <PrimaryButton onClick={() => manejarAccion('descanso_fin')} disabled={isLoading}>
              Terminar Descanso
            </PrimaryButton>
            <PrimaryButton
              onClick={() => manejarAccion('salida')}
              disabled={isLoading}
              className="bg-gradient-to-r from-inactivo to-red-600"
            >
              Finalizar Jornada
            </PrimaryButton>
          </>
        )}
      </div>
    </div>
  )
}
