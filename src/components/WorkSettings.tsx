import { useState, useEffect } from "react";
import { AutoEntryService } from "@/services/auto-entry-service";
import { useSecretSequence } from "@/hooks/useSecretSequence";
import { HolidayVacationPicker } from "@/components/HolidayVacationPicker";
import { GenerateInformes } from "@/components/GenerateInformes";
import { AdvancedWorkSettings } from "@/components/AdvancedWorkSettings";
import { PasswordChangeBlock } from "./PasswordChangeBlock";
import SecondaryButton from "./ui/SecondaryButton";
import { FiSave, FiCheck, FiX } from "react-icons/fi";

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  firstLogin?: boolean;
  isAdmin: boolean;
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="text-red-800 text-sm">
              Secuencia: {progress}/{totalSteps}
            </div>
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < progress ? "bg-red-500" : "bg-red-200"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {isUnlocked && (
        <AdvancedWorkSettings
          settings={settings}
          onSettingsChange={setSettings}
          onLock={lock}
        />
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
