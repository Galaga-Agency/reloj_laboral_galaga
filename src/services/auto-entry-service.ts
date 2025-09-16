import { supabase } from "@/lib/supabase";
import { TimeRecordsService } from "./time-records-service";
import {
  isWeekend,
  startOfDay,
  subDays,
  format,
  addHours,
  addMinutes,
} from "date-fns";

interface UserWorkSettings {
  id: string;
  usuarioId: string;
  horasDiarias: number;
  horasViernes: number; // New field for Friday hours
  horaEntradaMin: string;
  horaEntradaMax: string;
  horaSalidaMin: string;
  horaSalidaMax: string;
  horaSalidaViernesMin: string; // New field for Friday end time
  horaSalidaViernesMax: string; // New field for Friday end time
  horaInicioDescanso: string; // Lunch break start
  horaFinDescanso: string; // Lunch break end
  duracionDescansoMin: number; // Minimum break duration in minutes
  duracionDescansoMax: number; // Maximum break duration in minutes
  diasLibres: string[];
  autoEntryEnabled: boolean;
  includeLunchBreak: boolean; // New field to enable/disable lunch breaks
}

const CANARY_UTC_OFFSET = 1;

export class AutoEntryService {
  static async getUserWorkSettings(
    userId: string
  ): Promise<UserWorkSettings | null> {
    const { data, error } = await supabase
      .from("user_work_settings")
      .select("*")
      .eq("usuario_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return await this.createDefaultWorkSettings(userId);
      }
      throw error;
    }

