import { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiCheck } from "react-icons/fi";

interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  disabled = false,
  className = "",
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case "Enter":
      case " ":
        event.preventDefault();
        setIsOpen(!isOpen);
        break;
      case "Escape":
        setIsOpen(false);
        break;
      case "ArrowDown":
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          const currentIndex = options.findIndex((opt) => opt.value === value);
          const nextIndex =
            currentIndex < options.length - 1 ? currentIndex + 1 : 0;
          onChange(options[nextIndex].value);
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          const currentIndex = options.findIndex((opt) => opt.value === value);
          const prevIndex =
            currentIndex > 0 ? currentIndex - 1 : options.length - 1;
          onChange(options[prevIndex].value);
        }
        break;
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-4 py-3 
          bg-hielo/20 border border-hielo/50 rounded-xl
          text-left text-azul-profundo font-medium
          transition-all duration-200
          ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-hielo/30 focus:ring-2 focus:ring-teal focus:border-teal cursor-pointer"
          }
          ${isOpen ? "ring-2 ring-teal border-teal" : ""}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Filtro de fecha"
      >
        <span
          className={
            selectedOption ? "text-azul-profundo" : "text-azul-profundo/60"
          }
        >
          {selectedOption?.label || placeholder}
        </span>

        <FiChevronDown
          className={`w-5 h-5 text-azul-profundo/50 transition-transform duration-200 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute top-full left-0 right-0 mt-2 z-20">
            <div className="bg-blanco/95 backdrop-blur-sm border border-hielo/30 rounded-xl shadow-2xl overflow-hidden">
              <ul className="py-2 max-h-60 overflow-y-auto" role="listbox">
                {options.map((option) => (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={option.value === value}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={`
                        w-full px-4 py-3 text-left flex items-center justify-between
                        transition-colors duration-150
                        ${
                          option.value === value
                            ? "bg-teal/10 text-teal font-medium"
                            : "text-azul-profundo hover:bg-hielo/20"
                        }
                      `}
                    >
                      <span>{option.label}</span>
                      {option.value === value && (
                        <FiCheck className="w-4 h-4 text-teal" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
