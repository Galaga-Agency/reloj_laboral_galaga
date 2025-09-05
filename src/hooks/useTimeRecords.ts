import { useState, useEffect, useCallback } from 'react'
import { TimeRecordsService } from '@/services/time-records-service'
import type { RegistroTiempo, EstadoTrabajo } from '@/types'

interface UseTimeRecordsReturn {
  registros: RegistroTiempo[]
  estadoActual: EstadoTrabajo
  crearRegistro: (registro: Omit<RegistroTiempo, 'id' | 'usuarioId'>) => Promise<void>
  crearRegistrosSimulados: (registros: Omit<RegistroTiempo, 'id' | 'usuarioId'>[]) => Promise<void>
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useTimeRecords(usuarioId: string): UseTimeRecordsReturn {
  const [registros, setRegistros] = useState<RegistroTiempo[]>([])
  const [estadoActual, setEstadoActual] = useState<EstadoTrabajo>('desconectado')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRegistros = useCallback(async () => {
    if (!usuarioId) return

    setIsLoading(true)
    setError(null)

    try {
      const records = await TimeRecordsService.getRecordsByUser(usuarioId)
      setRegistros(records)
      
      // Calculate current state
      if (records.length > 0) {
        const ultimoRegistro = records[0] // Already sorted by date desc
        
        if (ultimoRegistro.tipoRegistro === 'entrada' && !ultimoRegistro.fechaSalida) {
          setEstadoActual('trabajando')
        } else if (ultimoRegistro.tipoRegistro === 'descanso_inicio' && !ultimoRegistro.fechaSalida) {
          setEstadoActual('descanso')
        } else {
          setEstadoActual('desconectado')
        }
      } else {
        setEstadoActual('desconectado')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [usuarioId])

  const crearRegistro = useCallback(async (nuevoRegistro: Omit<RegistroTiempo, 'id' | 'usuarioId'>) => {
    setError(null)

    try {
      await TimeRecordsService.createRecord({
        ...nuevoRegistro,
        usuarioId
      })
      
      // Refetch all records to update state
      await fetchRegistros()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    }
  }, [usuarioId, fetchRegistros])

  const crearRegistrosSimulados = useCallback(async (nuevosRegistros: Omit<RegistroTiempo, 'id' | 'usuarioId'>[]) => {
    setError(null)

    try {
      const registrosConUsuario = nuevosRegistros.map(registro => ({
        ...registro,
        usuarioId
      }))

      await TimeRecordsService.createMultipleRecords(registrosConUsuario)
      
      // Refetch all records
      await fetchRegistros()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    }
  }, [usuarioId, fetchRegistros])

  useEffect(() => {
    fetchRegistros()
  }, [fetchRegistros])

  return {
    registros,
    estadoActual,
    crearRegistro,
    crearRegistrosSimulados,
    isLoading,
    error,
    refetch: fetchRegistros
  }
}