import { FiClock, FiEyeOff } from "react-icons/fi";
import { CustomInput } from "@/components/ui/CustomInput";
import { Checkbox } from "@/components/ui/Checkbox";
import { Usuario } from "@/types";

interface AdvancedWorkSettingsProps {
  settings: Usuario;
  onSettingsChange: (settings: Usuario) => void;
  onLock: () => void;
}

export function AdvancedWorkSettings({
  settings,
  onSettingsChange,
  onLock,
}: AdvancedWorkSettingsProps) {
  const updateSetting = <K extends keyof Usuario>(
    key: K,
    value: Usuario[K]
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-2 border-red-400">
      <div className="flex items-center justify-between pb-6">
        <div className="flex items-center gap-3">
          <FiClock className="text-2xl text-teal" />
          <h2 className="text-2xl font-bold text-white">Horario de Trabajo</h2>
          <span className="bg-red-200 text-red-800 text-xs px-2 py-1 rounded-full">
            Configuración Avanzada
          </span>
        </div>
        <button
          onClick={onLock}
          className="text-sm text-white hover:text-gray-700 flex items-center gap-1"
        >
          <FiEyeOff className="w-4 h-4" />
          Ocultar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <CustomInput
            label="Horas diarias"
            type="number"
            min="1"
            max="12"
            value={settings.horas_diarias ?? ""}
            onChange={(e) =>
              updateSetting("horas_diarias", Number(e.target.value))
            }
          />

          <CustomInput
            label="Horas viernes"
            type="number"
            min="1"
            max="12"
            value={settings.horas_viernes ?? ""}
            onChange={(e) =>
              updateSetting("horas_viernes", Number(e.target.value))
            }
          />

          <CustomInput
            label="Hora entrada (mínima)"
            type="time"
            value={settings.hora_entrada_min || ""}
            onChange={(e) => updateSetting("hora_entrada_min", e.target.value)}
          />

          <CustomInput
            label="Hora entrada (máxima)"
            type="time"
            value={settings.hora_entrada_max || ""}
            onChange={(e) => updateSetting("hora_entrada_max", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-4">
          <Checkbox
            checked={settings.auto_entry_enabled ?? false}
            onChange={(checked) => updateSetting("auto_entry_enabled", checked)}
            label="Entradas automáticas"
            description="Genera entradas cuando no fiches"
          />

          <Checkbox
            checked={settings.include_lunch_break ?? false}
            onChange={(checked) =>
              updateSetting("include_lunch_break", checked)
            }
            label="Incluir descanso de comida"
            description="Cuenta el descanso en la jornada laboral"
          />

          <CustomInput
            label="Hora salida (mínima)"
            type="time"
            value={settings.hora_salida_min || ""}
            onChange={(e) =>
              updateSetting(
                "hora_salida_min",
                e.target.value || settings.hora_salida_min
              )
            }
          />

          <CustomInput
            label="Hora salida (máxima)"
            type="time"
            value={settings.hora_salida_max || ""}
            onChange={(e) =>
              updateSetting(
                "hora_salida_max",
                e.target.value || settings.hora_salida_max
              )
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <CustomInput
          label="Hora salida viernes (mínima)"
          type="time"
          value={settings.hora_salida_viernes_min || ""}
          onChange={(e) =>
            updateSetting(
              "hora_salida_viernes_min",
              e.target.value || settings.hora_salida_viernes_min
            )
          }
        />

        <CustomInput
          label="Hora salida viernes (máxima)"
          type="time"
          value={settings.hora_salida_viernes_max || ""}
          onChange={(e) =>
            updateSetting(
              "hora_salida_viernes_max",
              e.target.value || settings.hora_salida_viernes_max
            )
          }
        />

        <CustomInput
          label="Inicio descanso"
          type="time"
          value={settings.hora_inicio_descanso || ""}
          onChange={(e) =>
            updateSetting(
              "hora_inicio_descanso",
              e.target.value || settings.hora_inicio_descanso
            )
          }
        />

        <CustomInput
          label="Fin descanso"
          type="time"
          value={settings.hora_fin_descanso || ""}
          onChange={(e) =>
            updateSetting(
              "hora_fin_descanso",
              e.target.value || settings.hora_fin_descanso
            )
          }
        />

        <CustomInput
          label="Duración descanso (mínimo, min)"
          type="number"
          min="0"
          value={settings.duracion_descanso_min ?? ""}
          onChange={(e) =>
            updateSetting(
              "duracion_descanso_min",
              e.target.value
                ? Number(e.target.value)
                : settings.duracion_descanso_min
            )
          }
        />

        <CustomInput
          label="Duración descanso (máximo, min)"
          type="number"
          min="0"
          value={settings.duracion_descanso_max ?? ""}
          onChange={(e) =>
            updateSetting(
              "duracion_descanso_max",
              e.target.value
                ? Number(e.target.value)
                : settings.duracion_descanso_max
            )
          }
        />
      </div>
    </div>
  );
}
