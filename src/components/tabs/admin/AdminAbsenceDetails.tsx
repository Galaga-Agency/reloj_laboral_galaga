import { useState, useEffect } from "react";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { FiClock, FiUser, FiMessageSquare } from "react-icons/fi";
import { useAbsences } from "@/contexts/AbsenceContext";
import { AbsenceStatisticsCalculator } from "@/utils/absence-statistics";
import { AdminService } from "@/services/admin-service";
import type { Usuario } from "@/types";

interface AdminAbsenceDetailsProps {
  currentAdmin: Usuario;
  selectedDate: Date | null;
}

export function AdminAbsenceDetails({
  currentAdmin,
  selectedDate,
}: AdminAbsenceDetailsProps) {
  const { absences } = useAbsences();
  const [users, setUsers] = useState<Usuario[]>([]);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await AdminService.getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const getUserName = (userId: string): string => {
    const user = users.find((u) => u.id === userId);
    return user ? user.nombre : userId;
  };

  const selectedAbsences = selectedDate
    ? absences.filter((a) =>
        a.fechas.some((f) => isSameDay(new Date(f), selectedDate))
      )
    : [];

  if (!selectedDate) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 flex items-center justify-center">
        <p className="text-white/60 text-center">
          Selecciona una fecha en el calendario para ver los detalles de las
          ausencias
        </p>
      </div>
    );
  }

  if (selectedAbsences.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
        <h3 className="text-xl font-bold text-white mb-4">
          {format(selectedDate, "EEEE, dd 'de' MMMM yyyy", { locale: es })}
        </h3>
        <p className="text-white/60">
          No hay ausencias reportadas para esta fecha
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
      <h3 className="text-xl font-bold text-white mb-6">
        {format(selectedDate, "EEEE, dd 'de' MMMM yyyy", { locale: es })}
      </h3>

      {message && (
        <div
          className={`p-3 rounded-lg mb-4 ${
            message.type === "success"
              ? "bg-green-500/20 border border-green-500/30 text-green-300"
              : "bg-red-500/20 border border-red-500/30 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto">
        {selectedAbsences.map((absence) => {
          return (
            <div
              key={absence.id}
              className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FiUser className="text-white w-5 h-5" />
                  <div>
                    <p className="text-white font-semibold">
                      {getUserName(absence.usuarioId)}
                    </p>
                    <p className="text-white/60 text-sm">
                      {AbsenceStatisticsCalculator.getTypeLabel(
                        absence.tipoAusencia
                      )}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    absence.estado === "pendiente"
                      ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                      : absence.estado === "aprobada"
                      ? "bg-green-500/20 text-green-300 border-green-500/30"
                      : "bg-red-500/20 text-red-300 border-red-500/30"
                  }`}
                >
                  {absence.estado === "pendiente"
                    ? "Pendiente"
                    : absence.estado === "aprobada"
                    ? "Aprobada"
                    : "Rechazada"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <FiClock className="text-white/60 w-4 h-4" />
                  <div>
                    <p className="text-white/60 text-xs">Hora Inicio</p>
                    <p className="text-white font-medium">
                      {absence.horaInicio}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FiClock className="text-white/60 w-4 h-4" />
                  <div>
                    <p className="text-white/60 text-xs">Hora Fin</p>
                    <p className="text-white font-medium">{absence.horaFin}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-white/60 text-xs mb-1">Motivo</p>
                <p className="text-white text-sm">{absence.razon}</p>
              </div>

              {absence.comentarios && (
                <div className="mb-4 p-3 bg-white/5 rounded-lg">
                  <div className="flex items-start gap-2">
                    <FiMessageSquare className="text-white/60 w-4 h-4 mt-0.5" />
                    <div>
                      <p className="text-white/60 text-xs mb-1">Comentarios</p>
                      <p className="text-white/80 text-sm">
                        {absence.comentarios}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
