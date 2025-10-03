import { useState, useEffect, useMemo, useCallback } from "react";
import { AdminService } from "@/services/admin-service";
import type { Usuario } from "@/types";
import { AdminSystemDocumentation } from "./AdminSystemDocs";
import { AdminAbsencesPanel } from "@/components/tabs/admin/AdminAbsencesPanel";
import { WorkersMonitor } from "@/components/tabs/admin/WorkersMonitor";
import { TeleworkingPanel } from "@/components/tabs/admin/TeleworkingPanel";
import { UsersManagement } from "@/components/tabs/admin/UsersManagement";
import { RecordsManagement } from "@/components/tabs/admin/RecordsManagement";
import { useSecretSequence } from "@/hooks/useSecretSequence";
import { useAbsences } from "@/contexts/AbsenceContext";
import { useTeleworking } from "@/contexts/TeleworkingContext";
import { TimeCorrectionsService } from "@/services/time-corrections-service";
import {
  FiUsers,
  FiAlertCircle,
  FiMenu,
  FiX,
  FiClock,
  FiTrendingUp,
  FiCalendar,
  FiActivity,
  FiHome,
  FiUserPlus,
} from "react-icons/fi";

interface AdminPanelProps {
  currentUser: Usuario;
}

type AdminView = "users" | "records" | "monitor" | "absences" | "teleworking";

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
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [pendingChangesCount, setPendingChangesCount] = useState(0);

  const { absences, refreshAbsences } = useAbsences();
  const { schedules: teleworkSchedules, refreshSchedules } = useTeleworking();

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

  const pendingAbsencesCount = absences.filter(
    (a) => a.estado === "pendiente" && a.createdBy !== currentUser.id
  ).length;

  const pendingTeleworkCount = useMemo(() => {
    const pending = teleworkSchedules.filter((s) => s.estado === "pendiente");
    if (pending.length === 0) return 0;

    const sorted = [...pending].sort(
      (a, b) => a.fecha.getTime() - b.fecha.getTime()
    );
    let groups = 1;

    for (let i = 1; i < sorted.length; i++) {
      const prevDate = new Date(sorted[i - 1].fecha);
      const currDate = new Date(sorted[i].fecha);
      prevDate.setHours(0, 0, 0, 0);
      currDate.setHours(0, 0, 0, 0);

      const dayDiff =
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      const sameUser = sorted[i].usuarioId === sorted[i - 1].usuarioId;
      const sameLocation = sorted[i].location === sorted[i - 1].location;

      if (dayDiff !== 1 || !sameUser || !sameLocation) {
        groups++;
      }
    }

    return groups;
  }, [teleworkSchedules]);

  const loadPendingCounts = useCallback(async () => {
    try {
      const changesCount =
        await TimeCorrectionsService.getPendingChangesCount();
      setPendingChangesCount(changesCount);
    } catch (error) {
      console.error("Error loading pending counts:", error);
    }
  }, []);

  useEffect(() => {
    loadPendingCounts();
  }, [loadPendingCounts]);

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

  const handleDataChanged = useCallback(async () => {
    await refreshAbsences();
    const now = new Date();
    await refreshSchedules(
      new Date(now.getFullYear(), 0, 1),
      new Date(now.getFullYear(), 11, 31)
    );
    await loadPendingCounts();
  }, [refreshAbsences, refreshSchedules, loadPendingCounts]);

  const navItems = [
    {
      id: "monitor" as const,
      label: "Monitor en Tiempo Real",
      icon: FiActivity,
    },
    {
      id: "users" as const,
      label: "Gestión de Usuarios",
      icon: FiUserPlus,
    },
    {
      id: "records" as const,
      label: "Registros de Tiempo",
      icon: FiClock,
      badge: pendingChangesCount > 0 ? pendingChangesCount : undefined,
    },
    {
      id: "absences" as const,
      label: "Gestión de Ausencias",
      icon: FiAlertCircle,
      badge: pendingAbsencesCount > 0 ? pendingAbsencesCount : undefined,
    },
    {
      id: "teleworking" as const,
      label: "Teletrabajo",
      icon: FiHome,
      badge: pendingTeleworkCount > 0 ? pendingTeleworkCount : undefined,
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
                <div key={item.id} className="flex flex-col">
                  <button
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
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ml-auto">
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {item.id === "absences" && isActive && (
                    <div className="mt-2 ml-6 flex flex-col gap-1 border-l-2 border-white/20 pl-2">
                      {absenceSubNavItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const subActive = activeAbsenceSubView === subItem.id;
                        return (
                          <button
                            key={subItem.id}
                            onClick={() =>
                              handleAbsenceSubViewChange(subItem.id)
                            }
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
                              ${
                                subActive
                                  ? "bg-white/40 text-teal font-medium"
                                  : "text-azul-profundo/70 lg:text-white/60 hover:bg-hielo/20 lg:hover:bg-white/10"
                              }`}
                          >
                            <SubIcon className="w-4 h-4 flex-shrink-0" />
                            <span>{subItem.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-20"
        />
      )}

      <main className="flex-1 min-w-0">
        {activeView === "users" ? (
          <>
            <UsersManagement currentUser={currentUser} />
            {isUnlocked && (
              <div className="mt-6">
                <AdminSystemDocumentation
                  currentUser={currentUser}
                  onLock={lock}
                />
              </div>
            )}
          </>
        ) : activeView === "records" ? (
          <RecordsManagement
            currentUser={currentUser}
            onRecordsChanged={handleDataChanged}
          />
        ) : activeView === "monitor" ? (
          <WorkersMonitor currentAdmin={currentUser} />
        ) : activeView === "teleworking" ? (
          <TeleworkingPanel
            currentAdmin={currentUser}
            onTeleworkingChanged={handleDataChanged}
          />
        ) : (
          <AdminAbsencesPanel
            currentAdmin={currentUser}
            activeSubView={activeAbsenceSubView}
            onAbsencesChanged={handleDataChanged}
          />
        )}
      </main>
    </div>
  );
}
