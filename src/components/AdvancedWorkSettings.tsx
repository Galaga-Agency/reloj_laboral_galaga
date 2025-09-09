import { FiClock, FiEyeOff } from "react-icons/fi";
import { CustomInput } from "@/components/ui/CustomInput";
import { Checkbox } from "@/components/ui/Checkbox";

interface WorkSettings {
  horasDiarias: number;
  horaEntradaMin: string;
  horaEntradaMax: string;
  horaSalidaMin: string;
  horaSalidaMax: string;
  diasLibres: string[];
  autoEntryEnabled: boolean;
}

interface AdvancedWorkSettingsProps {
  settings: WorkSettings;
  onSettingsChange: (settings: WorkSettings) => void;
  onLock: () => void;
}

export function AdvancedWorkSettings({
  settings,
  onSettingsChange,
  onLock,
}: AdvancedWorkSettingsProps) {
  const updateSetting = <K extends keyof WorkSettings>(
    key: K,
    value: WorkSettings[K]
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="bg-red-100 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-2 border-red-400">
      <div className="flex items-center justify-between pb-6">
        <div className="flex items-center gap-3">
          <FiClock className="text-2xl text-teal" />
          <h2 className="text-2xl font-bold text-azul-profundo">
            Horario de Trabajo
          </h2>
          <span className="bg-red-200 text-red-800 text-xs px-2 py-1 rounded-full">
            Configuración Avanzada
          </span>
        </div>
        <button
          onClick={onLock}
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
              updateSetting("horasDiarias", Number(e.target.value))
            }
          />

          <CustomInput
            label="Hora entrada (mínima)"
            type="time"
            value={settings.horaEntradaMin}
            onChange={(e) => updateSetting("horaEntradaMin", e.target.value)}
          />

          <CustomInput
            label="Hora entrada (máxima)"
            type="time"
            value={settings.horaEntradaMax}
            onChange={(e) => updateSetting("horaEntradaMax", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-4">
          <Checkbox
            checked={settings.autoEntryEnabled}
            onChange={(checked) => updateSetting("autoEntryEnabled", checked)}
            label="Activar entradas automáticas"
            description="Genera entradas automáticamente cuando no fiches"
          />

          <CustomInput
            label="Hora salida (mínima)"
            type="time"
            value={settings.horaSalidaMin}
            onChange={(e) => updateSetting("horaSalidaMin", e.target.value)}
          />

          <CustomInput
            label="Hora salida (máxima)"
            type="time"
            value={settings.horaSalidaMax}
            onChange={(e) => updateSetting("horaSalidaMax", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
