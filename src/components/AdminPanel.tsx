import { useState, useEffect } from "react";
import { AdminService, type TimeRange } from "@/services/admin-service";
import type { Usuario, RegistroTiempo } from "@/types";
import { UsersList } from "@/components/UsersList";
import { UserRecordsList } from "@/components/UserRecordsList";
import { AdminSystemDocumentation } from "./AdminSystemDocs";
import { AdminUserReports } from "@/components/AdminUserReports";
import { useSecretSequence } from "@/hooks/useSecretSequence";

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
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const { isUnlocked, progress, totalSteps, lock } = useSecretSequence({
    sequence: ["s", "e", "c", "r", "e", "t"],
    resetTimeout: 5000,
    onSequenceComplete: () => {
      setMessage({
        type: "success",
        text: "Documentación de sistema desbloqueada",
      });
      setTimeout(() => setMessage(null), 2000);
    },
  });

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

  const handleUserSelect = async (user: Usuario) => {
    setSelectedUser(user);
  };

  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange as TimeRange);
  };

  const handleUsersUpdated = () => {
    loadUsers();
  };

  const handleRecordUpdated = () => {
    if (selectedUser) {
      loadUserRecords(selectedUser.id, timeRange);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    // Clear error after 5 seconds
    setTimeout(() => setError(null), 5000);
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UsersList
          users={users}
          selectedUser={selectedUser}
          currentUser={currentUser}
          onUserSelect={handleUserSelect}
          onUsersUpdated={handleUsersUpdated}
          onError={handleError}
        />

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

      {isUnlocked && (
        <AdminSystemDocumentation currentUser={currentUser} onLock={lock} />
      )}
    </div>
  );
}
