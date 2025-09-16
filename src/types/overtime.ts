export interface OvertimeData {
  dailyHours: number;
  weeklyHours: number;
  monthlyHours: number;
  yearlyHours: number;
  dailyOvertime: number;
  weeklyOvertime: number;
  monthlyOvertime: number;
  yearlyOvertime: number;
  isOverLimit: boolean;
  warningLevel: "none" | "warning" | "critical";
}
