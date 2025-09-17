import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FiLogOut } from "react-icons/fi";
import type { Usuario } from "@/types";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { useDeviceDetect } from "@/hooks/useDeviceDetect";
import {
  OfficialPortalService,
  type EmployeeData,
} from "@/services/official-portal-service";
import { PortalSearchExport } from "../oficial-portal/PortalSearchExport";
import { PortalStatisticsCards } from "../oficial-portal/PortalStatisticsCards";
import { PortalEmployeesTable } from "../oficial-portal/PortalEmployeesTable";

interface PortalOficialPageProps {
  usuario: Usuario;
  onLogout: () => void;
}

export function PortalOficialPage({
  usuario,
  onLogout,
}: PortalOficialPageProps) {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { isMobile, isTablet } = useDeviceDetect();

  useEffect(() => {
    fetchEmployeesData();
  }, []);

  const fetchEmployeesData = async () => {
    try {
      setLoading(true);
      setError(null);

      const employeesData = await OfficialPortalService.getAllEmployeesData();
      setEmployees(employeesData);

      // Log this access
      await OfficialPortalService.logAccess(usuario.id, "view", {
        action: "view_all_employees",
        count: employeesData.length,
      });
    } catch (error) {
      console.error("Error fetching employees data:", error);
      setError(
        error instanceof Error ? error.message : "Error loading employee data"
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = async () => {
    try {
      const csvContent = OfficialPortalService.generateCSV(filteredEmployees);
      const filename = `reporte_empleados_${format(
        new Date(),
        "yyyy-MM-dd"
      )}.csv`;

      OfficialPortalService.downloadCSV(csvContent, filename);

      // Log this access
      await OfficialPortalService.logAccess(usuario.id, "export", {
        action: "export_csv",
        format: "csv",
        employees_count: filteredEmployees.length,
        exported_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      setError("Error al exportar los datos");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-azul-profundo via-azul-profundo to-teal flex items-center justify-center">
        <div className="text-white text-xl">Cargando portal oficial...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-azul-profundo via-azul-profundo to-teal">
      {/* Header */}
      <header className="bg-blanco border-b border-hielo/30 relative z-50">
        <div className="px-4 py-4 md:px-6 md:py-5 lg:px-10 lg:py-7">
          {isMobile || isTablet ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src="/assets/img/logos/logo-mobile.webp"
                  alt="Galaga"
                  className="h-10"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-azul-profundo text-lg">
                    Portal Oficial
                  </span>
                  <span className="text-sm text-teal">{usuario.nombre}</span>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-lg border border-teal text-teal hover:bg-teal/5 flex items-center justify-center min-w-[40px] min-h-[40px]"
              >
                <FiLogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <img
                  src="/assets/img/logos/logo-mobile.webp"
                  alt="Galaga"
                  className="h-12 lg:h-16"
                />
                <div>
                  <h1 className="text-xl font-bold text-azul-profundo lg:text-3xl">
                    Portal Oficial
                  </h1>
                  <p className="text-base font-medium mt-1 text-teal">
                    Acceso para autoridades laborales -{" "}
                    {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", {
                      locale: es,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-activo" />

                  <p className="text-xl font-bold text-azul-profundo">
                    {usuario.nombre}
                  </p>
                </div>
                <SecondaryButton
                  onClick={onLogout}
                  size="sm"
                  borderColor="teal"
                >
                  <FiLogOut className="w-4 h-4" />
                  Cerrar Sesión
                </SecondaryButton>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Search and Export */}
        <PortalSearchExport
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onExport={handleExport}
        />

        {/* Statistics Cards */}
        <PortalStatisticsCards employees={filteredEmployees} />

        {/* Employees Table */}
        <PortalEmployeesTable employees={filteredEmployees} />
      </main>
    </div>
  );
}
