import { useState } from "react";
import {
  FiUsers,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiShield,
  FiUserCheck,
  FiUserX,
  FiRefreshCw,
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
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <FiUsers className="w-5 h-5 text-white" />
            <h2 className="text-xl font-semibold text-white">Usuarios</h2>
          </div>
          <PrimaryButton onClick={handleCreateUser} size="sm">
            <FiPlus className="w-4 h-4" />
            <span className="hidden md:block">Crear Usuario</span>
          </PrimaryButton>
        </div>

        <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col gap-4 items-center justify-center py-12">
              <FiRefreshCw className="w-8 h-8 mx-auto animate-spin text-white/50" />
              <div className="text-white">Cargando usuarios...</div>
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className={`w-[120vw] md:w-full p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                  !user.isActive
                    ? "opacity-50 bg-gray-500/10 border-gray-500/20 blur-[0.5px]"
                    : selectedUser?.id === user.id
                    ? "bg-white/20 border-white/30"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
                onClick={() => onUserSelect(user)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-medium ${
                          !user.isActive
                            ? "text-white/60 line-through"
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
                        <span className="text-xs bg-gray-500/20 text-gray-300 px-2 py-1 rounded-full">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-sm ${
                        !user.isActive ? "text-white/50" : "text-white/70"
                      }`}
                    >
                      {user.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleUserStatus(user);
                      }}
                      disabled={user.id === currentUser.id}
                      className={`p-1 rounded transition-colors ${
                        user.id === currentUser.id
                          ? "text-gray-400 cursor-not-allowed"
                          : user.isActive
                          ? "p-1 text-white hover:text-white/70 hover:bg-blue-500/10 rounded cursor-pointer"
                          : "p-1 text-white hover:text-white/70 hover:bg-blue-500/10 rounded cursor-pointer"
                      }`}
                      title={
                        user.isActive ? "Desactivar usuario" : "Activar usuario"
                      }
                    >
                      {user.isActive ? (
                        <FiUserCheck className="w-4 h-4" />
                      ) : (
                        <FiUserX className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditUser(user);
                      }}
                      className="p-1 text-white hover:text-white/70 hover:bg-blue-500/10 rounded cursor-pointer"
                      title="Editar usuario"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteUser(user.id, user.nombre);
                      }}
                      disabled={user.id === currentUser.id}
                      className={`p-1 rounded transition-colors ${
                        user.id === currentUser.id
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-red-400 cursor-pointer hover:text-red-300 hover:bg-red-500/10"
                      }`}
                      title="Eliminar usuario"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
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
