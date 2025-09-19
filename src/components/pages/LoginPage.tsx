import type { Usuario } from "@/types";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";
import { LoginForm } from "@/components/forms/LoginForm";
import { initEntranceAnimation } from "@/utils/animations/entrance-animations";
import { GDPRConsentPage } from "@/components/pages/GDPRConsentPage";
import { PasswordUpdatePage } from "@/components/pages/PasswordUpdatePage";
import { useState } from "react";

type LoginStep = 'login' | 'password-update' | 'gdpr-consent' | 'complete';

export function LoginPage() {
  const [currentStep, setCurrentStep] = useState<LoginStep>('login');
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);

  useGSAPAnimations({ animations: [initEntranceAnimation], delay: 100 });

  const handleLogin = (usuario: Usuario) => {
    setCurrentUser(usuario);
    
    if (usuario.firstLogin) {
      setCurrentStep('password-update');
    } else if (!usuario.gdprConsentGiven) {
      setCurrentStep('gdpr-consent');
    } else {
      // Navigate to main panel
      window.location.href = '/panel';
    }
  };

  const handlePasswordUpdated = () => {
    if (currentUser && !currentUser.gdprConsentGiven) {
      setCurrentStep('gdpr-consent');
    } else {
      window.location.href = '/panel';
    }
  };

  const handleGDPRConsentComplete = () => {
    window.location.href = '/panel';
  };

  // Render different steps
  if (currentStep === 'password-update' && currentUser) {
    return <PasswordUpdatePage usuario={currentUser} onComplete={handlePasswordUpdated} />;
  }

  if (currentStep === 'gdpr-consent' && currentUser) {
    return <GDPRConsentPage usuario={currentUser} onConsentComplete={handleGDPRConsentComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-azul-profundo to-teal relative">
      {/* Mobile & Tablet Layout */}
      <div className="min-h-screen flex flex-col items-center justify-center px-6 lg:hidden">
        <img
          src="/assets/img/logos/logo-full.webp"
          alt="Galaga Agency"
          className="absolute top-6 left-6 w-32 md:w-40 h-auto fade-down opacity-0"
        />
        
        <div
          className="flex flex-col gap-8 text-center"
          style={{ width: "clamp(320px, 90vw, 600px)" }}
        >
          <div className="flex flex-col gap-4">
            <h1 className="text-5xl md:text-6xl font-semibold text-white leading-tight fade-left opacity-0">
              Reloj Laboral
            </h1>
            <p className="text-xl md:text-2xl text-white/90 fade-up opacity-0">
              Sistema de fichaje para el equipo
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="fade-up opacity-0">
              <LoginForm onLogin={handleLogin} />
            </div>
            <div className="fade-up opacity-0">
              <p className="text-white/70 text-sm">
                ¿No tienes credenciales? Contacta con el administrador.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen">
        <div className="flex-1 flex items-center justify-center px-20">
          <div className="max-w-2xl">
            <img
              src="/assets/img/logos/logo-full.webp"
              alt="Galaga Agency"
              className="absolute top-6 left-6 w-48 h-auto fade-down opacity-0"
            />
            <h1 className="text-8xl font-semibold text-white pb-8 leading-none fade-left opacity-0">
              Reloj Laboral
            </h1>
            <p className="text-3xl text-white/90 font-light fade-up opacity-0">
              Sistema de fichaje para el equipo
            </p>
          </div>
        </div>

        <div className="w-2/5 bg-black/20 backdrop-blur-xl flex items-center justify-center px-16">
          <div className="w-full max-w-lg flex flex-col gap-8">
            <div className="fade-up opacity-0">
              <LoginForm onLogin={handleLogin} />
            </div>
            <div className="text-center fade-up opacity-0">
              <p className="text-white/70 text-sm">
                ¿No tienes credenciales? Contacta con el administrador.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}