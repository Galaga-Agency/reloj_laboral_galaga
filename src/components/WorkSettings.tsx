import { useState, useEffect } from 'react'
import { AutoEntryService } from '@/services/auto-entry-service'
import { supabase } from '@/lib/supabase'
import { useSecretSequence } from '@/hooks/useSecretSequence'
import { HolidayVacationPicker } from '@/components/HolidayVacationPicker'
import { GenerateInformes } from '@/components/GenerateInformes'
import { Checkbox } from '@/components/ui/Checkbox'
import { FiClock, FiKey, FiSave, FiEyeOff } from 'react-icons/fi'

// Define types directly to avoid import issues
interface Usuario {
  id: string
  nombre: string
  email: string
  firstLogin?: boolean
}

interface RegistroTiempo {
  id: string
  usuarioId: string
  fechaEntrada: Date
  fechaSalida?: Date
  tipoRegistro: 'entrada' | 'salida' | 'descanso_inicio' | 'descanso_fin'
  esSimulado?: boolean
}

interface WorkSettingsProps {
  usuario: Usuario
  registros?: RegistroTiempo[]
}

interface WorkSettings {
  horasDiarias: number
  horaEntradaMin: string
  horaEntradaMax: string
  horaSalidaMin: string
  horaSalidaMax: string
  diasLibres: string[]
  autoEntryEnabled: boolean
}

export function WorkSettings({ usuario, registros = [] }: WorkSettingsProps) {
  const [settings, setSettings] = useState<WorkSettings>({
    horasDiarias: 8,
    horaEntradaMin: '08:30',
    horaEntradaMax: '09:30',
    horaSalidaMin: '17:30',
    horaSalidaMax: '18:30',
    diasLibres: [],
    autoEntryEnabled: true
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  })

  // Secret sequence: "SECRET" (type s-e-c-r-e-t)
  const { isUnlocked, progress, totalSteps, lock } = useSecretSequence({
    sequence: ['s', 'e', 'c', 'r', 'e', 't'],
    resetTimeout: 5000,
    onSequenceComplete: () => {
      setMessage({ type: 'success', text: 'Configuración avanzada desbloqueada' })
      setTimeout(() => setMessage(null), 2000)
    }
  })

  useEffect(() => {
    loadSettings()
  }, [usuario.id])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const userSettings = await AutoEntryService.getUserWorkSettings(usuario.id)
      if (userSettings) {
        setSettings(userSettings)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      setMessage({ type: 'error', text: 'Error cargando configuración' })
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      await AutoEntryService.updateWorkSettings(usuario.id, settings)
      setMessage({ type: 'success', text: 'Configuración guardada correctamente' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Error guardando configuración' })
    } finally {
      setIsSaving(false)
    }
  }

  const changePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' })
      return
    }

    if (passwordData.new.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' })
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' })
      setPasswordData({ current: '', new: '', confirm: '' })
      setShowPasswordChange(false)
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error changing password:', error)
      setMessage({ type: 'error', text: 'Error cambiando contraseña' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-azul-profundo">Cargando configuración...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Secret Sequence Indicator */}
      {progress > 0 && !isUnlocked && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="text-yellow-800 text-sm">
              Secuencia: {progress}/{totalSteps}
            </div>
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < progress ? 'bg-yellow-500' : 'bg-yellow-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Work Schedule Settings - HIDDEN BEHIND SECRET */}
      {isUnlocked && (
        <div className="bg-blanco/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-2 border-yellow-300">
          <div className="flex items-center justify-between pb-6">
            <div className="flex items-center gap-3">
              <FiClock className="text-2xl text-teal" />
              <h2 className="text-2xl font-bold text-azul-profundo">Horario de Trabajo</h2>
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                Configuración Avanzada
              </span>
            </div>
            <button
              onClick={lock}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <FiEyeOff className="w-4 h-4" />
              Ocultar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-azul-profundo">
                  Horas diarias de trabajo
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={settings.horasDiarias}
                  onChange={(e) => setSettings(prev => ({ ...prev, horasDiarias: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-hielo rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-azul-profundo">
                  Hora entrada (mínima)
                </label>
                <input
                  type="time"
                  value={settings.horaEntradaMin}
                  onChange={(e) => setSettings(prev => ({ ...prev, horaEntradaMin: e.target.value }))}
                  className="w-full px-3 py-2 border border-hielo rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-azul-profundo">
                  Hora entrada (máxima)
                </label>
                <input
                  type="time"
                  value={settings.horaEntradaMax}
                  onChange={(e) => setSettings(prev => ({ ...prev, horaEntradaMax: e.target.value }))}
                  className="w-full px-3 py-2 border border-hielo rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Checkbox
                checked={settings.autoEntryEnabled}
                onChange={(checked) => setSettings(prev => ({ ...prev, autoEntryEnabled: checked }))}
                label="Activar entradas automáticas"
                description="Genera entradas automáticamente cuando no fiches"
              />

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-azul-profundo">
                  Hora salida (mínima)
                </label>
                <input
                  type="time"
                  value={settings.horaSalidaMin}
                  onChange={(e) => setSettings(prev => ({ ...prev, horaSalidaMin: e.target.value }))}
                  className="w-full px-3 py-2 border border-hielo rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-azul-profundo">
                  Hora salida (máxima)
                </label>
                <input
                  type="time"
                  value={settings.horaSalidaMax}
                  onChange={(e) => setSettings(prev => ({ ...prev, horaSalidaMax: e.target.value }))}
                  className="w-full px-3 py-2 border border-hielo rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Generation - ALWAYS VISIBLE */}
      <GenerateInformes registros={registros.filter(r => r.usuarioId === usuario.id)} usuario={usuario} />

      {/* Holidays Management - ALWAYS VISIBLE */}
      <HolidayVacationPicker
        selectedDates={settings.diasLibres}
        onDatesChange={(dates) => setSettings(prev => ({ ...prev, diasLibres: dates }))}
      />

      {/* Password Change - ALWAYS VISIBLE */}
      <div className="bg-blanco/95 backdrop-blur-sm rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-3 pb-6">
          <FiKey className="text-2xl text-teal" />
          <h2 className="text-2xl font-bold text-azul-profundo">Cambiar Contraseña</h2>
        </div>

        {!showPasswordChange ? (
          <button
            onClick={() => setShowPasswordChange(true)}
            className="px-4 py-2 bg-azul-profundo text-blanco rounded-lg hover:bg-azul-profundo/90"
          >
            Cambiar Contraseña
          </button>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-azul-profundo">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={passwordData.new}
                onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                className="w-full px-3 py-2 border border-hielo rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-azul-profundo">
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={passwordData.confirm}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
                className="w-full px-3 py-2 border border-hielo rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
                placeholder="Repite la nueva contraseña"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={changePassword}
                disabled={!passwordData.new || !passwordData.confirm}
                className="px-4 py-2 bg-teal text-blanco rounded-lg hover:bg-teal/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Actualizar Contraseña
              </button>
              <button
                onClick={() => {
                  setShowPasswordChange(false)
                  setPasswordData({ current: '', new: '', confirm: '' })
                }}
                className="px-4 py-2 border border-hielo text-azul-profundo rounded-lg hover:bg-hielo/20"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Save Settings */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal to-turquesa text-blanco rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-blanco border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <FiSave className="w-5 h-5" />
          )}
          {isSaving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>

      {/* Secret Hint */}
      {!isUnlocked && (
        <div className="text-center">
          <p className="text-xs text-gray-400">
            Configuración avanzada disponible...
          </p>
        </div>
      )}
    </div>
  )
}