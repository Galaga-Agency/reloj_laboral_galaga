import { createPortal } from 'react-dom';
import { FiHome, FiBriefcase } from 'react-icons/fi';
import { useState } from 'react';

interface WorkLocationModalProps {
  isOpen: boolean;
  onConfirm: (location: 'oficina' | 'teletrabajo') => void;
  onCancel: () => void;
}

export function WorkLocationModal({ 
  isOpen, 
  onConfirm, 
  onCancel 
}: WorkLocationModalProps) {
  const [selectedLocation, setSelectedLocation] = useState<'oficina' | 'teletrabajo' | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedLocation) {
      onConfirm(selectedLocation);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-8 w-full" style={{ maxWidth: '32rem' }}>
        <h3 className="text-xl font-bold text-azul-profundo pb-2">
          ¿Desde dónde trabajas hoy?
        </h3>
        <p className="text-azul-profundo/70 pb-6 text-sm">
          Selecciona tu ubicación de trabajo
        </p>
        
        <div className="flex gap-4 pb-8">
          <button
            onClick={() => setSelectedLocation('oficina')}
            className={`flex-1 flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200 ${
              selectedLocation === 'oficina'
                ? 'border-teal bg-teal/10 shadow-lg scale-105'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <FiBriefcase 
              className={`w-12 h-12 ${
                selectedLocation === 'oficina' ? 'text-teal' : 'text-gray-400'
              }`}
            />
            <span 
              className={`font-semibold ${
                selectedLocation === 'oficina' ? 'text-azul-profundo' : 'text-gray-600'
              }`}
            >
              Oficina
            </span>
          </button>

          <button
            onClick={() => setSelectedLocation('teletrabajo')}
            className={`flex-1 flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200 ${
              selectedLocation === 'teletrabajo'
                ? 'border-teal bg-teal/10 shadow-lg scale-105'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <FiHome 
              className={`w-12 h-12 ${
                selectedLocation === 'teletrabajo' ? 'text-teal' : 'text-gray-400'
              }`}
            />
            <span 
              className={`font-semibold ${
                selectedLocation === 'teletrabajo' ? 'text-azul-profundo' : 'text-gray-600'
              }`}
            >
              Teletrabajo
            </span>
          </button>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedLocation}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
              selectedLocation
                ? 'bg-teal text-white hover:bg-teal/90 shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}