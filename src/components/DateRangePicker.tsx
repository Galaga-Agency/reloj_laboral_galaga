import { useState } from 'react'
import { format, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import { FiCalendar, FiPlus, FiX } from 'react-icons/fi'

interface DateRangePickerProps {
  selectedDates: string[]
  onDatesChange: (dates: string[]) => void
}

export function DateRangePicker({ selectedDates, onDatesChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const addSingleDate = () => {
    if (startDate && !selectedDates.includes(startDate)) {
      onDatesChange([...selectedDates, startDate].sort())
      setStartDate('')
    }
  }

  const addDateRange = () => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      if (start <= end) {
        const daysInRange = eachDayOfInterval({ start, end })
        const newDates = daysInRange.map(date => date.toISOString().split('T')[0])
        const uniqueDates = [...new Set([...selectedDates, ...newDates])].sort()
        onDatesChange(uniqueDates)
      }
      
      setStartDate('')
      setEndDate('')
    }
  }

  const addPresetRange = (type: 'week' | 'month') => {
    const today = new Date()
    let start: Date
    let end: Date

    if (type === 'week') {
      start = startOfWeek(today, { locale: es })
      end = endOfWeek(today, { locale: es })
    } else {
      start = startOfMonth(today)
      end = endOfMonth(today)
    }

    const daysInRange = eachDayOfInterval({ start, end })
    const newDates = daysInRange.map(date => date.toISOString().split('T')[0])
    const uniqueDates = [...new Set([...selectedDates, ...newDates])].sort()
    onDatesChange(uniqueDates)
  }

  const removeDate = (date: string) => {
    onDatesChange(selectedDates.filter(d => d !== date))
  }

  const clearAll = () => {
    onDatesChange([])
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-azul-profundo flex items-center gap-2">
          <FiCalendar className="w-5 h-5" />
          Días Libres y Vacaciones
        </h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-2 bg-teal text-white rounded-lg hover:bg-teal/90 flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Agregar
        </button>
      </div>

      {isOpen && (
        <div className="bg-hielo/20 border border-hielo rounded-lg p-4 space-y-4">
          {/* Single Date */}
          <div>
            <label className="block text-sm font-medium text-azul-profundo mb-2">
              Agregar día específico
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-hielo rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
                min={format(new Date(), 'yyyy-MM-dd')}
              />
              <button
                onClick={addSingleDate}
                disabled={!startDate}
                className="px-4 py-2 bg-azul-profundo text-white rounded-lg hover:bg-azul-profundo/90 disabled:opacity-50"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-azul-profundo mb-2">
              Agregar rango de fechas
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="date"
                placeholder="Fecha inicio"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-hielo rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
                min={format(new Date(), 'yyyy-MM-dd')}
              />
              <input
                type="date"
                placeholder="Fecha fin"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-hielo rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
                min={startDate || format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <button
              onClick={addDateRange}
              disabled={!startDate || !endDate}
              className="w-full px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal/90 disabled:opacity-50"
            >
              Agregar Rango
            </button>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-sm font-medium text-azul-profundo mb-2">
              Rangos rápidos
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => addPresetRange('week')}
                className="px-3 py-2 bg-turquesa text-white rounded-lg hover:bg-turquesa/90 text-sm"
              >
                Esta Semana
              </button>
              <button
                onClick={() => addPresetRange('month')}
                className="px-3 py-2 bg-turquesa text-white rounded-lg hover:bg-turquesa/90 text-sm"
              >
                Este Mes
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-azul-profundo hover:bg-hielo/30 rounded-lg"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Selected Dates Display */}
      {selectedDates.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-azul-profundo">
              {selectedDates.length} días seleccionados
            </span>
            <button
              onClick={clearAll}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Limpiar todo
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
            {selectedDates.map(date => (
              <div key={date} className="flex items-center justify-between bg-hielo/30 px-3 py-2 rounded-lg">
                <span className="text-sm text-azul-profundo">
                  {format(new Date(date), "d MMM", { locale: es })}
                </span>
                <button
                  onClick={() => removeDate(date)}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}