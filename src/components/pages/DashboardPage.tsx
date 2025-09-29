import { useState } from "react";
import type { Usuario, VistaNavegacion } from "@/types";
import { RelojPrincipal } from "@/components/RelojPrincipal";
import { HistorialTrabajo } from "@/components/HistorialTrabajo";
import { WorkSettings } from "@/components/WorkSettings";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { DashboardTabs } from "@/components/DashboardTabs";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useTimeRecords } from "@/hooks/useTimeRecords";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";
import { FiClock, FiList, FiSettings, FiShield } from "react-icons/fi";
import { initEntranceAnimation } from "@/utils/animations/entrance-animations";
import { useOvertimeCalculations } from "@/hooks/useOvertimeCalculations";
import { OvertimeAlert } from "@/components/OvertimeAlert";

interface DashboardPageProps {
  usuario: Usuario;
  onLogout: () => void;
}

export function DashboardPage({ usuario, onLogout }: DashboardPageProps) {
  const [vistaActual, setVistaActual] = useState<VistaNavegacion>("reloj");

  const { registros, estadoActual, refetch } = useTimeRecords(usuario.id);

  useGSAPAnimations({ animations: [initEntranceAnimation], delay: 100 });

  const tabs = [
    {
      id: "reloj" as const,
      label: "Fichaje",
      icon: <FiClock className="w-5 h-5" />,
    },
    {
      id: "historial" as const,
      label: "Historial",
      icon: <FiList className="w-5 h-5" />,
    },
    {
      id: "configuracion" as const,
      label: "Config",
      icon: <FiSettings className="w-5 h-5" />,
    },
    ...(usuario.isAdmin
      ? [
          {
            id: "admin" as const,
            label: "Admin",
            icon: <FiShield className="w-5 h-5" />,
          },
        ]
      : []),
  ];

  const { overtimeData } = useOvertimeCalculations(usuario.id);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-azul-profundo via-[#123243] to-teal pb-16">
      <div className="dashboard-header">
        <DashboardHeader
          usuario={usuario}
          estadoActual={estadoActual}
          onLogout={onLogout}
        />
      </div>

      <OvertimeAlert overtimeData={overtimeData} />

      <div className="dashboard-tabs">
        <DashboardTabs
          tabs={tabs}
          activeTab={vistaActual}
          onTabChange={(tabId) => setVistaActual(tabId as VistaNavegacion)}
        />
      </div>

      <main className="flex-1 w-full px-4 py-8">
        <div className="flex justify-center">
          <div className="w-full" style={{ maxWidth: "80rem" }}>
            {vistaActual === "reloj" && (
              <RelojPrincipal
                usuario={usuario}
                estadoActual={estadoActual}
                onStatusChange={refetch}
              />
            )}
            {vistaActual === "historial" && (
              <HistorialTrabajo usuarioId={usuario.id} onRefresh={refetch} />
            )}
            {vistaActual === "configuracion" && (
              <WorkSettings usuario={usuario} registros={registros} />
            )}
            {vistaActual === "admin" && usuario.isAdmin && (
              <AdminPanel currentUser={usuario} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}