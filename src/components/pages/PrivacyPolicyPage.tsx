import { BackButton } from "@/components/BackButton";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useAuth } from "@/context/AuthContext";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";
import { useTimeRecords } from "@/hooks/useTimeRecords";
import { initEntranceAnimation } from "@/utils/animations/entrance-animations";

export function PrivacyPolicyPage() {
  const { usuario, isAuthenticated, logout } = useAuth();
  const { estadoActual } = useTimeRecords(usuario?.id || "");

  // Entrance animations (classnames-based)
  useGSAPAnimations({ animations: [initEntranceAnimation], delay: 100 });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-azul-profundo via-[#123243] to-teal pb-16">
      {isAuthenticated && usuario && (
        <div className="shadow-lg fade-down opacity-0">
          <DashboardHeader
            usuario={usuario}
            estadoActual={estadoActual}
            onLogout={logout}
          />
        </div>
      )}

      <main className="flex-1 w-full px-4 py-8">
        <div className="w-full">
          <div className="pb-6 fade-left opacity-0">
            <BackButton />
          </div>

          <article className=" p-8 text-white flex flex-col gap-6 fade-up opacity-0">
            <header className="fade-zoom opacity-0">
              <h1 className="text-3xl font-bold">Política de Privacidad</h1>
              <p className="pt-2 opacity-80 text-sm">
                Última actualización: 09/09/2025 (CET)
              </p>
            </header>

            <p className="fade-up opacity-0">
              En <strong>GALAGA AGENCY – Reloj Laboral</strong> protegemos tus
              datos personales y los tratamos de forma lícita, leal y
              transparente. Aquí te explicamos qué datos recogemos, con qué
              finalidades y cuáles son tus derechos.
            </p>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold mb-2">
                Responsable del tratamiento
              </h2>
              <p>
                DOS POR DOS GRUPO IMAGEN, S.L.U. (GALAGA AGENCY). Puedes
                contactarnos en{" "}
                <a
                  className="underline underline-offset-2"
                  href="mailto:soporte@galagaagency.com"
                >
                  soporte@galagaagency.com
                </a>
                .
              </p>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold mb-2">Datos que tratamos</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Datos de cuenta: nombre y email corporativo.</li>
                <li>
                  Registros de jornada: entradas, salidas, pausas y metadatos
                  técnicos mínimos (fecha/hora, dispositivo).
                </li>
                <li>Datos necesarios para seguridad, soporte y auditoría.</li>
              </ul>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold mb-2">Finalidades</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Proporcionar el servicio de control horario.</li>
                <li>Cumplir obligaciones legales laborales.</li>
                <li>
                  Mejorar seguridad, mantenimiento, calidad y soporte del
                  servicio.
                </li>
              </ul>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold mb-2">Base jurídica</h2>
              <p>
                Ejecución de contrato/relación laboral, cumplimiento de
                obligaciones legales y, cuando proceda, interés legítimo en la
                seguridad del servicio.
              </p>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold mb-2">Conservación</h2>
              <p>
                Los registros de jornada se conservan al menos 4 años o el plazo
                exigido por la normativa aplicable. Pasados los plazos, los
                datos se anonimizan o eliminan de forma segura.
              </p>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold mb-2">Destinatarios</h2>
              <p>
                Proveedores imprescindibles para prestar el servicio (infra,
                email, monitorización), con contratos de encargo de tratamiento,
                ubicados en la UE o con garantías adecuadas (p. ej. cláusulas
                tipo).
              </p>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold mb-2">Derechos</h2>
              <p>
                Puedes ejercer acceso, rectificación, supresión, limitación,
                oposición y portabilidad escribiendo a{" "}
                <a
                  className="underline underline-offset-2"
                  href="mailto:soporte@galagaagency.com"
                >
                  soporte@galagaagency.com
                </a>
                . También puedes reclamar ante la AEPD.
              </p>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold mb-2">Seguridad</h2>
              <p>
                Aplicamos medidas técnicas y organizativas para proteger la
                confidencialidad, integridad y disponibilidad de tus datos.
              </p>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold mb-2">Cambios</h2>
              <p>
                Podremos actualizar esta política para reflejar cambios legales
                o del servicio. Mantendremos esta página al día con la última
                fecha de revisión.
              </p>
            </section>
          </article>
        </div>
      </main>
    </div>
  );
}
