"use client";

import { format, isEqual, addDays, isSameDay } from "date-fns";
import type { TeleworkingSchedule } from "@/types/teleworking";
import type { Absence } from "@/types";
import type { Usuario } from "@/types";
import { FiX } from "react-icons/fi";

interface NotificationCenterProps {
  usuario: Usuario;
  teleworkSchedules: TeleworkingSchedule[];
  absences: Absence[];
  onDismissTelework: (id: string) => void;
  onDismissAbsence: (id: string) => void;
}

interface GroupedTeleworkNotification {
  ids: string[];
  location: "remote" | "office";
  estado: "aprobada" | "rechazada";
  startDate: Date;
  endDate: Date;
}

interface GroupedAbsenceNotification {
  ids: string[];
  estado: "aprobada" | "rechazada";
  startDate: Date;
  endDate: Date;
  razon: string;
}

export function NotificationCenter({
  usuario,
  teleworkSchedules,
  absences,
  onDismissTelework,
  onDismissAbsence,
}: NotificationCenterProps) {
  const teleworkNotifications = teleworkSchedules.filter(
    (t) => t.usuarioId === usuario.id && t.estado !== "pendiente"
  );

  const absenceNotifications = absences.filter(
    (a) => a.usuarioId === usuario.id && a.estado !== "pendiente"
  );

  const groupedTelework = groupConsecutiveTelework(teleworkNotifications);
  const groupedAbsences = groupConsecutiveAbsences(absenceNotifications);

  const totalNotifications = groupedTelework.length + groupedAbsences.length;

  const handleDismissTeleworkGroup = (ids: string[]) => {
    ids.forEach((id) => onDismissTelework(id));
  };

  const handleDismissAbsenceGroup = (ids: string[]) => {
    ids.forEach((id) => onDismissAbsence(id));
  };

  return (
    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
      <h2 className="text-white font-bold mb-3">Notificaciones</h2>

      {totalNotifications === 0 ? (
        <p className="text-white/50 text-sm">No tienes notificaciones</p>
      ) : (
        <div className="space-y-2">
          {groupedTelework.map((group, index) => (
            <div
              key={`telework-${group.ids.join("-")}-${index}`}
              className="flex justify-between items-center bg-white/10 rounded-lg px-3 py-2 text-sm"
            >
              <div className="text-white/80">
                Tu solicitud de{" "}
                <span className="font-medium">
                  {group.location === "remote" ? "teletrabajo" : "oficina"}
                </span>{" "}
                el{" "}
                {isEqual(group.startDate, group.endDate) ? (
                  format(group.startDate, "dd/MM/yyyy")
                ) : (
                  <>
                    {format(group.startDate, "dd/MM/yyyy")} -{" "}
                    {format(group.endDate, "dd/MM/yyyy")}
                  </>
                )}{" "}
                fue{" "}
                <span
                  className={`font-bold ${
                    group.estado === "aprobada"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {group.estado}
                </span>
              </div>
              <button
                onClick={() => handleDismissTeleworkGroup(group.ids)}
                className="text-white/50 hover:text-white transition"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          ))}

          {groupedAbsences.map((group, index) => (
            <div
              key={`absence-${group.ids.join("-")}-${index}`}
              className="flex justify-between items-center bg-white/10 rounded-lg px-3 py-2 text-sm"
            >
              <div className="text-white/80">
                Tu solicitud de <span className="font-medium">ausencia</span> el{" "}
                {isEqual(group.startDate, group.endDate) ? (
                  format(group.startDate, "dd/MM/yyyy")
                ) : (
                  <>
                    {format(group.startDate, "dd/MM/yyyy")} -{" "}
                    {format(group.endDate, "dd/MM/yyyy")}
                  </>
                )}{" "}
                ({group.razon}) fue{" "}
                <span
                  className={`font-bold ${
                    group.estado === "aprobada"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {group.estado}
                </span>
              </div>
              <button
                onClick={() => handleDismissAbsenceGroup(group.ids)}
                className="text-white/50 hover:text-white transition"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function groupConsecutiveTelework(
  schedules: TeleworkingSchedule[]
): GroupedTeleworkNotification[] {
  if (schedules.length === 0) return [];

  const sorted = [...schedules].sort(
    (a, b) => a.fecha.getTime() - b.fecha.getTime()
  );

  const groups: GroupedTeleworkNotification[] = [];
  let currentGroup: GroupedTeleworkNotification | null = null;

  for (const schedule of sorted) {
    const nextDay = currentGroup ? addDays(currentGroup.endDate, 1) : null;
    const scheduleDate = new Date(schedule.fecha);
    scheduleDate.setHours(0, 0, 0, 0);

    if (nextDay) {
      nextDay.setHours(0, 0, 0, 0);
    }

    const canGroup =
      currentGroup &&
      currentGroup.location === schedule.location &&
      currentGroup.estado === schedule.estado &&
      nextDay &&
      nextDay.getTime() === scheduleDate.getTime();

    if (canGroup && currentGroup) {
      currentGroup.ids.push(schedule.id);
      currentGroup.endDate = schedule.fecha;
    } else {
      if (currentGroup) {
        groups.push(currentGroup);
      }
      currentGroup = {
        ids: [schedule.id],
        location: schedule.location,
        estado: schedule.estado as "aprobada" | "rechazada",
        startDate: schedule.fecha,
        endDate: schedule.fecha,
      };
    }
  }

  if (currentGroup) {
    groups.push(currentGroup);
  }

  return groups;
}

function groupConsecutiveAbsences(
  absences: Absence[]
): GroupedAbsenceNotification[] {
  if (absences.length === 0) return [];

  const groups: GroupedAbsenceNotification[] = [];

  for (const absence of absences) {
    if (absence.fechas.length === 0) continue;

    const sortedDates = [...absence.fechas].sort(
      (a, b) => a.getTime() - b.getTime()
    );

    groups.push({
      ids: [absence.id],
      estado: absence.estado as "aprobada" | "rechazada",
      startDate: sortedDates[0],
      endDate: sortedDates[sortedDates.length - 1],
      razon: absence.razon,
    });
  }

  return groups;
}
