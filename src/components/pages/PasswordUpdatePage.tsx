import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Usuario } from "@/types";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { initEntranceAnimation } from "@/utils/animations/entrance-animations";
import { CustomInput } from "../ui/CustomInput";
import { FiLock } from "react-icons/fi";

interface PasswordUpdatePageProps {
  usuario: Usuario;
  onComplete?: () => void;
}

interface PasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export function PasswordUpdatePage({ usuario }: PasswordUpdatePageProps) {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useGSAPAnimations({ animations: [initEntranceAnimation], delay: 100 });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<PasswordFormData>({
    mode: "onChange",
  });

  const newPassword = watch("newPassword");

  const onSubmit = async (data: PasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await updatePassword(data.newPassword);
      navigate("/panel");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="login-logo text-center pb-8 fade-down opacity-0">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-teal rounded-2xl shadow-2xl">
            <FiLock className="w-8 h-8 text-blanco" />
          </div>
          <h1 className="text-3xl font-bold text-blanco py-4 fade-left opacity-0">
            Actualizar Contraseña
          </h1>
          <p className="text-hielo text-lg fade-up opacity-0">
            Bienvenido/a, {usuario.nombre}
          </p>
        </div>

        <div className="login-form bg-blanco/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 fade-up opacity-0">
          <h2 className="text-2xl font-bold text-azul-profundo pb-4 text-center">
            Primera conexión
          </h2>

          <div className="p-4 bg-mandarina/10 border border-mandarina/30 rounded-lg">
            <p className="text-sm text-azul-profundo">
              Por seguridad, debes cambiar tu contraseña temporal antes de
              continuar.
            </p>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-inactivo/10 border border-inactivo/30 rounded-lg">
              <p className="text-sm text-inactivo font-medium">{error}</p>
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-6 fade-up opacity-0 pt-6"
          >
            <CustomInput
              label="Nueva contraseña"
              type="password"
              variant="lightBg"
              {...register("newPassword", {
                required: "La nueva contraseña es obligatoria",
                minLength: {
                  value: 8,
                  message: "La contraseña debe tener al menos 8 caracteres",
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message:
                    "Debe contener al menos una mayúscula, una minúscula y un número",
                },
              })}
              placeholder="Mínimo 8 caracteres"
              disabled={isLoading}
              error={errors.newPassword?.message}
            />

            <CustomInput
              label="Confirmar contraseña"
              type="password"
              variant="lightBg"
              {...register("confirmPassword", {
                required: "Debes confirmar la contraseña",
                validate: (value) =>
                  value === newPassword || "Las contraseñas no coinciden",
              })}
              placeholder="Repite la nueva contraseña"
              disabled={isLoading}
              error={errors.confirmPassword?.message}
            />

            <PrimaryButton disabled={isLoading || !isValid} className="w-full">
              {isLoading ? "Actualizando..." : "Actualizar Contraseña"}
            </PrimaryButton>
          </form>

          <div className="pt-6 text-center fade-up opacity-0">
            <p className="text-xs text-azul-profundo/60">
              Una vez actualizada, podrás acceder al sistema de fichaje.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
