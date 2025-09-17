import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FiLogOut } from "react-icons/fi";
import type { Usuario, EstadoTrabajo } from "@/types";
import SecondaryButton from "./ui/SecondaryButton";
import { useDeviceDetect } from "@/hooks/useDeviceDetect";
import { useAuth } from "@/context/AuthContext";

interface DashboardHeaderProps {
  usuario: Usuario;
  estadoActual: EstadoTrabajo;
  onLogout: () => void;
}

export function DashboardHeader({
  usuario,
  estadoActual,
  onLogout,
}: DashboardHeaderProps) {
  const { isMobile, isTablet } = useDeviceDetect();
  const { isLoggingOut } = useAuth();

  return (
    <header className="bg-blanco border-b border-hielo/30 relative z-50">
      <div className="px-4 py-4 md:px-6 md:py-5 lg:px-10 lg:py-7">
        {isMobile || isTablet ? (
          <div className="flex items-center justify-between fade-down opacity-0">
            <div className="flex items-center gap-4">
              <img
                src="/assets/img/logos/logo-mobile.webp"
                alt="Galaga"
                className="h-10"
              />
              <div className="flex items-center gap-4">
                <span className="font-bold text-azul-profundo text-xl">
                  {usuario.nombre}
                </span>
                <div
                  className={`w-4 h-4 rounded-full ${
                    estadoActual === "trabajando" ? "bg-activo" : "bg-inactivo"
                  }`}
                />
              </div>
            </div>

            <button
              onClick={onLogout}
              disabled={isLoggingOut}
              className={`p-2 rounded-lg border border-teal text-teal flex items-center justify-center min-w-[40px] min-h-[40px] ${
                isLoggingOut
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-teal/5"
              }`}
            >
              {isLoggingOut ? (
                <div className="w-4 h-4 border-2 border-teal border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FiLogOut className="w-5 h-5" />
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between fade-down opacity-0">
            <div className="flex items-center gap-6 fade-left opacity-0">
              <img
                src="/assets/img/logos/logo-mobile.webp"
                alt="Galaga"
                className="h-12 lg:h-16"
              />
              <div>
                <h1 className="text-xl font-bold text-azul-profundo lg:text-3xl">
                  Reloj Laboral
                </h1>
                <p className="text-base font-medium mt-1 text-teal">
                  {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", {
                    locale: es,
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8 fade-right opacity-0">
              <div className="text-right">
                {usuario.role === "employee" ? (
                  <>
                    <p className="text-xl font-bold text-azul-profundo">
                      {usuario.nombre}
                    </p>
                    <div className="flex items-center justify-end gap-3 mt-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          estadoActual === "trabajando"
                            ? "bg-activo"
                            : "bg-inactivo"
                        }`}
                      />
                      <span className="text-azul-profundo/70 font-medium capitalize">
                        {estadoActual === "trabajando"
                          ? "Trabajando"
                          : "Desconectado"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-right flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-activo" />

                    <p className="text-xl font-bold text-azul-profundo">
                      {usuario.nombre}
                    </p>
                  </div>
                )}
              </div>

              <SecondaryButton
                onClick={onLogout}
                size="sm"
                borderColor="teal"
                disabled={isLoggingOut}
                className={isLoggingOut ? "opacity-50 cursor-not-allowed" : ""}
              >
                {isLoggingOut ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Cerrando...
                  </>
                ) : (
                  <>
                    <FiLogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </>
                )}
              </SecondaryButton>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
