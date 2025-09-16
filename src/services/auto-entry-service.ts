import { supabase } from "@/lib/supabase";
import { TimeRecordsService } from "./time-records-service";
import { isWeekend, startOfDay, subDays, format, addHours } from "date-fns";

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
        hora_entrada_min: "08:45",
        hora_entrada_max: "09:15",
        hora_salida_min: "17:02",
        hora_salida_max: "17:30",
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
      // Check for missing exit entries
      const entryRecords = yesterdayRecords.filter(
        (r) => r.tipoRegistro === "entrada"
      );
      const exitRecords = yesterdayRecords.filter(
        (r) => r.tipoRegistro === "salida"
      );

      if (entryRecords.length > exitRecords.length) {
        console.log(
          `Found ${entryRecords.length} entries but only ${exitRecords.length} exits. Creating missing exit entries.`
        );

        for (const entryRecord of entryRecords) {
          const hasMatchingExit = exitRecords.some(
            (exit) =>
              Math.abs(
                exit.fechaEntrada.getTime() - entryRecord.fechaEntrada.getTime()
              ) < 1000
          );

          if (!hasMatchingExit) {
            console.log(
              `Creating missing exit for entry at ${entryRecord.fechaEntrada}`
            );
            await this.createMissingExitEntry(
              userId,
              yesterday,
              settings,
              entryRecord
            );
          }
        }
      } else {
        console.log(`Yesterday already has ${yesterdayRecords.length} records`);
      }
    }
  }

  static async createDayEntries(
    userId: string,
    date: Date,
    settings: UserWorkSettings
  ): Promise<void> {
    const dayStart = startOfDay(date);

    const entryTime = this.generateRandomTime(
      settings.horaEntradaMin,
      settings.horaEntradaMax,
      dayStart
    );

    const exitTime = this.generateRandomTime(
      settings.horaSalidaMin,
      settings.horaSalidaMax,
      dayStart
    );

    console.log(
      `Creating simple workday from ${format(
        addHours(entryTime, CANARY_UTC_OFFSET),
        "HH:mm:ss"
      )} to ${format(
        addHours(exitTime, CANARY_UTC_OFFSET),
        "HH:mm:ss"
      )} local time`
    );

    try {
      await TimeRecordsService.createRecord({
        usuarioId: userId,
        fechaEntrada: entryTime,
        tipoRegistro: "entrada",
        esSimulado: true,
      });

      console.log(
        `Created ENTRADA at ${format(
          addHours(entryTime, CANARY_UTC_OFFSET),
          "HH:mm:ss"
        )} local time`
      );

      await TimeRecordsService.createRecord({
        usuarioId: userId,
        fechaEntrada: entryTime,
        fechaSalida: exitTime,
        tipoRegistro: "salida",
        esSimulado: true,
      });

      console.log(
        `Created SALIDA at ${format(
          addHours(exitTime, CANARY_UTC_OFFSET),
          "HH:mm:ss"
        )} local time`
      );

      console.log(
        `Successfully created simple workday for user ${userId} on ${format(
          date,
          "yyyy-MM-dd"
        )}`
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

  static async createMissingExitEntry(
    userId: string,
    date: Date,
    settings: UserWorkSettings,
    entryRecord: any
  ): Promise<void> {
    const dayStart = startOfDay(date);

    const exitTime = this.generateRandomTime(
      settings.horaSalidaMin,
      settings.horaSalidaMax,
      dayStart
    );

    console.log(
      `Creating missing exit at ${format(
        addHours(exitTime, CANARY_UTC_OFFSET),
        "HH:mm:ss"
      )} local time`
    );

    try {
      await TimeRecordsService.createRecord({
        usuarioId: userId,
        fechaEntrada: entryRecord.fechaEntrada,
        fechaSalida: exitTime,
        tipoRegistro: "salida",
        esSimulado: true,
      });

      console.log(
        `Successfully created missing exit entry for user ${userId} on ${format(
          date,
          "yyyy-MM-dd"
        )}`
      );
    } catch (error) {
      console.error(
        `Error creating missing exit entry for user ${userId} on ${format(
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
