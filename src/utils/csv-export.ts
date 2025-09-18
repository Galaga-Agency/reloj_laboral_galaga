import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DayPairs } from "@/utils/time-records";

function escapeCsv(v: string) {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function hhmmss(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(ss)}`;
}

export function generateEmployeeCsv(
  days: DayPairs[],
  employeeName: string,
  employeeEmail: string,
  rangeLabel: string
): string {
  const header = [
    "Empleado",
    "Email",
    "Rango",
    "Fecha",
    "Entrada",
    "Salida",
    "Duración (seg)",
    "Duración (hh:mm:ss)",
    "Estado",
  ].join(",");

  const rows: string[] = [];

  for (const day of days) {
    for (const p of day.pairs) {
      const fecha = format(new Date(day.dateKey), "yyyy-MM-dd", { locale: es });
      const entrada = format(p.entrada, "yyyy-MM-dd HH:mm", { locale: es });
      const salida = p.salida
        ? format(p.salida, "yyyy-MM-dd HH:mm", { locale: es })
        : "";
      const seconds = p.seconds ?? 0;
      const estado = p.salida ? "Cerrado" : "Abierto (sin salida)";

      rows.push(
        [
          escapeCsv(employeeName),
          escapeCsv(employeeEmail || ""),
          escapeCsv(rangeLabel),
          fecha,
          entrada,
          salida,
          String(seconds),
          hhmmss(seconds),
          estado,
        ].join(",")
      );
    }
  }

  return [header, ...rows].join("\n");
}

export function downloadCsv(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
