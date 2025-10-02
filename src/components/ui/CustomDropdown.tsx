import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiChevronDown, FiCheck } from "react-icons/fi";

interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: any;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  variant?: "lightBg" | "darkBg";
}

export function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  disabled = false,
  className = "",
  variant = "lightBg",
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
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

  useEffect(() => {
    const updatePosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.left,
          width: rect.width,
        });
      }
    };

    if (isOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
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

  const dropdownMenu = isOpen ? (
    <>
      <div
        className="fixed inset-0 z-[9998]"
        onClick={() => setIsOpen(false)}
      />

      <div
        ref={dropdownRef}
        className="fixed z-[9999]"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
        }}
      >
        <div
          className={`
          backdrop-blur-sm border border-hielo/30 rounded-xl shadow-2xl overflow-hidden
          ${variant === "darkBg" ? "bg-blanco/95" : "bg-blanco"}
        `}
        >
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
                    transition-colors duration-150 cursor-pointer
                    ${
                      option.value === value
                        ? variant === "darkBg"
                          ? "bg-teal/20 text-teal font-medium"
                          : "bg-teal/10 text-teal font-medium"
                        : variant === "darkBg"
                        ? "text-teal/90 hover:bg-teal/10"
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
  ) : null;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-4 py-3 
          border rounded-xl font-medium transition-all duration-200
          ${
            variant === "darkBg"
              ? "bg-white/10 border-white/20 text-white"
              : "bg-hielo/20 border-hielo/50 text-azul-profundo"
          }
          ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : variant === "darkBg"
              ? "hover:bg-white/20 focus:ring-2 focus:ring-white/50 focus:border-white/50 cursor-pointer"
              : "hover:bg-hielo/30 focus:ring-2 focus:ring-teal focus:border-teal cursor-pointer"
          }
          ${
            isOpen
              ? variant === "darkBg"
                ? "ring-2 ring-white/50 border-white/50"
                : "ring-2 ring-teal border-teal"
              : ""
          }
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Filtro de fecha"
      >
        <span
          className={`
          ${
            variant === "darkBg"
              ? selectedOption
                ? "text-white"
                : "text-white/60"
              : selectedOption
              ? "text-azul-profundo"
              : "text-azul-profundo/60"
          }
        `}
        >
          {selectedOption?.label || placeholder}
        </span>

        <FiChevronDown
          className={`
            w-5 h-5 transition-transform duration-200
            ${variant === "darkBg" ? "text-white/50" : "text-azul-profundo/50"}
            ${isOpen ? "rotate-180" : "rotate-0"}
          `}
        />
      </button>

      {typeof document !== "undefined" &&
        createPortal(dropdownMenu, document.body)}
    </div>
  );
}
