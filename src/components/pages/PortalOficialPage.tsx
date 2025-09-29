import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FiLogOut } from "react-icons/fi";
import type { Usuario } from "@/types";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { useDeviceDetect } from "@/hooks/useDeviceDetect";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { OfficialPortalService } from "@/services/official-portal-service";
import { PortalSearchExport } from "../oficial-portal/PortalSearchExport";
import { PortalStatisticsCards } from "../oficial-portal/PortalStatisticsCards";
import { PortalEmployeesTable } from "../oficial-portal/PortalEmployeesTable";
import type { ComplianceAlert, EmployeeData } from "@/types/official-portal";

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
  const [dateRange, setDateRange] = useState("thismonth");
  const [error, setError] = useState<string | null>(null);
  const [complianceAlerts, setComplianceAlerts] = useState<ComplianceAlert[]>(
    []
  );
  const { isMobile, isTablet } = useDeviceDetect();

  const dateRangeOptions = [
    { value: "thisweek", label: "Esta Semana" },
    { value: "thismonth", label: "Este Mes" },
    { value: "lastmonth", label: "Mes Pasado" },
    { value: "past7days", label: "Últimos 7 Días" },
    { value: "past30days", label: "Últimos 30 Días" },
    { value: "all", label: "Todo el Historial" },
  ];

  useEffect(() => {
    fetchEmployeesData();
  }, [dateRange]);

  const hasLoggedRef = useRef(false);

  useEffect(() => {
    if (!hasLoggedRef.current) {
      hasLoggedRef.current = true;
      OfficialPortalService.logAccess(usuario.id, "view", {
        action: "view_portal",
        date_range: { from: dateRange, to: dateRange },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEmployeesData = async () => {
    try {
      setLoading(true);
      setError(null);

      const employeesData = await OfficialPortalService.getAllEmployeesData(
        dateRange
      );
      setEmployees(employeesData);

      const alerts = await OfficialPortalService.generateComplianceAlerts(
        employeesData
      );
      setComplianceAlerts(alerts);
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

      await OfficialPortalService.logAccess(usuario.id, "export", {
        action: "export_csv",
        format: "csv",
        employees_count: filteredEmployees.length,
        exported_at: new Date().toISOString(),
        search_term: searchTerm,
        date_range: { from: dateRange, to: dateRange },
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      setError("Error al exportar los datos");
    }
  };

  const getCurrentRangeLabel = () => {
    const option = dateRangeOptions.find((opt) => opt.value === dateRange);
    return option?.label || "Período Seleccionado";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-azul-profundo via-azul-profundo to-teal pb-24">
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

        {/* Date Range Selector */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8 relative z-50">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-azul-profundo mb-2">
                Período de Datos
              </h2>
              <p className="text-sm text-azul-profundo/70">
                Mostrando información de:{" "}
                <span className="font-medium text-teal">
                  {getCurrentRangeLabel()}
                </span>
              </p>
            </div>
            <div className="w-full md:w-64 z-[999]">
              <CustomDropdown
                options={dateRangeOptions}
                value={dateRange}
                onChange={setDateRange}
                placeholder="Seleccionar período..."
                variant="lightBg"
              />
            </div>
          </div>
        </div>

        {/* Search and Export */}
        <PortalSearchExport
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onExport={handleExport}
        />

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="text-white text-xl">Cargando datos...</div>
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <PortalStatisticsCards
              employees={filteredEmployees}
              selectedPeriod={dateRange}
            />

            {/* Employees Table */}
            <PortalEmployeesTable
              employees={filteredEmployees}
              selectedRange={getCurrentRangeLabel()}
            />
          </>
        )}
      </main>
    </div>
  );
}
