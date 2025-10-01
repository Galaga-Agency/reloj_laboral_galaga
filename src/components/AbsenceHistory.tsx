import { useState, useEffect, useMemo } from "react";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  FiCalendar,
  FiClock,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";
import type { Absence, Usuario } from "@/types";
import { AbsenceService } from "@/services/absence-service";
import { DateManager } from "@/utils/date-management";

interface AbsenceHistoryProps {
  usuario: Usuario;
}

export function AbsenceHistory({ usuario }: AbsenceHistoryProps) {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAbsences = async () => {
    setIsLoading(true);
    try {
      const data = await AbsenceService.getAbsencesByUser(
        usuario.id,
        undefined,
        undefined,
        true
      );
      setAbsences(data);
    } catch (error) {
      console.error("Error fetching absences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAbsences();
  }, [usuario.id]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await fetchAbsences();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const pastAbsences = useMemo(() => {
    const today = startOfDay(new Date());
    return absences.filter((absence) =>
      absence.fechas.every((fecha) => isBefore(startOfDay(fecha), today))
    );
  }, [absences]);

  const statistics = useMemo(() => {
    const realAbsences = pastAbsences.filter(
      (a) => a.tipoAusencia !== "dia_libre"
    );
    const scheduledDaysOff = pastAbsences.filter(
      (a) => a.tipoAusencia === "dia_libre"
    );

    const totalMinutes = realAbsences.reduce(
      (sum, a) => sum + a.duracionMinutos,
      0
    );
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    const pending = realAbsences.filter((a) => a.estado === "pendiente").length;
    const approved = realAbsences.filter((a) => a.estado === "aprobada").length;
    const rejected = realAbsences.filter(
      (a) => a.estado === "rechazada"
    ).length;

    return {
      totalAbsences: realAbsences.length,
      totalHours,
      pending,
      approved,
      rejected,
      scheduledDaysOff: scheduledDaysOff.length,
    };
  }, [pastAbsences]);

  const getStatusBadge = (estado: string) => {
    const styles = {
      pendiente: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      aprobada: "bg-green-500/20 text-green-400 border-green-500/30",
      rechazada: "bg-red-500/20 text-red-400 border-red-500/30",
      programada: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    };

    const labels = {
      pendiente: "Pendiente",
      aprobada: "Aprobada",
      rechazada: "Rechazada",
      programada: "Programada",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${
          styles[estado as keyof typeof styles] || styles.pendiente
        }`}
      >
        {labels[estado as keyof typeof labels] || estado}
      </span>
    );
  };

  const getAbsenceTypeLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      tardanza: "Tardanza",
      salida_temprana: "Salida Temprana",
      ausencia_parcial: "Ausencia Parcial",
      ausencia_completa: "Día Completo",
      permiso_medico: "Permiso Médico",
      permiso_personal: "Permiso Personal",
      dia_libre: "Día Libre",
    };
    return labels[tipo] || tipo;
  };

  const sortedAbsences = useMemo(() => {
    return pastAbsences.sort((a, b) => {
      const aLatest = Math.max(...a.fechas.map((d) => d.getTime()));
      const bLatest = Math.max(...b.fechas.map((d) => d.getTime()));
      return bLatest - aLatest;
    });
  }, [pastAbsences]);

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/10">
      <div className="flex items-center justify-between pb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Historial de Ausencias
          </h2>
          <p className="text-sm text-white/60 mt-1">
            Todas tus ausencias y días libres registrados
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <FiRefreshCw
            className={`w-5 h-5 text-white transition-transform duration-500 ${
              isRefreshing ? "animate-spin" : ""
            }`}
          />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-6">
        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-teal/20">
          <div className="flex items-center gap-2 text-sm text-white font-medium pb-2">
            <FiCalendar className="w-4 h-4" />
            Total Ausencias
          </div>
          <div className="text-2xl font-bold text-white">
            {statistics.totalAbsences}
          </div>
          <div className="text-sm text-white/60 mt-1">
            {statistics.totalHours}h perdidas
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-teal/20">
          <div className="flex items-center gap-2 text-sm text-white font-medium pb-2">
            <FiClock className="w-4 h-4" />
            Días Libres
          </div>
          <div className="text-2xl font-bold text-white">
            {statistics.scheduledDaysOff}
          </div>
          <div className="text-sm text-white/60 mt-1">programados</div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-teal/20 col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 text-sm text-white font-medium pb-2">
            <FiAlertCircle className="w-4 h-4" />
            Estado
          </div>
          <div className="flex gap-2 text-sm text-white mt-2">
            <span className="text-yellow-400">
              {statistics.pending} pendientes
            </span>
            <span className="text-white/40">•</span>
            <span className="text-green-400">
              {statistics.approved} aprobadas
            </span>
            <span className="text-white/40">•</span>
            <span className="text-red-400">
              {statistics.rejected} rechazadas
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8 flex flex-col items-center">
            <FiRefreshCw className="w-8 h-8 mx-auto animate-spin text-white/50" />
            <p className="text-sm text-white/60 pt-2">Cargando ausencias...</p>
          </div>
        ) : sortedAbsences.length === 0 ? (
          <div className="text-center py-8 text-white/60 flex flex-col items-center">
            <FiCalendar className="w-12 h-12 mx-auto opacity-30 pb-2" />
            <p className="text-sm">No hay ausencias registradas</p>
          </div>
        ) : (
          sortedAbsences.map((absence) => {
            const dateStrings = absence.fechas.map((f) =>
              format(f, "yyyy-MM-dd")
            );
            const dateRanges = DateManager.groupIntoRanges(dateStrings);

            return (
              <div
                key={absence.id}
                className="group p-4 rounded-lg border transition-colors duration-200 bg-white/5 border-white/10 hover:bg-white/10"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-white">
                        {getAbsenceTypeLabel(absence.tipoAusencia)}
                      </span>
                      {getStatusBadge(absence.estado)}
                    </div>

                    <div className="text-sm text-white/70 space-y-1">
                      {dateRanges.map((range, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <FiCalendar className="w-3 h-3" />
                          {range.count === 1 ? (
                            <span>
                              {format(
                                parseISO(range.start),
                                "EEEE, dd 'de' MMMM yyyy",
                                {
                                  locale: es,
                                }
                              )}
                            </span>
                          ) : (
                            <span>
                              {format(parseISO(range.start), "d 'de' MMMM", {
                                locale: es,
                              })}{" "}
                              -{" "}
                              {format(
                                parseISO(range.end),
                                "d 'de' MMMM 'de' yyyy",
                                {
                                  locale: es,
                                }
                              )}{" "}
                              ({range.count} días)
                            </span>
                          )}
                        </div>
                      ))}

                      {absence.tipoAusencia !== "dia_libre" && (
                        <div className="flex items-center gap-2">
                          <FiClock className="w-3 h-3" />
                          <span>
                            {absence.horaInicio} - {absence.horaFin} (
                            {Math.floor(absence.duracionMinutos / 60)}h{" "}
                            {absence.duracionMinutos % 60}m)
                          </span>
                        </div>
                      )}

                      <div className="text-white/50 text-xs pt-1">
                        {absence.razon}
                      </div>

                      {absence.comentarios && (
                        <div className="text-white/40 text-xs italic">
                          {absence.comentarios}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
