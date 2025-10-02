import { useState, useEffect, useMemo, useRef } from "react";
import type { Absence, Usuario } from "@/types";
import { startOfMonth, endOfMonth } from "date-fns";
import { AdminService } from "@/services/admin-service";
import { useAbsenceStatistics } from "@/hooks/useAbsenceStatistics";
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
  onAbsencesChanged?: () => void;
}

export function AdminAbsencesPanel({
  currentAdmin,
  activeSubView,
  onAbsencesChanged,
}: AdminAbsencesPanelProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAbsences, setSelectedAbsences] = useState<Absence[]>([]);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const pendingRef = useRef<HTMLDivElement>(null);
  const statisticsRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const workersRef = useRef<HTMLDivElement>(null);
  const holidaysRef = useRef<HTMLDivElement>(null);
  const daysOffRef = useRef<HTMLDivElement>(null);

  const dateRange = useMemo(() => {
    const now = new Date();
    return {
      start: startOfMonth(now),
      end: endOfMonth(now),
    };
  }, []);

  const { stats } = useAbsenceStatistics(dateRange.start, dateRange.end);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const refs = {
      pending: pendingRef,
      statistics: statisticsRef,
      calendar: calendarRef,
      workers: workersRef,
      holidays: holidaysRef,
      "days-off": daysOffRef,
    };

    const targetRef = refs[activeSubView];
    if (targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeSubView]);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const allUsers = await AdminService.getAllUsers();
      setUsers(allUsers.filter((u) => u.isActive));
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleDateSelect = (date: Date, absences: Absence[]) => {
    setSelectedDate(date);
    setSelectedAbsences(absences);
  };

  const handleStatusUpdate = () => {
    setRefreshKey((prev) => prev + 1);
    if (selectedDate) {
      handleDateSelect(selectedDate, selectedAbsences);
    }
    if (onAbsencesChanged) {
      onAbsencesChanged();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div ref={pendingRef}>
        <AdminPendingAbsences
          currentAdmin={currentAdmin}
          onUpdate={handleStatusUpdate}
        />
      </div>

      <div ref={statisticsRef}>
        <AdminAbsenceStatistics />
      </div>
      <div ref={calendarRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminAbsenceCalendar
          refreshKey={refreshKey}
          onDateSelect={handleDateSelect}
        />
        <AdminAbsenceDetails
          selectedDate={selectedDate}
          absences={selectedAbsences}
          currentAdmin={currentAdmin}
          onStatusUpdate={handleStatusUpdate}
          refreshKey={refreshKey}
        />
      </div>

      <div ref={workersRef}>
        <AdminAbsenceWorkerList users={users} isLoading={isLoadingUsers} />
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