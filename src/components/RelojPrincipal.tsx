import { useState, useEffect } from 'react'
import type { Usuario, EstadoTrabajo } from '@/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { FiPlay, FiPause, FiSquare } from 'react-icons/fi'
import { useGSAPAnimations } from '@/hooks/useGSAPAnimations'
import { initClockAnimations } from '@/utils/animations/clock-animations'
import { useTimeRecords } from '@/hooks/useTimeRecords'
import PrimaryButton from '@/components/ui/PrimaryButton'
import SecondaryButton from '@/components/ui/SecondaryButton'
import { ConfirmModal } from '@/components/modals/ConfirmModal'

interface Props {
  usuario: Usuario
  estadoActual?: EstadoTrabajo
  tiempoTrabajado?: string
  onStatusChange?: () => void
}

export function RelojPrincipal({ usuario, estadoActual: propEstadoActual, tiempoTrabajado: propTiempoTrabajado, onStatusChange }: Props) {
  const [horaActual, setHoraActual] = useState(new Date())
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  
  const hookData = useTimeRecords(usuario.id)
  
  // Use props if provided, otherwise fall back to hook data
  const estadoActual = propEstadoActual ?? hookData.estadoActual
  const tiempoTrabajado = propTiempoTrabajado ?? hookData.tiempoTrabajado
  const availableActions = hookData.availableActions
  const performAction = hookData.performAction
  const isLoading = hookData.isLoading
  const error = hookData.error

  useGSAPAnimations({ animations: [initClockAnimations], delay: 100 })

  useEffect(() => {
    const timer = setInterval(() => setHoraActual(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleAction = async (action: 'entrada' | 'descanso_inicio' | 'descanso_fin' | 'salida') => {
    if (action === 'salida') {
      setShowConfirmModal(true)
      return
    }
    
    try {
      await performAction(action)
      // Call parent's onStatusChange if provided
      onStatusChange?.()
    } catch (err) {
      console.error('Error performing action:', err)
    }
  }

  const handleConfirmStop = async () => {
    setShowConfirmModal(false)
    try {
      await performAction('salida')
      // Call parent's onStatusChange if provided
      onStatusChange?.()
    } catch (err) {
      console.error('Error performing action:', err)
    }
  }

  const getStatusDisplay = () => {
    switch (estadoActual) {
      case 'trabajando': 
        return { 
          texto: 'TRABAJANDO', 
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          dotColor: 'bg-green-500',
          pulse: true
        }
      case 'descanso':   
        return { 
          texto: 'DESCANSO', 
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          dotColor: 'bg-orange-500',
          pulse: false
        }
      default:           
        return { 
          texto: 'PARADO', 
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          dotColor: 'bg-gray-500',
          pulse: false
        }
    }
  }

  const getActionConfig = (action: string) => {
    const configs = {
      entrada: { 
        icon: <FiPlay className="w-6 h-6" />, 
        label: 'EMPEZAR', 
        type: 'primary' as const,
        className: 'bg-green-600 hover:bg-green-700'
      },
      descanso_inicio: { 
        icon: <FiPause className="w-6 h-6" />, 
        label: 'DESCANSO', 
        type: 'secondary' as const,
        className: 'bg-orange-600 hover:bg-orange-700 text-white'
      },
      descanso_fin: { 
        icon: <FiPlay className="w-6 h-6" />, 
        label: 'CONTINUAR', 
        type: 'secondary' as const,
        className: 'bg-green-600 hover:bg-green-700 text-white'
      },
      salida: { 
        icon: <FiSquare className="w-6 h-6" />, 
        label: 'PARAR', 
        type: 'danger' as const,
        className: 'bg-red-600 hover:bg-red-700'
      }
    }
    return configs[action as keyof typeof configs]
  }

  const status = getStatusDisplay()

  return (
    <>
      <div className="flex flex-col gap-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="clock-container bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-12 text-center">
          <div className="text-7xl font-mono font-bold text-azul-profundo pb-4">
            {format(horaActual, 'HH:mm:ss')}
          </div>
          
          <div className="text-lg text-azul-profundo/70 pb-8">
            {format(horaActual, "EEEE, d 'de' MMMM", { locale: es })}
          </div>

          <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full ${status.bgColor} border-2 border-current/20`}>
            <span className={`w-4 h-4 rounded-full ${status.dotColor} ${status.pulse ? 'animate-pulse' : ''}`} />
            <span className={`font-bold text-lg ${status.color}`}>
              {status.texto}
            </span>
          </div>

          <div className="flex items-end gap-4 justify-center pt-8">
            <div className="text-4xl font-bold text-azul-profundo ">
              {tiempoTrabajado}
            </div>
            <div className="text-azul-profundo/60 pb-1">
              Tiempo trabajado hoy
            </div>
          </div>
        </div>

        <div className="buttons-container flex flex-col sm:flex-row gap-4 justify-center">
          {availableActions.map((actionConfig) => {
            const config = getActionConfig(actionConfig.action)
            if (!config) return null

            if (config.type === 'primary') {
              return (
                <PrimaryButton
                  key={actionConfig.action}
                  onClick={() => handleAction(actionConfig.action)}
                  disabled={isLoading}
                  className={`flex items-center gap-3 px-8 py-4 text-lg font-bold ${config.className}`}
                >
                  {config.icon}
                  {isLoading ? 'PROCESANDO...' : config.label}
                </PrimaryButton>
              )
            }

            if (config.type === 'secondary') {
              return (
                <SecondaryButton
                  key={actionConfig.action}
                  onClick={() => handleAction(actionConfig.action)}
                  disabled={isLoading}
                  className={`flex items-center gap-3 px-8 py-4 text-lg font-bold ${config.className}`}
                >
                  {config.icon}
                  {isLoading ? 'PROCESANDO...' : config.label}
                </SecondaryButton>
              )
            }

            return (
              <PrimaryButton
                key={actionConfig.action}
                onClick={() => handleAction(actionConfig.action)}
                disabled={isLoading}
                className={`flex items-center gap-3 px-8 py-4 text-lg font-bold ${config.className}`}
              >
                {config.icon}
                {isLoading ? 'PROCESANDO...' : config.label}
              </PrimaryButton>
            )
          })}
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onConfirm={handleConfirmStop}
        onCancel={() => setShowConfirmModal(false)}
        title="¿Finalizar jornada?"
        message="Estás a punto de finalizar tu jornada laboral. ¿Estás seguro?"
        confirmText="Sí, finalizar"
        cancelText="Cancelar"
      />
    </>
  )
}