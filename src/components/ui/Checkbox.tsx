import { forwardRef } from "react";
import { FiCheck } from "react-icons/fi";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  variant?: "lightBg" | "darkBg";
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      checked,
      onChange,
      label,
      description,
      disabled = false,
      className = "",
      variant = "darkBg",
    },
    ref
  ) => {
    return (
      <label
        className={`flex items-start gap-3 cursor-pointer ${
          disabled ? "cursor-not-allowed opacity-50" : ""
        } ${className}`}
      >
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="sr-only"
          />
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
              checked
                ? "bg-teal border-teal"
                : variant === "darkBg"
                ? "bg-white/5 border-white/20 hover:border-teal/50"
                : "bg-hielo/20 border-hielo/50 hover:border-teal"
            } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
          >
            {checked && (
              <FiCheck className="w-3 h-3 text-white" strokeWidth={3} />
            )}
          </div>
        </div>

        {(label || description) && (
          <div className="flex flex-col gap-1">
            {label && (
              <span
                className={`text-sm font-medium ${
                  variant === "darkBg" ? "text-white" : "text-azul-profundo"
                }`}
              >
                {label}
              </span>
            )}
            {description && (
              <span
                className={`text-xs ${
                  variant === "darkBg"
                    ? "text-white/60"
                    : "text-azul-profundo/60"
                }`}
              >
                {description}
              </span>
            )}
          </div>
        )}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
