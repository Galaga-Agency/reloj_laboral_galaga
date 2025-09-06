// utils/pdf-reports.ts
import jsPDF from 'jspdf'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { RegistroTiempo } from '@/types'
import { TimeRecordsUtils } from './time-records'

export interface ReportData {
  usuario: {
    id: string
    nombre: string
    email: string
    firstLogin?: boolean
  }
  registros: RegistroTiempo[]
  periodo: string
  fechaInicio: Date
  fechaFin: Date
  estadisticas: {
    tiempoTotal: string
    diasTrabajados: number
    promedioDiario: string
  }
}

export class PDFReportGenerator {
  private static readonly MARGIN = 20
  private static readonly LINE_HEIGHT = 7
  private static readonly PAGE_WIDTH = 210
  private static readonly PAGE_HEIGHT = 297

  static generateReport(data: ReportData): void {
    const doc = new jsPDF()
    let yPosition = this.MARGIN

    // Header
    yPosition = this.addHeader(doc, data, yPosition)
    yPosition += 10

    // Statistics summary
    yPosition = this.addStatistics(doc, data.estadisticas, yPosition)
    yPosition += 10

    // Records table
    this.addRecordsTable(doc, data.registros, yPosition)

    // Generate filename and save
    const filename = this.generateFilename(data)
    doc.save(filename)
  }

  private static addHeader(doc: jsPDF, data: ReportData, y: number): number {
    // Company/App title
    doc.setFontSize(20)
    doc.setFont(undefined, 'bold')
    doc.text('Reloj Laboral - Informe de Tiempo', this.MARGIN, y)
    y += 15

    // Report period
    doc.setFontSize(14)
    doc.setFont(undefined, 'normal')
    doc.text(`Período: ${data.periodo}`, this.MARGIN, y)
    y += this.LINE_HEIGHT

    // Date range
    const fechaInicio = format(data.fechaInicio, 'dd/MM/yyyy', { locale: es })
    const fechaFin = format(data.fechaFin, 'dd/MM/yyyy', { locale: es })
    doc.text(`Desde: ${fechaInicio} - Hasta: ${fechaFin}`, this.MARGIN, y)
    y += this.LINE_HEIGHT

    // Employee name
    doc.text(`Empleado: ${data.usuario.nombre}`, this.MARGIN, y)
    y += this.LINE_HEIGHT

    // Generation date
    doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, this.MARGIN, y)
    y += this.LINE_HEIGHT

    // Separator line
    doc.setLineWidth(0.5)
    doc.line(this.MARGIN, y + 5, this.PAGE_WIDTH - this.MARGIN, y + 5)

    return y + 10
  }

  private static addStatistics(doc: jsPDF, stats: ReportData['estadisticas'], y: number): number {
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.text('Resumen', this.MARGIN, y)
    y += 10

    doc.setFontSize(12)
    doc.setFont(undefined, 'normal')

    doc.text(`Tiempo Total Trabajado: ${stats.tiempoTotal}`, this.MARGIN, y)
    y += this.LINE_HEIGHT

    doc.text(`Días Trabajados: ${stats.diasTrabajados}`, this.MARGIN, y)
    y += this.LINE_HEIGHT

    doc.text(`Promedio Diario: ${stats.promedioDiario}`, this.MARGIN, y)
    y += this.LINE_HEIGHT

    return y
  }

  private static addRecordsTable(doc: jsPDF, registros: RegistroTiempo[], y: number): void {
    if (registros.length === 0) {
      doc.setFontSize(12)
      doc.text('No hay registros para el período seleccionado', this.MARGIN, y)
      return
    }

    // Table header
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('Detalle de Registros', this.MARGIN, y)
    y += 15

    // Group records by day
    const recordsByDay = this.groupRecordsByDay(registros)

    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')

    for (const [date, dayRecords] of recordsByDay) {
      // Check if we need a new page
      if (y > this.PAGE_HEIGHT - 50) {
        doc.addPage()
        y = this.MARGIN
      }

      // Day header
      doc.setFont(undefined, 'bold')
      doc.text(`${format(new Date(date), 'EEEE, dd/MM/yyyy', { locale: es })}`, this.MARGIN, y)
      y += this.LINE_HEIGHT
      doc.setFont(undefined, 'normal')

      // Day records
      for (const registro of dayRecords) {
        const tipoStr = TimeRecordsUtils.getTypeText(registro.tipoRegistro)
        const entradaStr = format(new Date(registro.fechaEntrada), 'HH:mm:ss')
        const salidaStr = registro.fechaSalida 
          ? ` → ${format(new Date(registro.fechaSalida), 'HH:mm:ss')}` 
          : ''
        const simuladoStr = registro.esSimulado ? ' (Simulado)' : ''

        doc.text(`  ${tipoStr}: ${entradaStr}${salidaStr}${simuladoStr}`, this.MARGIN, y)
        y += this.LINE_HEIGHT
      }

      y += 3 // Space between days
    }

    // Simple footer
    doc.setFontSize(8)
    doc.text('Generado por Reloj Laboral', this.MARGIN, this.PAGE_HEIGHT - 10)
  }

  private static groupRecordsByDay(registros: RegistroTiempo[]): Map<string, RegistroTiempo[]> {
    const grouped = new Map<string, RegistroTiempo[]>()

    registros.forEach(registro => {
      const dateKey = format(new Date(registro.fechaEntrada), 'yyyy-MM-dd')
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, [])
      }
      grouped.get(dateKey)!.push(registro)
    })

    // Sort each day's records by time
    grouped.forEach(dayRecords => {
      dayRecords.sort((a, b) => 
        new Date(a.fechaEntrada).getTime() - new Date(b.fechaEntrada).getTime()
      )
    })

    return grouped
  }

  private static generateFilename(data: ReportData): string {
    const fechaInicio = format(data.fechaInicio, 'yyyy-MM-dd')
    const fechaFin = format(data.fechaFin, 'yyyy-MM-dd')
    const nombreLimpio = data.usuario.nombre.replace(/[^a-zA-Z0-9]/g, '_')
    
    return `informe_${nombreLimpio}_${fechaInicio}_${fechaFin}.pdf`
  }
}