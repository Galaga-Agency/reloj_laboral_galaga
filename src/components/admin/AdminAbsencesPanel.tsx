import { useState, useEffect, useMemo, useRef } from "react";
import { FiAlertCircle, FiUsers, FiClock, FiTrendingUp } from "react-icons/fi";
import { AdminAbsenceCalendar } from "@/components/admin/AdminAbsenceCalendar";
import { AdminAbsenceDetails } from "@/components/admin/AdminAbsenceDetails";
import { AdminAbsenceWorkerList } from "@/components/admin/AdminAbsenceWorkerList";
import { AdminAbsenceStatistics } from "@/components/admin/AdminAbsenceStatistics";
import { useAbsenceStatistics } from "@/hooks/useAbsenceStatistics";
import { AdminService } from "@/services/admin-service";
import type { Absence, Usuario } from "@/types";
import { startOfMonth, endOfMonth } from "date-fns";
import { AdminPendingAbsences } from "./AdminPendingAbsences";

interface AdminAbsencesPanelProps {
  currentAdmin: Usuario;
  activeSubView: "pending" | "statistics" | "calendar" | "workers";
}

export function AdminAbsencesPanel({
  currentAdmin,
  activeSubView,
}: AdminAbsencesPanelProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAbsences, setSelectedAbsences] = useState<Absence[]>([]);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const pendingRef = useRef<HTMLDivElement>(null);
  const statisticsRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const workersRef = useRef<HTMLDivElement>(null);

  const dateRange = useMemo(() => {
    const now = new Date();
    return {
      start: startOfMonth(now),
      end: endOfMonth(now),
    };
  }, []);

  const { stats, isLoading: isLoadingStats } = useAbsenceStatistics(
    dateRange.start,
    dateRange.end
  );

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const refs = {
      pending: pendingRef,
      statistics: statisticsRef,
      calendar: calendarRef,
      workers: workersRef,
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
    if (selectedDate) {
      handleDateSelect(selectedDate, selectedAbsences);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div ref={pendingRef}>
        <AdminPendingAbsences
          currentAdmin={currentAdmin}
          onUpdate={() => window.location.reload()}
        />
      </div>

      <div ref={statisticsRef}>
        <AdminAbsenceStatistics />
      </div>

      <div ref={calendarRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminAbsenceCalendar onDateSelect={handleDateSelect} />

        <AdminAbsenceDetails
          selectedDate={selectedDate}
          absences={selectedAbsences}
          currentAdmin={currentAdmin}
          onStatusUpdate={handleStatusUpdate}
        />
      </div>

      <div ref={workersRef}>
        <AdminAbsenceWorkerList users={users} isLoading={isLoadingUsers} />
      </div>
    </div>
  );
}
