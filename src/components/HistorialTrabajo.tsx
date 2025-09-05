import { useState, useMemo } from 'react'
import type { RegistroTiempo } from '@/types'
import { format, differenceInMinutes, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

interface HistorialTrabajoProps {
  registros: RegistroTiempo[]
}

export function HistorialTrabajo({ registros }: HistorialTrabajoProps) {
  const [filtro, setFiltro] = useState<'hoy' | 'semana' | 'mes' | 'todo'>('semana')
  const [busqueda, setBusqueda] = useState('')

  const registrosFiltrados = useMemo(() => {
    const ahora = new Date()
    let registrosPorFecha = registros

    switch (filtro) {
      case 'hoy':
        registrosPorFecha = registros.filter(r => 
          new Date(r.fechaEntrada).toDateString() === ahora.toDateString()
        )
        break
      case 'semana':
        const inicioSemana = startOfWeek(ahora, { weekStartsOn: 1 })
        const finSemana = endOfWeek(ahora, { weekStartsOn: 1 })
        registrosPorFecha = registros.filter(r => {
          const fecha = new Date(r.fechaEntrada)
          return fecha >= inicioSemana && fecha <= finSemana
        })
        break
      case 'mes':
        const inicioMes = startOfMonth(ahora)
        const finMes = endOfMonth(ahora)
        registrosPorFecha = registros.filter(r => {
          const fecha = new Date(r.fechaEntrada)
          return fecha >= inicioMes && fecha <= finMes
        })
        break
    }

    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase()
      registrosPorFecha = registrosPorFecha.filter(r => 
        format(new Date(r.fechaEntrada), 'PPP', { locale: es }).toLowerCase().includes(busquedaLower) ||
        r.tipoRegistro.toLowerCase().includes(busquedaLower)
      )
    }

    return registrosPorFecha.sort((a, b) => 
      new Date(b.fechaEntrada).getTime() - new Date(a.fechaEntrada).getTime()
    )
  }, [registros, filtro, busqueda])

  const estadisticas = useMemo(() => {
    const registrosPorDia = new Map<string, RegistroTiempo[]>()
    
    registrosFiltrados.forEach(registro => {
      const dia = format(new Date(registro.fechaEntrada), 'yyyy-MM-dd')
      if (!registrosPorDia.has(dia)) {
        registrosPorDia.set(dia, [])
      }
      registrosPorDia.get(dia)!.push(registro)
    })

    let totalMinutos = 0
    let diasTrabajados = 0

    registrosPorDia.forEach(registrosDia => {
      let minutosDelDia = 0
      let entradaActual: Date | null = null

      registrosDia.forEach(registro => {
        if (registro.tipoRegistro === 'entrada') {
          entradaActual = new Date(registro.fechaEntrada)
        } else if (registro.tipoRegistro === 'salida' && entradaActual) {
          const salida = registro.fechaSalida ? new Date(registro.fechaSalida) : new Date(registro.fechaEntrada)
          minutosDelDia += differenceInMinutes(salida, entradaActual)
          entradaActual = null
        }
      })

      if (minutosDelDia > 0) {
        totalMinutos += minutosDelDia
        diasTrabajados++
      }
    })

    const horasTotal = Math.floor(totalMinutos / 60)
    const minutosTotal = totalMinutos % 60
    const promedioDiario = diasTrabajados > 0 ? totalMinutos / diasTrabajados : 0
    const horasPromedio = Math.floor(promedioDiario / 60)
    const minutosPromedio = Math.floor(promedioDiario % 60)

    return {
      tiempoTotal: `${horasTotal}h ${minutosTotal}m`,
      diasTrabajados,
      promedioDiario: `${horasPromedio}h ${minutosPromedio}m`
    }
  }, [registrosFiltrados])

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'entrada': return '🟢'
      case 'salida': return '🔴'
      case 'descanso_inicio': return '⏸️'
      case 'descanso_fin': return '▶️'
      default: return '📝'
    }
  }

  const getTipoTexto = (tipo: string) => {
    switch (tipo) {
      case 'entrada': return 'Entrada'
      case 'salida': return 'Salida'
      case 'descanso_inicio': return 'Inicio Descanso'
      case 'descanso_fin': return 'Fin Descanso'
      default: return tipo
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-blanco/95 backdrop-blur-sm rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-azul-profundo mb-6">Historial de Trabajo</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-activo/10 to-activo/5 p-4 rounded-xl border border-activo/20">
            <div className="text-sm text-activo font-medium">Tiempo Total</div>
            <div className="text-2xl font-bold text-azul-profundo">{estadisticas.tiempoTotal}</div>
          </div>
          <div className="bg-gradient-to-br from-turquesa/10 to-turquesa/5 p-4 rounded-xl border border-turquesa/20">
            <div className="text-sm text-turquesa font-medium">Días Trabajados</div>
            <div className="text-2xl font-bold text-azul-profundo">{estadisticas.diasTrabajados}</div>
          </div>
          <div className="bg-gradient-to-br from-mandarina/10 to-mandarina/5 p-4 rounded-xl border border-mandarina/20">
            <div className="text-sm text-mandarina font-medium">Promedio Diario</div>
            <div className="text-2xl font-bold text-azul-profundo">{estadisticas.promedioDiario}</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por fecha o tipo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-4 py-2 border border-hielo rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
            />
          </div>
          <div className="flex gap-2">
            {(['hoy', 'semana', 'mes', 'todo'] as const).map((opcion) => (
              <button
                key={opcion}
                onClick={() => setFiltro(opcion)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filtro === opcion
                    ? 'bg-teal text-blanco shadow-lg'
                    : 'bg-hielo/50 text-azul-profundo hover:bg-hielo'
                }`}
              >
                {opcion === 'hoy' ? 'Hoy' : opcion === 'semana' ? 'Semana' : opcion === 'mes' ? 'Mes' : 'Todo'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {registrosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-azul-profundo/60">
              No hay registros para mostrar
            </div>
          ) : (
            registrosFiltrados.map((registro) => (
              <div key={registro.id} className="flex items-center justify-between p-4 bg-hielo/20 rounded-lg border border-hielo/50 hover:bg-hielo/30 transition-colors duration-200">
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">{getTipoIcon(registro.tipoRegistro)}</span>
                  <div>
                    <div className="font-medium text-azul-profundo">
                      {getTipoTexto(registro.tipoRegistro)}
                      {registro.esSimulado && (
                        <span className="ml-2 px-2 py-1 text-xs bg-mandarina/20 text-mandarina rounded-full">
                          Simulado
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-azul-profundo/70">
                      {format(new Date(registro.fechaEntrada), 'PPP', { locale: es })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-azul-profundo">
                    {format(new Date(registro.fechaEntrada), 'HH:mm:ss')}
                  </div>
                  {registro.fechaSalida && (
                    <div className="text-sm text-azul-profundo/70 font-mono">
                      → {format(new Date(registro.fechaSalida), 'HH:mm:ss')}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}