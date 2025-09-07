import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";
import { initLoginAnimations } from "@/utils/animations/login-animations";
import { ResetPasswordForm } from "@/components/forms/ResetPasswordForm";

interface PasswordResetPageProps {
  onResetComplete: () => void;
}

export function PasswordResetPage({ onResetComplete }: PasswordResetPageProps) {
  const navigate = useNavigate();
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  useGSAPAnimations({ animations: [initLoginAnimations], delay: 100 });

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setIsValidSession(!!session);
      } catch (err) {
        setIsValidSession(false);
      }
    };

    checkSession();
  }, []);

  const handleSuccess = () => {
    navigate("/iniciar-sesion");
  };

  const handleCancel = () => {
    navigate("/iniciar-sesion");
  };

  const handleBackToLogin = () => {
    navigate("/iniciar-sesion");
  };

  if (isValidSession === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-azul-profundo to-teal flex items-center justify-center px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="text-white text-lg">Verificando sesión...</span>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-azul-profundo to-teal flex items-center justify-center px-4">
        <div className="flex justify-center">
          <div className="w-full" style={{ maxWidth: '28rem' }}>
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-xl text-center">
              <h2 className="text-2xl font-bold text-azul-profundo pb-4">
                Enlace Expirado
              </h2>
              <p className="text-azul-profundo/70 pb-6">
                El enlace de recuperación ha expirado o es inválido. Solicita uno
                nuevo.
              </p>
              <SecondaryButton onClick={handleBackToLogin} className="w-full">
                Volver al Login
              </SecondaryButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-azul-profundo to-teal flex items-center justify-center px-4">
      <img
        src="/assets/img/logos/logo-full.webp"
        alt="Galaga Agency"
        className="absolute top-6 left-6 w-48 h-auto"
      />
      <div className="w-full max-w-md">
        <div className="text-center pb-8">
          <h1 className="text-3xl font-bold text-white pb-2">
            Nueva Contraseña
          </h1>
          <p className="text-white/80">Establece tu nueva contraseña</p>
        </div>

        <ResetPasswordForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}