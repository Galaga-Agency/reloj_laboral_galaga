import { createPortal } from "react-dom";
import { FiX, FiCalendar, FiClock } from "react-icons/fi";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { CustomCalendar } from "@/components/ui/CustomCalendar";
import { CustomInput } from "@/components/ui/CustomInput";
import type { Absence, Usuario } from "@/types";
import React, { useRef, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AbsenceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (updates: {
    fechas?: Date[];
    horaInicio?: string;
    horaFin?: string;
    razon?: string;
    comentarios?: string;
    editedFechas?: Date[];
    editedHoraInicio?: string;
    editedHoraFin?: string;
    editedRazon?: string;
    editedComentarios?: string;
  }) => Promise<void>;
  isLoading: boolean;
  editingAbsence: Absence | null;
  currentAdmin: Usuario;
}

export function AbsenceEditModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editingAbsence,
  currentAdmin,
}: AbsenceEditModalProps) {
  if (!isOpen || !editingAbsence) return null;

  const [selectedDates, setSelectedDates] = useState<string[]>(
    editingAbsence.fechas.map((d) => d.toISOString().split("T")[0])
  );
  const [horaInicio, setHoraInicio] = useState(editingAbsence.horaInicio);
  const [horaFin, setHoraFin] = useState(editingAbsence.horaFin);
  const [razon, setRazon] = useState(editingAbsence.razon);
  const [comentarios, setComentarios] = useState(
    editingAbsence.comentarios || ""
  );

  const calendarTriggerRef = useRef<HTMLButtonElement>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const handleSubmit = async () => {
    const updates = {
      fechas: selectedDates.map((d) => new Date(d)),
      horaInicio,
      horaFin,
      razon,
      comentarios,
      ...(currentAdmin.isAdmin && {
        editedFechas: selectedDates.map((d) => new Date(d)),
        editedHoraInicio: horaInicio,
        editedHoraFin: horaFin,
        editedRazon: razon,
        editedComentarios: comentarios,
      }),
    };
    await onSubmit(updates);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-6">
          <h3 className="text-2xl font-bold text-azul-profundo">
            Editar Ausencia
          </h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 cursor-pointer text-azul-profundo/60 hover:text-azul-profundo hover:bg-hielo/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Fecha con CustomCalendar */}
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
                        {
                          locale: es,
                        }
                      )
                    : `${selectedDates.length} días seleccionados`
                  : "Seleccionar fecha"}
              </span>
            </button>
          </div>

          {/* Horas */}
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

          {/* Razon */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-azul-profundo">
              Motivo
            </label>
            <CustomInput
              type="text"
              variant="lightBg"
              value={razon}
              onChange={(e) => setRazon(e.target.value)}
            />
          </div>

          {/* Comentarios */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-azul-profundo">
              Comentarios Adicionales
            </label>
            <textarea
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              rows={3}
              className="px-4 py-3 bg-hielo/20 border border-hielo/50 rounded-xl text-azul-profundo focus:ring-2 focus:ring-teal focus:border-teal focus:outline-none resize-none"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <SecondaryButton onClick={onClose} disabled={isLoading}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar Cambios"}
          </PrimaryButton>
        </div>
      </div>

      {/* CustomCalendar */}
      {showCalendar && (
        <CustomCalendar
          selectedDates={selectedDates}
          onBulkSelect={(dates) => {
            setSelectedDates(dates);
          }}
          onClose={() => setShowCalendar(false)}
          triggerRef={calendarTriggerRef}
          allowPastDates={true}
        />
      )}
    </div>,
    document.body
  );
}
