import { useState, useMemo } from 'react'
import type { RegistroTiempo } from '@/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { FiRefreshCw, FiSearch, FiClock, FiCalendar, FiTrendingUp } from 'react-icons/fi'
import PrimaryButton from '@/components/ui/PrimaryButton'
import { TimeRecordsUtils, type FilterPeriod } from '@/utils/time-records'

interface HistorialTrabajoProps {
  registros: RegistroTiempo[]
  onRefresh?: () => void
}

export function HistorialTrabajo({ registros, onRefresh }: HistorialTrabajoProps) {
  const [filtro, setFiltro] = useState<FilterPeriod>('hoy')
  const [busqueda, setBusqueda] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return
    
    setIsRefreshing(true)
    try {
      await onRefresh()
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  const registrosFiltrados = useMemo(() => {
    let filtered = TimeRecordsUtils.filterByPeriod(registros, filtro)
    filtered = TimeRecordsUtils.filterBySearch(filtered, busqueda)
    
    return filtered.sort((a, b) => 
      new Date(b.fechaEntrada).getTime() - new Date(a.fechaEntrada).getTime()
    )
  }, [registros, filtro, busqueda])

  const estadisticas = useMemo(() => {
    return TimeRecordsUtils.calculateStatistics(registrosFiltrados)
  }, [registrosFiltrados])

  const filterOptions: { key: FilterPeriod; label: string }[] = [
    { key: 'hoy', label: 'Hoy' },
    { key: 'semana', label: 'Semana' },
    { key: 'mes', label: 'Mes' },
    { key: 'todo', label: 'Todo' }
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-blanco/95 backdrop-blur-sm rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between pb-6">
          <h2 className="text-2xl font-bold text-azul-profundo">Historial de Trabajo</h2>
          <PrimaryButton
            onClick={handleRefresh}
            disabled={isRefreshing}
            size="sm"
            className={isRefreshing ? 'opacity-70' : ''}
          >
            <FiRefreshCw className={`w-4 h-4 transition-transform duration-500 ${
              isRefreshing ? 'animate-spin' : ''
            }`} />
            {isRefreshing ? 'Actualizando...' : 'Actualizar'}
          </PrimaryButton>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6">
          <div className="bg-gradient-to-br from-activo/10 to-activo/5 p-4 rounded-xl border border-activo/20">
            <div className="flex items-center gap-2 text-sm text-activo font-medium pb-2">
              <FiClock className="w-4 h-4" />
              Tiempo Total
            </div>
            <div className="text-2xl font-bold text-azul-profundo">{estadisticas.tiempoTotal}</div>
          </div>
          <div className="bg-gradient-to-br from-turquesa/10 to-turquesa/5 p-4 rounded-xl border border-turquesa/20">
            <div className="flex items-center gap-2 text-sm text-turquesa font-medium pb-2">
              <FiCalendar className="w-4 h-4" />
              Días Trabajados
            </div>
            <div className="text-2xl font-bold text-azul-profundo">{estadisticas.diasTrabajados}</div>
          </div>
          <div className="bg-gradient-to-br from-mandarina/10 to-mandarina/5 p-4 rounded-xl border border-mandarina/20">
            <div className="flex items-center gap-2 text-sm text-mandarina font-medium pb-2">
              <FiTrendingUp className="w-4 h-4" />
              Promedio Diario
            </div>
            <div className="text-2xl font-bold text-azul-profundo">{estadisticas.promedioDiario}</div>
          </div>
        </div>

        {/* Records List */}
        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
          {registrosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-azul-profundo/60">
              <FiClock className="w-12 h-12 mx-auto opacity-30 pb-2" />
              <p className="text-sm">No hay registros para mostrar</p>
            </div>
          ) : (
            registrosFiltrados.map((registro) => (
              <div key={registro.id} className="flex items-center justify-between p-4 bg-hielo/20 rounded-lg border border-hielo/50 hover:bg-hielo/30 transition-colors duration-200">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blanco/80">
                    {TimeRecordsUtils.getTypeIcon(registro.tipoRegistro)}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-azul-profundo">
                        {TimeRecordsUtils.getTypeText(registro.tipoRegistro)}
                      </span>
                      {registro.esSimulado && (
                        <span className="px-2 py-1 text-xs bg-mandarina/20 text-mandarina rounded-full">
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