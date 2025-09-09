import { useState } from "react";
import type { Usuario, VistaNavegacion } from "@/types";
import { RelojPrincipal } from "@/components/RelojPrincipal";
import { HistorialTrabajo } from "@/components/HistorialTrabajo";
import { WorkSettings } from "@/components/WorkSettings";
import { DashboardTabs } from "@/components/DashboardTabs";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useTimeRecords } from "@/hooks/useTimeRecords";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";
import { FiClock, FiList, FiSettings } from "react-icons/fi";
import { initEntranceAnimation } from "@/utils/animations/entrance-animations";

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
  ];

  const renderTabContent = () => {
    switch (vistaActual) {
      case "reloj":
        return (
          <RelojPrincipal
            usuario={usuario}
            estadoActual={estadoActual}
            onStatusChange={refetch}
          />
        );
      case "historial":
        return <HistorialTrabajo usuarioId={usuario.id} onRefresh={refetch} />;
      case "configuracion":
        return <WorkSettings usuario={usuario} registros={registros} />;
      default:
        return (
          <RelojPrincipal
            usuario={usuario}
            estadoActual={estadoActual}
            onStatusChange={refetch}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-azul-profundo via-[#123243] to-teal pb-16">
      <div className="dashboard-header fade-down opacity-0">
        <DashboardHeader
          usuario={usuario}
          estadoActual={estadoActual}
          onLogout={onLogout}
        />
      </div>

      <div className="dashboard-tabs fade-up opacity-0">
        <DashboardTabs
          tabs={tabs}
          activeTab={vistaActual}
          onTabChange={(tabId) => setVistaActual(tabId as VistaNavegacion)}
        />
      </div>

      <main className="flex-1 w-full px-4 py-8 fade-up opacity-0">
        <div className="flex justify-center">
          <div className="w-full" style={{ maxWidth: "80rem" }}>
            {renderTabContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
