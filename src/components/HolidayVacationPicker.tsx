import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { FiCalendar, FiPlus, FiX, FiTrash2 } from 'react-icons/fi'
import { DateManager, type DateRange } from '@/utils/date-management'

interface HolidayVacationPickerProps {
  selectedDates: string[]
  onDatesChange: (dates: string[]) => void
}

export function HolidayVacationPicker({ selectedDates, onDatesChange }: HolidayVacationPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [singleDate, setSingleDate] = useState('')
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')

  const handleAddSingleDate = () => {
    const newDates = DateManager.addSingleDate(selectedDates, singleDate)
    if (newDates !== selectedDates) {
      onDatesChange(newDates)
      setSingleDate('')
    }
  }

  const handleAddDateRange = () => {
    const newDates = DateManager.addDateRange(selectedDates, rangeStart, rangeEnd)
    if (newDates !== selectedDates) {
      onDatesChange(newDates)
      setRangeStart('')
      setRangeEnd('')
    }
  }

  const handleAddPresetRange = (type: 'week' | 'month') => {
    const newDates = DateManager.addPresetRange(selectedDates, type)
    onDatesChange(newDates)
  }

  const handleRemoveDate = (date: string) => {
    const newDates = DateManager.removeSingleDate(selectedDates, date)
    onDatesChange(newDates)
  }

  const handleRemoveRange = (range: DateRange) => {
    const newDates = DateManager.removeDateRange(selectedDates, range)
    onDatesChange(newDates)
  }

  const handleClearAll = () => {
    onDatesChange(DateManager.clearAllDates())
  }

  const dateRanges = DateManager.groupIntoRanges(selectedDates)
  const dateAlreadyExists = DateManager.dateExists(selectedDates, singleDate)

  return (
    <div className="bg-blanco/95 backdrop-blur-sm rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between pb-6">
        <h2 className="text-2xl font-bold text-azul-profundo flex items-center gap-3">
          <FiCalendar className="text-teal" />
          Días Libres y Vacaciones
        </h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 bg-teal text-blanco rounded-lg hover:bg-teal/90 flex items-center gap-2 transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          {isOpen ? 'Cerrar' : 'Agregar'}
        </button>
      </div>

      {isOpen && (
        <div className="bg-hielo/20 border border-hielo rounded-lg p-4 pb-6">
          <div className="flex flex-col gap-6">
            {/* Single Date */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-azul-profundo">
                Agregar día específico
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  className="flex-1 px-3 py-2 border border-hielo rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
                <button
                  onClick={handleAddSingleDate}
                  disabled={!singleDate || dateAlreadyExists}
                  className="px-4 py-2 bg-azul-profundo text-blanco rounded-lg hover:bg-azul-profundo/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Agregar
                </button>
              </div>
              {dateAlreadyExists && (
                <p className="text-xs text-orange-600">Esta fecha ya está seleccionada</p>
              )}
            </div>

            {/* Date Range */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-azul-profundo">
                Agregar rango de fechas (vacaciones)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  className="px-3 py-2 border border-hielo rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
                <input
                  type="date"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  className="px-3 py-2 border border-hielo rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
                  min={rangeStart || format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              <button
                onClick={handleAddDateRange}
                disabled={!rangeStart || !rangeEnd}
                className="w-full px-4 py-2 bg-teal text-blanco rounded-lg hover:bg-teal/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Agregar Rango
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-azul-profundo">
                Rangos rápidos
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddPresetRange('week')}
                  className="px-3 py-2 bg-turquesa text-blanco rounded-lg hover:bg-turquesa/90 text-sm"
                >
                  Esta Semana
                </button>
                <button
                  onClick={() => handleAddPresetRange('month')}
                  className="px-3 py-2 bg-turquesa text-blanco rounded-lg hover:bg-turquesa/90 text-sm"
                >
                  Este Mes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Dates Display */}
      {selectedDates.length > 0 ? (
        <div className="flex flex-col gap-4 pt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-azul-profundo">
              {selectedDates.length} días seleccionados
            </span>
            <button
              onClick={handleClearAll}
              className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
            >
              <FiTrash2 className="w-4 h-4" />
              Limpiar todo
            </button>
          </div>
          
          <div className="flex flex-col gap-3">
            {dateRanges.map((range, index) => (
              <div key={`${range.start}-${range.end}-${index}`} className="flex items-center justify-between bg-hielo/30 px-4 py-3 rounded-lg">
                <div className="flex flex-col gap-1">
                  {range.count === 1 ? (
                    <span className="text-sm font-medium text-azul-profundo">
                      {format(parseISO(range.start), "d 'de' MMMM 'de' yyyy", { locale: es })}
                    </span>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-azul-profundo">
                        {format(parseISO(range.start), "d 'de' MMMM", { locale: es })} - {format(parseISO(range.end), "d 'de' MMMM 'de' yyyy", { locale: es })}
                      </span>
                      <span className="text-xs text-azul-profundo/60">
                        {range.count} días consecutivos
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (range.count === 1) {
                        handleRemoveDate(range.start)
                      } else {
                        handleRemoveRange(range)
                      }
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                    title={range.count === 1 ? "Eliminar día" : "Eliminar rango"}
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-azul-profundo/60">
          <FiCalendar className="w-12 h-12 mx-auto opacity-30 pb-2" />
          <p className="text-sm">No hay días libres configurados</p>
          <p className="text-xs">Haz clic en "Agregar" para añadir días</p>
        </div>
      )}
    </div>
  )
}