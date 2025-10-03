import { useState, useEffect } from "react";
import { FiUsers, FiRefreshCw } from "react-icons/fi";
import type { Usuario } from "@/types";
import { UsersList } from "@/components/tabs/admin/UsersList";
import { AdminService } from "@/services/admin-service";

interface UsersManagementProps {
  currentUser: Usuario;
}

export function UsersManagement({ currentUser }: UsersManagementProps) {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allUsers = await AdminService.getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = (user: Usuario) => {
    setSelectedUser(user);
  };

  const handleUsersUpdated = () => {
    loadUsers();
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  };

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}

      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
        <div className="flex items-center gap-2 pb-4">
          <FiUsers className="w-6 h-6 text-white" />
          <h2 className="text-2xl font-semibold text-white">
            Gestión de Usuarios
          </h2>
        </div>

        <p className="text-white/70 mb-6">
          Administra los usuarios del sistema: crear, editar, activar/desactivar
          y eliminar cuentas.
        </p>

        {isLoading ? (
          <div className="flex flex-col gap-4 items-center justify-center py-12">
            <FiRefreshCw className="w-8 h-8 animate-spin text-white/50" />
            <div className="text-white">Cargando usuarios...</div>
          </div>
        ) : (
          <UsersList
            users={users}
            selectedUser={selectedUser}
            currentUser={currentUser}
            onUserSelect={handleUserSelect}
            onUsersUpdated={handleUsersUpdated}
            onError={handleError}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
