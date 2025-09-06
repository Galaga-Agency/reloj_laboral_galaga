import { ReactNode } from 'react'

interface Tab {
  id: string
  label: string
  icon: ReactNode
}

interface DashboardTabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export function DashboardTabs({ tabs, activeTab, onTabChange, className = '' }: DashboardTabsProps) {
  return (
    <>
      {/* Mobile: Bottom navigation bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="bg-white/90 backdrop-blur-xl border-t border-hielo/30 px-4 py-2 safe-area-pb">
          <div className="flex justify-around">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center gap-1 p-2 min-w-0 transition-all duration-200 cursor-pointer ${
                  activeTab === tab.id ? 'text-teal' : 'text-azul-profundo/50'
                }`}
              >
                <div className={`text-xl transition-transform duration-200 ${
                  activeTab === tab.id ? 'scale-125 -translate-y-0.5' : ''
                }`}>
                  {tab.icon}
                </div>
                <span className="text-xs font-medium truncate w-full text-center">
                  {tab.label}
                </span>
                {activeTab === tab.id && (
                  <div className="w-4 h-0.5 bg-teal rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop: Segmented control style */}
      <nav className={`hidden md:block bg-transparent p-6 ${className}`}>
        <div className="flex justify-center">
          <div className="relative bg-hielo/20 p-1 rounded-2xl">
            <div className="flex">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 z-10 ${
                    activeTab === tab.id
                      ? 'text-azul-profundo'
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* Sliding background */}
            <div 
              className="absolute top-1 bottom-1 bg-white rounded-xl shadow-lg transition-all duration-300 ease-out"
              style={{
                left: `${tabs.findIndex(tab => tab.id === activeTab) * (100 / tabs.length)}%`,
                width: `${100 / tabs.length}%`,
                marginLeft: '4px',
                marginRight: '4px'
              }}
            />
          </div>
        </div>
      </nav>
    </>
  )
}