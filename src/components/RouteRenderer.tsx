import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "@/components/pages/LoginPage";
import { PasswordUpdatePage } from "@/components/pages/PasswordUpdatePage";
import { PasswordResetPage } from "@/components/pages/PasswordResetPage";
import { DashboardPage } from "@/components/pages/DashboardPage";
import { PortalOficialPage } from "@/components/pages/PortalOficialPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { ROUTES, getRedirectPath } from "@/utils/route-config";
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
  const userRole = usuario?.role; // Get role directly from your auth context

  console.log("RouteRenderer - User role:", userRole, "User:", usuario); // DEBUG

  return (
    <Routes>
      <Route
        path={ROUTES.LOGIN}
        element={
          isAuthenticated ? (
            <Navigate
              to={
                getRedirectPath(ROUTES.LOGIN, usuario, userRole) ||
                ROUTES.DASHBOARD
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
              <Navigate
                to={
                  getRedirectPath(ROUTES.PASSWORD_UPDATE, usuario, userRole) ||
                  ROUTES.DASHBOARD
                }
                replace
              />
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
            ) : userRole === "official" ? (
              <Navigate to={ROUTES.PORTAL_OFICIAL} replace />
            ) : (
              <DashboardPage usuario={usuario!} onLogout={logout} />
            )}
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.PORTAL_OFICIAL}
        element={
          <ProtectedRoute
            isAuthenticated={isAuthenticated}
            redirectTo={ROUTES.LOGIN}
          >
            {needsPasswordUpdate ? (
              <Navigate to={ROUTES.PASSWORD_UPDATE} replace />
            ) : userRole === "employee" ? (
              <Navigate to={ROUTES.DASHBOARD} replace />
            ) : (
              <PortalOficialPage usuario={usuario!} onLogout={logout} />
            )}
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.HOME}
        element={
          <Navigate
            to={getRedirectPath(ROUTES.HOME, usuario, userRole) || ROUTES.LOGIN}
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
