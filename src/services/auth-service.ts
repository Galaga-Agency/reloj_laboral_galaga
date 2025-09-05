import { supabase } from '@/lib/supabase'
import type { Usuario } from '@/types'

export class AuthService {
  static async signIn(email: string, password: string): Promise<Usuario> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      throw new Error(`Credenciales incorrectas: ${error.message}`)
    }

    if (!data.user) {
      throw new Error('No se pudo obtener información del usuario')
    }

    // Get user record from our usuarios table
    const { data: userRecord, error: fetchError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (fetchError) {
      throw new Error(`Error al obtener datos del usuario: ${fetchError.message}`)
    }

    return {
      id: userRecord.id,
      nombre: userRecord.nombre,
      email: userRecord.email,
      firstLogin: userRecord.first_login
    }
  }

  static async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      throw new Error(`Error al actualizar contraseña: ${error.message}`)
    }

    // Mark first login as complete
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('usuarios')
        .update({ first_login: false } as any)
        .eq('id', user.id)
    }
  }

  static async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(`Error al cerrar sesión: ${error.message}`)
    }
  }

  static async getCurrentUser(): Promise<Usuario | null> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    // Get user record from our usuarios table
    const { data: userRecord, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Error al obtener datos del usuario: ${error.message}`)
    }

    return {
      id: userRecord.id,
      nombre: userRecord.nombre,
      email: userRecord.email,
      firstLogin: userRecord.first_login
    }
  }
}