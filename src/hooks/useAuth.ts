import { useState, useCallback } from 'react'
import { AuthService } from '@/services/auth-service'
import type { Usuario } from '@/types'

interface UseAuthReturn {
  login: (email: string, password: string) => Promise<Usuario>
  isLoading: boolean
  error: string | null
  clearError: () => void
}

export function useAuth(): UseAuthReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<Usuario> => {
    setIsLoading(true)
    setError(null)

    try {
      const usuario = await AuthService.signIn(email, password)
      return usuario
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    login,
    isLoading,
    error,
    clearError
  }
}