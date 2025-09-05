import { useState, useEffect } from 'react'
import { LoginPage } from '@/components/pages/LoginPage'
import { PasswordUpdatePage } from '@/components/pages/PasswordUpdatePage'
import { DashboardPage } from '@/components/pages/DashboardPage'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { AuthService } from '@/services/auth-service'
import type { Usuario } from '@/types'

function App() {
  const [usuario, setUsuario] = useLocalStorage<Usuario | null>('usuario_actual', null)
  const [estaLogueado, setEstaLogueado] = useState(false)
  const [esFirstLogin, setEsFirstLogin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser()
        if (currentUser) {
          setUsuario(currentUser)
          setEstaLogueado(true)
          setEsFirstLogin(currentUser.firstLogin || false)
        }
      } catch (error) {
        console.error('Error checking auth state:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthState()
  }, [setUsuario])

  const manejarLogin = (datosUsuario: Usuario) => {
    setUsuario(datosUsuario)
    setEstaLogueado(true)
    setEsFirstLogin(datosUsuario.firstLogin || false)
  }

  const manejarPasswordUpdated = () => {
    setEsFirstLogin(false)
    if (usuario) {
      setUsuario({ ...usuario, firstLogin: false })
    }
  }

  const manejarLogout = async () => {
    try {
      await AuthService.signOut()
      setUsuario(null)
      setEstaLogueado(false)
      setEsFirstLogin(false)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-azul-profundo to-teal flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-blanco border-t-transparent rounded-full animate-spin"></div>
          <span className="text-blanco text-lg">Cargando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-azul-profundo to-teal">
      <div className="min-h-screen bg-gradient-to-t from-black/20 to-transparent">
        {!estaLogueado ? (
          <LoginPage onLogin={manejarLogin} />
        ) : esFirstLogin && usuario ? (
          <PasswordUpdatePage 
            usuario={usuario} 
            onPasswordUpdated={manejarPasswordUpdated} 
          />
        ) : (
          <DashboardPage usuario={usuario!} onLogout={manejarLogout} />
        )}
      </div>
    </div>
  )
}

export default App