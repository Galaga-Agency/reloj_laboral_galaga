import { useState, useEffect } from "react";
import { AutoEntryService } from "@/services/auto-entry-service";
import { supabase } from "@/lib/supabase";
import { useSecretSequence } from "@/hooks/useSecretSequence";
import { HolidayVacationPicker } from "@/components/HolidayVacationPicker";
import { GenerateInformes } from "@/components/GenerateInformes";
import { Checkbox } from "@/components/ui/Checkbox";
import { CustomInput } from "@/components/ui/CustomInput";
import { FiClock, FiKey, FiSave, FiEyeOff, FiCheck, FiX } from "react-icons/fi";
import SecondaryButton from "./ui/SecondaryButton";
import { PasswordChangeBlock } from "./PasswordChangeBlock";

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  firstLogin?: boolean;
}

interface RegistroTiempo {
  id: string;
  usuarioId: string;
  fechaEntrada: Date;
  fechaSalida?: Date;
  tipoRegistro: "entrada" | "salida";
  esSimulado?: boolean;
}

interface WorkSettingsProps {
  usuario: Usuario;
  registros?: RegistroTiempo[];
}

interface WorkSettings {
  horasDiarias: number;
  horaEntradaMin: string;
  horaEntradaMax: string;
  horaSalidaMin: string;
  horaSalidaMax: string;
  diasLibres: string[];
  autoEntryEnabled: boolean;
}

export function WorkSettings({ usuario, registros = [] }: WorkSettingsProps) {
  const [settings, setSettings] = useState<WorkSettings>({
    horasDiarias: 8,
    horaEntradaMin: "08:30",
    horaEntradaMax: "09:30",
    horaSalidaMin: "17:30",
    horaSalidaMax: "18:30",
    diasLibres: [],
    autoEntryEnabled: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordError, setPasswordError] = useState<string>("");

  const { isUnlocked, progress, totalSteps, lock } = useSecretSequence({
    sequence: ["s", "e", "c", "r", "e", "t"],
    resetTimeout: 5000,
    onSequenceComplete: () => {
      setMessage({
        type: "success",
        text: "Configuración avanzada desbloqueada",
      });
      setTimeout(() => setMessage(null), 2000);
    },
  });

  useEffect(() => {
    loadSettings();
  }, [usuario.id]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const userSettings = await AutoEntryService.getUserWorkSettings(
        usuario.id
      );
      if (userSettings) {
        setSettings(userSettings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      setMessage({ type: "error", text: "Error cargando configuración" });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      await AutoEntryService.updateWorkSettings(usuario.id, settings);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const changePassword = async () => {
    setPasswordError("");

    if (passwordData.new !== passwordData.confirm) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }

    if (passwordData.new.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new,
      });

      if (error) throw error;

      setMessage({
        type: "success",
        text: "Contraseña actualizada correctamente",
      });
      setPasswordData({ current: "", new: "", confirm: "" });
      setShowPasswordChange(false);
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordError("Error cambiando contraseña");
    }
  };

  const getButtonContent = () => {
    if (isSaving) {
      return (
        <>
          <div className="w-5 h-5 border-2 border-blanco border-t-transparent rounded-full animate-spin"></div>
          Guardando...
        </>
      );
    }

    if (saveStatus === "success") {
      return (
        <>
          <FiCheck className="w-5 h-5" />
          Guardado correctamente
        </>
      );
    }

    if (saveStatus === "error") {
      return (
        <>
          <FiX className="w-5 h-5" />
          Error al guardar
        </>
      );
    }

    return (
      <>
        <FiSave className="w-5 h-5" />
        Guardar Configuración
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-white">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}
      {progress > 0 && !isUnlocked && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="text-yellow-800 text-sm">
              Secuencia: {progress}/{totalSteps}
            </div>
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < progress ? "bg-yellow-500" : "bg-yellow-200"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      {isUnlocked && (
        <div className="bg-blanco/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-2 border-yellow-300">
          <div className="flex items-center justify-between pb-6">
            <div className="flex items-center gap-3">
              <FiClock className="text-2xl text-teal" />
              <h2 className="text-2xl font-bold text-azul-profundo">
                Horario de Trabajo
              </h2>
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                Configuración Avanzada
              </span>
            </div>
            <button
              onClick={lock}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <FiEyeOff className="w-4 h-4" />
              Ocultar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <CustomInput
                label="Horas diarias de trabajo"
                type="number"
                min="1"
                max="12"
                value={settings.horasDiarias}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    horasDiarias: Number(e.target.value),
                  }))
                }
              />

              <CustomInput
                label="Hora entrada (mínima)"
                type="time"
                value={settings.horaEntradaMin}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    horaEntradaMin: e.target.value,
                  }))
                }
              />

              <CustomInput
                label="Hora entrada (máxima)"
                type="time"
                value={settings.horaEntradaMax}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    horaEntradaMax: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex flex-col gap-4">
              <Checkbox
                checked={settings.autoEntryEnabled}
                onChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    autoEntryEnabled: checked,
                  }))
                }
                label="Activar entradas automáticas"
                description="Genera entradas automáticamente cuando no fiches"
              />

              <CustomInput
                label="Hora salida (mínima)"
                type="time"
                value={settings.horaSalidaMin}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    horaSalidaMin: e.target.value,
                  }))
                }
              />

              <CustomInput
                label="Hora salida (máxima)"
                type="time"
                value={settings.horaSalidaMax}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    horaSalidaMax: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>
      )}
      <GenerateInformes
        registros={registros.filter((r) => r.usuarioId === usuario.id)}
        usuario={usuario}
      />
      <HolidayVacationPicker
        selectedDates={settings.diasLibres}
        onDatesChange={(dates) =>
          setSettings((prev) => ({ ...prev, diasLibres: dates }))
        }
      />
      <PasswordChangeBlock
        onMessage={(m) => {
          setMessage(m);
          // optional: auto-hide after 3s
          setTimeout(() => setMessage(null), 3000);
        }}
      />
      <div className="flex justify-end items-center gap-3">
        <SecondaryButton onClick={saveSettings} disabled={isSaving} darkBg>
          {getButtonContent()}
        </SecondaryButton>
      </div>
    </div>
  );
}
