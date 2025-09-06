// utils/time-records.ts
import { format, differenceInMinutes, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday } from 'date-fns'
import type { RegistroTiempo } from '@/types'
import { FiPlay, FiSquare, FiPause, FiRotateCcw, FiClock } from 'react-icons/fi'

export type FilterPeriod = 'hoy' | 'semana' | 'mes' | 'todo'

export interface WorkStatistics {
  tiempoTotal: string
  diasTrabajados: number
  promedioDiario: string
}

export class TimeRecordsUtils {
  /**
   * Filter records by time period
   */
  static filterByPeriod(registros: RegistroTiempo[], period: FilterPeriod): RegistroTiempo[] {
    if (period === 'todo') return registros

    const ahora = new Date()

    switch (period) {
      case 'hoy':
        return registros.filter(r => isToday(new Date(r.fechaEntrada)))
        
      case 'semana':
        const inicioSemana = startOfWeek(ahora, { weekStartsOn: 1 })
        const finSemana = endOfWeek(ahora, { weekStartsOn: 1 })
        return registros.filter(r => {
          const fecha = new Date(r.fechaEntrada)
          return fecha >= inicioSemana && fecha <= finSemana
        })
        
      case 'mes':
        const inicioMes = startOfMonth(ahora)
        const finMes = endOfMonth(ahora)
        return registros.filter(r => {
          const fecha = new Date(r.fechaEntrada)
          return fecha >= inicioMes && fecha <= finMes
        })
        
      default:
        return registros
    }
  }

  /**
   * Calculate work statistics from time records
   */
  static calculateStatistics(registros: RegistroTiempo[]): WorkStatistics {
    // Group records by day
    const registrosPorDia = new Map<string, RegistroTiempo[]>()
    
    registros.forEach(registro => {
      const dia = format(new Date(registro.fechaEntrada), 'yyyy-MM-dd')
      if (!registrosPorDia.has(dia)) {
        registrosPorDia.set(dia, [])
      }
      registrosPorDia.get(dia)!.push(registro)
    })

    let totalMinutos = 0
    let diasTrabajados = 0

    registrosPorDia.forEach((registrosDia) => {
      const minutosDelDia = this.calculateDayMinutes(registrosDia)
      
      if (minutosDelDia > 0) {
        totalMinutos += minutosDelDia
        diasTrabajados++
      }
    })

    const horasTotal = Math.floor(totalMinutos / 60)
    const minutosRest = totalMinutos % 60
    const promedioDiario = diasTrabajados > 0 ? totalMinutos / diasTrabajados : 0
    const horasPromedio = Math.floor(promedioDiario / 60)
    const minutosPromedio = Math.floor(promedioDiario % 60)

    return {
      tiempoTotal: `${horasTotal}h ${minutosRest}m`,
      diasTrabajados,
      promedioDiario: `${horasPromedio}h ${minutosPromedio}m`
    }
  }

  /**
   * Calculate worked minutes for a single day
   */
  private static calculateDayMinutes(registrosDia: RegistroTiempo[]): number {
    const registrosOrdenados = registrosDia.sort((a, b) => 
      new Date(a.fechaEntrada).getTime() - new Date(b.fechaEntrada).getTime()
    )

    let minutosDelDia = 0
    let entradaActual: Date | null = null
    let enDescanso = false

    registrosOrdenados.forEach(registro => {
      switch (registro.tipoRegistro) {
        case 'entrada':
          if (!entradaActual) {
            entradaActual = new Date(registro.fechaEntrada)
          }
          break
          
        case 'descanso_inicio':
          if (entradaActual && !enDescanso) {
            const minutosTrabajoAntes = differenceInMinutes(new Date(registro.fechaEntrada), entradaActual)
            minutosDelDia += minutosTrabajoAntes
            enDescanso = true
          }
          break
          
        case 'descanso_fin':
          if (enDescanso) {
            entradaActual = new Date(registro.fechaEntrada)
            enDescanso = false
          }
          break
          
        case 'salida':
          if (entradaActual && !enDescanso) {
            const salida = registro.fechaSalida ? new Date(registro.fechaSalida) : new Date(registro.fechaEntrada)
            const minutosTrabajoFinal = differenceInMinutes(salida, entradaActual)
            minutosDelDia += minutosTrabajoFinal
          }
          entradaActual = null
          enDescanso = false
          break
      }
    })

    return minutosDelDia
  }

  /**
   * Get icon for registro type
   */
  static getTypeIcon(tipo: string) {
    switch (tipo) {
      case 'entrada': return <FiPlay className="w-4 h-4 text-activo" />
      case 'salida': return <FiSquare className="w-4 h-4 text-inactivo" />
      case 'descanso_inicio': return <FiPause className="w-4 h-4 text-descanso" />
      case 'descanso_fin': return <FiRotateCcw className="w-4 h-4 text-activo" />
      default: return <FiClock className="w-4 h-4 text-azul-profundo" />
    }
  }

  /**
   * Get display text for registro type
   */
  static getTypeText(tipo: string): string {
    switch (tipo) {
      case 'entrada': return 'Entrada'
      case 'salida': return 'Salida'
      case 'descanso_inicio': return 'Inicio Descanso'
      case 'descanso_fin': return 'Fin Descanso'
      default: return tipo
    }
  }

  /**
   * Filter records by search term
   */
  static filterBySearch(registros: RegistroTiempo[], searchTerm: string): RegistroTiempo[] {
    if (!searchTerm) return registros

    const busquedaLower = searchTerm.toLowerCase()
    return registros.filter(r => 
      format(new Date(r.fechaEntrada), 'PPP', { locale: require('date-fns/locale/es') }).toLowerCase().includes(busquedaLower) ||
      r.tipoRegistro.toLowerCase().includes(busquedaLower)
    )
  }
}