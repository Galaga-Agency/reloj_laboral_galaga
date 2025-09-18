import { supabase } from "@/lib/supabase";
import type { RegistroTiempo, Usuario } from "@/types";

export interface TimeCorrection {
  id: string;
  registroTiempoId: string;
  usuarioId: string;
  adminUserId: string;
  adminUserName: string;
  campoModificado: "fecha" | "tipo_registro" | "multiple";
  valorAnterior: string;
  valorNuevo: string;
  razon: string;
  fechaCorreccion: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface CorrectionRequest {
  recordId: string;
  userId: string;
  adminId: string;
  reason: string;
  changes: {
    fecha?: Date;
    tipoRegistro?: "entrada" | "salida";
  };
  ipAddress?: string;
  userAgent?: string;
}

const CAMPO_MODIFICADO = {
  fecha: "fecha",
  tipoRegistro: "tipo_registro",
} as const;

export class TimeCorrectionsService {
  /**
   * Get corrections for multiple records (for PDF reports)
   */
  static async getCorrectionsForRecords(
    recordIds: string[]
  ): Promise<Map<string, TimeCorrection[]>> {
    if (recordIds.length === 0) return new Map();

    const { data, error } = await supabase
      .from("time_corrections")
      .select("*")
      .in("registro_tiempo_id", recordIds)
      .order("fecha_correccion", { ascending: false });

    if (error) {
      throw new Error(
        `Error fetching corrections for records: ${error.message}`
      );
    }

    const correctionsMap = new Map<string, TimeCorrection[]>();

    (data || []).forEach((correction) => {
      const recordId = correction.registro_tiempo_id;
      if (!correctionsMap.has(recordId)) {
        correctionsMap.set(recordId, []);
      }

      correctionsMap.get(recordId)!.push({
        id: correction.id,
        registroTiempoId: correction.registro_tiempo_id,
        usuarioId: correction.usuario_id,
        adminUserId: correction.admin_user_id,
        adminUserName: correction.admin_user_name,
        campoModificado: correction.campo_modificado,
        valorAnterior: correction.valor_anterior,
        valorNuevo: correction.valor_nuevo,
        razon: correction.razon,
        fechaCorreccion: new Date(correction.fecha_correccion),
        ipAddress: correction.ip_address,
        userAgent: correction.user_agent,
      });
    });

    return correctionsMap;
  }

