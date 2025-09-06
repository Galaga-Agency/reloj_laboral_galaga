import { useState, useEffect } from 'react'
import type { Usuario } from '@/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useGSAPAnimations } from '@/hooks/useGSAPAnimations'
import { initClockAnimations } from '@/utils/animations/clock-animations'
import { useTimeRecords } from '@/hooks/useTimeRecords'
import PrimaryButton from '@/components/ui/PrimaryButton'
import SecondaryButton from '@/components/ui/SecondaryButton'

interface Props {
  usuario: Usuario
}

export function RelojPrincipal({ usuario }: Props) {
  const [horaActual, setHoraActual] = useState(new Date())
  
  const {
    estadoActual,
    tiempoTrabajado,
    availableActions,
    performAction,
    isLoading,
    error
  } = useTimeRecords(usuario.id)

  useGSAPAnimations({ animations: [initClockAnimations], delay: 100 })

  useEffect(() => {
    const timer = setInterval(() => setHoraActual(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleAction = async (action: 'entrada' | 'descanso_inicio' | 'descanso_fin' | 'salida') => {
    try {
      await performAction(action)
    } catch (err) {
      console.error('Error performing action:', err)
    }
  }

  const getStatusInfo = () => {
    switch (estadoActual) {
      case 'trabajando': 
        return { 
          texto: 'Trabajando', 
          color: 'text-activo', 
          bg: 'bg-activo/10', 
          br: 'border-activo/30',
          pulse: true
        }
      case 'descanso':   
        return { 
          texto: 'En Descanso', 
          color: 'text-descanso', 
          bg: 'bg-descanso/10', 
          br: 'border-descanso/30',
          pulse: false
        }
      default:           
        return { 
          texto: 'Desconectado', 
          color: 'text-inactivo', 
          bg: 'bg-inactivo/10', 
          br: 'border-inactivo/30',
          pulse: false
        }
    }
  }

  const statusInfo = getStatusInfo()

  const renderActionButton = (actionConfig: {
    action: 'entrada' | 'descanso_inicio' | 'descanso_fin' | 'salida'
    label: string
    type: 'primary' | 'secondary' | 'danger'
  }) => {
    const { action, label, type } = actionConfig

    if (type === 'danger') {
      return (
        <PrimaryButton
          key={action}
          onClick={() => handleAction(action)}
          disabled={isLoading}
          className="bg-gradient-to-r from-inactivo to-red-600 hover:from-red-500 hover:to-red-700"
        >
          {isLoading ? 'Procesando…' : label}
        </PrimaryButton>
      )
    }

    if (type === 'secondary') {
      return (
        <SecondaryButton
          key={action}
          onClick={() => handleAction(action)}
          disabled={isLoading}
        >
          {isLoading ? 'Procesando…' : label}
        </SecondaryButton>
      )
    }

    return (
      <PrimaryButton
        key={action}
        onClick={() => handleAction(action)}
        disabled={isLoading}
      >
        {isLoading ? 'Procesando…' : label}
      </PrimaryButton>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* CLOCK CARD */}
      <div className="bg-blanco/95 backdrop-blur rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-6">
        <div className="text-6xl font-mono font-bold text-azul-profundo">
          {format(horaActual, 'HH:mm:ss')}
        </div>
        
        <div className="text-lg text-azul-profundo/70">
          {format(horaActual, "EEEE, d 'de' MMMM", { locale: es })}
        </div>

        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 ${statusInfo.bg} ${statusInfo.br}`}>
          <span className={`w-3 h-3 rounded-full ${statusInfo.color.replace('text-', 'bg-')} ${statusInfo.pulse ? 'animate-pulse' : ''}`} />
          <span className={`font-semibold ${statusInfo.color}`}>
            {statusInfo.texto}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="text-3xl font-bold text-azul-profundo">
            {tiempoTrabajado}
          </div>
          <div className="text-sm text-azul-profundo/60">
            Tiempo trabajado hoy
          </div>
        </div>

        <div className="text-sm text-azul-profundo/50">
          Bienvenido, {usuario.nombre}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {availableActions.map(renderActionButton)}
      </div>
    </div>
  )
}