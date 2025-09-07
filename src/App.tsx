import { BrowserRouter } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { RouteRenderer } from '@/components/RouteRenderer'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { AuthService } from '@/services/auth-service'
import { supabase } from '@/lib/supabase'
import type { Usuario } from '@/types'

function App() {
  const [usuario, setUsuario] = useLocalStorage<Usuario | null>('usuario_actual', null)
  const [isLoading, setIsLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    let authStateProcessed = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('=== AUTH STATE CHANGE ===')
        console.log('Event:', event, 'Session exists:', !!session)
        
        if (event === 'INITIAL_SESSION') {
          console.log('Processing INITIAL_SESSION')
          
          if (!session) {
            console.log('No initial session found - user should be logged out')
            setUsuario(null)
          } else {
            console.log('Initial session found - getting user data')
            try {
              const currentUser = await AuthService.getCurrentUser()
              console.log('Initial session user data:', currentUser)
              
              if (currentUser) {
                setUsuario(currentUser)
              } else {
                setUsuario(null)
              }
            } catch (error) {
              console.error('Error getting user from initial session:', error)
              setUsuario(null)
            }
          }
          
          authStateProcessed = true
          setAuthChecked(true)
          setIsLoading(false)
          console.log('INITIAL_SESSION processing complete')
        } 
        else if (event === 'SIGNED_IN' && session && authStateProcessed) {
          console.log('SIGNED_IN event - getting user data')
          try {
            const currentUser = await AuthService.getCurrentUser()
            console.log('SIGNED_IN user data:', currentUser)
            
            if (currentUser) {
              setUsuario(currentUser)
            } else {
              console.log('SIGNED_IN but no user data - signing out')
              await AuthService.signOut()
            }
          } catch (error) {
            console.error('Error getting user after sign in:', error)
            await AuthService.signOut()
          }
        } 
        else if (event === 'SIGNED_OUT') {
          console.log('SIGNED_OUT - clearing user')
          setUsuario(null)
        } 
        else if (event === 'TOKEN_REFRESHED') {
          console.log('TOKEN_REFRESHED - verifying user')
          try {
            const currentUser = await AuthService.getCurrentUser()
            if (currentUser) {
              setUsuario(currentUser)
            } else {
              setUsuario(null)
            }
          } catch (error) {
            console.error('Error refreshing user data:', error)
          }
        }
      }
    )

    // Fallback timeout in case auth state change never fires
    const fallbackTimeout = setTimeout(() => {
      if (!authStateProcessed) {
        console.log('Auth state change timeout - assuming no session')
        setUsuario(null)
        setAuthChecked(true)
        setIsLoading(false)
      }
    }, 10000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(fallbackTimeout)
    }
  }, [])

  const handleLogin = (datosUsuario: Usuario) => {
    console.log('handleLogin called with:', datosUsuario)
    setUsuario(datosUsuario)
  }

  const handlePasswordUpdated = () => {
    if (usuario) {
      console.log('Password updated, updating user firstLogin status')
      setUsuario({ ...usuario, firstLogin: false })
    }
  }

  const handleLogout = async () => {
    console.log('handleLogout called')
    try {
      await AuthService.signOut()
      setUsuario(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  console.log('App render state:', { 
    isLoading, 
    authChecked, 
    hasUsuario: !!usuario,
    usuarioId: usuario?.id 
  })

  if (isLoading || !authChecked) {
    return <LoadingScreen />
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-azul-profundo to-teal">
        <div className="min-h-screen bg-gradient-to-t from-black/20 to-transparent">
          <RouteRenderer
            usuario={usuario}
            onLogin={handleLogin}
            onPasswordUpdated={handlePasswordUpdated}
            onLogout={handleLogout}
          />
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App