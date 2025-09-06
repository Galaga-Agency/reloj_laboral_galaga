import { useState } from 'react'
import type { Usuario, VistaNavegacion } from '@/types'
import { RelojPrincipal } from '@/components/RelojPrincipal'
import { HistorialTrabajo } from '@/components/HistorialTrabajo'
import { WorkSettings } from '@/components/WorkSettings'
import { DashboardTabs } from '@/components/DashboardTabs'
import { DashboardHeader } from '@/components/DashboardHeader'
import { useTimeRecords } from '@/hooks/useTimeRecords'
import { useGSAPAnimations } from '@/hooks/useGSAPAnimations'
import { initDashboardAnimations } from '@/utils/animations/clock-animations'
import { FiClock, FiList, FiSettings } from 'react-icons/fi'

interface DashboardPageProps {
  usuario: Usuario
  onLogout: () => void
}

export function DashboardPage({ usuario, onLogout }: DashboardPageProps) {
  const [vistaActual, setVistaActual] = useState<VistaNavegacion>('reloj')
  
  const {
    registros,
    estadoActual,
    refetch
  } = useTimeRecords(usuario.id)

  useGSAPAnimations({ animations: [initDashboardAnimations], delay: 100 })

  const tabs = [
    { id: 'reloj' as const, label: 'Fichaje', icon: <FiClock className="w-5 h-5" /> },
    { id: 'historial' as const, label: 'Historial', icon: <FiList className="w-5 h-5" /> },
    { id: 'configuracion' as const, label: 'Config', icon: <FiSettings className="w-5 h-5" /> }
  ]

  const renderTabContent = () => {
    switch (vistaActual) {
      case 'reloj':
        return <RelojPrincipal usuario={usuario} />
      case 'historial':
        return <HistorialTrabajo registros={registros.filter(r => r.usuarioId === usuario.id)} onRefresh={refetch} />
      case 'configuracion':
        return <WorkSettings usuario={usuario} registros={registros} />
      default:
        return <RelojPrincipal usuario={usuario} />
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-azul-profundo via-[#123243] to-teal">
      {/* HEADER */}
      <DashboardHeader 
        usuario={usuario}
        estadoActual={estadoActual}
        onLogout={onLogout}
      />

      {/* NAVIGATION TABS */}
      <DashboardTabs
        tabs={tabs}
        activeTab={vistaActual}
        onTabChange={(tabId) => setVistaActual(tabId as VistaNavegacion)}
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full px-4 py-8">
        {renderTabContent()}
      </main>
    </div>
  )
}