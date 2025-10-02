import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "@/components/pages/LoginPage";
import { PasswordUpdatePage } from "@/components/pages/PasswordUpdatePage";
import { PasswordResetPage } from "@/components/pages/PasswordResetPage";
import { DashboardPage } from "@/components/pages/DashboardPage";
import { PortalOficialPage } from "@/components/pages/PortalOficialPage";
import { GDPRConsentPage } from "@/components/pages/GDPRConsentPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES, getRedirectPath } from "@/utils/route-config";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { LegalNoticePage } from "./pages/LegalNoticePage";

export function RouteRenderer() {
  const { usuario, isLoading, isLoggingOut, isAuthenticated, logout } =
    useAuth();

  console.log("🎬 RouteRenderer render:", {
    hasUsuario: !!usuario,
    email: usuario?.email,
    isLoading,
    isLoggingOut,
    isAuthenticated,
  });

  if (isLoading) {
    console.log("⏸️ RouteRenderer showing LOADING screen");
    return <LoadingScreen />;
  }

  if (isLoggingOut) {
    console.log("👋 RouteRenderer showing LOGOUT screen");
    return <LoadingScreen message="Cerrando sesión..." />;
  }

  console.log("✅ RouteRenderer rendering ROUTES");

  const needsPasswordUpdate = usuario?.firstLogin;
  const needsGDPRConsent = usuario && !usuario.gdprConsentGiven;
  const userRole = usuario?.role;

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
        path={ROUTES.GDPR_CONSENT}
        element={
          <ProtectedRoute
            isAuthenticated={isAuthenticated}
            redirectTo={ROUTES.LOGIN}
          >
            {needsPasswordUpdate ? (
              <Navigate to={ROUTES.PASSWORD_UPDATE} replace />
            ) : needsGDPRConsent ? (
              <GDPRConsentPage usuario={usuario!} />
            ) : (
              <Navigate
                to={
                  getRedirectPath(ROUTES.GDPR_CONSENT, usuario, userRole) ||
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
            ) : needsGDPRConsent ? (
              <Navigate to={ROUTES.GDPR_CONSENT} replace />
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
            ) : needsGDPRConsent ? (
              <Navigate to={ROUTES.GDPR_CONSENT} replace />
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
