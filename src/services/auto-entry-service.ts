import { supabase } from '@/lib/supabase'
import { TimeRecordsService } from './time-records-service'
import { isWeekend, startOfDay, subDays, addMinutes } from 'date-fns'
import type { RegistroTiempo } from '@/types'

interface UserWorkSettings {
  id: string
  usuarioId: string
  horasDiarias: number
  horaEntradaMin: string
  horaEntradaMax: string
  horaSalidaMin: string
  horaSalidaMax: string
  diasLibres: string[]
  autoEntryEnabled: boolean
}

export class AutoEntryService {
  static async getUserWorkSettings(userId: string): Promise<UserWorkSettings | null> {
    const { data, error } = await supabase
      .from('user_work_settings')
      .select('*')
      .eq('usuario_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return await this.createDefaultWorkSettings(userId)
      }
      throw error
    }

    return {
      id: data.id,
      usuarioId: data.usuario_id,
      horasDiarias: data.horas_diarias,
      horaEntradaMin: data.hora_entrada_min,
      horaEntradaMax: data.hora_entrada_max,
      horaSalidaMin: data.hora_salida_min,
      horaSalidaMax: data.hora_salida_max,
      diasLibres: data.dias_libres || [],
      autoEntryEnabled: data.auto_entry_enabled
    }
  }

  static async createDefaultWorkSettings(userId: string): Promise<UserWorkSettings> {
    const { data, error } = await supabase
      .from('user_work_settings')
      .insert({
        usuario_id: userId,
        horas_diarias: 8,
        hora_entrada_min: '08:30',
        hora_entrada_max: '09:30',
        hora_salida_min: '17:30',
        hora_salida_max: '18:30',
        dias_libres: [],
        auto_entry_enabled: true
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      usuarioId: data.usuario_id,
      horasDiarias: data.horas_diarias,
      horaEntradaMin: data.hora_entrada_min,
      horaEntradaMax: data.hora_entrada_max,
      horaSalidaMin: data.hora_salida_min,
      horaSalidaMax: data.hora_salida_max,
      diasLibres: data.dias_libres || [],
      autoEntryEnabled: data.auto_entry_enabled
    }
  }

  static async updateWorkSettings(userId: string, settings: Partial<UserWorkSettings>): Promise<void> {
    const { error } = await supabase
      .from('user_work_settings')
      .update({
        horas_diarias: settings.horasDiarias,
        hora_entrada_min: settings.horaEntradaMin,
        hora_entrada_max: settings.horaEntradaMax,
        hora_salida_min: settings.horaSalidaMin,
        hora_salida_max: settings.horaSalidaMax,
        dias_libres: settings.diasLibres,
        auto_entry_enabled: settings.autoEntryEnabled,
        updated_at: new Date().toISOString()
      })
      .eq('usuario_id', userId)

    if (error) throw error
  }

  static shouldProcessDay(date: Date, settings: UserWorkSettings): boolean {
    if (isWeekend(date)) return false
    
    const dateString = date.toISOString().split('T')[0]
    if (settings.diasLibres.includes(dateString)) return false
    
    if (date >= new Date()) return false
    
    return true
  }

  static generateRandomTime(minTime: string, maxTime: string, baseDate: Date): Date {
    const [minHour, minMinute] = minTime.split(':').map(Number)
    const [maxHour, maxMinute] = maxTime.split(':').map(Number)
    
    const minMinutes = minHour * 60 + minMinute
    const maxMinutes = maxHour * 60 + maxMinute
    
    const randomMinutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes
    const hours = Math.floor(randomMinutes / 60)
    const minutes = randomMinutes % 60
    
    const result = new Date(baseDate)
    result.setHours(hours, minutes, Math.floor(Math.random() * 60), 0)
    
    return result
  }

  static async processUserAutoEntries(userId: string): Promise<void> {
    const settings = await this.getUserWorkSettings(userId)
    if (!settings || !settings.autoEntryEnabled) return

    // Check last 7 days for missing entries
    for (let i = 1; i <= 7; i++) {
      const checkDate = subDays(new Date(), i)
      
      if (!this.shouldProcessDay(checkDate, settings)) continue

      const existingRecords = await TimeRecordsService.getRecordsByUser(userId)
      const dayRecords = existingRecords.filter(record => 
        record.fechaEntrada.toDateString() === checkDate.toDateString()
      )

      if (dayRecords.length === 0) {
        await this.createDayEntries(userId, checkDate, settings)
      }
    }
  }

  static async createDayEntries(userId: string, date: Date, settings: UserWorkSettings): Promise<void> {
    const dayStart = startOfDay(date)
    
    const entryTime = this.generateRandomTime(
      settings.horaEntradaMin, 
      settings.horaEntradaMax, 
      dayStart
    )
    
    const exitTime = this.generateRandomTime(
      settings.horaSalidaMin, 
      settings.horaSalidaMax, 
      dayStart
    )

    // Create entry
    await TimeRecordsService.createRecord({
      usuarioId: userId,
      fechaEntrada: entryTime,
      tipoRegistro: 'entrada',
      esSimulado: true
    })

    // Random break (30% chance)
    if (Math.random() > 0.7) {
      const breakStart = addMinutes(entryTime, Math.floor(Math.random() * 120) + 180)
      const breakEnd = addMinutes(breakStart, Math.floor(Math.random() * 30) + 30)
      
      await TimeRecordsService.createRecord({
        usuarioId: userId,
        fechaEntrada: breakStart,
        tipoRegistro: 'descanso_inicio',
        esSimulado: true
      })

      await TimeRecordsService.createRecord({
        usuarioId: userId,
        fechaEntrada: breakEnd,
        fechaSalida: breakEnd,
        tipoRegistro: 'descanso_fin',
        esSimulado: true
      })
    }

    // Create exit
    await TimeRecordsService.createRecord({
      usuarioId: userId,
      fechaEntrada: exitTime,
      fechaSalida: exitTime,
      tipoRegistro: 'salida',
      esSimulado: true
    })
  }

  // Run this daily via cron job or similar
  static async processAllUsersAutoEntries(): Promise<void> {
    const { data: users, error } = await supabase
      .from('usuarios')
      .select('id')

    if (error) throw error
    if (!users) return

    for (const user of users) {
      try {
        await this.processUserAutoEntries(user.id)
      } catch (error) {
        console.error(`Error processing auto entries for user ${user.id}:`, error)
      }
    }
  }
}