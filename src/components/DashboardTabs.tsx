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
        <div className="px-4 pb-4 pt-2 safe-area-pb">
          <div className="relative mx-auto max-w-md">
            <div className="absolute inset-0 blur-xl bg-white/30 rounded-2xl" />
            <div className="relative rounded-2xl border border-hielo/40 bg-white p-1 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
              <div
                className="absolute top-1 bottom-1 rounded-xl border border-teal/30 bg-teal/10 shadow-[0_8px_24px_rgba(45,212,191,0.35)] transition-transform duration-300 ease-out will-change-transform"
                style={{
                  width: `calc(97.5% / ${tabs.length})`,
                  transform: `translateX(${activeIndex * 100}%)`,
                }}
              />
              <div
                className="grid relative z-10"
                style={{
                  gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
                }}
              >
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange(tab.id)}
                      className={`relative flex flex-col items-center justify-center gap-1 py-2 min-w-0 cursor-pointer transition-all duration-300 ${
                        isActive
                          ? "text-teal"
                          : "text-azul-profundo/60 hover:text-azul-profundo"
                      }`}
                    >
                      <div
                        className={`text-xl transition-transform duration-300 ${
                          isActive ? "scale-110 -translate-y-0.5" : "scale-100"
                        }`}
                      >
                        {tab.icon}
                      </div>
                      <span
                        className={`text-[11px] font-medium leading-none truncate w-full text-center transition-opacity ${
                          isActive ? "opacity-100" : "opacity-80"
                        }`}
                      >
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
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
