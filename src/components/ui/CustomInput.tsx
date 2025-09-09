import { forwardRef, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
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
          <label className="text-sm font-medium text-azul-profundo">
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
              bg-blanco/90 text-azul-profundo
              transition-all duration-200
              focus:ring-2 focus:ring-teal focus:border-teal focus:outline-none
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isPasswordType ? "pr-12" : ""}
              ${
                error
                  ? "border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400"
                  : "border-hielo/50 hover:border-hielo focus:border-teal"
              }
              ${className}
            `}
            {...props}
          />

          {isPasswordType && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-azul-profundo/60 hover:text-azul-profundo transition-colors"
            >
              {showPassword ? (
                <FiEyeOff className="w-5 h-5" />
              ) : (
                <FiEye className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {helperText && !error && (
          <p className="text-sm text-azul-profundo/60">{helperText}</p>
        )}
      </div>
    );
  }
);

CustomInput.displayName = "CustomInput";
