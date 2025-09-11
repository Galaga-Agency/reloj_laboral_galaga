import { supabase } from "@/lib/supabase";
import type { RegistroTiempo } from "@/types";

export class TimeRecordsService {
  static async createRecord(
    record: Omit<RegistroTiempo, "id">
  ): Promise<RegistroTiempo> {
    const { data, error } = await supabase
      .from("registros_tiempo")
      .insert({
        usuario_id: record.usuarioId,
        fecha_entrada: record.fechaEntrada.toISOString(),
        fecha_salida: record.fechaSalida?.toISOString() || null,
        tipo_registro: record.tipoRegistro,
        es_simulado: record.esSimulado || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating time record: ${error.message}`);
    }

    return {
      id: data.id,
      usuarioId: data.usuario_id,
      fechaEntrada: new Date(data.fecha_entrada),
      fechaSalida: data.fecha_salida ? new Date(data.fecha_salida) : undefined,
      tipoRegistro: data.tipo_registro,
      esSimulado: data.es_simulado,
    };
  }

  static async getRecordsByUser(userId: string): Promise<RegistroTiempo[]> {
    const { data, error } = await supabase
      .from("registros_tiempo")
      .select("*")
      .eq("usuario_id", userId)
      .order("fecha_entrada", { ascending: false });

    if (error) {
      throw new Error(`Error fetching time records: ${error.message}`);
    }

    if (!data) return [];

    return data.map((record: any) => ({
      id: record.id,
      usuarioId: record.usuario_id,
      fechaEntrada: new Date(record.fecha_entrada),
      fechaSalida: record.fecha_salida
        ? new Date(record.fecha_salida)
        : undefined,
      tipoRegistro: record.tipo_registro,
      esSimulado: record.es_simulado,
    }));
  }

  static async createMultipleRecords(
    records: Omit<RegistroTiempo, "id">[]
  ): Promise<RegistroTiempo[]> {
    const recordsToInsert = records.map((record) => ({
      usuario_id: record.usuarioId,
      fecha_entrada: record.fechaEntrada.toISOString(),
      fecha_salida: record.fechaSalida?.toISOString() || null,
      tipo_registro: record.tipoRegistro,
      es_simulado: record.esSimulado || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("registros_tiempo")
      .insert(recordsToInsert as any)
      .select();

    if (error) {
      throw new Error(`Error creating multiple time records: ${error.message}`);
    }

    if (!data) return [];

    return data.map((record: any) => ({
      id: record.id,
      usuarioId: record.usuario_id,
      fechaEntrada: new Date(record.fecha_entrada),
      fechaSalida: record.fecha_salida
        ? new Date(record.fecha_salida)
        : undefined,
      tipoRegistro: record.tipo_registro,
      esSimulado: record.es_simulado,
    }));
  }

  static async getLatestRecordByUser(
    userId: string
  ): Promise<RegistroTiempo | null> {
    const { data, error } = await supabase
      .from("registros_tiempo")
      .select("*")
      .eq("usuario_id", userId)
      .order("fecha_entrada", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Error fetching latest record: ${error.message}`);
    }

    if (!data) return null;

    return {
      id: data.id,
      usuarioId: data.usuario_id,
      fechaEntrada: new Date(data.fecha_entrada),
      fechaSalida: data.fecha_salida ? new Date(data.fecha_salida) : undefined,
      tipoRegistro: data.tipo_registro,
      esSimulado: data.es_simulado,
    };
  }

  static async getRecordsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<RegistroTiempo[]> {
    // Get ALL records for the user and filter in memory to handle both fecha_entrada and fecha_salida
    const { data, error } = await supabase
      .from("registros_tiempo")
      .select("*")
      .eq("usuario_id", userId)
      .order("fecha_entrada", { ascending: false });

    if (error) {
      throw new Error(
        `Error fetching time records by date range: ${error.message}`
      );
    }

    if (!data) return [];

    const allRecords = data.map((record: any) => ({
      id: record.id,
      usuarioId: record.usuario_id,
      fechaEntrada: new Date(record.fecha_entrada),
      fechaSalida: record.fecha_salida
        ? new Date(record.fecha_salida)
        : undefined,
      tipoRegistro: record.tipo_registro,
      esSimulado: record.es_simulado,
    }));

    // Filter records where the ACTION happened within the date range
    return allRecords.filter((record) => {
      const actionDate =
        record.tipoRegistro === "salida" && record.fechaSalida
          ? record.fechaSalida
          : record.fechaEntrada;

      return actionDate >= startDate && actionDate <= endDate;
    });
  }
}
