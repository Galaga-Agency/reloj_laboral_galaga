import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import { CustomInput } from "@/components/ui/CustomInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import type { Absence, Usuario } from "@/types";
import React from "react";

interface AbsenceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (updates: {
    fecha?: Date;
    horaInicio?: string;
    horaFin?: string;
    razon?: string;
    comentarios?: string;
    // 🔑 new: edited_* for clarity
    editedFecha?: Date;
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

  const [formData, setFormData] = React.useState({
    fecha: editingAbsence.fecha.toISOString().split("T")[0],
    horaInicio: editingAbsence.horaInicio,
    horaFin: editingAbsence.horaFin,
    razon: editingAbsence.razon,
    comentarios: editingAbsence.comentarios || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const updates = {
      fecha: new Date(formData.fecha),
      horaInicio: formData.horaInicio,
      horaFin: formData.horaFin,
      razon: formData.razon,
      comentarios: formData.comentarios,
      // 🔑 duplicate into edited_* if admin is editing
      ...(currentAdmin.isAdmin && {
        editedFecha: new Date(formData.fecha),
        editedHoraInicio: formData.horaInicio,
        editedHoraFin: formData.horaFin,
        editedRazon: formData.razon,
        editedComentarios: formData.comentarios,
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
          <CustomInput
            label="Fecha"
            type="date"
            name="fecha"
            value={formData.fecha}
            onChange={handleChange}
            variant="lightBg"
          />

          <div className="grid grid-cols-2 gap-4">
            <CustomInput
              label="Hora inicio"
              type="time"
              name="horaInicio"
              value={formData.horaInicio}
              onChange={handleChange}
              variant="lightBg"
            />
            <CustomInput
              label="Hora fin"
              type="time"
              name="horaFin"
              value={formData.horaFin}
              onChange={handleChange}
              variant="lightBg"
            />
          </div>

          <CustomInput
            label="Motivo"
            type="text"
            name="razon"
            value={formData.razon}
            onChange={handleChange}
            variant="lightBg"
          />

          <CustomInput
            label="Comentarios"
            type="text"
            name="comentarios"
            value={formData.comentarios}
            onChange={handleChange}
            variant="lightBg"
          />
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
    </div>,
    document.body
  );
}
