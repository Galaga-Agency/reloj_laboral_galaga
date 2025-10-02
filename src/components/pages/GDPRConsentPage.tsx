import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";
import { initEntranceAnimation } from "@/utils/animations/entrance-animations";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { Checkbox } from "@/components/ui/Checkbox";
import { FiShield, FiCheck, FiExternalLink } from "react-icons/fi";
import type { Usuario } from "@/types";

interface GDPRConsentPageProps {
  usuario: Usuario;
  onConsentComplete?: () => void;
}

interface ConsentState {
  dataProcessingConsent: boolean;
  privacyPolicyRead: boolean;
}

export function GDPRConsentPage({ usuario }: GDPRConsentPageProps) {
  const navigate = useNavigate();
  const { updateUserGDPRConsent } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState<ConsentState>({
    dataProcessingConsent: false,
    privacyPolicyRead: false,
  });

  useGSAPAnimations({ animations: [initEntranceAnimation], delay: 100 });

  const canProceed = consent.dataProcessingConsent && consent.privacyPolicyRead;

  const handleConsentChange = (key: keyof ConsentState, value: boolean) => {
    setConsent((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!canProceed) return;

    setIsLoading(true);
    setError(null);

    try {
      await updateUserGDPRConsent(usuario.id, {
        dataProcessingConsent: consent.dataProcessingConsent,
        emailNotificationsConsent: false, // Not implemented
        geolocationConsent: false, // Not implemented
        privacyPolicyAcceptedAt: new Date().toISOString(),
        consentVersion: "1.0",
      });

      // Navigate based on user role
      if (usuario.role === "official") {
        navigate("/portal-oficial");
      } else {
        navigate("/panel");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-8 pb-24 bg-gradient-to-br from-azul-profundo via-[#123243] to-teal">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center pb-8 fade-down opacity-0">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-teal rounded-2xl shadow-2xl mb-4">
            <FiShield className="w-8 h-8 text-blanco" />
          </div>
          <h1 className="text-3xl font-bold text-blanco mb-2 fade-left opacity-0">
            Protección de Datos
          </h1>
          <p className="text-hielo text-lg fade-up opacity-0">
            Antes de continuar, necesitamos tu consentimiento
          </p>
        </div>

        {/* Card */}
        <div className="bg-blanco/5 backdrop-blur-sm rounded-2xl shadow-2xl p-8 fade-up opacity-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-3">
              Consentimiento RGPD
            </h2>
            <p className="text-white/80 text-sm leading-relaxed">
              Como usuario de <strong>Reloj Laboral</strong>, necesitamos tu
              consentimiento expreso para procesar tus datos conforme al
              Reglamento General de Protección de Datos (RGPD).
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-inactivo/10 border border-inactivo/30 rounded-lg">
              <p className="text-sm text-inactivo font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Required Consents */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <FiCheck className="text-teal" />
                Consentimientos Obligatorios
              </h3>

              {/* Data Processing Consent */}
              <div className="p-4 border border-white/20 rounded-lg bg-blanco/5">
                <Checkbox
                  checked={consent.dataProcessingConsent}
                  onChange={(checked) =>
                    handleConsentChange("dataProcessingConsent", checked)
                  }
                  label="Procesamiento de datos laborales"
                  description="Acepto que GALAGA AGENCY procese mis datos personales (nombre, email, registros horarios) para cumplir con las obligaciones legales del control horario según el Art. 34.9 del Estatuto de los Trabajadores."
                  disabled={isLoading}
                />
              </div>

              {/* Privacy Policy */}
              <div className="p-4 border border-white/20 rounded-lg bg-blanco/5">
                <Checkbox
                  checked={consent.privacyPolicyRead}
                  onChange={(checked) =>
                    handleConsentChange("privacyPolicyRead", checked)
                  }
                  label="Política de Privacidad y Aviso Legal"
                  disabled={isLoading}
                />
                <div className="mt-2 ml-8">
                  <p className="text-sm text-white/70">
                    He leído y acepto la{" "}
                    <a
                      href="/politica-privacidad"
                      target="_blank"
                      className="text-white underline inline-flex items-center gap-1"
                    >
                      Política de Privacidad
                      <FiExternalLink className="w-3 h-3" />
                    </a>{" "}
                    y el{" "}
                    <a
                      href="/aviso-legal"
                      target="_blank"
                      className="text-white underline inline-flex items-center gap-1"
                    >
                      Aviso Legal
                      <FiExternalLink className="w-3 h-3" />
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>

            {/* Rights Information */}
            <div className="p-4 bg-white/5 border border-white/20 rounded-lg">
              <h4 className="font-semibold text-white mb-2">
                Tus derechos RGPD
              </h4>
              <p className="text-sm text-white/80 leading-relaxed">
                Puedes ejercer tus derechos de acceso, rectificación, supresión,
                limitación, oposición y portabilidad de tus datos en cualquier
                momento contactando con nosotros en{" "}
                <a
                  href="mailto:soporte@galagaagency.com"
                  className="text-white underline"
                >
                  soporte@galagaagency.com
                </a>
              </p>
            </div>

            {/* Data Processing Info */}
            <div className="p-4 bg-white/5 border border-white/20 rounded-lg">
              <h4 className="font-semibold text-white mb-2">
                Qué datos procesamos
              </h4>
              <ul className="text-sm text-white/80 space-y-1">
                <li>• Datos de identificación: nombre, email</li>
                <li>• Registros horarios: entradas, salidas, pausas</li>
                <li>• Datos técnicos: IP de acceso, tipo de dispositivo</li>
                <li>• Informes mensuales de jornada laboral</li>
              </ul>
              <p className="text-xs text-white/60 mt-2">
                Todos los datos se almacenan de forma segura y se conservan
                durante 4 años según la normativa laboral.
              </p>
            </div>

            <PrimaryButton
              onClick={handleSubmit}
              disabled={isLoading || !canProceed}
              className="w-full"
            >
              {isLoading ? "Guardando consentimiento..." : "Continuar al Panel"}
            </PrimaryButton>
          </div>

          <div className="pt-6 text-center">
            <p className="text-xs text-white/60">
              Este consentimiento se registra con fecha y hora para cumplir con
              el RGPD.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
