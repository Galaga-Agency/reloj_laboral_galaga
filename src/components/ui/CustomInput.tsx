import { forwardRef, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  variant?: "lightBg" | "darkBg";
}

export const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  (
    {
      label,
      error,
      helperText,
      containerClassName = "",
      className = "",
      type,
      variant = "darkBg",
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordType = type === "password";
    const inputType = isPasswordType && showPassword ? "text" : type;

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    return (
      <div className={`flex flex-col gap-2 ${containerClassName}`}>
        {label && (
          <label
            className={`text-sm font-medium ${
              variant === "darkBg" ? "text-white" : "text-azul-profundo"
            }`}
          >
            {label}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            className={`
              w-full px-4 py-3 
              border rounded-xl
              transition-all duration-200
              focus:ring-1 focus:outline-none
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isPasswordType ? "pr-12" : ""}
              ${
                variant === "darkBg"
                  ? "bg-white/5 text-white placeholder:text-white/40 border-white/20 hover:border-white/30 focus:ring-teal/50 focus:border-teal/50"
                  : "bg-hielo/20 text-azul-profundo placeholder:text-azul-profundo/40 border-hielo/50 hover:border-hielo/70 focus:ring-teal focus:border-teal"
              }
              ${
                error
                  ? variant === "darkBg"
                    ? "border-red-500/50 bg-red-500/10 focus:ring-red-500/50 focus:border-red-500/50"
                    : "border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500"
                  : ""
              }
              ${className}
            `}
            {...props}
          />

          {isPasswordType && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                variant === "darkBg"
                  ? "text-white/60 hover:text-white"
                  : "text-azul-profundo/60 hover:text-azul-profundo"
              }`}
            >
              {showPassword ? (
                <FiEyeOff className="w-5 h-5" />
              ) : (
                <FiEye className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        {error && (
          <p
            className={`text-sm ${
              variant === "darkBg" ? "text-red-400" : "text-red-600"
            }`}
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p
            className={`text-sm ${
              variant === "darkBg" ? "text-white/60" : "text-azul-profundo/60"
            }`}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

CustomInput.displayName = "CustomInput";
