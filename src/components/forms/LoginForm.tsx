import { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import type { Usuario } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import PrimaryButton from "@/components/ui/PrimaryButton";

interface LoginFormProps {
  onLogin: (usuario: Usuario) => void;
}

interface LoginFormData {
  email: string;
  password: string;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const { login } = useAuth();
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({ mode: "onChange" });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const usuario = await login(data.email, data.password);
      onLogin(usuario);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    setResetMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/restablecer-contrasena`,
      });
      setResetMessage(
        error
          ? `Error: ${error.message}`
          : "Se ha enviado un enlace de recuperación a tu correo electrónico."
      );
    } catch {
      setResetMessage("Error al enviar el correo de recuperación.");
    } finally {
      setResetLoading(false);
    }
  };

  if (showPasswordReset) {
    return (
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-azul-profundo pb-6 text-center">
          Recuperar Contraseña
        </h2>

        {resetMessage && (
          <div
            className={`p-3 rounded-lg text-sm ${
              resetMessage.startsWith("Error")
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-green-50 text-green-700 border border-green-200"
            }`}
          >
            {resetMessage}
          </div>
        )}

        <form
          onSubmit={handlePasswordReset}
          className={`flex flex-col gap-4 ${resetMessage && "pt-4"}`}
        >
          <div>
            <label className="block text-sm font-medium text-azul-profundo pb-2">
              Correo electrónico
            </label>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full px-4 py-3 border border-hielo rounded-xl focus:ring-2 focus:ring-teal focus:border-teal transition-all"
              placeholder="tu@galagaagency.com"
              required
              disabled={resetLoading}
            />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <PrimaryButton
              disabled={resetLoading || !resetEmail.trim()}
              className="w-full"
            >
              {resetLoading ? "Enviando…" : "Enviar Enlace"}
            </PrimaryButton>

            <button
              type="button"
              onClick={() => setShowPasswordReset(false)}
              className="w-full py-3 text-azul-profundo/70 hover:text-azul-profundo transition-colors"
            >
              Volver al inicio de sesión
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl">
      <h2 className="text-xl font-bold text-azul-profundo text-center pb-6">
        Iniciar Sesión
      </h2>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`flex flex-col gap-4 ${resetMessage && "pt-4"}`}
      >
        <div>
          <label className="block text-sm font-medium text-azul-profundo pb-2">
            Correo electrónico
          </label>
          <input
            type="email"
            {...register("email", {
              required: "El correo electrónico es obligatorio",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Formato de correo inválido",
              },
            })}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal focus:border-teal transition-all ${
              errors.email ? "border-red-300 bg-red-50" : "border-hielo"
            }`}
            placeholder="tu@galagaagency.com"
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-sm text-red-600 pt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-azul-profundo pb-2">
            Contraseña
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password", {
                required: "La contraseña es obligatoria",
                minLength: {
                  value: 6,
                  message: "La contraseña debe tener al menos 6 caracteres",
                },
              })}
              className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-teal focus:border-teal transition-all ${
                errors.password ? "border-red-300 bg-red-50" : "border-hielo"
              }`}
              placeholder="Tu contraseña"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-azul-profundo/50 hover:text-azul-profundo transition-colors"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600 pt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <PrimaryButton disabled={isLoading || !isValid} className="w-full">
            {isLoading ? "Verificando…" : "Iniciar Sesión"}
          </PrimaryButton>

          <button
            type="button"
            onClick={() => setShowPasswordReset(true)}
            className="w-full py-2 text-sm text-azul-profundo/70 hover:text-teal transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </form>
    </div>
  );
}
