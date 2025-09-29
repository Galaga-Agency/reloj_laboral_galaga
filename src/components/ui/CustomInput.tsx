import { forwardRef, useState } from "react";
import { FiEye, FiEyeOff, FiClock, FiCalendar } from "react-icons/fi";
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
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [dateValue, setDateValue] = useState<Date | null>(null);
    const [timeValue, setTimeValue] = useState("");

    const isPasswordType = type === "password";
    const isDateType = type === "date";
    const isTimeType = type === "time";
    const isNumberType = type === "number";
    const inputType = isPasswordType && showPassword ? "text" : type;

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    const iconColor =
      variant === "darkBg"
        ? "text-white hover:text-white"
        : "text-teal hover:text-teal-800";

    // build calendar grid
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
            type={
              isDateType || isTimeType
                ? "text" // kill browser widget
                : inputType
            }
            readOnly={isDateType || isTimeType}
            value={
              isDateType
                ? dateValue
                  ? format(dateValue, "yyyy-MM-dd")
                  : ""
                : isTimeType
                ? timeValue
                : props.value
            }
            className={`
              w-full px-4 py-3 
              border rounded-xl
              transition-all duration-200
              focus:ring-1 focus:outline-none
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isPasswordType || isDateType || isTimeType ? "pr-12" : ""}
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
            placeholder={
              isDateType
                ? "Seleccionar fecha"
                : isTimeType
                ? "HH:MM"
                : props.placeholder
            }
            onClick={() => {
              if (isDateType) setShowDatePicker(!showDatePicker);
              if (isTimeType) setShowTimePicker(!showTimePicker);
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
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 ${iconColor}`}
              onClick={() => setShowDatePicker(!showDatePicker)}
            />
          )}
          {isTimeType && (
            <FiClock
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 cursor-pointer ${iconColor}`}
              onClick={() => setShowTimePicker(!showTimePicker)}
            />
          )}

          {/* Custom date picker */}
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

          {/* Custom time picker */}
          {isTimeType && showTimePicker && (
            <div
              className="
      absolute bottom-full mb-2 left-0 w-92 rounded-lg shadow-xl z-20 p-4
      bg-white border border-gray-200 text-gray-900
    "
            >
              {/* Hours */}
              <div className="mb-4">
                <p className="text-xs mb-2 text-gray-500">Horas</p>
                <div className="grid grid-cols-8 gap-2">
                  {Array.from({ length: 24 }).map((_, h) => {
                    const val = h.toString().padStart(2, "0");
                    const selected =
                      (props.value as string)?.split(":")[0] === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          const minutes =
                            (props.value as string)?.split(":")[1] || "00";
                          const newValue = `${val}:${minutes}`;
                          props.onChange?.({
                            target: { value: newValue },
                          } as React.ChangeEvent<HTMLInputElement>);
                        }}
                        className={`py-2 rounded-md text-sm font-semibold transition
                ${selected ? "bg-teal text-white" : "hover:bg-gray-100"}
              `}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Minutes */}
              <div className="mb-4">
                <p className="text-xs mb-2 text-gray-500">Minutos</p>
                <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto">
                  {Array.from({ length: 60 }).map((_, m) => {
                    const val = m.toString().padStart(2, "0");
                    const selected =
                      (props.value as string)?.split(":")[1] === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          const hour =
                            (props.value as string)?.split(":")[0] || "00";
                          const newValue = `${hour}:${val}`;
                          props.onChange?.({
                            target: { value: newValue },
                          } as React.ChangeEvent<HTMLInputElement>);
                        }}
                        className={`py-2 rounded-md text-sm font-semibold transition
                ${selected ? "bg-teal text-white" : "hover:bg-gray-100"}
              `}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center border-t pt-3">
                <span className="font-mono text-lg text-gray-800">
                  {(props.value as string) || "00:00"}
                </span>
                <button
                  type="button"
                  className="px-4 py-2 rounded-md bg-teal text-white font-semibold hover:bg-teal/90 hover:-translate-y-1 transition-all duration-300"
                  onClick={() => setShowTimePicker(false)}
                >
                  OK
                </button>
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
