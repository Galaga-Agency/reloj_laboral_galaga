import { supabase } from "@/lib/supabase";
import { TimeRecordsService } from "./time-records-service";
import {
  isWeekend,
  startOfDay,
  subDays,
  addMinutes,
  format,
  addHours,
} from "date-fns";
import type { RegistroTiempo } from "@/types";

interface UserWorkSettings {
  id: string;
  usuarioId: string;
  horasDiarias: number;
  horaEntradaMin: string;
  horaEntradaMax: string;
  horaSalidaMin: string;
  horaSalidaMax: string;
  diasLibres: string[];
  autoEntryEnabled: boolean;
}

const CANARY_UTC_OFFSET = 1; // Canary Islands is UTC+1

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
      horasDiarias: data.horas_diarias,
      horaEntradaMin: data.hora_entrada_min,
      horaEntradaMax: data.hora_entrada_max,
      horaSalidaMin: data.hora_salida_min,
      horaSalidaMax: data.hora_salida_max,
      diasLibres: data.dias_libres || [],
      autoEntryEnabled: data.auto_entry_enabled,
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
        hora_entrada_min: "08:30",
        hora_entrada_max: "09:30",
        hora_salida_min: "17:30",
        hora_salida_max: "18:30",
        dias_libres: [],
        auto_entry_enabled: true,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      usuarioId: data.usuario_id,
      horasDiarias: data.horas_diarias,
      horaEntradaMin: data.hora_entrada_min,
      horaEntradaMax: data.hora_entrada_max,
      horaSalidaMin: data.hora_salida_min,
      horaSalidaMax: data.hora_salida_max,
      diasLibres: data.dias_libres || [],
      autoEntryEnabled: data.auto_entry_enabled,
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
        hora_entrada_min: settings.horaEntradaMin,
        hora_entrada_max: settings.horaEntradaMax,
        hora_salida_min: settings.horaSalidaMin,
        hora_salida_max: settings.horaSalidaMax,
        dias_libres: settings.diasLibres,
        auto_entry_enabled: settings.autoEntryEnabled,
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

    // Simple fix: use local time minus 2 days to ensure yesterday gets processed
    const cutoffDate = subDays(startOfDay(new Date()), 2);
    if (date >= cutoffDate) {
      console.log(`Skipping recent date: ${format(date, "yyyy-MM-dd")}`);
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

    // Convert to UTC by subtracting the offset
    const utcResult = addHours(result, -CANARY_UTC_OFFSET);

    console.log(
      `Generated: ${format(result, "HH:mm:ss")} local → ${format(
        utcResult,
        "HH:mm:ss"
      )} UTC`
    );

    return utcResult;
  }

  static async processUserAutoEntries(userId: string): Promise<void> {
    console.log(`Processing auto entries for user: ${userId}`);

    const settings = await this.getUserWorkSettings(userId);
    if (!settings || !settings.autoEntryEnabled) {
      console.log(`Auto entry disabled for user: ${userId}`);
      return;
    }

    const existingRecords = await TimeRecordsService.getRecordsByUser(userId);

    // Check last 7 days
    for (let i = 1; i <= 7; i++) {
      const checkDate = subDays(startOfDay(new Date()), i);

      if (!this.shouldProcessDay(checkDate, settings)) continue;

      const dayRecords = existingRecords.filter((record) => {
        // Convert UTC to local for comparison
        const localRecordTime = addHours(
          record.fechaEntrada,
          CANARY_UTC_OFFSET
        );
        const recordDate = startOfDay(localRecordTime);
        const targetDate = startOfDay(checkDate);
        return recordDate.getTime() === targetDate.getTime();
      });

      if (dayRecords.length === 0) {
        console.log(`Creating entries for ${format(checkDate, "yyyy-MM-dd")}`);
        await this.createDayEntries(userId, checkDate, settings);
      }
    }
  }

  static async createDayEntries(
    userId: string,
    date: Date,
    settings: UserWorkSettings
  ): Promise<void> {
    const dayStart = startOfDay(date);

    // Generate entry time (in local time, converted to UTC)
    const entryTime = this.generateRandomTime(
      settings.horaEntradaMin,
      settings.horaEntradaMax,
      dayStart
    );

    // Generate exit time (in local time, converted to UTC)
    const exitTime = this.generateRandomTime(
      settings.horaSalidaMin,
      settings.horaSalidaMax,
      dayStart
    );

    // Calculate total work minutes for break placement
    const totalWorkMinutes =
      (exitTime.getTime() - entryTime.getTime()) / (1000 * 60);

    console.log(
      `Creating entries from ${format(
        addHours(entryTime, CANARY_UTC_OFFSET),
        "HH:mm:ss"
      )} to ${format(
        addHours(exitTime, CANARY_UTC_OFFSET),
        "HH:mm:ss"
      )} local time (${Math.round(totalWorkMinutes)} minutes)`
    );

    // Generate random breaks (1-3 breaks per day)
    const numBreaks = Math.floor(Math.random() * 3) + 1;
    const breaks: { start: Date; end: Date }[] = [];

    for (let i = 0; i < numBreaks; i++) {
      // Random break start time (avoid first 30 min and last 60 min of work)
      const earliestBreakStart = addMinutes(entryTime, 30);
      const latestBreakStart = addMinutes(exitTime, -60);

      if (latestBreakStart > earliestBreakStart) {
        const breakStartMinutes = Math.floor(
          Math.random() *
            ((latestBreakStart.getTime() - earliestBreakStart.getTime()) /
              (1000 * 60))
        );
        const breakStart = addMinutes(earliestBreakStart, breakStartMinutes);

        // Random break duration (15-45 minutes)
        const breakDuration = Math.floor(Math.random() * 30) + 15;
        const breakEnd = addMinutes(breakStart, breakDuration);

        // Make sure break doesn't go past exit time
        if (breakEnd < exitTime) {
          breaks.push({ start: breakStart, end: breakEnd });
        }
      }
    }

    // Sort breaks by start time to avoid overlaps
    breaks.sort((a, b) => a.start.getTime() - b.start.getTime());

    // Remove overlapping breaks
    const validBreaks: { start: Date; end: Date }[] = [];
    for (const currentBreak of breaks) {
      const lastBreak = validBreaks[validBreaks.length - 1];
      if (!lastBreak || currentBreak.start >= addMinutes(lastBreak.end, 15)) {
        validBreaks.push(currentBreak);
      }
    }

    console.log(`Creating ${validBreaks.length} breaks`);

    try {
      // Create all records in chronological order
      const allRecords: {
        time: Date;
        type: "entrada" | "salida";
        isBreak?: boolean;
      }[] = [];

      // Add main entry
      allRecords.push({ time: entryTime, type: "entrada" });

      // Add break records
      validBreaks.forEach((breakItem) => {
        allRecords.push({
          time: breakItem.start,
          type: "salida",
          isBreak: true,
        });
        allRecords.push({
          time: breakItem.end,
          type: "entrada",
          isBreak: true,
        });
      });

      // Add main exit
      allRecords.push({ time: exitTime, type: "salida" });

      // Sort all records by time
      allRecords.sort((a, b) => a.time.getTime() - b.time.getTime());

      // Create records in database (times are already in UTC)
      for (const record of allRecords) {
        if (record.type === "entrada") {
          await TimeRecordsService.createRecord({
            usuarioId: userId,
            fechaEntrada: record.time,
            tipoRegistro: "entrada",
            esSimulado: true,
          });
        } else {
          const originalEntryTime =
            allRecords.find((r) => r.type === "entrada" && !r.isBreak)?.time ||
            entryTime;

          await TimeRecordsService.createRecord({
            usuarioId: userId,
            fechaEntrada: originalEntryTime,
            fechaSalida: record.time,
            tipoRegistro: "salida",
            esSimulado: true,
          });
        }

        console.log(
          `Created ${record.type} at ${format(
            addHours(record.time, CANARY_UTC_OFFSET),
            "HH:mm:ss"
          )} local time${record.isBreak ? " (break)" : ""}`
        );
      }

      console.log(
        `Successfully created realistic workday for user ${userId} on ${format(
          date,
          "yyyy-MM-dd"
        )} with ${validBreaks.length} breaks`
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
      .select("id, nombre");

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
