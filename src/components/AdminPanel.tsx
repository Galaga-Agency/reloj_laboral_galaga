import { useState, useEffect } from "react";
import { AdminService, type TimeRange } from "@/services/admin-service";
import type { Usuario, RegistroTiempo } from "@/types";
import {
  FiUsers,
  FiClock,
  FiShield,
  FiPlus,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";
import { TimeRecordsUtils } from "@/utils/time-records";
import { DateFormatUtils } from "@/utils/date-format";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { UserFormModal } from "@/components/modals/UserFormModal";
import type { UserFormData } from "@/components/forms/CreateUserForm";
import { AdminSystemDocumentation } from "./AdminSystemDocs";
import { AdminUserReports } from "@/components/AdminUserReports";

interface AdminPanelProps {
  currentUser: Usuario;
}

export function AdminPanel({ currentUser }: AdminPanelProps) {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [userRecords, setUserRecords] = useState<RegistroTiempo[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("past2days");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecordsLoading, setIsRecordsLoading] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
  }>({ isOpen: false, userId: "", userName: "" });

  const timeRangeOptions = [
    { value: "yesterday", label: "Ayer" },
    { value: "past2days", label: "Últimos 2 días" },
    { value: "thisweek", label: "Esta semana" },
    { value: "past7days", label: "Últimos 7 días" },
    { value: "thismonth", label: "Este mes" },
    { value: "pastmonth", label: "Mes pasado" },
    { value: "all", label: "Todo el historial" },
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadUserRecords(selectedUser.id, timeRange);
    }
  }, [selectedUser, timeRange]);

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

  const loadUserRecords = async (userId: string, range: TimeRange) => {
    try {
      setIsRecordsLoading(true);
      setError(null);
      const records = await AdminService.getUserRecords(userId, range);

      // Sort records antichronologically (newest first)
      const sortedRecords = records.sort((a, b) => {
        const dateA =
          a.tipoRegistro === "entrada"
            ? a.fechaEntrada
            : a.fechaSalida || a.fechaEntrada;
        const dateB =
          b.tipoRegistro === "entrada"
            ? b.fechaEntrada
            : b.fechaSalida || b.fechaEntrada;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      setUserRecords(sortedRecords);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error loading user records"
      );
    } finally {
      setIsRecordsLoading(false);
    }
  };

  const handleUserSelect = async (user: Usuario) => {
    setSelectedUser(user);
  };

  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange as TimeRange);
  };

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
      setError("No puedes eliminar tu propia cuenta");
      return;
    }

    setDeleteConfirm({
      isOpen: true,
      userId,
      userName,
    });
  };

  const confirmDeleteUser = async () => {
    try {
      setError(null);
      await AdminService.deleteUser(deleteConfirm.userId);
      await loadUsers();
      if (selectedUser?.id === deleteConfirm.userId) {
        setSelectedUser(null);
        setUserRecords([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting user");
    } finally {
      setDeleteConfirm({ isOpen: false, userId: "", userName: "" });
    }
  };

  const handleSubmitForm = async (userData: UserFormData) => {
    try {
      setIsFormLoading(true);
      setError(null);

      if (editingUser) {
        await AdminService.updateUser(editingUser.id, userData);
      } else {
        await AdminService.createUser(userData);
      }

      await loadUsers();
      setShowUserForm(false);
      setEditingUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving user");
    } finally {
      setIsFormLoading(false);
    }
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-white">Cargando panel de administración...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      <div className="text-center pb-8">
        <h1 className="text-3xl font-bold text-white pb-2">
          Panel de Administración
        </h1>
        <p className="text-white/70">Gestiona usuarios y registros de tiempo</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}

      {/* Users Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            {users.map((user) => (
              <div
                key={user.id}
                className={`w-[120vw] md:w-full p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedUser?.id === user.id
                    ? "bg-white/20 border-white/30"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
                onClick={() => handleUserSelect(user)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {user.nombre}
                      </span>
                      {user.isAdmin && (
                        <FiShield
                          className="w-4 h-4 text-yellow-400 flex-shrink-0"
                          title="Administrador"
                        />
                      )}
                    </div>
                    <div className="text-white/70 text-sm">{user.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
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
            ))}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-unset justify-between pb-4">
            <div className="flex items-center gap-2">
              <FiClock className="w-5 h-5 text-white flex-shrink-0" />
              <h2 className="text-xl font-semibold text-white">
                {selectedUser
                  ? `Registros de ${selectedUser.nombre}`
                  : "Selecciona un usuario"}
              </h2>
            </div>

            {selectedUser && (
              <div className="w-48">
                <CustomDropdown
                  options={timeRangeOptions}
                  value={timeRange}
                  onChange={handleTimeRangeChange}
                  variant="dark"
                  className="text-sm"
                />
              </div>
            )}
          </div>

          {selectedUser ? (
            <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
              {isRecordsLoading ? (
                <div className="text-center flex flex-col items-center text-white/70 py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white mx-auto pb-3 rounded-full"></div>
                  Cargando registros...
                </div>
              ) : userRecords.length === 0 ? (
                <div className="text-center text-white/70 py-8">
                  Este usuario no tiene registros en el período seleccionado
                </div>
              ) : (
                userRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 flex-shrink-0">
                        {TimeRecordsUtils.getTypeIcon(record.tipoRegistro)}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {TimeRecordsUtils.getTypeText(record.tipoRegistro)}
                          </span>
                        </div>
                        <div className="text-sm text-white/70">
                          {DateFormatUtils.formatDate(record.fechaEntrada)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-white">
                        {record.tipoRegistro === "entrada"
                          ? DateFormatUtils.formatTime(record.fechaEntrada)
                          : DateFormatUtils.formatTime(
                              record.fechaSalida || record.fechaEntrada
                            )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="text-center text-white/70 py-8">
              Selecciona un usuario para ver sus registros
            </div>
          )}
        </div>
      </div>

      {/* User Reports Section */}
      {selectedUser && (
        <AdminUserReports
          selectedUser={selectedUser}
          userRecords={userRecords}
        />
      )}

      <AdminSystemDocumentation currentUser={currentUser} />

      {/* Modals */}
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
    </div>
  );
}
