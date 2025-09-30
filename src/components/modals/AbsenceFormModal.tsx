import { useState, useRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  FiCalendar,
  FiClock,
  FiAlertCircle,
  FiX,
  FiUpload,
  FiFile,
} from "react-icons/fi";
import { CustomCalendar } from "@/components/ui/CustomCalendar";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { AbsenceService } from "@/services/absence-service";
import type { Usuario, AbsenceType } from "@/types";
import { CustomInput } from "../ui/CustomInput";
import { Toast } from "@/components/ui/Toast";

interface AbsenceFormModalProps {
  usuario: Usuario;
  onClose: () => void;
  onSuccess: () => void;
}

export function AbsenceFormModal({
  usuario,
  onClose,
  onSuccess,
}: AbsenceFormModalProps) {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [tipoAusencia, setTipoAusencia] = useState<AbsenceType | "">("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [razon, setRazon] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calendarTriggerRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const absenceTypes = [
    { value: "tardanza", label: "Tardanza (Llegada tarde)" },
    { value: "salida_temprana", label: "Salida Temprana" },
    { value: "ausencia_parcial", label: "Ausencia Parcial (Durante el día)" },
    { value: "ausencia_completa", label: "Ausencia de Día Completo" },
    { value: "permiso_medico", label: "Permiso Médico" },
    { value: "permiso_personal", label: "Permiso Personal" },
  ];

  const absenceReasons = AbsenceService.getAbsenceReasons();

  const handleCalendarSelect = (dates: string[]) => {
    setSelectedDates(dates);
    setShowCalendar(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("El archivo no puede superar los 5MB");
        return;
      }

      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
      ];
      if (!allowedTypes.includes(file.type)) {
        setError("Solo se permiten archivos PDF o imágenes (JPG, PNG)");
        return;
      }

      setSelectedFile(file);
      setError(null);
    }
  };

  const validateForm = (): string | null => {
    if (selectedDates.length === 0)
      return "Debes seleccionar al menos una fecha";
    if (!tipoAusencia) return "Debes seleccionar el tipo de ausencia";
    if (!razon) return "Debes seleccionar un motivo";

    if (tipoAusencia !== "ausencia_completa") {
      if (!horaInicio) return "Debes indicar la hora de inicio";
      if (!horaFin) return "Debes indicar la hora de fin";

      const inicio = horaInicio.split(":").map(Number);
      const fin = horaFin.split(":").map(Number);
      const inicioMinutes = inicio[0] * 60 + inicio[1];
      const finMinutes = fin[0] * 60 + fin[1];

      if (finMinutes <= inicioMinutes) {
        return "La hora de fin debe ser posterior a la hora de inicio";
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await AbsenceService.createAbsence({
        usuarioId: usuario.id,
        fechas: selectedDates.map((d) => new Date(d)),
        tipoAusencia: tipoAusencia as AbsenceType,
        horaInicio: tipoAusencia === "ausencia_completa" ? "00:00" : horaInicio,
        horaFin: tipoAusencia === "ausencia_completa" ? "23:59" : horaFin,
        razon,
        comentarios: comentarios || undefined,
        file: selectedFile || undefined,
        createdBy: usuario.id,
        isAdmin : usuario.isAdmin
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err)
      console.log(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-white border-b border-hielo/30 p-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 rounded-2xl">
            <FiAlertCircle className="text-teal text-2xl" />
            <h2 className="text-2xl font-bold text-azul-profundo">
              Reportar Ausencia
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hielo/20 rounded-lg transition-colors"
          >
            <FiX className="w-6 h-6 text-azul-profundo" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6 overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <FiAlertCircle className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-azul-profundo">
              Fecha de la Ausencia
            </label>
            <button
              ref={calendarTriggerRef}
              onClick={() => setShowCalendar(true)}
              className="flex items-center gap-2 px-4 py-3 bg-hielo/20 border border-hielo/50 rounded-xl text-azul-profundo hover:bg-hielo/30 transition-colors"
            >
              <FiCalendar className="w-5 h-5" />
              <span>
                {selectedDates.length > 0
                  ? selectedDates.length === 1
                    ? format(
                        new Date(selectedDates[0]),
                        "EEEE, dd 'de' MMMM yyyy",
                        { locale: es }
                      )
                    : `${selectedDates.length} días seleccionados`
                  : "Seleccionar fecha"}
              </span>
            </button>
          </div>

          <CustomDropdown
            options={absenceTypes}
            value={tipoAusencia}
            onChange={setTipoAusencia}
            placeholder="Seleccionar tipo de ausencia"
            className="w-full"
          />

          {tipoAusencia !== "ausencia_completa" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-azul-profundo">
                  Hora de Inicio
                </label>
                <div className="relative">
                  <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-azul-profundo/60" />
                  <CustomInput
                    type="time"
                    variant="lightBg"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border rounded-xl bg-hielo/20 border-hielo/50 text-azul-profundo focus:ring-2 focus:ring-teal focus:border-teal focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-azul-profundo">
                  Hora de Fin
                </label>
                <div className="relative">
                  <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-azul-profundo/60" />
                  <CustomInput
                    type="time"
                    variant="lightBg"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border rounded-xl bg-hielo/20 border-hielo/50 text-azul-profundo focus:ring-2 focus:ring-teal focus:border-teal focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          <CustomDropdown
            options={absenceReasons}
            value={razon}
            onChange={setRazon}
            placeholder="Seleccionar motivo"
            className="w-full"
          />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-azul-profundo">
              Comentarios Adicionales (Opcional)
            </label>
            <textarea
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              placeholder="Añade más detalles sobre la ausencia..."
              rows={4}
              className="w-full px-4 py-3 border rounded-xl bg-hielo/20 border-hielo/50 text-azul-profundo focus:ring-2 focus:ring-teal focus:border-teal focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-azul-profundo">
              Documento Justificativo (Opcional)
            </label>
            <p className="text-xs text-azul-profundo/60 mb-2">
              Adjunta un justificante médico, documento oficial, etc. (PDF o
              imagen, máx. 5MB)
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!selectedFile ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-hielo/50 rounded-xl text-azul-profundo/70 hover:border-teal hover:text-teal hover:bg-hielo/20 transition-all"
              >
                <FiUpload className="w-5 h-5" />
                <span>Seleccionar archivo</span>
              </button>
            ) : (
              <div className="flex items-center justify-between p-3 bg-hielo/20 border border-hielo/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <FiFile className="w-5 h-5 text-teal" />
                  <span className="text-sm text-azul-profundo">
                    {selectedFile.name}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-1 hover:bg-red-100 rounded transition-colors"
                >
                  <FiX className="w-4 h-4 text-red-500" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-hielo/30 flex gap-3 flex-shrink-0">
          <SecondaryButton onClick={onClose} className="flex-1">
            Cancelar
          </SecondaryButton>
          <PrimaryButton
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              "Reportar Ausencia"
            )}
          </PrimaryButton>
        </div>
      </div>

      {showCalendar && (
        <CustomCalendar
          selectedDates={selectedDates}
          onBulkSelect={handleCalendarSelect}
          onClose={() => setShowCalendar(false)}
          triggerRef={calendarTriggerRef}
          allowPastDates={true}
        />
      )}
    </div>
  );
}