    return {
      id: data.id,
      usuarioId: data.usuario_id,
      horasDiarias: data.horas_diarias || 8,
      horasViernes: data.horas_viernes || 7,
      horaEntradaMin: data.hora_entrada_min,
      horaEntradaMax: data.hora_entrada_max,
      horaSalidaMin: data.hora_salida_min,
      horaSalidaMax: data.hora_salida_max,
      horaSalidaViernesMin: data.hora_salida_viernes_min || "15:45",
      horaSalidaViernesMax: data.hora_salida_viernes_max || "16:15",
      horaInicioDescanso: data.hora_inicio_descanso || "13:45",
      horaFinDescanso: data.hora_fin_descanso || "15:45",
      duracionDescansoMin: data.duracion_descanso_min || 25,
      duracionDescansoMax: data.duracion_descanso_max || 45,
      diasLibres: data.dias_libres || [],
      autoEntryEnabled: data.auto_entry_enabled,
      includeLunchBreak: data.include_lunch_break ?? true,
    };
  }

  static async createDefaultWorkSettings(
    userId: string
  ): Promise<UserWorkSettings> {
    const { data, error } = await supabase
      .from("user_work_settings")
      .insert({
        usuario_id: userId,
        horas_diarias: 8,
        horas_viernes: 7,
        hora_entrada_min: "08:45",
        hora_entrada_max: "09:15",
        hora_salida_min: "17:00",
        hora_salida_max: "17:30",
        hora_salida_viernes_min: "15:45",
        hora_salida_viernes_max: "16:15",
        hora_inicio_descanso: "13:45",
        hora_fin_descanso: "15:45",
        duracion_descanso_min: 25,
        duracion_descanso_max: 45,
        dias_libres: [],
        auto_entry_enabled: true,
        include_lunch_break: true,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      usuarioId: data.usuario_id,
      horasDiarias: data.horas_diarias,
      horasViernes: data.horas_viernes,
      horaEntradaMin: data.hora_entrada_min,
      horaEntradaMax: data.hora_entrada_max,
      horaSalidaMin: data.hora_salida_min,
      horaSalidaMax: data.hora_salida_max,
      horaSalidaViernesMin: data.hora_salida_viernes_min,
      horaSalidaViernesMax: data.hora_salida_viernes_max,
      horaInicioDescanso: data.hora_inicio_descanso,
      horaFinDescanso: data.hora_fin_descanso,
      duracionDescansoMin: data.duracion_descanso_min,
      duracionDescansoMax: data.duracion_descanso_max,
      diasLibres: data.dias_libres || [],
      autoEntryEnabled: data.auto_entry_enabled,
      includeLunchBreak: data.include_lunch_break,
    };
  }

  static async updateWorkSettings(
    userId: string,
    settings: Partial<UserWorkSettings>
  ): Promise<void> {
    const { error } = await supabase
      .from("user_work_settings")
      .update({
        horas_diarias: settings.horasDiarias,
        horas_viernes: settings.horasViernes,
        hora_entrada_min: settings.horaEntradaMin,
        hora_entrada_max: settings.horaEntradaMax,
        hora_salida_min: settings.horaSalidaMin,
        hora_salida_max: settings.horaSalidaMax,
        hora_salida_viernes_min: settings.horaSalidaViernesMin,
        hora_salida_viernes_max: settings.horaSalidaViernesMax,
        hora_inicio_descanso: settings.horaInicioDescanso,
        hora_fin_descanso: settings.horaFinDescanso,
        duracion_descanso_min: settings.duracionDescansoMin,
        duracion_descanso_max: settings.duracionDescansoMax,
        dias_libres: settings.diasLibres,
        auto_entry_enabled: settings.autoEntryEnabled,
        include_lunch_break: settings.includeLunchBreak,
        updated_at: new Date().toISOString(),
      })
      .eq("usuario_id", userId);

    if (error) throw error;
  }

  static shouldProcessDay(date: Date, settings: UserWorkSettings): boolean {
    if (isWeekend(date)) {
      console.log(`Skipping weekend: ${format(date, "yyyy-MM-dd")}`);
      return false;
    }

    const dateString = format(date, "yyyy-MM-dd");
    if (settings.diasLibres.includes(dateString)) {
      console.log(`Skipping holiday: ${dateString}`);
      return false;
    }

    return true;
  }

  static generateRandomTime(
    minTime: string,
    maxTime: string,
    baseDate: Date
  ): Date {
    const [minHour, minMinute] = minTime.split(":").map(Number);
    const [maxHour, maxMinute] = maxTime.split(":").map(Number);

    const minMinutes = minHour * 60 + minMinute;
    const maxMinutes = maxHour * 60 + maxMinute;

    const randomMinutes =
      Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;
    const hours = Math.floor(randomMinutes / 60);
    const minutes = randomMinutes % 60;

    const result = new Date(baseDate);
    result.setHours(hours, minutes, Math.floor(Math.random() * 60), 0);

    const utcResult = addHours(result, -CANARY_UTC_OFFSET);

    console.log(
      `Generated: ${format(result, "HH:mm:ss")} local → ${format(
        utcResult,
        "HH:mm:ss"
      )} UTC`
    );

    return utcResult;
  }

  static generateLunchBreakTimes(
    settings: UserWorkSettings,
    baseDate: Date
  ): { lunchOutTime: Date; lunchInTime: Date } {
    // Generate random lunch break start time within allowed window
    const lunchOutTime = this.generateRandomTime(
      settings.horaInicioDescanso,
      settings.horaFinDescanso,
      baseDate
    );

    // Generate random break duration between min and max
    const breakDurationMinutes =
      Math.floor(
        Math.random() *
          (settings.duracionDescansoMax - settings.duracionDescansoMin + 1)
      ) + settings.duracionDescansoMin;

    // Calculate lunch return time
    const lunchInTime = addMinutes(lunchOutTime, breakDurationMinutes);

    console.log(
      `Lunch break: OUT at ${format(
        addHours(lunchOutTime, CANARY_UTC_OFFSET),
        "HH:mm:ss"
      )} → IN at ${format(
        addHours(lunchInTime, CANARY_UTC_OFFSET),
        "HH:mm:ss"
      )} (${breakDurationMinutes}min break)`
    );

    return { lunchOutTime, lunchInTime };
  }

  static async processUserAutoEntries(userId: string): Promise<void> {
    console.log(`Processing auto entries for user: ${userId}`);

    const settings = await this.getUserWorkSettings(userId);
    if (!settings || !settings.autoEntryEnabled) {
      console.log(`Auto entry disabled for user: ${userId}`);
      return;
    }

    const yesterday = subDays(startOfDay(new Date()), 1);

    if (!this.shouldProcessDay(yesterday, settings)) {
      console.log(
        `Yesterday should not be processed: ${format(yesterday, "yyyy-MM-dd")}`
      );
      return;
    }

    const existingRecords = await TimeRecordsService.getRecordsByUser(userId);

    const yesterdayRecords = existingRecords.filter((record) => {
      const localRecordTime = addHours(record.fechaEntrada, CANARY_UTC_OFFSET);
      const recordDate = startOfDay(localRecordTime);
      const targetDate = startOfDay(yesterday);
      return recordDate.getTime() === targetDate.getTime();
    });

    if (yesterdayRecords.length === 0) {
      console.log(
        `Creating entries for yesterday: ${format(yesterday, "yyyy-MM-dd")}`
      );
      await this.createDayEntries(userId, yesterday, settings);
    } else {
      console.log(`Yesterday already has ${yesterdayRecords.length} records`);
      // Here you could add logic to validate existing records or fill gaps
    }
  }

  static async createDayEntries(
    userId: string,
    date: Date,
    settings: UserWorkSettings
  ): Promise<void> {
    const dayStart = startOfDay(date);
    const isFriday = date.getDay() === 5;

    console.log(
      `Creating workday entries for ${format(date, "yyyy-MM-dd")} (${
        isFriday ? "Friday" : "Regular day"
      })`
    );

    // Generate morning entry time
    const entryTime = this.generateRandomTime(
      settings.horaEntradaMin,
      settings.horaEntradaMax,
      dayStart
    );

    // Determine end time based on day of week
    const exitTime = isFriday
      ? this.generateRandomTime(
          settings.horaSalidaViernesMin,
          settings.horaSalidaViernesMax,
          dayStart
        )
      : this.generateRandomTime(
          settings.horaSalidaMin,
          settings.horaSalidaMax,
          dayStart
        );

    const records: Array<Omit<any, "id">> = [];

    // 1. Morning ENTRADA
    records.push({
      usuarioId: userId,
      fechaEntrada: entryTime,
      tipoRegistro: "entrada",
      esSimulado: true,
    });

    if (settings.includeLunchBreak) {
      // 2. Generate lunch break times
      const { lunchOutTime, lunchInTime } = this.generateLunchBreakTimes(
        settings,
        dayStart
      );

      // 3. Lunch break SALIDA (temporary exit)
      records.push({
        usuarioId: userId,
        fechaEntrada: entryTime, // Reference to morning entry
        fechaSalida: lunchOutTime,
        tipoRegistro: "salida",
        esSimulado: true,
      });

      // 4. Lunch return ENTRADA
      records.push({
        usuarioId: userId,
        fechaEntrada: lunchInTime,
        tipoRegistro: "entrada",
        esSimulado: true,
      });

      // 5. Final SALIDA (end of day)
      records.push({
        usuarioId: userId,
        fechaEntrada: lunchInTime, // Reference to afternoon entry
        fechaSalida: exitTime,
        tipoRegistro: "salida",
        esSimulado: true,
      });
    } else {
      // Simple workday without lunch break
      records.push({
        usuarioId: userId,
        fechaEntrada: entryTime,
        fechaSalida: exitTime,
        tipoRegistro: "salida",
        esSimulado: true,
      });
    }

    try {
      // Create all records
      await TimeRecordsService.createMultipleRecords(records);

      const workType = isFriday ? "Friday (7h)" : "Regular (8h)";
      const breakType = settings.includeLunchBreak
        ? "with lunch break"
        : "simple";

      console.log(
        `Successfully created ${workType} workday ${breakType} for user ${userId} on ${format(
          date,
          "yyyy-MM-dd"
        )} - ${records.length} records created`
      );
    } catch (error) {
      console.error(
        `Error creating auto entries for user ${userId} on ${format(
          date,
          "yyyy-MM-dd"
        )}:`,
        error
      );
      throw error;
    }
  }

  static async processAllUsersAutoEntries(): Promise<void> {
    const { data: users, error } = await supabase
      .from("usuarios")
      .select("id, nombre")
      .eq("is_active", true); // Only process active users

    if (error) throw error;
    if (!users) return;

    for (const user of users) {
      try {
        await this.processUserAutoEntries(user.id);
      } catch (error) {
        console.error(`Error for user ${user.id}:`, error);
      }
    }
  }
}
