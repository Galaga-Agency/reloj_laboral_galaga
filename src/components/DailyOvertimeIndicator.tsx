import { FiTrendingUp, FiCheckCircle } from "react-icons/fi";

interface DailyOvertimeIndicatorProps {
  totalHours: number;
}

export function DailyOvertimeIndicator({
  totalHours,
}: DailyOvertimeIndicatorProps) {
  // Add 15 minutes if worked 6+ hours (to match TimeRecordsUtils logic)
  const adjustedHours = totalHours >= 6 ? totalHours + 0.25 : totalHours;

  const targetHours = 8;
  const difference = adjustedHours - targetHours;
  const isOvertime = difference > 0.1;

  if (isOvertime) {
    return (
      <div className="flex items-center gap-1 text-xs text-red-600 px-2 py-1">
        <FiTrendingUp className="w-3 h-3" />
        <span>
          {adjustedHours.toFixed(2)}h (+{difference.toFixed(2)}h)
        </span>
      </div>
    );
  }

  // Everything else is green (normal or undertime)
  return (
    <div className="flex items-center gap-1 text-xs text-green-600 px-2 py-1">
      <FiCheckCircle className="w-3 h-3" />
      <span>
        {adjustedHours.toFixed(2)}h
        {difference < -0.1 && ` (${difference.toFixed(2)}h)`}
      </span>
    </div>
  );
}
