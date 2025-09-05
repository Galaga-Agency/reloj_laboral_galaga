export interface RegistroTiempo {
  id: string
  usuarioId: string
  fechaEntrada: Date
  fechaSalida?: Date
  tipoRegistro: 'entrada' | 'salida' | 'descanso_inicio' | 'descanso_fin'
  esSimulado?: boolean
}

export type EstadoTrabajo = 'desconectado' | 'trabajando' | 'descanso'