import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
  isAuthenticated: boolean
  redirectTo: string
}

export function ProtectedRoute({ children, isAuthenticated, redirectTo }: ProtectedRouteProps) {
  return isAuthenticated ? <>{children}</> : <Navigate to={redirectTo} replace />
}