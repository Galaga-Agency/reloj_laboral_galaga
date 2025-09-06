// components/GenerateInformes.tsx
import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { FiFileText, FiDownload, FiCalendar, FiActivity } from 'react-icons/fi'
import type { RegistroTiempo, Usuario } from '@/types'
import { useReports, type ReportPeriod } from '@/hooks/useReports'
import PrimaryButton from '@/components/ui/PrimaryButton'

interface GenerateInformesProps {
  registros: RegistroTiempo[]
  usuario: Usuario
}

export function GenerateInformes({ registros, usuario }: GenerateInformesProps) {
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const {
    selectedPeriod,
    customDateRange,
    isGenerating,
    dateRange,
    statistics,
    recordCount,
    hasData,
    setSelectedPeriod,
    setCustomDateRange,
    generatePDFReport,
    canGenerateReport,
    isCustomRangeValid
  } = useReports({ registros, usuario })

  const handleGenerateReport = async () => {
    try {
      const result = await generatePDFReport()
      setMessage({ type: 'success', text: result.message })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Error generando informe' 
      })
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const periodOptions: { value: ReportPeriod; label: string; description: string }[] = [
    { value: 'today', label: 'Hoy', description: 'Registros del día actual' },
    { value: 'week', label: 'Esta Semana', description: 'Lunes a domingo de esta semana' },
    { value: 'month', label: 'Este Mes', description: 'Todo el mes actual' },
    { value: 'custom', label: 'Rango Personalizado', description: 'Selecciona fechas específicas' }
  ]

  return (
    <div className="bg-blanco/95 backdrop-blur-sm rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 pb-6">
        <FiFileText className="text-2xl text-teal" />
        <h2 className="text-2xl font-bold text-azul-profundo">Generar Informes</h2>
      </div>

      {message && (
        <div className={`p-4 rounded-lg pb-6 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Period Selection */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-azul-profundo">Seleccionar Período</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {periodOptions.map((option) => (
              <label
                key={option.value}
                className={`flex flex-col gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedPeriod === option.value
                    ? 'border-teal bg-teal/5'
                    : 'border-hielo hover:border-teal/50 hover:bg-hielo/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="period"
                    value={option.value}
                    checked={selectedPeriod === option.value}
                    onChange={(e) => setSelectedPeriod(e.target.value as ReportPeriod)}
                    className="w-4 h-4 text-teal border-hielo focus:ring-teal"
                  />
                  <span className="font-medium text-azul-profundo">{option.label}</span>
                </div>
                <span className="text-sm text-azul-profundo/70 pl-6">{option.description}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Custom Date Range */}
        {selectedPeriod === 'custom' && (
          <div className="flex flex-col gap-4 p-4 bg-hielo/20 rounded-lg border border-hielo">
            <h4 className="text-md font-medium text-azul-profundo">Rango de Fechas</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-azul-profundo">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="px-3 py-2 border border-hielo rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
                  max={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-azul-profundo">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="px-3 py-2 border border-hielo rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
                  min={customDateRange.start}
                  max={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
            </div>

            {!isCustomRangeValid && customDateRange.start && customDateRange.end && (
              <p className="text-sm text-red-600">
                La fecha de inicio debe ser anterior o igual a la fecha de fin
              </p>
            )}
          </div>
        )}

        {/* Preview Statistics */}
        {dateRange && (
          <div className="flex flex-col gap-4 p-4 bg-gradient-to-br from-turquesa/10 to-turquesa/5 rounded-lg border border-turquesa/20">
            <div className="flex items-center gap-2">
              <FiActivity className="text-turquesa" />
              <h4 className="text-md font-medium text-azul-profundo">Vista Previa del Informe</h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-azul-profundo">{recordCount}</div>
                <div className="text-sm text-azul-profundo/70">Registros</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-azul-profundo">{statistics.diasTrabajados}</div>
                <div className="text-sm text-azul-profundo/70">Días Trabajados</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-azul-profundo">{statistics.tiempoTotal}</div>
                <div className="text-sm text-azul-profundo/70">Tiempo Total</div>
              </div>
            </div>

            <div className="text-sm text-azul-profundo/70 text-center">
              Período: {format(dateRange.start, 'dd/MM/yyyy', { locale: es })} - {format(dateRange.end, 'dd/MM/yyyy', { locale: es })}
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div className="flex flex-col gap-3">
          {!hasData && dateRange && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
              No hay registros para el período seleccionado
            </div>
          )}

          <PrimaryButton
            onClick={handleGenerateReport}
            disabled={!canGenerateReport}
            className="w-full sm:w-auto"
          >
            <FiDownload className={`w-4 h-4 ${isGenerating ? 'animate-bounce' : ''}`} />
            {isGenerating ? 'Generando PDF...' : 'Generar Informe PDF'}
          </PrimaryButton>

          <p className="text-xs text-azul-profundo/60">
            El informe incluirá un resumen estadístico y el detalle completo de todos los registros del período seleccionado.
          </p>
        </div>
      </div>
    </div>
  )
}