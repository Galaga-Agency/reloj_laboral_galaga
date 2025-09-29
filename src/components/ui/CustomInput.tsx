import { forwardRef, useState } from "react";
import { FiEye, FiEyeOff, FiCalendar } from "react-icons/fi";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  format,
} from "date-fns";
import { es } from "date-fns/locale";

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
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateValue, setDateValue] = useState<Date | null>(null);

    const isPasswordType = type === "password";
    const isDateType = type === "date";
    const inputType = isPasswordType && showPassword ? "text" : type;

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    const iconColor =
      variant === "darkBg"
        ? "text-white hover:text-white"
        : "text-teal hover:text-teal-800";

    const buildCalendar = (currentMonth: Date) => {
      const start = startOfWeek(startOfMonth(currentMonth), {
        weekStartsOn: 1,
      });
      const end = endOfMonth(currentMonth);
      const days: Date[] = [];
      let day = start;

      while (day <= end) {
        days.push(day);
        day = addDays(day, 1);
      }
      return days;
    };

    const calendarDays = buildCalendar(dateValue || new Date());

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
            type={isDateType ? "text" : inputType}
            readOnly={isDateType}
            value={
              isDateType
                ? dateValue
                  ? format(dateValue, "yyyy-MM-dd")
                  : ""
                : props.value
            }
            className={`
              w-full px-4 py-3 
              border rounded-xl
              transition-all duration-200
              focus:ring-1 focus:outline-none
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isPasswordType || isDateType ? "pr-12" : ""}
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
            placeholder={isDateType ? "Seleccionar fecha" : props.placeholder}
            onClick={() => {
              if (isDateType) setShowDatePicker(!showDatePicker);
            }}
            {...props}
          />

          {isPasswordType && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${iconColor}`}
            >
              {showPassword ? (
                <FiEyeOff className="w-5 h-5" />
              ) : (
                <FiEye className="w-5 h-5" />
              )}
            </button>
          )}

          {isDateType && (
            <FiCalendar
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 cursor-pointer ${iconColor}`}
              onClick={() => setShowDatePicker(!showDatePicker)}
            />
          )}

          {isDateType && showDatePicker && (
            <div
              className={`absolute mt-2 p-4 rounded-xl shadow-xl z-20 ${
                variant === "darkBg"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-black"
              }`}
            >
              <div className="grid grid-cols-7 gap-2 text-sm">
                {["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].map((d) => (
                  <div key={d} className="font-medium text-center">
                    {d}
                  </div>
                ))}
                {calendarDays.map((day, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setDateValue(day);
                      setShowDatePicker(false);
                    }}
                    className={`p-2 rounded text-center ${
                      isSameDay(day, dateValue || new Date())
                        ? "bg-teal text-white"
                        : isSameMonth(day, dateValue || new Date())
                        ? "hover:bg-teal-100"
                        : "opacity-40"
                    }`}
                  >
                    {format(day, "d", { locale: es })}
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
