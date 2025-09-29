import { useState, useEffect } from "react";
import type { Usuario, EstadoTrabajo } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FiPlay, FiSquare, FiAlertCircle } from "react-icons/fi";
import { useTimeRecords } from "@/hooks/useTimeRecords";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { AbsenceForm } from "@/components/forms/AbsenceForm";
import { Link } from "react-router-dom";

interface Props {
  usuario: Usuario;
  estadoActual?: EstadoTrabajo;
  tiempoTrabajado?: string;
  onStatusChange?: () => void;
}

export function RelojPrincipal({
  usuario,
  estadoActual: propEstadoActual,
  tiempoTrabajado: propTiempoTrabajado,
  onStatusChange,
}: Props) {
  const [horaActual, setHoraActual] = useState(new Date());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [optimisticState, setOptimisticState] = useState<EstadoTrabajo | null>(
    null
  );

  const hookData = useTimeRecords(usuario.id);

  const estadoActual =
    optimisticState ?? propEstadoActual ?? hookData.estadoActual;
  const tiempoTrabajado = propTiempoTrabajado ?? hookData.tiempoTrabajado;
  const availableActions = hookData.availableActions;
  const performAction = hookData.performAction;
  const error = hookData.error;

  useEffect(() => {
    const timer = setInterval(() => setHoraActual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (optimisticState !== null) {
      const timeout = setTimeout(() => {
        setOptimisticState(null);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [optimisticState]);

  const handleAction = async (action: "entrada" | "salida") => {
    if (action === "salida") {
      setShowConfirmModal(true);
      return;
    }

    setOptimisticState(action === "entrada" ? "trabajando" : "parado");

    try {
      await performAction(action);
      onStatusChange?.();
    } catch (err) {
      setOptimisticState(null);
      console.error("Error performing action:", err);
    }
  };

  const handleConfirmStop = async () => {
    setShowConfirmModal(false);
    setOptimisticState("parado");

    try {
      await performAction("salida");
      onStatusChange?.();
    } catch (err) {
      setOptimisticState(null);
      console.error("Error performing action:", err);
    }
  };

  const handleAbsenceSuccess = () => {
    onStatusChange?.();
  };

  const getStatusDisplay = () => {
    switch (estadoActual) {
      case "trabajando":
        return {
          texto: "TRABAJANDO",
          color: "text-green-600",
          bgColor: "bg-green-100",
          dotColor: "bg-green-500",
          pulse: true,
        };
      default:
        return {
          texto: "PARADO",
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          dotColor: "bg-gray-500",
          pulse: false,
        };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="clock-container bg-white/10 backdrop-blur rounded-3xl shadow-2xl p-12 text-center">
          <div className="text-5xl md:text-7xl font-mono font-bold text-white pb-4">
            {format(horaActual, "HH:mm:ss")}
          </div>

          <div className="text-lg text-white/70 pb-8">
            {format(horaActual, "EEEE, d 'de' MMMM", { locale: es })}
          </div>

          <div
            className={`inline-flex items-center gap-3 px-6 py-3 rounded-full ${status.bgColor} border-2 border-current/20 transition-all duration-300`}
          >
            <span
              className={`w-4 h-4 rounded-full ${
                status.dotColor
              } transition-all duration-300 ${
                status.pulse ? "animate-pulse" : ""
              }`}
            />
            <span
              className={`font-bold text-lg ${status.color} transition-all duration-300`}
            >
              {status.texto}
            </span>
          </div>

          <div className="flex items-end gap-4 justify-center pt-8">
            <div className="text-2xl md:text-4xl font-bold text-white ">
              {tiempoTrabajado}
            </div>
            <div className="text-white/60 pb-1 text-nowrap">
              Tiempo trabajado hoy
            </div>
          </div>
        </div>

        <div className="buttons-container flex flex-col sm:flex-row gap-4 justify-center">
          {availableActions.map((actionConfig) => {
            if (actionConfig.action === "entrada") {
              return (
                <PrimaryButton
                  key={actionConfig.action}
                  onClick={() => handleAction(actionConfig.action)}
                >
                  <FiPlay className="w-6 h-6" />
                  INICIAR
                </PrimaryButton>
              );
            }

            if (actionConfig.action === "salida") {
              return (
                <SecondaryButton
                  key={actionConfig.action}
                  onClick={() => handleAction(actionConfig.action)}
                >
                  <FiSquare className="w-6 h-6 text-red-400" />
                  <span className="text-red-400">PARAR</span>
                </SecondaryButton>
              );
            }

            return null;
          })}
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => setShowAbsenceForm(true)}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm group cursor-pointer"
          >
            <FiAlertCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="underline underline-offset-4">
              ¿Necesitas reportar una ausencia o tardanza?
            </span>
          </button>
        </div>

        <div className="flex justify-center gap-6 md:hidden text-white pt-12">
          <Link to="/politica-privacidad" className="hover:underline">
            Política de Privacidad
          </Link>
          <Link to="/aviso-legal" className="hover:underline">
            Aviso Legal
          </Link>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onConfirm={handleConfirmStop}
        onCancel={() => setShowConfirmModal(false)}
        title="¿Parar el reloj?"
        message="Vas a parar el tiempo de trabajo. Podrás volver a iniciarlo cuando quieras."
        confirmText="Sí, parar"
        cancelText="Cancelar"
      />

      {showAbsenceForm && (
        <AbsenceForm
          usuario={usuario}
          onClose={() => setShowAbsenceForm(false)}
          onSuccess={handleAbsenceSuccess}
        />
      )}
    </div>
  );
}
