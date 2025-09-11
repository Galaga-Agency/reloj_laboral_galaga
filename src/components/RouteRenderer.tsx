import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "@/components/pages/LoginPage";
import { PasswordUpdatePage } from "@/components/pages/PasswordUpdatePage";
import { PasswordResetPage } from "@/components/pages/PasswordResetPage";
import { DashboardPage } from "@/components/pages/DashboardPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/utils/route-config";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { LegalNoticePage } from "./pages/LegalNoticePage";

export function RouteRenderer() {
  const { usuario, isLoading, isLoggingOut, isAuthenticated, logout } =
    useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isLoggingOut) {
    return <LoadingScreen message="Cerrando sesión..." />;
  }

  const needsPasswordUpdate = usuario?.firstLogin;

  return (
    <Routes>
      <Route
        path={ROUTES.LOGIN}
        element={
          isAuthenticated ? (
            <Navigate
              to={
                needsPasswordUpdate ? ROUTES.PASSWORD_UPDATE : ROUTES.DASHBOARD
              }
              replace
            />
          ) : (
            <LoginPage />
          )
        }
      />

      <Route
        path={ROUTES.PASSWORD_RESET}
        element={<PasswordResetPage onResetComplete={() => {}} />}
      />

      <Route
        path={ROUTES.PASSWORD_UPDATE}
        element={
          <ProtectedRoute
            isAuthenticated={isAuthenticated}
            redirectTo={ROUTES.LOGIN}
          >
            {needsPasswordUpdate ? (
              <PasswordUpdatePage usuario={usuario!} />
            ) : (
              <Navigate to={ROUTES.DASHBOARD} replace />
            )}
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute
            isAuthenticated={isAuthenticated}
            redirectTo={ROUTES.LOGIN}
          >
            {needsPasswordUpdate ? (
              <Navigate to={ROUTES.PASSWORD_UPDATE} replace />
            ) : (
              <DashboardPage usuario={usuario!} onLogout={logout} />
            )}
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.HOME}
        element={
          <Navigate
            to={(() => {
              if (!isAuthenticated) return ROUTES.LOGIN;
              if (needsPasswordUpdate) return ROUTES.PASSWORD_UPDATE;
              return ROUTES.DASHBOARD;
            })()}
            replace
          />
        }
      />

      <Route path="/politica-privacidad" element={<PrivacyPolicyPage />} />

      <Route path="/aviso-legal" element={<LegalNoticePage />} />

      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}