  /**
   * Apply a time correction to an existing record
   */
  static async applyCorrection(
    request: CorrectionRequest
  ): Promise<{ success: boolean; correctionId?: string; error?: string }> {
    try {
      // 1. Get the current record
      const { data: currentRecord, error: fetchError } = await supabase
        .from("registros_tiempo")
        .select("*")
        .eq("id", request.recordId)
        .single();

      if (fetchError || !currentRecord) {
        return { success: false, error: "Record not found" };
      }

      // 2. Get admin user details
      const { data: adminUser, error: adminError } = await supabase
        .from("usuarios")
        .select("nombre, is_admin")
        .eq("id", request.adminId)
        .single();

      if (adminError || !adminUser?.is_admin) {
        return {
          success: false,
          error: "Admin user not found or insufficient permissions",
        };
      }

      // 3. Prepare the updates and audit records
      const updates: any = {
        updated_at: new Date().toISOString(),
        fue_modificado: true,
        fecha_ultima_modificacion: new Date().toISOString(),
        modificado_por_admin: request.adminId,
      };
      const auditRecords: Omit<TimeCorrection, "id">[] = [];

      // Track each change for audit
      if (request.changes.fecha) {
        const oldValue = new Date(currentRecord.fecha).toISOString();
        const newValue = request.changes.fecha.toISOString();

        updates.fecha = newValue;
        auditRecords.push({
          registroTiempoId: request.recordId,
          usuarioId: request.userId,
          adminUserId: request.adminId,
          adminUserName: adminUser.nombre,
          campoModificado: "fecha",
          valorAnterior: oldValue,
          valorNuevo: newValue,
          razon: request.reason,
          fechaCorreccion: new Date(),
          ipAddress: request.ipAddress,
          userAgent: request.userAgent,
        });
      }

      if (request.changes.tipoRegistro) {
        const oldValue = currentRecord.tipo_registro;
        const newValue = request.changes.tipoRegistro;

        updates.tipo_registro = newValue;
        auditRecords.push({
          registroTiempoId: request.recordId,
          usuarioId: request.userId,
          adminUserId: request.adminId,
          adminUserName: adminUser.nombre,
          campoModificado: "tipo_registro",
          valorAnterior: oldValue,
          valorNuevo: newValue,
          razon: request.reason,
          fechaCorreccion: new Date(),
          ipAddress: request.ipAddress,
          userAgent: request.userAgent,
        });
      }

      if (auditRecords.length === 0) {
        return { success: false, error: "No changes specified" };
      }

      // 4. Update the main record
      console.log("Updating record with:", updates);
      const { error: updateError } = await supabase
        .from("registros_tiempo")
        .update(updates)
        .eq("id", request.recordId);

      if (updateError) {
        console.error("Update error:", updateError);
        return {
          success: false,
          error: `Failed to update record: ${updateError.message}`,
        };
      }

      console.log("Record updated successfully");

      // 5. Insert audit records
      const { data: auditData, error: auditError } = await supabase
        .from("time_corrections")
        .insert(
          auditRecords.map((record) => ({
            registro_tiempo_id: record.registroTiempoId,
            usuario_id: record.usuarioId,
            admin_user_id: record.adminUserId,
            admin_user_name: record.adminUserName,
            campo_modificado: record.campoModificado,
            valor_anterior: record.valorAnterior,
            valor_nuevo: record.valorNuevo,
            razon: record.razon,
            fecha_correccion: record.fechaCorreccion.toISOString(),
            ip_address: record.ipAddress,
            user_agent: record.userAgent,
          }))
        )
        .select()
        .single();

      if (auditError) {
        console.error("Failed to create audit record:", auditError);
      }

      console.log(
        `Time correction applied by ${adminUser.nombre} to record ${request.recordId}: ${request.reason}`
      );

      return {
        success: true,
        correctionId: auditData?.id,
      };
    } catch (error) {
      console.error("Error applying time correction:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get all corrections for a specific record
   */
  static async getRecordCorrections(
    recordId: string
  ): Promise<TimeCorrection[]> {
    const { data, error } = await supabase
      .from("time_corrections")
      .select("*")
      .eq("registro_tiempo_id", recordId)
      .order("fecha_correccion", { ascending: false });

    if (error) {
      throw new Error(`Error fetching corrections: ${error.message}`);
    }

    return (data || []).map((correction) => ({
      id: correction.id,
      registroTiempoId: correction.registro_tiempo_id,
      usuarioId: correction.usuario_id,
      adminUserId: correction.admin_user_id,
      adminUserName: correction.admin_user_name,
      campoModificado: correction.campo_modificado,
      valorAnterior: correction.valor_anterior,
      valorNuevo: correction.valor_nuevo,
      razon: correction.razon,
      fechaCorreccion: new Date(correction.fecha_correccion),
      ipAddress: correction.ip_address,
      userAgent: correction.user_agent,
    }));
  }

  /**
   * Get all corrections for a specific user within a date range
   */
  static async getUserCorrections(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<TimeCorrection[]> {
    let query = supabase
      .from("time_corrections")
      .select("*")
      .eq("usuario_id", userId);

    if (startDate) {
      query = query.gte("fecha_correccion", startDate.toISOString());
    }
    if (endDate) {
      query = query.lte("fecha_correccion", endDate.toISOString());
    }

    query = query.order("fecha_correccion", { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching user corrections: ${error.message}`);
    }

    return (data || []).map((correction) => ({
      id: correction.id,
      registroTiempoId: correction.registro_tiempo_id,
      usuarioId: correction.usuario_id,
      adminUserId: correction.admin_user_id,
      adminUserName: correction.admin_user_name,
      campoModificado: correction.campo_modificado,
      valorAnterior: correction.valor_anterior,
      valorNuevo: correction.valor_nuevo,
      razon: correction.razon,
      fechaCorreccion: new Date(correction.fecha_correccion),
      ipAddress: correction.ip_address,
      userAgent: correction.user_agent,
    }));
  }

  /**
   * Get admin correction statistics
   */
  static async getAdminCorrectionStats(adminId: string): Promise<{
    totalCorrections: number;
    thisMonth: number;
    thisWeek: number;
    recentCorrections: TimeCorrection[];
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

    const { data, error } = await supabase
      .from("time_corrections")
      .select("*")
      .eq("admin_user_id", adminId)
      .order("fecha_correccion", { ascending: false });

    if (error) {
      throw new Error(`Error fetching admin stats: ${error.message}`);
    }

    const corrections = (data || []).map((correction) => ({
      id: correction.id,
      registroTiempoId: correction.registro_tiempo_id,
      usuarioId: correction.usuario_id,
      adminUserId: correction.admin_user_id,
      adminUserName: correction.admin_user_name,
      campoModificado: correction.campo_modificado,
      valorAnterior: correction.valor_anterior,
      valorNuevo: correction.valor_nuevo,
      razon: correction.razon,
      fechaCorreccion: new Date(correction.fecha_correccion),
      ipAddress: correction.ip_address,
      userAgent: correction.user_agent,
    }));

    return {
      totalCorrections: corrections.length,
      thisMonth: corrections.filter((c) => c.fechaCorreccion >= startOfMonth)
        .length,
      thisWeek: corrections.filter((c) => c.fechaCorreccion >= startOfWeek)
        .length,
      recentCorrections: corrections.slice(0, 5),
    };
  }
}
