import { useState } from "react";
import { FiEdit3 } from "react-icons/fi";
import type { RegistroTiempo, Usuario } from "@/types";
import { TimeRecordCorrectionModal } from "@/components/modals/TimeRecordCorrectionModal";

interface UserRecordEditProps {
  record: RegistroTiempo;
  currentUser: Usuario;
  onSuccess: () => void;
}

export function UserRecordEdit({
  record,
  currentUser,
  onSuccess,
}: UserRecordEditProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  const handleSuccess = () => {
    setSuccessMessage(true);
    setTimeout(() => setSuccessMessage(false), 3000);
    onSuccess();
  };

  return (
    <>
      <button
        onClick={() => setShowEditModal(true)}
        className="p-2 text-azul-profundo/50 hover:text-azul-profundo hover:bg-hielo/20 rounded-lg transition-colors"
        title="Solicitar cambio en este registro"
      >
        <FiEdit3 className="w-4 h-4" />
      </button>

      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg">
          Solicitud de cambio enviada para aprobación
        </div>
      )}

      <TimeRecordCorrectionModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        record={record}
        user={currentUser}
        currentUser={currentUser}
        onSuccess={handleSuccess}
        isUserRequest={true}
      />
    </>
  );
}
