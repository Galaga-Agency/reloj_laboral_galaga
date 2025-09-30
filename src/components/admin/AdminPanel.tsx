import { useState, useEffect } from "react";
import { AdminService, type TimeRange } from "@/services/admin-service";
import type { Usuario, RegistroTiempo } from "@/types";
import { UsersList } from "@/components/admin/UsersList";
import { UserRecordsList } from "@/components/admin/UserRecordsList";
import { AdminSystemDocumentation } from "../AdminSystemDocs";
import { AdminUserReports } from "@/components/AdminUserReports";
import { AdminAbsencesPanel } from "@/components/admin/AdminAbsencesPanel";
import { PendingChangesPanel } from "@/components/admin/PendingChangesPanel";
import { WorkersMonitor } from "@/components/admin/WorkersMonitor";
import { useSecretSequence } from "@/hooks/useSecretSequence";
import {
  FiUsers,
  FiAlertCircle,
  FiMenu,
  FiX,
  FiClock,
  FiTrendingUp,
  FiCalendar,
  FiBell,
  FiActivity,
} from "react-icons/fi";
import { AbsenceService } from "@/services/absence-service";
import { TimeCorrectionsService } from "@/services/time-corrections-service";

interface AdminPanelProps {
  currentUser: Usuario;
}

type AdminView = "users" | "monitor" | "absences" | "pending-changes";

type AbsenceSubView =
  | "pending"
  | "statistics"
  | "calendar"
  | "workers"
  | "holidays"
  | "days-off";

