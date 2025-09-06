import type { RegistroTiempo, EstadoTrabajo } from '@/types'
import { differenceInMinutes, isToday } from 'date-fns'

export interface ClockSession {
  isActive: boolean
  startTime: Date | null
  breakStartTime: Date | null
  totalWorkedMinutes: number
  totalBreakMinutes: number
}

export class ClockStateManager {
  /**
   * Determines the current work state based on the latest record
   */
  static getCurrentState(registros: RegistroTiempo[]): EstadoTrabajo {
    if (registros.length === 0) return 'desconectado'
    
    const latestRecord = registros[0] // Assuming sorted by date desc
    
    switch (latestRecord.tipoRegistro) {
      case 'entrada':
        return 'trabajando'
      case 'descanso_inicio':
        return 'descanso'
      case 'descanso_fin':
        return 'trabajando'
      case 'salida':
        return 'desconectado'
      default:
        return 'desconectado'
    }
  }

  /**
   * Gets today's records for a specific user
   */
  static getTodayRecords(registros: RegistroTiempo[]): RegistroTiempo[] {
    return registros.filter(record => isToday(record.fechaEntrada))
  }

  /**
   * Calculates total worked time for today
   */
  static calculateWorkedTime(registros: RegistroTiempo[]): string {
    const todayRecords = this.getTodayRecords(registros)
    if (todayRecords.length === 0) return '00:00'

    let totalMinutes = 0
    let currentSessionStart: Date | null = null
    let isInBreak = false

    // Process records in chronological order (reverse the array since it's desc)
    const chronologicalRecords = [...todayRecords].reverse()

    for (const record of chronologicalRecords) {
      switch (record.tipoRegistro) {
        case 'entrada':
          currentSessionStart = record.fechaEntrada
          isInBreak = false
          break
          
        case 'descanso_inicio':
          if (currentSessionStart && !isInBreak) {
            totalMinutes += differenceInMinutes(record.fechaEntrada, currentSessionStart)
          }
          isInBreak = true
          break
          
        case 'descanso_fin':
          currentSessionStart = record.fechaEntrada
          isInBreak = false
          break
          
        case 'salida':
          if (currentSessionStart && !isInBreak) {
            const endTime = record.fechaSalida || record.fechaEntrada
            totalMinutes += differenceInMinutes(endTime, currentSessionStart)
          }
          currentSessionStart = null
          isInBreak = false
          break
      }
    }

    // If currently working, add time since last session start
    if (currentSessionStart && !isInBreak) {
      totalMinutes += differenceInMinutes(new Date(), currentSessionStart)
    }

    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }

  /**
   * Validates if an action can be performed based on current state
   */
  static canPerformAction(
    action: 'entrada' | 'descanso_inicio' | 'descanso_fin' | 'salida',
    currentState: EstadoTrabajo
  ): { canPerform: boolean; reason?: string } {
    switch (action) {
      case 'entrada':
        if (currentState !== 'desconectado') {
          return { canPerform: false, reason: 'Ya estás trabajando o en descanso' }
        }
        break
        
      case 'descanso_inicio':
        if (currentState !== 'trabajando') {
          return { canPerform: false, reason: 'Debes estar trabajando para iniciar un descanso' }
        }
        break
        
      case 'descanso_fin':
        if (currentState !== 'descanso') {
          return { canPerform: false, reason: 'No estás en descanso' }
        }
        break
        
      case 'salida':
        if (currentState === 'desconectado') {
          return { canPerform: false, reason: 'No estás trabajando' }
        }
        break
    }
    
    return { canPerform: true }
  }

  /**
   * Gets the appropriate button configuration for current state
   */
  static getAvailableActions(currentState: EstadoTrabajo) {
    switch (currentState) {
      case 'desconectado':
        return [
          { action: 'entrada' as const, label: 'Iniciar Jornada', type: 'primary' as const }
        ]
        
      case 'trabajando':
        return [
          { action: 'descanso_inicio' as const, label: 'Iniciar Descanso', type: 'secondary' as const },
          { action: 'salida' as const, label: 'Finalizar Jornada', type: 'danger' as const }
        ]
        
      case 'descanso':
        return [
          { action: 'descanso_fin' as const, label: 'Terminar Descanso', type: 'primary' as const },
          { action: 'salida' as const, label: 'Finalizar Jornada', type: 'danger' as const }
        ]
        
      default:
        return []
    }
  }
}