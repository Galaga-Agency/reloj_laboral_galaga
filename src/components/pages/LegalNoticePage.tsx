import { BackButton } from "@/components/BackButton";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useAuth } from "@/context/AuthContext";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";
import { useTimeRecords } from "@/hooks/useTimeRecords";
import { initEntranceAnimation } from "@/utils/animations/entrance-animations";

export function LegalNoticePage() {
  const { usuario, isAuthenticated, logout } = useAuth();
  const { estadoActual } = useTimeRecords(usuario?.id || "");

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
              <h1 className="text-3xl font-bold">Aviso Legal</h1>
              <p className="mt-2 opacity-80 text-sm">
                Última actualización: 09/09/2025 (CET)
              </p>
            </header>

            <p className="fade-up opacity-0">
              El presente sitio y la aplicación <strong>Reloj Laboral</strong>{" "}
              pertenecen a DOS POR DOS GRUPO IMAGEN, S.L.U. (GALAGA AGENCY). El
              acceso y uso implican la aceptación de este aviso.
            </p>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold mb-2">Identificación</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Denominación: DOS POR DOS GRUPO IMAGEN, S.L.U.</li>
                <li>Nombre comercial: GALAGA AGENCY</li>
                <li>Email de contacto: soporte@galagaagency.com</li>
              </ul>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold mb-2">Condiciones de uso</h2>
              <p>
                Te comprometes a utilizar la app conforme a la ley, la buena fe
                y el orden público. Queda prohibido cualquier uso que afecte a
                la disponibilidad, seguridad o integridad del servicio.
              </p>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold mb-2">
                Propiedad intelectual
              </h2>
              <p>
                El software, diseño, marcas y contenidos están protegidos. No se
                permite su reproducción, distribución o transformación salvo
                autorización expresa.
              </p>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold mb-2">Responsabilidad</h2>
              <p>
                Se realizan esfuerzos razonables para mantener el servicio
                disponible y seguro, sin garantizar la ausencia de
                interrupciones o errores inevitables.
              </p>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold mb-2">Enlaces</h2>
              <p>
                Pueden existir enlaces a sitios de terceros. No asumimos
                responsabilidad por sus contenidos o políticas.
              </p>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold mb-2">
                Legislación y jurisdicción
              </h2>
              <p>
                Este aviso se rige por la legislación española. Para
                controversias, las partes se someten a los juzgados y tribunales
                competentes.
              </p>
            </section>
          </article>
        </div>
      </main>
    </div>
  );
}