export function AdminPanel({ currentUser }: AdminPanelProps) {
  const [activeView, setActiveView] = useState<AdminView>("monitor");
  const [activeAbsenceSubView, setActiveAbsenceSubView] =
    useState<AbsenceSubView>("pending");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [userRecords, setUserRecords] = useState<RegistroTiempo[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("past2days");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecordsLoading, setIsRecordsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [pendingAbsencesCount, setPendingAbsencesCount] = useState(0);
  const [pendingChangesCount, setPendingChangesCount] = useState(0);

  const { isUnlocked, lock } = useSecretSequence({
    sequence: ["s", "e", "c", "r", "e", "t"],
    resetTimeout: 5000,
    onSequenceComplete: () => {
      setMessage({
        type: "success",
        text: "Documentación de sistema desbloqueada",
      });
      setTimeout(() => setMessage(null), 2000);
    },
  });

  useEffect(() => {
    loadPendingCounts();
  }, []);

  useEffect(() => {
    if (activeView === "absences") {
      loadPendingAbsencesCount();
    }
  }, [activeView]);

  const loadPendingCounts = async () => {
    try {
      const [absencesCount, changesCount] = await Promise.all([
        loadPendingAbsencesCount(),
        TimeCorrectionsService.getPendingChangesCount(),
      ]);
      setPendingChangesCount(changesCount);
    } catch (error) {
      console.error("Error loading pending counts:", error);
    }
  };

  const loadPendingAbsencesCount = async () => {
    try {
      const now = new Date();
      const absences = await AbsenceService.getAllAbsences(
        new Date(now.getFullYear(), 0, 1),
        now
      );
      const pending = absences.filter((a) => a.estado === "pendiente").length;
      setPendingAbsencesCount(pending);
      return pending;
    } catch (error) {
      console.error("Error loading pending absences count:", error);
      return 0;
    }
  };

  useEffect(() => {
    if (activeView === "users") {
      loadUsers();
    }
  }, [activeView]);

  useEffect(() => {
    if (selectedUser) {
      loadUserRecords(selectedUser.id, timeRange);
    }
  }, [selectedUser, timeRange]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allUsers = await AdminService.getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading users");
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserRecords = async (userId: string, range: TimeRange) => {
    try {
      setIsRecordsLoading(true);
      setError(null);
      const records = await AdminService.getUserRecords(userId, range);

      const sortedRecords = records.sort((a, b) => {
        return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
      });

      setUserRecords(sortedRecords);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error loading user records"
      );
    } finally {
      setIsRecordsLoading(false);
    }
  };

  const handleUserSelect = async (user: Usuario) => {
    setSelectedUser(user);
  };

  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange as TimeRange);
  };

  const handleUsersUpdated = () => {
    loadUsers();
  };

  const handleRecordUpdated = () => {
    if (selectedUser) {
      loadUserRecords(selectedUser.id, timeRange);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  };

  const handleViewChange = (view: AdminView) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
    if (view === "absences") {
      setActiveAbsenceSubView("pending");
    }
  };

  const handleAbsenceSubViewChange = (subView: AbsenceSubView) => {
    setActiveAbsenceSubView(subView);
    setIsMobileMenuOpen(false);
  };

  const handleChangesProcessed = () => {
    loadPendingCounts();
    if (selectedUser) {
      loadUserRecords(selectedUser.id, timeRange);
    }
  };

  const navItems = [
    {
      id: "monitor" as const,
      label: "Monitor en Tiempo Real",
      icon: FiActivity,
    },
    {
      id: "users" as const,
      label: "Usuarios y Registros",
      icon: FiUsers,
    },
    {
      id: "pending-changes" as const,
      label: "Cambios Pendientes",
      icon: FiBell,
      badge: pendingChangesCount > 0 ? pendingChangesCount : undefined,
    },
    {
      id: "absences" as const,
      label: "Gestión de Ausencias",
      icon: FiAlertCircle,
      badge: pendingAbsencesCount > 0 ? pendingAbsencesCount : undefined,
    },
  ];

  const absenceSubNavItems = [
    { id: "pending" as const, label: "Pendientes", icon: FiAlertCircle },
    { id: "statistics" as const, label: "Estadísticas", icon: FiTrendingUp },
    { id: "calendar" as const, label: "Calendario", icon: FiCalendar },
    { id: "workers" as const, label: "Informes Por Empleado", icon: FiUsers },
    { id: "holidays" as const, label: "Festivos", icon: FiCalendar },
    { id: "days-off" as const, label: "Días Libres", icon: FiClock },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-screen md:max-w-[1600px] mx-auto overflow-hidden">
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed bottom-24 right-6 z-40 p-4 bg-teal rounded-full shadow-2xl text-white hover:scale-110 transition-transform"
      >
        {isMobileMenuOpen ? (
          <FiX className="w-6 h-6" />
        ) : (
          <FiMenu className="w-6 h-6" />
        )}
      </button>

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen lg:h-auto lg:top-6 z-30
          w-80 lg:w-72 xl:w-80 flex-shrink-0
          transition-transform duration-300 ease-in-out
          ${
            isMobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }`}
      >
        <div className="h-full lg:h-auto py-24 md:py-6 bg-white/95 lg:bg-white/10 backdrop-blur-md rounded-none lg:rounded-2xl px-6 lg:border lg:border-white/20 shadow-2xl lg:shadow-none overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-azul-profundo lg:text-white mb-2">
              Panel Admin
            </h2>
            <p className="text-azul-profundo/70 lg:text-white/70 text-sm">
              Gestiona el sistema
            </p>
          </div>

          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.id)}
                  className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all font-medium
                    ${
                      isActive
                        ? "bg-teal text-white shadow-lg"
                        : "bg-transparent text-azul-profundo lg:text-white/80 hover:bg-hielo/30 lg:hover:bg-white/10"
                    }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {activeView === "absences" && (
            <div className="mt-4 pl-4 border-l-2 border-white/20">
              <div className="flex flex-col gap-1">
                {absenceSubNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeAbsenceSubView === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleAbsenceSubViewChange(item.id)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-all text-sm cursor-pointer
                        ${
                          isActive
                            ? "bg-white/40 text-teal font-medium"
                            : "text-azul-profundo/70 lg:text-white/60 hover:bg-hielo/20 lg:hover:bg-white/10"
                        }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-20"
        />
      )}

      <main className="flex-1 min-w-0">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-300 mb-6">
            {error}
          </div>
        )}

        {activeView === "users" ? (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UsersList
                users={users}
                selectedUser={selectedUser}
                currentUser={currentUser}
                onUserSelect={handleUserSelect}
                onUsersUpdated={handleUsersUpdated}
                onError={handleError}
                isLoading={false}
              />

              <UserRecordsList
                selectedUser={selectedUser}
                userRecords={userRecords}
                timeRange={timeRange}
                isRecordsLoading={isRecordsLoading}
                currentAdmin={currentUser}
                onTimeRangeChange={handleTimeRangeChange}
                onRecordUpdated={handleRecordUpdated}
              />
            </div>

            {selectedUser && (
              <AdminUserReports
                selectedUser={selectedUser}
                userRecords={userRecords}
              />
            )}

            {isUnlocked && (
              <AdminSystemDocumentation
                currentUser={currentUser}
                onLock={lock}
              />
            )}
          </div>
        ) : activeView === "monitor" ? (
          <WorkersMonitor currentAdmin={currentUser} />
        ) : activeView === "pending-changes" ? (
          <PendingChangesPanel
            currentAdmin={currentUser}
            onChangesProcessed={handleChangesProcessed}
          />
        ) : (
          <AdminAbsencesPanel
            currentAdmin={currentUser}
            activeSubView={activeAbsenceSubView}
          />
        )}
      </main>
    </div>
  );
}
