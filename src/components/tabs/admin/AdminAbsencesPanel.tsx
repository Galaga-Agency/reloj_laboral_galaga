import { useEffect, useRef, useState } from "react";
import type { Usuario } from "@/types";
import { useAbsences } from "@/contexts/AbsenceContext";
import { AdminPendingAbsences } from "./AdminPendingAbsences";
import { AdminAbsenceStatistics } from "./AdminAbsenceStatistics";
import { AdminAbsenceCalendar } from "./AdminAbsenceCalendar";
import { AdminAbsenceDetails } from "./AdminAbsenceDetails";
import { AdminAbsenceWorkerList } from "./AdminAbsenceWorkerList";
import { AdminBankHolidaysManager } from "./AdminBankHolidaysManager";
import { AdminDaysOffManager } from "./AdminDaysOffManager";

interface AdminAbsencesPanelProps {
  currentAdmin: Usuario;
  activeSubView:
    | "pending"
    | "statistics"
    | "calendar"
    | "workers"
    | "holidays"
    | "days-off";
  onAbsencesChanged?: () => Promise<void>;
}

export function AdminAbsencesPanel({
  currentAdmin,
  activeSubView,
  onAbsencesChanged,
}: AdminAbsencesPanelProps) {
  const { refreshAbsences } = useAbsences();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const pendingRef = useRef<HTMLDivElement>(null);
  const statisticsRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const workersRef = useRef<HTMLDivElement>(null);
  const holidaysRef = useRef<HTMLDivElement>(null);
  const daysOffRef = useRef<HTMLDivElement>(null);

  const handleUpdate = async () => {
    await refreshAbsences();
    if (onAbsencesChanged) {
      await onAbsencesChanged();
    }
  };

  useEffect(() => {
    const refMap = {
      pending: pendingRef,
      statistics: statisticsRef,
      calendar: calendarRef,
      workers: workersRef,
      holidays: holidaysRef,
      "days-off": daysOffRef,
    };

    const targetRef = refMap[activeSubView];
    if (targetRef?.current) {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeSubView]);

  return (
    <div className="flex flex-col gap-6">
      <div ref={pendingRef}>
        <AdminPendingAbsences
          currentAdmin={currentAdmin}
          onUpdate={handleUpdate}
        />
      </div>

      <div ref={statisticsRef}>
        <AdminAbsenceStatistics />
      </div>

      <div ref={calendarRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminAbsenceCalendar
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
        <AdminAbsenceDetails
          currentAdmin={currentAdmin}
          selectedDate={selectedDate}
        />
      </div>

      <div ref={workersRef}>
        <AdminAbsenceWorkerList />
      </div>

      <div ref={holidaysRef}>
        <AdminBankHolidaysManager currentAdmin={currentAdmin} />
      </div>

      <div ref={daysOffRef}>
        <AdminDaysOffManager currentAdmin={currentAdmin} />
      </div>
    </div>
  );
}
