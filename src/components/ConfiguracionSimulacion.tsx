import { useState } from 'react'
import type { Usuario, RegistroTiempo } from '@/types'
import { subDays, addMinutes, startOfDay } from 'date-fns'

interface ConfiguracionSimulacionProps {
  usuario: Usuario
  onRegistrosSimulados: (registros: RegistroTiempo[]) => void
}

export function ConfiguracionSimulacion({ usuario, onRegistrosSimulados }: ConfiguracionSimulacionProps) {
  const [diasAtras, setDiasAtras] = useState(5)
  const [horaEntradaMin, setHoraEntradaMin] = useState('08:30')
  const [horaEntradaMax, setHoraEntradaMax] = useState('09:30')
  const [horaSalidaMin, setHoraSalidaMin] = useState('17:30')
  const [horaSalidaMax, setHoraSalidaMax] = useState('18:30')
  const [incluirDescansos, setIncluirDescansos] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  const generarHoraAleatoria = (horaMin: string, horaMax: string, fecha: Date): Date => {
    const [horaMinH, horaMinM] = horaMin.split(':').map(Number)
    const [horaMaxH, horaMaxM] = horaMax.split(':').map(Number)
    
    const minutosMin = horaMinH * 60 + horaMinM
    const minutosMax = horaMaxH * 60 + horaMaxM
    
    const minutosAleatorios = Math.floor(Math.random() * (minutosMax - minutosMin + 1)) + minutosMin
    const horas = Math.floor(minutosAleatorios / 60)
    const minutos = minutosAleatorios % 60
    
    const nuevaFecha = new Date(fecha)
    nuevaFecha.setHours(horas, minutos, Math.floor(Math.random() * 60), 0)
    
    return nuevaFecha
  }

  const generarRegistrosSimulados = async () => {
    setIsGenerating(true)
    
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const registrosGenerados: RegistroTiempo[] = []
    const hoy = new Date()
    
    for (let i = diasAtras; i >= 1; i--) {
      const fecha = subDays(hoy, i)
      const inicioDia = startOfDay(fecha)
      
      // Skip weekends
      if (fecha.getDay() === 0 || fecha.getDay() === 6) continue
      
      const horaEntrada = generarHoraAleatoria(horaEntradaMin, horaEntradaMax, inicioDia)
      
      const registroEntrada: RegistroTiempo = {
        id: crypto.randomUUID(),
        usuarioId: usuario.id,
        fechaEntrada: horaEntrada,
        tipoRegistro: 'entrada',
        esSimulado: true
      }
      registrosGenerados.push(registroEntrada)
      
      if (incluirDescansos && Math.random() > 0.3) {
        const inicioDescanso = addMinutes(horaEntrada, Math.floor(Math.random() * 120) + 180)
        const finDescanso = addMinutes(inicioDescanso, Math.floor(Math.random() * 30) + 30)
        
        registrosGenerados.push({
          id: crypto.randomUUID(),
          usuarioId: usuario.id,
          fechaEntrada: inicioDescanso,
          tipoRegistro: 'descanso_inicio',
          esSimulado: true
        })
        
        registrosGenerados.push({
          id: crypto.randomUUID(),
          usuarioId: usuario.id,
          fechaEntrada: finDescanso,
          fechaSalida: finDescanso,
          tipoRegistro: 'descanso_fin',
          esSimulado: true
        })
      }
      
      const horaSalida = generarHoraAleatoria(horaSalidaMin, horaSalidaMax, inicioDia)
      
      const registroSalida: RegistroTiempo = {
        id: crypto.randomUUID(),
        usuarioId: usuario.id,
        fechaEntrada: horaSalida,
        fechaSalida: horaSalida,
        tipoRegistro: 'salida',
        esSimulado: true
      }
      registrosGenerados.push(registroSalida)
    }
    
    onRegistrosSimulados(registrosGenerados)
    setIsGenerating(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-blanco/95 backdrop-blur-sm rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🤫</span>
          <h2 className="text-2xl font-bold text-azul-profundo">Configuración Especial</h2>
        </div>
        
        <div className="bg-mandarina/10 border border-mandarina/30 rounded-lg p-4 mb-6">
          <p className="text-sm text-azul-profundo">
            ⚠️ Esta función genera registros simulados para completar días anteriores. 
            Úsala con discreción y responsabilidad.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-azul-profundo mb-2">
                Días atrás a simular
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={diasAtras}
                onChange={(e) => setDiasAtras(Number(e.target.value))}
                className="w-full px-3 py-2 border border-hielo rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-azul-profundo mb-2">
                Hora entrada (mínima)
              </label>
              <input
                type="time"
                value={horaEntradaMin}
                onChange={(e) => setHoraEntradaMin(e.target.value)}
                className="w-full px-3 py-2 border border-hielo rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-azul-profundo mb-2">
                Hora entrada (máxima)
              </label>
              <input
                type="time"
                value={horaEntradaMax}
                onChange={(e) => setHoraEntradaMax(e.target.value)}
                className="w-full px-3 py-2 border border-hielo rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={incluirDescansos}
                  onChange={(e) => setIncluirDescansos(e.target.checked)}
                  className="w-4 h-4 text-teal border-hielo rounded focus:ring-teal"
                />
                <span className="text-sm font-medium text-azul-profundo">
                  Incluir descansos aleatorios
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-azul-profundo mb-2">
                Hora salida (mínima)
              </label>
              <input
                type="time"
                value={horaSalidaMin}
                onChange={(e) => setHoraSalidaMin(e.target.value)}
                className="w-full px-3 py-2 border border-hielo rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-azul-profundo mb-2">
                Hora salida (máxima)
              </label>
              <input
                type="time"
                value={horaSalidaMax}
                onChange={(e) => setHoraSalidaMax(e.target.value)}
                className="w-full px-3 py-2 border border-hielo rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-hielo">
          <button
            onClick={generarRegistrosSimulados}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-mandarina to-naranja-tostado text-blanco py-3 px-6 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-blanco border-t-transparent rounded-full animate-spin"></div>
                <span>Generando registros...</span>
              </div>
            ) : (
              `Generar ${diasAtras} días de registros`
            )}
          </button>
        </div>

        <div className="mt-4 text-xs text-azul-profundo/60 text-center">
          Solo se generarán registros para días laborables (lunes a viernes)
        </div>
      </div>
    </div>
  )
}