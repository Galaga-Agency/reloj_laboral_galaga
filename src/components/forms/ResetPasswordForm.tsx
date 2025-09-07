import { useForm } from "react-hook-form";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";

interface ResetPasswordFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface ResetFormData {
  newPassword: string;
  confirmPassword: string;
}

export function ResetPasswordForm({ onSuccess, onCancel }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<ResetFormData>({
    mode: "onChange",
  });

  const newPassword = watch("newPassword");

  const onSubmit = async (data: ResetFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) {
        let errorMessage = "Error al actualizar la contraseña";
        
        if (error.message.includes("New password should be different")) {
          errorMessage = "La nueva contraseña debe ser diferente a la actual";
        } else if (error.message.includes("Password should be")) {
          errorMessage = "La contraseña no cumple con los requisitos de seguridad";
        } else if (error.message.includes("same as")) {
          errorMessage = "La nueva contraseña debe ser diferente a la anterior";
        }
        
        throw new Error(errorMessage);
      }

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al actualizar la contraseña"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl">
      <h2 className="text-xl font-bold text-azul-profundo text-center pb-6">Restablecer Contraseña</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-azul-profundo pb-2">
            Nueva contraseña
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              {...register("newPassword", {
                required: "La nueva contraseña es obligatoria",
                minLength: {
                  value: 8,
                  message: "La contraseña debe tener al menos 8 caracteres",
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: "Debe contener al menos una mayúscula, una minúscula y un número",
                },
              })}
              className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-teal focus:border-teal transition-all ${
                errors.newPassword ? "border-red-300 bg-red-50" : "border-hielo"
              }`}
              placeholder="Mínimo 8 caracteres"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-azul-profundo/50 hover:text-azul-profundo transition-colors"
              disabled={isLoading}
            >
              {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-sm text-red-600 pt-1">{errors.newPassword.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-azul-profundo pb-2">
            Confirmar contraseña
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              {...register("confirmPassword", {
                required: "Debes confirmar la contraseña",
                validate: (value) =>
                  value === newPassword || "Las contraseñas no coinciden",
              })}
              className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-teal focus:border-teal transition-all ${
                errors.confirmPassword ? "border-red-300 bg-red-50" : "border-hielo"
              }`}
              placeholder="Repite la nueva contraseña"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-azul-profundo/50 hover:text-azul-profundo transition-colors"
              disabled={isLoading}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-600 pt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <PrimaryButton disabled={isLoading || !isValid} className="w-full">
            {isLoading ? "Actualizando..." : "Actualizar Contraseña"}
          </PrimaryButton>

          <SecondaryButton onClick={onCancel} className="w-full" disabled={isLoading}>
            Cancelar
          </SecondaryButton>
        </div>
      </form>
    </div>
  );
}