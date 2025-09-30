import { useState, useEffect } from "react";
import { useSecretSequence } from "@/hooks/useSecretSequence";
import { HolidayVacationPicker } from "@/components/HolidayVacationPicker";
import { GenerateInformes } from "@/components/GenerateInformes";
import { AdvancedWorkSettings } from "@/components/AdvancedWorkSettings";
import { PasswordChangeBlock } from "./PasswordChangeBlock";
import SecondaryButton from "./ui/SecondaryButton";
import { FiSave, FiCheck, FiX } from "react-icons/fi";
import { RegistroTiempo, Usuario, Absence } from "@/types";
import { supabase } from "@/lib/supabase";
import { AbsenceService } from "@/services/absence-service";

interface WorkSettingsProps {
  usuario: Usuario;
  registros?: RegistroTiempo[];
}

export function WorkSettings({ usuario, registros = [] }: WorkSettingsProps) {
  const [settings, setSettings] = useState<Usuario>(usuario);
  const [daysOff, setDaysOff] = useState<Absence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const { isUnlocked, lock } = useSecretSequence({
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

  const loadDiasLibres = async () => {
    try {
      const absences = await AbsenceService.getAbsencesByUser(
        usuario.id,
        undefined,
        undefined,
        true 
      );
      console.log("All absences for user:", absences);
      const dayOffAbsences = absences.filter(
        (a) => a.tipoAusencia === "dia_libre"
      );
      console.log("Filtered days off:", dayOffAbsences);
      setDaysOff(dayOffAbsences);
    } catch (error) {
      console.error("Error loading dias libres:", error);
    }
  };

  const handleDeleteDayOff = async (absenceId: string) => {
    try {
      await AbsenceService.deleteAbsence(absenceId);
      await loadDiasLibres();
    } catch (error) {
      console.error("Error deleting day off:", error);
    }
  };

  useEffect(() => {
    setSettings(usuario);
    loadDiasLibres();
  }, [usuario]);

  const saveSettings = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      const { error } = await supabase
        .from("usuarios")
        .update({
          horas_diarias: settings.horas_diarias,
          horas_viernes: settings.horas_viernes,
          hora_entrada_min: settings.hora_entrada_min,
          hora_entrada_max: settings.hora_entrada_max,
          hora_salida_min: settings.hora_salida_min,
          hora_salida_max: settings.hora_salida_max,
          hora_salida_viernes_min: settings.hora_salida_viernes_min,
          hora_salida_viernes_max: settings.hora_salida_viernes_max,
          hora_inicio_descanso: settings.hora_inicio_descanso,
          hora_fin_descanso: settings.hora_fin_descanso,
          duracion_descanso_min: settings.duracion_descanso_min,
          duracion_descanso_max: settings.duracion_descanso_max,
          include_lunch_break: settings.include_lunch_break,
          auto_entry_enabled: settings.auto_entry_enabled,
        })
        .eq("id", usuario.id);

      if (error) throw error;
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
        daysOff={daysOff}
        onRefresh={loadDiasLibres}
        onDelete={handleDeleteDayOff}
        currentUserId={usuario.id}
        currentUser={usuario}
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
