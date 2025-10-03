import { useState } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiShield,
  FiUserCheck,
  FiUserX,
} from "react-icons/fi";
import type { Usuario } from "@/types";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { UserFormModal } from "@/components/modals/UserFormModal";
import type { UserFormData } from "@/components/forms/CreateUserForm";
import { AdminService } from "@/services/admin-service";

interface UsersListProps {
  users: Usuario[];
  selectedUser: Usuario | null;
  currentUser: Usuario;
  onUserSelect: (user: Usuario) => void;
  onUsersUpdated: () => void;
  onError: (error: string) => void;
  isLoading: boolean;
}

export function UsersList({
  users,
  selectedUser,
  currentUser,
  onUserSelect,
  onUsersUpdated,
  onError,
  isLoading,
}: UsersListProps) {
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
  }>({ isOpen: false, userId: "", userName: "" });
  const [deactivateConfirm, setDeactivateConfirm] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
    currentStatus: boolean;
  }>({ isOpen: false, userId: "", userName: "", currentStatus: true });

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowUserForm(true);
  };

  const handleEditUser = (user: Usuario) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (userId === currentUser.id) {
      onError("No puedes eliminar tu propia cuenta");
      return;
    }

    setDeleteConfirm({
      isOpen: true,
      userId,
      userName,
    });
  };

  const handleToggleUserStatus = (user: Usuario) => {
    if (user.id === currentUser.id) {
      onError("No puedes cambiar el estado de tu propia cuenta");
      return;
    }

    setDeactivateConfirm({
      isOpen: true,
      userId: user.id,
      userName: user.nombre,
      currentStatus: user.isActive,
    });
  };

  const confirmToggleUserStatus = async () => {
    try {
      await AdminService.updateUserActiveStatus(
        deactivateConfirm.userId,
        !deactivateConfirm.currentStatus
      );
      onUsersUpdated();
    } catch (err) {
      onError(
        err instanceof Error ? err.message : "Error updating user status"
      );
    } finally {
      setDeactivateConfirm({
        isOpen: false,
        userId: "",
        userName: "",
        currentStatus: true,
      });
    }
  };

  const confirmDeleteUser = async () => {
    try {
      await AdminService.deleteUser(deleteConfirm.userId);
      onUsersUpdated();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error deleting user");
    } finally {
      setDeleteConfirm({ isOpen: false, userId: "", userName: "" });
    }
  };

  const handleSubmitForm = async (userData: UserFormData) => {
    try {
      setIsFormLoading(true);

      if (editingUser) {
        await AdminService.updateUser(editingUser.id, userData);
      } else {
        await AdminService.createUser(userData);
      }

      onUsersUpdated();
      setShowUserForm(false);
      setEditingUser(null);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error saving user");
    } finally {
      setIsFormLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="text-white/80 text-sm">
          {users.length} usuario{users.length !== 1 ? "s" : ""} en total
        </div>
        <PrimaryButton onClick={handleCreateUser} size="sm">
          <FiPlus className="w-4 h-4" />
          <span>Crear Usuario</span>
        </PrimaryButton>
      </div>

      <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto">
        {users.map((user) => (
          <div
            key={user.id}
            className={`group w-[120vw] md:w-full p-4 rounded-xl border transition-all duration-200 ${
              !user.isActive
                ? "opacity-60 bg-gray-500/10 border-gray-500/20"
                : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`font-semibold text-base truncate ${
                      !user.isActive
                        ? "text-white/50 line-through"
                        : "text-white"
                    }`}
                  >
                    {user.nombre}
                  </span>
                  {user.isAdmin && (
                    <FiShield
                      className="w-4 h-4 text-yellow-400 flex-shrink-0"
                      title="Administrador"
                    />
                  )}
                  {!user.isActive && (
                    <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded font-medium">
                      Inactivo
                    </span>
                  )}
                </div>
                <div
                  className={`text-sm truncate ${
                    !user.isActive ? "text-white/40" : "text-white/60"
                  }`}
                >
                  {user.email}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleToggleUserStatus(user)}
                  disabled={user.id === currentUser.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    user.id === currentUser.id
                      ? "bg-white/5 text-white/30 cursor-not-allowed"
                      : user.isActive
                      ? "text-orange-300 hover:bg-orange-500/10"
                      : "text-green-300 hover:bg-green-500/10"
                  }`}
                  title={
                    user.id === currentUser.id
                      ? "No puedes modificar tu propia cuenta"
                      : user.isActive
                      ? "Desactivar usuario"
                      : "Activar usuario"
                  }
                >
                  {user.isActive ? (
                    <>
                      <FiUserX className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Desactivar</span>
                    </>
                  ) : (
                    <>
                      <FiUserCheck className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Activar</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleEditUser(user)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-300 hover:bg-blue-500/10 transition-all whitespace-nowrap"
                  title="Editar usuario"
                >
                  <FiEdit2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Editar</span>
                </button>

                <button
                  onClick={() => handleDeleteUser(user.id, user.nombre)}
                  disabled={user.id === currentUser.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    user.id === currentUser.id
                      ? "bg-white/5 text-white/30 cursor-not-allowed"
                      : "text-red-300 hover:bg-red-500/10"
                  }`}
                  title={
                    user.id === currentUser.id
                      ? "No puedes eliminar tu propia cuenta"
                      : "Eliminar usuario"
                  }
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <UserFormModal
        isOpen={showUserForm}
        onClose={() => setShowUserForm(false)}
        onSubmit={handleSubmitForm}
        isLoading={isFormLoading}
        editingUser={editingUser}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onConfirm={confirmDeleteUser}
        onCancel={() =>
          setDeleteConfirm({ isOpen: false, userId: "", userName: "" })
        }
        title="Eliminar Usuario"
        message={`¿Estás seguro de que quieres eliminar a ${deleteConfirm.userName}? Esta acción no se puede deshacer y eliminará todos sus registros de tiempo.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      <ConfirmModal
        isOpen={deactivateConfirm.isOpen}
        onConfirm={confirmToggleUserStatus}
        onCancel={() =>
          setDeactivateConfirm({
            isOpen: false,
            userId: "",
            userName: "",
            currentStatus: true,
          })
        }
        title={
          deactivateConfirm.currentStatus
            ? "Desactivar Usuario"
            : "Activar Usuario"
        }
        message={
          deactivateConfirm.currentStatus
            ? `¿Estás seguro de que quieres desactivar a ${deactivateConfirm.userName}? El usuario no podrá acceder al sistema hasta que sea reactivado.`
            : `¿Estás seguro de que quieres reactivar a ${deactivateConfirm.userName}? El usuario podrá volver a acceder al sistema.`
        }
        confirmText={deactivateConfirm.currentStatus ? "Desactivar" : "Activar"}
        cancelText="Cancelar"
      />
    </>
  );
}
