import { useState, useEffect } from "react";
import { AutoEntryService } from "@/services/auto-entry-service";
import { useSecretSequence } from "@/hooks/useSecretSequence";
import { HolidayVacationPicker } from "@/components/HolidayVacationPicker";
import { GenerateInformes } from "@/components/GenerateInformes";
import { AdvancedWorkSettings } from "@/components/AdvancedWorkSettings";
import { PasswordChangeBlock } from "./PasswordChangeBlock";
import SecondaryButton from "./ui/SecondaryButton";
import { FiSave, FiCheck, FiX } from "react-icons/fi";
import { RegistroTiempo, Usuario } from "@/types";

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
    horaEntradaMin: "08:45",
    horaEntradaMax: "09:00",
    horaSalidaMin: "17:00",
    horaSalidaMax: "17:30",
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

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
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

      {isUnlocked && (
        <AdvancedWorkSettings
          settings={settings}
          onSettingsChange={setSettings}
          onLock={lock}
        />
      )}

      <div className="flex justify-end items-center gap-3">
        <SecondaryButton
          onClick={saveSettings}
          disabled={isSaving || isLoading}
          darkBg
          borderColor="white"
        >
          {getButtonContent()}
        </SecondaryButton>
      </div>
    </div>
  );
}