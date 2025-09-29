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
  estado?: "pendiente" | "aprobado" | "rechazado";
  revisadoPor?: string;
  revisadoPorNombre?: string;
  fechaRevision?: Date;
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

export interface UserChangeRequest {
  recordId: string;
  userId: string;
  userName: string;
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
  static async getCorrectionsForRecords(
    recordIds: string[]
  ): Promise<Map<string, TimeCorrection[]>> {
    if (recordIds.length === 0) return new Map();

    const { data, error } = await supabase
      .from("time_corrections")
      .select("*")
      .in("registro_tiempo_id", recordIds)
      .in("estado", ["aprobado", "null"])
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
        estado: correction.estado,
        revisadoPor: correction.revisado_por,
        revisadoPorNombre: correction.revisado_por_nombre,
        fechaRevision: correction.fecha_revision
          ? new Date(correction.fecha_revision)
          : undefined,
        ipAddress: correction.ip_address,
        userAgent: correction.user_agent,
      });
    });

    return correctionsMap;
  }

  static async applyCorrection(
    request: CorrectionRequest
  ): Promise<{ success: boolean; correctionId?: string; error?: string }> {
    try {
      const { data: currentRecord, error: fetchError } = await supabase
        .from("registros_tiempo")
        .select("*")
        .eq("id", request.recordId)
        .single();

      if (fetchError || !currentRecord) {
        return { success: false, error: "Record not found" };
      }

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

      const updates: any = {
        updated_at: new Date().toISOString(),
        fue_modificado: true,
        fecha_ultima_modificacion: new Date().toISOString(),
        modificado_por_admin: request.adminId,
      };
      const auditRecords: any[] = [];

      if (request.changes.fecha) {
        const oldValue = new Date(currentRecord.fecha).toISOString();
        const newValue = request.changes.fecha.toISOString();

        updates.fecha = newValue;
        auditRecords.push({
          registro_tiempo_id: request.recordId,
          usuario_id: request.userId,
          admin_user_id: request.adminId,
          admin_user_name: adminUser.nombre,
          campo_modificado: "fecha",
          valor_anterior: oldValue,
          valor_nuevo: newValue,
          razon: request.reason,
          fecha_correccion: new Date().toISOString(),
          ip_address: request.ipAddress,
          user_agent: request.userAgent,
          estado: "aprobado",
          revisado_por: request.adminId,
          revisado_por_nombre: adminUser.nombre,
          fecha_revision: new Date().toISOString(),
        });
      }

      if (request.changes.tipoRegistro) {
        const oldValue = currentRecord.tipo_registro;
        const newValue = request.changes.tipoRegistro;

        updates.tipo_registro = newValue;
        auditRecords.push({
          registro_tiempo_id: request.recordId,
          usuario_id: request.userId,
          admin_user_id: request.adminId,
          admin_user_name: adminUser.nombre,
          campo_modificado: "tipo_registro",
          valor_anterior: oldValue,
          valor_nuevo: newValue,
          razon: request.reason,
          fecha_correccion: new Date().toISOString(),
          ip_address: request.ipAddress,
          user_agent: request.userAgent,
          estado: "aprobado",
          revisado_por: request.adminId,
          revisado_por_nombre: adminUser.nombre,
          fecha_revision: new Date().toISOString(),
        });
      }

      if (auditRecords.length === 0) {
        return { success: false, error: "No changes specified" };
      }

      const { error: updateError } = await supabase
        .from("registros_tiempo")
        .update(updates)
        .eq("id", request.recordId);

      if (updateError) {
        return {
          success: false,
          error: `Failed to update record: ${updateError.message}`,
        };
      }

      const { data: auditData, error: auditError } = await supabase
        .from("time_corrections")
        .insert(auditRecords)
        .select();

      if (auditError) {
        console.error("Failed to create audit record:", auditError);
      }

      return {
        success: true,
        correctionId: auditData?.[0]?.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async createUserChangeRequest(
    request: UserChangeRequest
  ): Promise<{ success: boolean; changeId?: string; error?: string }> {
    try {
      const { data: currentRecord, error: fetchError } = await supabase
        .from("registros_tiempo")
        .select("*")
        .eq("id", request.recordId)
        .single();

      if (fetchError || !currentRecord) {
        return { success: false, error: "Record not found" };
      }

      const changeRecords: any[] = [];

      if (request.changes.fecha) {
        const oldValue = new Date(currentRecord.fecha).toISOString();
        const newValue = request.changes.fecha.toISOString();

        changeRecords.push({
          registro_tiempo_id: request.recordId,
          usuario_id: request.userId,
          admin_user_id: request.userId,
          admin_user_name: request.userName,
          campo_modificado: "fecha",
          valor_anterior: oldValue,
          valor_nuevo: newValue,
          razon: request.reason,
          fecha_correccion: new Date().toISOString(),
          ip_address: request.ipAddress,
          user_agent: request.userAgent,
          estado: "pendiente",
        });
      }

      if (request.changes.tipoRegistro) {
        const oldValue = currentRecord.tipo_registro;
        const newValue = request.changes.tipoRegistro;

        changeRecords.push({
          registro_tiempo_id: request.recordId,
          usuario_id: request.userId,
          admin_user_id: request.userId,
          admin_user_name: request.userName,
          campo_modificado: "tipo_registro",
          valor_anterior: oldValue,
          valor_nuevo: newValue,
          razon: request.reason,
          fecha_correccion: new Date().toISOString(),
          ip_address: request.ipAddress,
          user_agent: request.userAgent,
          estado: "pendiente",
        });
      }

      if (changeRecords.length === 0) {
        return { success: false, error: "No changes specified" };
      }

      const { data, error: insertError } = await supabase
        .from("time_corrections")
        .insert(changeRecords)
        .select();

      if (insertError) {
        return {
          success: false,
          error: `Failed to create change request: ${insertError.message}`,
        };
      }

      return {
        success: true,
        changeId: data?.[0]?.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async getPendingChanges(): Promise<TimeCorrection[]> {
    const { data, error } = await supabase
      .from("time_corrections")
      .select("*")
      .eq("estado", "pendiente")
      .order("fecha_correccion", { ascending: false });

    if (error) {
      throw new Error(`Error fetching pending changes: ${error.message}`);
    }

    return (data || []).map((change) => ({
      id: change.id,
      registroTiempoId: change.registro_tiempo_id,
      usuarioId: change.usuario_id,
      adminUserId: change.admin_user_id,
      adminUserName: change.admin_user_name,
      campoModificado: change.campo_modificado,
      valorAnterior: change.valor_anterior,
      valorNuevo: change.valor_nuevo,
      razon: change.razon,
      estado: change.estado,
      revisadoPor: change.revisado_por,
      revisadoPorNombre: change.revisado_por_nombre,
      fechaRevision: change.fecha_revision
        ? new Date(change.fecha_revision)
        : undefined,
      fechaCorreccion: new Date(change.fecha_correccion),
      ipAddress: change.ip_address,
      userAgent: change.user_agent,
    }));
  }

  static async getPendingChangesCount(): Promise<number> {
    const { count, error } = await supabase
      .from("time_corrections")
      .select("*", { count: "exact", head: true })
      .eq("estado", "pendiente");

    if (error) {
      console.error("Error fetching pending count:", error);
      return 0;
    }

    return count || 0;
  }

  static async approveChange(
    changeId: string,
    adminId: string,
    adminName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: change, error: fetchError } = await supabase
        .from("time_corrections")
        .select("*")
        .eq("id", changeId)
        .single();

      if (fetchError || !change) {
        return { success: false, error: "Change request not found" };
      }

      const updates: any = {
        updated_at: new Date().toISOString(),
        fue_modificado: true,
        fecha_ultima_modificacion: new Date().toISOString(),
        editado_por_usuario: change.usuario_id,
        validado_por_admin: adminId,
      };

      if (change.campo_modificado === "fecha") {
        updates.fecha = change.valor_nuevo;
      } else if (change.campo_modificado === "tipo_registro") {
        updates.tipo_registro = change.valor_nuevo;
      }

      const { error: updateError } = await supabase
        .from("registros_tiempo")
        .update(updates)
        .eq("id", change.registro_tiempo_id);

      if (updateError) {
        return {
          success: false,
          error: `Failed to update record: ${updateError.message}`,
        };
      }

      const { error: changeUpdateError } = await supabase
        .from("time_corrections")
        .update({
          estado: "aprobado",
          revisado_por: adminId,
          revisado_por_nombre: adminName,
          fecha_revision: new Date().toISOString(),
        })
        .eq("id", changeId);

      if (changeUpdateError) {
        return {
          success: false,
          error: `Failed to update change status: ${changeUpdateError.message}`,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async rejectChange(
    changeId: string,
    adminId: string,
    adminName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("time_corrections")
        .update({
          estado: "rechazado",
          revisado_por: adminId,
          revisado_por_nombre: adminName,
          fecha_revision: new Date().toISOString(),
        })
        .eq("id", changeId);

      if (error) {
        return {
          success: false,
          error: `Failed to reject change: ${error.message}`,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

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
      estado: correction.estado,
      revisadoPor: correction.revisado_por,
      revisadoPorNombre: correction.revisado_por_nombre,
      fechaRevision: correction.fecha_revision
        ? new Date(correction.fecha_revision)
        : undefined,
      ipAddress: correction.ip_address,
      userAgent: correction.user_agent,
    }));
  }

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
      estado: correction.estado,
      revisadoPor: correction.revisado_por,
      revisadoPorNombre: correction.revisado_por_nombre,
      fechaRevision: correction.fecha_revision
        ? new Date(correction.fecha_revision)
        : undefined,
      ipAddress: correction.ip_address,
      userAgent: correction.user_agent,
    }));
  }

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
      estado: correction.estado,
      revisadoPor: correction.revisado_por,
      revisadoPorNombre: correction.revisado_por_nombre,
      fechaRevision: correction.fecha_revision
        ? new Date(correction.fecha_revision)
        : undefined,
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
