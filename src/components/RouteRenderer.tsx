import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@/components/pages/LoginPage'
import { PasswordUpdatePage } from '@/components/pages/PasswordUpdatePage'
import { PasswordResetPage } from '@/components/pages/PasswordResetPage'
import { DashboardPage } from '@/components/pages/DashboardPage'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ROUTES, getRedirectPath } from '@/utils/route-config'
import type { Usuario } from '@/types'

interface RouteRendererProps {
  usuario: Usuario | null
  onLogin: (usuario: Usuario) => void
  onPasswordUpdated: () => void
  onLogout: () => void
}

export function RouteRenderer({ 
  usuario, 
  onLogin, 
  onPasswordUpdated, 
  onLogout 
}: RouteRendererProps) {
  const isAuthenticated = !!usuario
  const needsPasswordUpdate = usuario?.firstLogin

  return (
    <Routes>
      <Route 
        path={ROUTES.LOGIN}
        element={
          isAuthenticated ? (
            <Navigate 
              to={needsPasswordUpdate ? ROUTES.PASSWORD_UPDATE : ROUTES.DASHBOARD} 
              replace 
            />
          ) : (
            <LoginPage onLogin={onLogin} />
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
          <ProtectedRoute isAuthenticated={isAuthenticated} redirectTo={ROUTES.LOGIN}>
            {needsPasswordUpdate ? (
              <PasswordUpdatePage 
                usuario={usuario!}
                onPasswordUpdated={onPasswordUpdated}
              />
            ) : (
              <Navigate to={ROUTES.DASHBOARD} replace />
            )}
          </ProtectedRoute>
        } 
      />

      <Route 
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} redirectTo={ROUTES.LOGIN}>
            {needsPasswordUpdate ? (
              <Navigate to={ROUTES.PASSWORD_UPDATE} replace />
            ) : (
              <DashboardPage usuario={usuario!} onLogout={onLogout} />
            )}
          </ProtectedRoute>
        } 
      />

      <Route 
        path={ROUTES.HOME}
        element={
          <Navigate 
            to={
              (() => {
                if (!isAuthenticated) return ROUTES.LOGIN
                if (needsPasswordUpdate) return ROUTES.PASSWORD_UPDATE
                return ROUTES.DASHBOARD
              })()
            }
            replace 
          />
        } 
      />

      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  )
}