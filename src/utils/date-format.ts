import { format } from "date-fns";
import { es } from "date-fns/locale";

export class DateFormatUtils {
  /**
   * Format time as HH:mm:ss
   */
  static formatTime(date: Date): string {
    return format(date, "HH:mm:ss");
  }

  /**
   * Format date in Spanish locale (e.g., "12 de septiembre de 2024")
   */
  static formatDate(date: Date): string {
    return format(date, "PPP", { locale: es });
  }

  /**
   * Format date as YYYY-MM-DD
   */
  static formatDateISO(date: Date): string {
    return format(date, "yyyy-MM-dd");
  }

  /**
   * Format date and time in Spanish locale
   */
  static formatDateTime(date: Date): string {
    return format(date, "PPP 'a las' HH:mm:ss", { locale: es });
  }

  /**
   * Format short date (e.g., "12 sep")
   */
  static formatShortDate(date: Date): string {
    return format(date, "d MMM", { locale: es });
  }

  /**
   * Format month and year (e.g., "septiembre 2024")
   */
  static formatMonthYear(date: Date): string {
    return format(date, "MMMM yyyy", { locale: es });
  }

  /**
   * Format relative time display (for UI components)
   */
  static formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInHours =
      Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return this.formatTime(date);
    } else if (diffInHours < 24 * 7) {
      return format(date, "EEEE 'a las' HH:mm", { locale: es });
    } else {
      return this.formatDate(date);
    }
  }
}

export function formatSecondsHms(seconds: number | null): string {
  if (seconds == null) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
