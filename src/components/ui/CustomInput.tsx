import { forwardRef, useState, useEffect } from "react";
import { FiClock } from "react-icons/fi";

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
      type = "text",
      variant = "darkBg",
      onChange,
      value,
      ...props
    },
    ref
  ) => {
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [internalValue, setInternalValue] = useState((value as string) || "");
    const [selectedHour, setSelectedHour] = useState<number | null>(null);

    const isTimeType = type === "time";

    useEffect(() => {
      if (isTimeType && value) {
        setInternalValue(value as string);
      }
    }, [value, isTimeType]);

    const iconColor =
      variant === "darkBg"
        ? "text-white hover:text-white"
        : "text-teal hover:text-teal-800";

    const handleHourClick = (h: number) => {
      setSelectedHour(h);
    };

    const handleMinuteClick = (m: number) => {
      const hour =
        selectedHour ??
        parseInt((internalValue || "00:00").split(":")[0] || "0", 10);

      const formatted = `${String(hour).padStart(2, "0")}:${String(m).padStart(
        2,
        "0"
      )}`;

      setInternalValue(formatted);

      if (onChange) {
        onChange({ target: { value: formatted } } as any);
      }

      setShowTimePicker(false);
      setSelectedHour(null);
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
            type={isTimeType ? "text" : type}
            readOnly={isTimeType}
            value={isTimeType ? internalValue : (value as string) || ""}
            onChange={(e) => {
              if (isTimeType) {
                return;
              }
              onChange?.(e);
            }}
            onClick={() => isTimeType && setShowTimePicker((p) => !p)}
            className={`
              w-full px-4 py-3 
              border rounded-xl
              ${isTimeType ? "cursor-pointer pr-10" : ""}
              transition-all duration-200
              focus:ring-1 focus:outline-none
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

          {isTimeType && (
            <button
              type="button"
              onClick={() => setShowTimePicker((p) => !p)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${iconColor}`}
            >
              <FiClock className="w-5 h-5" />
            </button>
          )}

          {isTimeType && showTimePicker && (
            <div
              className="
                absolute top-full left-0 mt-2 z-20
                flex gap-4 p-3
                bg-white
                border rounded-xl shadow-lg
              "
            >
              <div className="h-32 overflow-y-auto">
                {[...Array(24)].map((_, h) => (
                  <button
                    key={h}
                    type="button"
                    className={`block w-12 py-1 rounded ${
                      selectedHour === h
                        ? "bg-teal text-white"
                        : "hover:bg-teal hover:text-white"
                    }`}
                    onClick={() => handleHourClick(h)}
                  >
                    {String(h).padStart(2, "0")}
                  </button>
                ))}
              </div>

              <div className="h-32 overflow-y-auto">
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                  <button
                    key={m}
                    type="button"
                    className="block w-12 py-1 rounded hover:bg-teal hover:text-white"
                    onClick={() => handleMinuteClick(m)}
                  >
                    {String(m).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
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