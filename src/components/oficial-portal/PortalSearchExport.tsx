import { FiSearch, FiDownload } from "react-icons/fi";
import PrimaryButton from "@/components/ui/PrimaryButton";

interface PortalSearchExportProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onExport: () => void;
}

export function PortalSearchExport({
  searchTerm,
  onSearchChange,
  onExport,
}: PortalSearchExportProps) {
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8 z-10">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-azul-profundo/50 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar empleados por nombre o email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-hielo/50 rounded-xl focus:ring-2 focus:ring-teal focus:border-transparent bg-blanco text-azul-profundo placeholder-azul-profundo/50"
            />
          </div>
        </div>
        <PrimaryButton onClick={onExport} className="flex items-center gap-2">
          <FiDownload className="w-4 h-4" />
          Exportar CSV
        </PrimaryButton>
      </div>
    </div>
  );
}
