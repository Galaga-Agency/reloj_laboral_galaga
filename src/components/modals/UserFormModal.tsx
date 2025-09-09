import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import {
  CreateUserForm,
  type UserFormData,
} from "@/components/forms/CreateUserForm";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: UserFormData) => Promise<void>;
  isLoading: boolean;
  editingUser?: {
    id: string;
    nombre: string;
    email: string;
    isAdmin: boolean;
  } | null;
}

export function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editingUser,
}: UserFormModalProps) {
  if (!isOpen) return null;

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
      <div className="bg-white rounded-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-6">
          <h3 className="text-2xl font-bold text-azul-profundo">
            {editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
          </h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 cursor-pointer text-azul-profundo/60 hover:text-azul-profundo hover:bg-hielo/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <CreateUserForm
          onSubmit={onSubmit}
          onCancel={onClose}
          isLoading={isLoading}
          editingUser={editingUser}
        />
      </div>
    </div>,
    document.body
  );
}
