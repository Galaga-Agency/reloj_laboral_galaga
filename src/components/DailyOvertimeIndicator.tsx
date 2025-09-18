import { FiTrendingUp, FiCheckCircle } from "react-icons/fi";

function formatHoursHM(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  const mm = String(m).padStart(2, "0");
  return `${h}:${mm}`;
}

interface DailyOvertimeIndicatorProps {
  totalHours: number; // already includes paid 15min when applicable
  dateStr: string; // "YYYY-MM-DD"
}

export function DailyOvertimeIndicator({
  totalHours,
  dateStr,
}: DailyOvertimeIndicatorProps) {
  const date = new Date(`${dateStr}T00:00:00`);
  const isFriday = date.getDay() === 5; // 0 Sun ... 5 Fri
  const targetHours = isFriday ? 7 : 8;

  const diff = totalHours - targetHours;
  const isOvertime = diff > 0.1;

  if (isOvertime) {
    return (
      <div className="flex items-center gap-1 text-xs text-red-600 px-2 py-1">
        <FiTrendingUp className="w-3 h-3" />
        <span>
          {formatHoursHM(totalHours)}h (+{formatHoursHM(Math.max(0, diff))}h)
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-xs text-green-600 px-2 py-1">
      <FiCheckCircle className="w-3 h-3" />
      <span>
        {formatHoursHM(totalHours)}h
        {diff < -0.1 && ` (${formatHoursHM(Math.abs(diff))}h)`}
      </span>
    </div>
  );
}
