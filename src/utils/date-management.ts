import {
  addDays,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
  isValid,
  format,
} from "date-fns";
import { es } from "date-fns/locale";

export interface DateRange {
  start: string;
  end: string;
  count: number;
}

export class DateManager {
  /**
   * Add a single date to the existing dates array
   */
  static addSingleDate(selectedDates: string[], newDate: string): string[] {
    if (!newDate || selectedDates.includes(newDate)) {
      return selectedDates;
    }
    return [...selectedDates, newDate].sort();
  }

  /**
   * Add a date range to the existing dates array
   */
  static addDateRange(
    selectedDates: string[],
    startDate: string,
    endDate: string
  ): string[] {
    if (!startDate || !endDate) {
      return selectedDates;
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    if (!isValid(start) || !isValid(end) || start > end) {
      return selectedDates;
    }

    const daysInRange = eachDayOfInterval({ start, end });
    const newDates = daysInRange.map(
      (date) => date.toISOString().split("T")[0]
    );
    return [...new Set([...selectedDates, ...newDates])].sort();
  }

  /**
   * Add preset ranges (week/month)
   */
  static addPresetRange(
    selectedDates: string[],
    type: "week" | "month"
  ): string[] {
    const today = new Date();
    let start: Date;
    let end: Date;

    if (type === "week") {
      start = startOfWeek(today, { locale: es });
      end = endOfWeek(today, { locale: es });
    } else {
      start = startOfMonth(today);
      end = endOfMonth(today);
    }

    const daysInRange = eachDayOfInterval({ start, end });
    const newDates = daysInRange.map(
      (date) => date.toISOString().split("T")[0]
    );
    return [...new Set([...selectedDates, ...newDates])].sort();
  }

  /**
   * Remove a single date from the array
   */
  static removeSingleDate(
    selectedDates: string[],
    dateToRemove: string
  ): string[] {
    return selectedDates.filter((date) => date !== dateToRemove);
  }

  /**
   * Remove a date range from the array - FIXED VERSION
   */
  static removeDateRange(selectedDates: string[], range: DateRange): string[] {
    // Use eachDayOfInterval for consistency with other methods
    const rangeDates = eachDayOfInterval({
      start: parseISO(range.start),
      end: parseISO(range.end),
    }).map((date) => format(date, "yyyy-MM-dd"));

    // Remove all dates that are in the range
    return selectedDates.filter((date) => !rangeDates.includes(date));
  }

  /**
   * Clear all dates
   */
  static clearAllDates(): string[] {
    return [];
  }

  /**
   * Group consecutive dates into ranges for display
   */
  static groupIntoRanges(selectedDates: string[]): DateRange[] {
    if (selectedDates.length === 0) return [];

    const sortedDates = [...selectedDates].sort();
    const ranges: DateRange[] = [];
    let currentRangeStart = sortedDates[0];
    let currentRangeEnd = sortedDates[0];

    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = parseISO(sortedDates[i]);
      const prevDate = parseISO(currentRangeEnd);
      const nextDay = addDays(prevDate, 1);

      if (currentDate.getTime() === nextDay.getTime()) {
        // Consecutive date, extend current range
        currentRangeEnd = sortedDates[i];
      } else {
        // Non-consecutive date, finish current range and start new one
        const daysInRange = eachDayOfInterval({
          start: parseISO(currentRangeStart),
          end: parseISO(currentRangeEnd),
        }).length;

        ranges.push({
          start: currentRangeStart,
          end: currentRangeEnd,
          count: daysInRange,
        });

        currentRangeStart = sortedDates[i];
        currentRangeEnd = sortedDates[i];
      }
    }

    // Add the last range
    const daysInRange = eachDayOfInterval({
      start: parseISO(currentRangeStart),
      end: parseISO(currentRangeEnd),
    }).length;

    ranges.push({
      start: currentRangeStart,
      end: currentRangeEnd,
      count: daysInRange,
    });

    return ranges;
  }

  /**
   * Validate if a date is not in the past
   */
  static isValidFutureDate(date: string): boolean {
    if (!date) return false;
    const selectedDate = parseISO(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isValid(selectedDate) && selectedDate >= today;
  }

  /**
   * Check if a date already exists in the array
   */
  static dateExists(selectedDates: string[], date: string): boolean {
    return selectedDates.includes(date);
  }
}
