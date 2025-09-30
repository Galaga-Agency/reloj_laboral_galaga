import { TimeRecord } from '@domain/models';
import { formatISO9075 } from 'date-fns';

export interface WorkSegment {
  entrada: Date;
  salida?: Date;
  durationMs: number;
  isClosed: boolean;
}

export interface DailySummary {
  date: string;
  segments: WorkSegment[];
  totalMs: number;
}

const MS_IN_HOUR = 1000 * 60 * 60;

export const groupRecordsByDay = (records: TimeRecord[]): DailySummary[] => {
  const sorted = [...records].sort(
    (a, b) => a.fecha.getTime() - b.fecha.getTime()
  );
  const days = new Map<string, WorkSegment[]>();

  sorted.forEach((record) => {
    const dayKey = record.fecha.toISOString().slice(0, 10);
    if (!days.has(dayKey)) {
      days.set(dayKey, []);
    }

    const segments = days.get(dayKey)!;
    const lastSegment = segments[segments.length - 1];

    if (record.tipoRegistro === 'entrada') {
      segments.push({
        entrada: record.fecha,
        durationMs: 0,
        isClosed: false,
      });
    } else if (lastSegment && !lastSegment.isClosed) {
      lastSegment.salida = record.fecha;
      lastSegment.durationMs = Math.max(
        0,
        record.fecha.getTime() - lastSegment.entrada.getTime()
      );
      lastSegment.isClosed = true;
    }
  });

  return Array.from(days.entries()).map(([date, segments]) => ({
    date,
    segments,
    totalMs: segments.reduce((acc, seg) => acc + seg.durationMs, 0),
  }));
};

export const calculateWorkedMilliseconds = (
  records: TimeRecord[]
): number => {
  return groupRecordsByDay(records).reduce((acc, day) => acc + day.totalMs, 0);
};

export const millisecondsToHours = (ms: number): number => ms / MS_IN_HOUR;

export const formatDuration = (ms: number): string => {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`;
};

export interface TimeStatsSummary {
  totalHours: number;
  totalDays: number;
  avgHoursPerDay: number;
  overtimeHours: number;
}

export const calculateTimeStats = (
  records: TimeRecord[],
  expectedDailyHours = 8
): TimeStatsSummary => {
  if (records.length === 0) {
    return {
      totalHours: 0,
      totalDays: 0,
      avgHoursPerDay: 0,
      overtimeHours: 0,
    };
  }

  const dailySummaries = groupRecordsByDay(records);
  const totalMs = dailySummaries.reduce((acc, day) => acc + day.totalMs, 0);
  const totalHours = millisecondsToHours(totalMs);
  const totalDays = dailySummaries.length;
  const avgHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0;
  const overtimeHours = dailySummaries.reduce((acc, day) => {
    const dayHours = millisecondsToHours(day.totalMs);
    const overtime = Math.max(0, dayHours - expectedDailyHours);
    return acc + overtime;
  }, 0);

  return {
    totalHours,
    totalDays,
    avgHoursPerDay,
    overtimeHours,
  };
};

export const mapRecordToDto = (record: TimeRecord) => ({
  id: record.id,
  usuario_id: record.usuarioId,
  fecha: formatISO9075(record.fecha),
  tipo_registro: record.tipoRegistro,
  es_simulado: record.esSimulado,
  fue_modificado: record.fueModificado,
});
