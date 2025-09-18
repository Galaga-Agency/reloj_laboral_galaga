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
        fecha: record.fecha.toISOString(),
        tipo_registro: record.tipoRegistro,
        es_simulado: record.esSimulado || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating time record: ${error.message}`);
    }

    return {
      id: data.id,
      usuarioId: data.usuario_id,
      fecha: new Date(data.fecha),
      tipoRegistro: data.tipo_registro,
      esSimulado: data.es_simulado,
      fueModificado: data.fue_modificado,
      fechaUltimaModificacion: data.fecha_ultima_modificacion
        ? new Date(data.fecha_ultima_modificacion)
        : undefined,
      modificadoPorAdmin: data.modificado_por_admin,
    };
  }

  static async getRecordsByUser(userId: string): Promise<RegistroTiempo[]> {
    const { data, error } = await supabase
      .from("registros_tiempo")
      .select("*")
      .eq("usuario_id", userId)
      .order("fecha", { ascending: false });

    if (error) {
      throw new Error(`Error fetching time records: ${error.message}`);
    }

    if (!data) return [];

    return data.map((record: any) => ({
      id: record.id,
      usuarioId: record.usuario_id,
      fecha: new Date(record.fecha),
      tipoRegistro: record.tipo_registro,
      esSimulado: record.es_simulado,
      fueModificado: record.fue_modificado,
      fechaUltimaModificacion: record.fecha_ultima_modificacion
        ? new Date(record.fecha_ultima_modificacion)
        : undefined,
      modificadoPorAdmin: record.modificado_por_admin,
    }));
  }

  static async createMultipleRecords(
    records: Omit<RegistroTiempo, "id">[]
  ): Promise<RegistroTiempo[]> {
    const recordsToInsert = records.map((record) => ({
      usuario_id: record.usuarioId,
      fecha: record.fecha.toISOString(),
      tipo_registro: record.tipoRegistro,
      es_simulado: record.esSimulado || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("registros_tiempo")
      .insert(recordsToInsert)
      .select();

    if (error) {
      throw new Error(`Error creating multiple time records: ${error.message}`);
    }

    if (!data) return [];

    return data.map((record: any) => ({
      id: record.id,
      usuarioId: record.usuario_id,
      fecha: new Date(record.fecha),
      tipoRegistro: record.tipo_registro,
      esSimulado: record.es_simulado,
      fueModificado: record.fue_modificado,
      fechaUltimaModificacion: record.fecha_ultima_modificacion
        ? new Date(record.fecha_ultima_modificacion)
        : undefined,
      modificadoPorAdmin: record.modificado_por_admin,
    }));
  }

  static async getLatestRecordByUser(
    userId: string
  ): Promise<RegistroTiempo | null> {
    const { data, error } = await supabase
      .from("registros_tiempo")
      .select("*")
      .eq("usuario_id", userId)
      .order("fecha", { ascending: false })
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
      fecha: new Date(data.fecha),
      tipoRegistro: data.tipo_registro,
      esSimulado: data.es_simulado,
      fueModificado: data.fue_modificado,
      fechaUltimaModificacion: data.fecha_ultima_modificacion
        ? new Date(data.fecha_ultima_modificacion)
        : undefined,
      modificadoPorAdmin: data.modificado_por_admin,
    };
  }

  static async getRecordsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<RegistroTiempo[]> {
    const { data, error } = await supabase
      .from("registros_tiempo")
      .select("*")
      .eq("usuario_id", userId)
      .gte("fecha", startDate.toISOString())
      .lte("fecha", endDate.toISOString())
      .order("fecha", { ascending: false });

    if (error) {
      throw new Error(
        `Error fetching time records by date range: ${error.message}`
      );
    }

    if (!data) return [];

    return data.map((record: any) => ({
      id: record.id,
      usuarioId: record.usuario_id,
      fecha: new Date(record.fecha),
      tipoRegistro: record.tipo_registro,
      esSimulado: record.es_simulado,
      fueModificado: record.fue_modificado,
      fechaUltimaModificacion: record.fecha_ultima_modificacion
        ? new Date(record.fecha_ultima_modificacion)
        : undefined,
      modificadoPorAdmin: record.modificado_por_admin,
    }));
  }
}
