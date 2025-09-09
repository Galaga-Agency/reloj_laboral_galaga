import { ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  icon: ReactNode;
}

interface DashboardTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function DashboardTabs({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}: DashboardTabsProps) {
  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.id === activeTab)
  );

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        <div className="bg-white/90 backdrop-blur-xl border-t border-hielo/30 px-4 py-2 safe-area-pb">
          <div className="flex justify-around">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center gap-1 p-2 min-w-0 transition-all duration-200 cursor-pointer ${
                  activeTab === tab.id ? "text-teal" : "text-azul-profundo/50"
                }`}
              >
                <div
                  className={`text-xl transition-transform duration-200 ${
                    activeTab === tab.id ? "scale-125 -translate-y-0.5" : ""
                  }`}
                >
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

      <nav className={`hidden md:block bg-transparent p-6 ${className}`}>
        <div className="flex justify-center">
          <div className="relative bg-hielo/20 p-1 rounded-2xl overflow-hidden">
            <div
              className="grid relative z-10"
              style={{
                gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
              }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`relative cursor-pointer flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-colors duration-300 z-10 ${
                    activeTab === tab.id
                      ? "text-azul-profundo"
                      : "text-white/90 hover:text-white"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
            <div
              className="absolute inset-1 rounded-xl bg-white shadow-lg transition-transform duration-300 ease-out z-0 will-change-transform pointer-events-none"
              style={{
                width: `calc(98% / ${tabs.length})`,
                transform: `translateX(${activeIndex * 100}%)`,
              }}
            />
          </div>
        </div>
      </nav>
    </>
  );
}
