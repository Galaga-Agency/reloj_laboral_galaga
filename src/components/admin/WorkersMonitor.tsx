"use client";

import { useState, useEffect } from "react";
import { AdminService } from "@/services/admin-service";
import type { Usuario } from "@/types";
import { FiRefreshCw, FiHome, FiBriefcase, FiUserX } from "react-icons/fi";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { CustomInput } from "@/components/ui/CustomInput";

interface WorkerStatus {
  user: Usuario;
  isWorking: boolean;
  currentLocation?: "oficina" | "teletrabajo" | null;
  lastEntry?: Date;
  lastExit?: Date;
  timeWorkedToday: number;
  lastActivity?: Date;
}

interface WorkersMonitorProps {
  currentAdmin: Usuario;
}

export function WorkersMonitor({ currentAdmin }: WorkersMonitorProps) {
  const [workersStatus, setWorkersStatus] = useState<WorkerStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const dropdownOptions = [
    { value: "all", label: "Todos" },
    { value: "oficina", label: "Oficina" },
    { value: "teletrabajo", label: "Teletrabajo" },
    { value: "fuera", label: "Fuera" },
  ];

  const loadWorkersStatus = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      setError(null);

      const statusList = await AdminService.getWorkersStatus();
      setWorkersStatus(statusList);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Error loading workers status:", err);
      setError("Error al cargar datos, por favor refresca la página");
    } finally {
      setIsLoading(false);
      if (isManualRefresh) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadWorkersStatus();
    const interval = setInterval(() => loadWorkersStatus(), 60000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const filteredWorkers = workersStatus.filter((w) => {
    if (locationFilter === "fuera" && w.isWorking) return false;
    if (locationFilter !== "all" && locationFilter !== "fuera") {
      if (!(w.isWorking && w.currentLocation === locationFilter)) return false;
    }

    const query = searchQuery.toLowerCase();
    if (
      query &&
      !w.user.nombre.toLowerCase().includes(query) &&
      !w.user.email.toLowerCase().includes(query)
    ) {
      return false;
    }

    return true;
  });

  if (isLoading) {
    return (
      <div className="bg-darkblue text-white rounded-xl p-6 flex items-center justify-center">
        <FiRefreshCw className="w-6 h-6 animate-spin mr-3" />
        <span>Cargando estado de trabajadores...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 py-2">
        {/* Title */}
        <div className="flex-1 min-w-[160px]">
          <h2 className="text-2xl font-bold text-white">
            Monitor en Tiempo Real
          </h2>
          <p className="text-white/70 text-xs">
            Última actualización:{" "}
            {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: es })}
          </p>
        </div>

        {/* Search */}
        <div className="w-full max-w-[200px] flex-1">
          <CustomInput
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="darkBg"
          />
        </div>

        {/* Dropdown */}
        <div className="w-full max-w-[160px] flex-1">
          <CustomDropdown
            options={dropdownOptions}
            value={locationFilter}
            onChange={(val: string) => setLocationFilter(val)}
            placeholder="Ubicación"
            variant="darkBg"
          />
        </div>

        {/* Refresh */}
        <button
          onClick={() => loadWorkersStatus(true)}
          disabled={isRefreshing}
          className="p-3 bg-teal rounded-lg hover:bg-teal/80 transition disabled:opacity-50 flex items-center justify-center"
        >
          <FiRefreshCw
            className={`w-5 h-5 text-white ${
              isRefreshing ? "animate-spin" : ""
            }`}
          />
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Workers list or empty state */}
      <div className="space-y-4">
        {filteredWorkers.length === 0 ? (
          <div className="bg-darkblue/60 p-6 flex flex-col items-center justify-center text-center">
            <FiUserX className="w-10 h-10 text-white/50 mb-3" />
            <p className="text-white/80 font-semibold">
              No se encontraron trabajadores
            </p>
            <p className="text-white/50 text-sm mt-1">
              Ajusta los filtros o la búsqueda para ver resultados
            </p>
          </div>
        ) : (
          filteredWorkers.map((status) => (
            <div
              key={status.user.id}
              className={`rounded-xl p-4 flex flex-col gap-4 border transition-all ${
                status.isWorking
                  ? "bg-darkblue border-green-400/40 shadow-[0_0_8px_rgba(34,197,94,0.3)]"
                  : "bg-darkblue border-white/20"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      status.isWorking
                        ? "bg-green-400 animate-pulse"
                        : "bg-white/30"
                    }`}
                  />
                  <div className="min-w-0">
                    <h3 className="text-white font-semibold text-sm truncate">
                      {status.user.nombre}
                    </h3>
                    <p className="text-white/60 text-xs truncate">
                      {status.user.email}
                    </p>
                  </div>
                  {status.isWorking && status.currentLocation && (
                    <span
                      className={`ml-2 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-white/50 text-white`}
                    >
                      {status.currentLocation === "oficina" ? (
                        <>
                          <FiBriefcase className="w-4 h-4" /> Oficina
                        </>
                      ) : (
                        <>
                          <FiHome className="w-4 h-4" /> Teletrabajo
                        </>
                      )}
                    </span>
                  )}
                </div>

                <div
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    status.isWorking
                      ? "bg-green-500 text-white"
                      : "bg-white/10 text-white/70"
                  }`}
                >
                  {status.isWorking ? "Trabajando" : "Fuera"}
                </div>
              </div>

              {/* Info row */}
              <div className="flex flex-col gap-3 md:flex-row md:gap-4">
                <div className="flex-1 bg-white/5 rounded-lg p-3">
                  <p className="text-white/70 text-xs mb-1">Tiempo hoy</p>
                  <p className="text-white font-bold text-base">
                    {formatTime(status.timeWorkedToday)}
                  </p>
                </div>

                {status.isWorking && status.lastEntry && (
                  <div className="flex-1 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <p className="text-white/70 text-xs mb-1">Entrada</p>
                    <p className="text-green-400 font-bold text-base">
                      {format(status.lastEntry, "HH:mm")}
                    </p>
                    <p className="text-white/50 text-xs mt-1">
                      {formatDistanceToNow(status.lastEntry, {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>
                )}

                {!status.isWorking && status.lastExit && (
                  <div className="flex-1 bg-white/5 rounded-lg p-3">
                    <p className="text-white/70 text-xs mb-1">Última salida</p>
                    <div className="flex gap-2 items-center">
                      <p className="text-white/80 font-bold text-base">
                        {format(status.lastExit, "HH:mm")}
                      </p>
                      <p className="text-white/50 text-xs mt-1">
                        {formatDistanceToNow(status.lastExit, {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {!status.isWorking && !status.lastActivity && (
                  <div className="flex-1 bg-white/5 rounded-lg p-3 flex items-center justify-center">
                    <p className="text-white/50 text-xs">Sin actividad hoy</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
