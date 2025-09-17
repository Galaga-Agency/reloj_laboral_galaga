import { OvertimeData } from "@/types";

interface OvertimeAlertProps {
  overtimeData: OvertimeData | null;
}

export function OvertimeAlert({ overtimeData }: OvertimeAlertProps) {
  if (!overtimeData || overtimeData.warningLevel === "none") return null;

  const getStyles = () => {
    switch (overtimeData.warningLevel) {
      case "warning":
        return "bg-yellow-500/20 border-yellow-500 text-yellow-200";
      case "critical":
        return "bg-red-500/20 border-red-500 text-red-200";
      default:
        return "bg-blue-500/20 border-blue-500 text-blue-200";
    }
  };

  const getIcon = () => {
    return overtimeData.warningLevel === "critical" ? "🚨" : "⚠️";
  };

  const getTitle = () => {
    return overtimeData.warningLevel === "critical"
      ? "Límite de Horas Superado"
      : "Aviso de Horas Extra";
  };

  return (
    <div className={`border-y p-4 mb-4 ${getStyles()}`}>
      <div className="flex items-start gap-3">
        <span className="text-lg">{getIcon()}</span>
        <div className="flex-1">
          <h3 className="font-semibold mb-2">{getTitle()}</h3>
          <div className="space-y-1 text-sm">
            {overtimeData.dailyOvertime > 0 && (
              <p>• Horas extra hoy: {overtimeData.dailyOvertime.toFixed(2)}h</p>
            )}
            {overtimeData.weeklyOvertime > 0 && (
              <p>
                • Horas extra esta semana:{" "}
                {overtimeData.weeklyOvertime.toFixed(2)}h
              </p>
            )}
            {overtimeData.yearlyOvertime > 0 && (
              <p>
                • Horas extra este año: {overtimeData.yearlyOvertime.toFixed(2)}
                h / 80h máx.
              </p>
            )}
            {overtimeData.isOverLimit && (
              <p className="font-medium">
                ⚠️ Se han superado los límites legales
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
