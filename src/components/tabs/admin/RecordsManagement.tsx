import { useState, useEffect } from "react";
import { FiClock, FiRefreshCw } from "react-icons/fi";
import type { Usuario, RegistroTiempo } from "@/types";
import type { TimeRange } from "@/services/admin-service";
import { AdminService } from "@/services/admin-service";
import { UserRecordsList } from "@/components/tabs/admin/UserRecordsList";
import { AdminUserReports } from "@/components/tabs/admin/AdminUserReports";
import { PendingRecordsChangesPanel } from "@/components/tabs/admin/PendingRecordsChangesPanel";
import { CustomDropdown } from "@/components/ui/CustomDropdown";

interface RecordsManagementProps {
  currentUser: Usuario;
  onRecordsChanged?: () => Promise<void>;
}

export function RecordsManagement({
  currentUser,
  onRecordsChanged,
}: RecordsManagementProps) {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [userRecords, setUserRecords] = useState<RegistroTiempo[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("past2days");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecordsLoading, setIsRecordsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const sortedRecords = records.sort((a, b) => {
        return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
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

  const handleUserSelect = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setSelectedUser(user);
    }
  };

  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange as TimeRange);
  };

  const handleRecordUpdated = () => {
    if (selectedUser) {
      loadUserRecords(selectedUser.id, timeRange);
    }
  };

  const handleChangesProcessed = async () => {
    if (selectedUser) {
      loadUserRecords(selectedUser.id, timeRange);
    }
    if (onRecordsChanged) {
      await onRecordsChanged();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}

      <PendingRecordsChangesPanel
        currentAdmin={currentUser}
        onChangesProcessed={handleChangesProcessed}
      />

      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
        <div className="flex items-center gap-2 pb-4">
          <FiClock className="w-6 h-6 text-white" />
          <h2 className="text-2xl font-semibold text-white">
            Gestión de Registros de Tiempo
          </h2>
        </div>

        <p className="text-white/70 mb-6">
          Visualiza y administra los registros de tiempo de los usuarios del
          sistema.
        </p>

        <div className="mb-6">
          <label className="block text-white/80 mb-2 text-sm font-medium">
            Seleccionar Usuario
          </label>
          {isLoading ? (
            <div className="flex items-center gap-2 text-white/70">
              <FiRefreshCw className="w-4 h-4 animate-spin" />
              <span>Cargando usuarios...</span>
            </div>
          ) : (
            <CustomDropdown
              options={users.map((u) => ({
                value: u.id,
                label: `${u.nombre} ${!u.isActive ? "(Inactivo)" : ""}`,
              }))}
              value={selectedUser?.id || ""}
              onChange={handleUserSelect}
              placeholder="Selecciona un usuario"
              variant="darkBg"
            />
          )}
        </div>

        <UserRecordsList
          selectedUser={selectedUser}
          userRecords={userRecords}
          timeRange={timeRange}
          isRecordsLoading={isRecordsLoading}
          currentAdmin={currentUser}
          onTimeRangeChange={handleTimeRangeChange}
          onRecordUpdated={handleRecordUpdated}
        />
      </div>

      {selectedUser && (
        <AdminUserReports
          selectedUser={selectedUser}
          userRecords={userRecords}
        />
      )}
    </div>
  );
}
