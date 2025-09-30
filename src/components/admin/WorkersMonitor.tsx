import { useState, useEffect } from "react";
import { AdminService } from "@/services/admin-service";
import type { Usuario } from "@/types";
import { FiClock, FiUser, FiActivity, FiRefreshCw } from "react-icons/fi";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";

interface WorkerStatus {
  user: Usuario;
  isWorking: boolean;
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

  const loadWorkersStatus = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      }
      setError(null);

      const statusList = await AdminService.getWorkersStatus();
      setWorkersStatus(statusList);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Error loading workers status:", err);
      setError("Error al cargar datos, por favor refresca la paginá");
    } finally {
      setIsLoading(false);
      if (isManualRefresh) {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadWorkersStatus();

    const interval = setInterval(() => {
      loadWorkersStatus();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const workingCount = workersStatus.filter((w) => w.isWorking).length;
  const notWorkingCount = workersStatus.filter((w) => !w.isWorking).length;

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8">
        <div className="flex items-center justify-center">
          <FiRefreshCw className="w-6 h-6 text-white animate-spin" />
          <span className="ml-3 text-white">
            Cargando estado de trabajadores...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
              Monitor en Tiempo Real
            </h2>
            <p className="text-white/70 text-xs md:text-sm">
              Última actualización:{" "}
              {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: es })}
            </p>
          </div>
          <button
            onClick={() => loadWorkersStatus(true)}
            disabled={isRefreshing}
            className="p-3 bg-teal hover:bg-teal/80 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg hover:shadow-xl self-start sm:self-auto"
          >
            <FiRefreshCw
              className={`w-5 h-5 text-white transition-transform ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-300 mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
          <div className="bg-activo/20 backdrop-blur-sm rounded-xl p-4 border border-activo/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-activo/30 rounded-full flex items-center justify-center flex-shrink-0">
                <FiActivity className="w-5 h-5 md:w-6 md:h-6 text-activo" />
              </div>
              <div>
                <p className="text-white/70 text-xs md:text-sm">Trabajando</p>
                <p className="text-xl md:text-2xl font-bold text-white">
                  {workingCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                <FiUser className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <p className="text-white/70 text-xs md:text-sm">Fuera</p>
                <p className="text-xl md:text-2xl font-bold text-white">
                  {notWorkingCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-turquesa/20 backdrop-blur-sm rounded-xl p-4 border border-turquesa/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-turquesa/30 rounded-full flex items-center justify-center flex-shrink-0">
                <FiClock className="w-5 h-5 md:w-6 md:h-6 text-turquesa" />
              </div>
              <div>
                <p className="text-white/70 text-xs md:text-sm">
                  Total Activos
                </p>
                <p className="text-xl md:text-2xl font-bold text-white">
                  {workersStatus.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {workersStatus.map((status) => (
            <div
              key={status.user.id}
              className={`p-3 md:p-4 rounded-xl border transition-all ${
                status.isWorking
                  ? "bg-activo/10 border-activo/30"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 md:gap-3">
                  <div
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      status.isWorking
                        ? "bg-activo animate-pulse"
                        : "bg-white/30"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white text-sm md:text-base">
                        {status.user.nombre}
                      </h3>
                      {status.user.isAdmin && (
                        <span className="px-2 py-0.5 bg-mandarina/20 text-mandarina text-xs rounded-full">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-white/60 text-xs md:text-sm truncate">
                      {status.user.email}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium text-xs md:text-sm flex-shrink-0 ${
                      status.isWorking
                        ? "bg-activo text-white"
                        : "bg-white/10 text-white/70"
                    }`}
                  >
                    {status.isWorking ? "Trabajando" : "Fuera"}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pl-5 md:pl-6">
                  <div className="flex items-center gap-4 md:gap-6 flex-wrap">
                    <div>
                      <p className="text-white/70 text-xs mb-0.5">Tiempo hoy</p>
                      <p className="text-white font-semibold text-sm md:text-base">
                        {formatTime(status.timeWorkedToday)}
                      </p>
                    </div>

                    {status.isWorking && status.lastEntry && (
                      <div>
                        <p className="text-white/70 text-xs mb-0.5">Entrada</p>
                        <p className="text-activo font-semibold text-sm md:text-base">
                          {format(status.lastEntry, "HH:mm")}
                        </p>
                        <p className="text-white/50 text-xs">
                          {formatDistanceToNow(status.lastEntry, {
                            addSuffix: true,
                            locale: es,
                          })}
                        </p>
                      </div>
                    )}

                    {!status.isWorking && status.lastExit && (
                      <div>
                        <p className="text-white/70 text-xs mb-0.5">
                          Última salida
                        </p>
                        <p className="text-white/80 font-semibold text-sm md:text-base">
                          {format(status.lastExit, "HH:mm")}
                        </p>
                        <p className="text-white/50 text-xs">
                          {formatDistanceToNow(status.lastExit, {
                            addSuffix: true,
                            locale: es,
                          })}
                        </p>
                      </div>
                    )}

                    {!status.isWorking && !status.lastActivity && (
                      <div>
                        <p className="text-white/50 text-xs md:text-sm">
                          Sin actividad hoy
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
