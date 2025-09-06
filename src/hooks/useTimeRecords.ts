// hooks/useTimeRecords.ts
import { useState, useEffect, useCallback } from 'react'
import { TimeRecordsService } from '@/services/time-records-service'
import { ClockStateManager } from '@/utils/clock-state'
import type { RegistroTiempo, EstadoTrabajo } from '@/types'

interface UseTimeRecordsReturn {
  registros: RegistroTiempo[]
  estadoActual: EstadoTrabajo
  tiempoTrabajado: string
  availableActions: Array<{
    action: 'entrada' | 'descanso_inicio' | 'descanso_fin' | 'salida'
    label: string
    type: 'primary' | 'secondary' | 'danger'
  }>
  performAction: (action: 'entrada' | 'descanso_inicio' | 'descanso_fin' | 'salida') => Promise<void>
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useTimeRecords(usuarioId: string): UseTimeRecordsReturn {
  const [registros, setRegistros] = useState<RegistroTiempo[]>([])
  const [estadoActual, setEstadoActual] = useState<EstadoTrabajo>('desconectado')
  const [tiempoTrabajado, setTiempoTrabajado] = useState('00:00')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRegistros = useCallback(async () => {
    if (!usuarioId) return

    setIsLoading(true)
    setError(null)

    try {
      const records = await TimeRecordsService.getRecordsByUser(usuarioId)
      setRegistros(records)
      
      // Update state using utility functions
      const currentState = ClockStateManager.getCurrentState(records)
      setEstadoActual(currentState)
      
      const workedTime = ClockStateManager.calculateWorkedTime(records)
      setTiempoTrabajado(workedTime)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [usuarioId])

  const performAction = useCallback(async (
    action: 'entrada' | 'descanso_inicio' | 'descanso_fin' | 'salida'
  ) => {
    // Validate action
    const validation = ClockStateManager.canPerformAction(action, estadoActual)
    if (!validation.canPerform) {
      throw new Error(validation.reason || 'Acción no permitida')
    }

    setError(null)
    setIsLoading(true)

    try {
      const now = new Date()
      
      const registro: Omit<RegistroTiempo, 'id' | 'usuarioId'> = {
        fechaEntrada: now,
        tipoRegistro: action,
        fechaSalida: action === 'salida' || action === 'descanso_fin' ? now : undefined,
        esSimulado: false
      }

      await TimeRecordsService.createRecord({
        ...registro,
        usuarioId
      })

      // Refetch to update state
      await fetchRegistros()
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [usuarioId, estadoActual, fetchRegistros])

  // Update worked time every minute when working
  useEffect(() => {
    if (estadoActual === 'trabajando' || estadoActual === 'descanso') {
      const interval = setInterval(() => {
        const workedTime = ClockStateManager.calculateWorkedTime(registros)
        setTiempoTrabajado(workedTime)
      }, 60000) // Update every minute

      return () => clearInterval(interval)
    }
  }, [registros, estadoActual])

  useEffect(() => {
    fetchRegistros()
  }, [fetchRegistros])

  // Get available actions based on current state
  const availableActions = ClockStateManager.getAvailableActions(estadoActual)

  return {
    registros,
    estadoActual,
    tiempoTrabajado,
    availableActions,
    performAction,
    isLoading,
    error,
    refetch: fetchRegistros
  }
}