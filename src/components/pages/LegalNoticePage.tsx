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

      <main className="relative flex-1 w-full px-4 py-8">
        <div className="w-full">
          <div className="absolute top-6 md:top-12 left-4 md:left-12 pb-6 fade-left opacity-0">
            <BackButton />
          </div>

          <article className="p-8 text-white flex flex-col gap-6 fade-up opacity-0 section mt-6 md:md-0">
            <header className="fade-zoom opacity-0">
              <h1 className="text-3xl font-bold">Política de Privacidad</h1>
              <p className="pt-2 opacity-80 text-sm">
                Última actualización: 16/09/2025
              </p>
            </header>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold pb-3">
                Identificación del Responsable
              </h2>
              <div className="flex flex-col gap-2">
                <p>
                  <strong>Denominación social:</strong> GALAGA AGENCY
                </p>
                <p>
                  <strong>Actividad:</strong> Desarrollo y prestación de
                  servicios de software para control horario digital
                </p>
                <p>
                  <strong>Email de contacto:</strong> soporte@galagaagency.com
                </p>
                <p>
                  <strong>Aplicación:</strong> Reloj Laboral - Sistema de
                  Control Horario Digital
                </p>
              </div>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold pb-3">
                Marco Legal Aplicable
              </h2>
              <p className="pb-3">
                <strong>Reloj Laboral</strong> es una aplicación de control
                horario digital que cumple con:
              </p>
              <ul className="list-disc list-inside flex flex-col gap-2">
                <li>
                  <strong>
                    Artículo 34.9 del Estatuto de los Trabajadores:
                  </strong>{" "}
                  Obligación de registro diario de jornada
                </li>
                <li>
                  <strong>Real Decreto-ley 8/2019, de 8 de marzo:</strong>{" "}
                  Medidas urgentes de protección social y lucha contra la
                  precariedad laboral
                </li>
                <li>
                  <strong>Normativa de control horario digital 2025:</strong>{" "}
                  Sistemas digitales obligatorios con acceso telemático para
                  Inspección de Trabajo
                </li>
                <li>
                  <strong>Jornada laboral:</strong> 40 horas semanales máximas
                  según normativa vigente
                </li>
                <li>
                  <strong>Horas extraordinarias:</strong> Máximo 80 horas
                  anuales según legislación actual
                </li>
              </ul>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold pb-3">
                Funcionalidades del Servicio
              </h2>
              <p className="pb-3">Reloj Laboral proporciona:</p>
              <ul className="list-disc list-inside flex flex-col gap-2">
                <li>
                  <strong>Registro horario completo:</strong> Entrada, salida,
                  pausas con fecha y hora exactas
                </li>
                <li>
                  <strong>Identificación completa:</strong> Datos del trabajador
                  y empresa en cada registro
                </li>
                <li>
                  <strong>Conservación legal:</strong> Almacenamiento seguro
                  durante 4 años mínimo
                </li>
                <li>
                  <strong>Accesibilidad:</strong> Disponible para trabajadores,
                  representantes legales e Inspección de Trabajo
                </li>
                <li>
                  <strong>Control de horas extra:</strong> Detección automática
                  y notificación de excesos de jornada
                </li>
                <li>
                  <strong>Informes mensuales:</strong> Generación automática de
                  reportes de jornada validables por el trabajador
                </li>
                <li>
                  <strong>Cumplimiento digital:</strong> Sistema 100% digital
                  con acceso telemático
                </li>
              </ul>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold pb-3">
                Obligaciones del Usuario Empresa
              </h2>
              <ul className="list-disc list-inside flex flex-col gap-2">
                <li>
                  Garantizar el registro diario completo de todos los
                  trabajadores
                </li>
                <li>Conservar los registros durante al menos 4 años</li>
                <li>
                  Facilitar acceso a los datos a trabajadores, representantes e
                  Inspección
                </li>
                <li>
                  Respetar los límites de jornada (40h semanales) y horas extra
                  (80h anuales)
                </li>
                <li>
                  Utilizar exclusivamente métodos de registro digital aprobados
                </li>
              </ul>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold pb-3">
                Derechos del Trabajador
              </h2>
              <ul className="list-disc list-inside flex flex-col gap-2">
                <li>
                  Acceso completo a sus registros horarios en cualquier momento
                </li>
                <li>Validación mensual de informes de jornada</li>
                <li>
                  Notificación automática de horas extraordinarias realizadas
                </li>
                <li>Protección de datos según RGPD y LOPDGDD</li>
                <li>Desconexión digital fuera del horario laboral</li>
              </ul>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold pb-3">
                Sanciones por Incumplimiento
              </h2>
              <p className="pb-3">
                Según la normativa vigente, las infracciones en materia de
                registro horario conllevan:
              </p>
              <ul className="list-disc list-inside flex flex-col gap-2">
                <li>
                  <strong>Infracciones leves:</strong> 1.000 - 2.000 euros por
                  trabajador afectado
                </li>
                <li>
                  <strong>Infracciones graves:</strong> 2.001 - 5.000 euros por
                  trabajador afectado
                </li>
                <li>
                  <strong>Infracciones muy graves:</strong> 5.001 - 10.000 euros
                  por trabajador afectado
                </li>
              </ul>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold pb-3">Condiciones de Uso</h2>
              <p className="pb-3">
                El uso de Reloj Laboral implica la aceptación de estas
                condiciones. Los usuarios se comprometen a:
              </p>
              <ul className="list-disc list-inside flex flex-col gap-2">
                <li>
                  Utilizar la aplicación conforme a la legislación laboral
                  vigente
                </li>
                <li>Proporcionar información veraz y actualizada</li>
                <li>No interferir en el funcionamiento del sistema</li>
                <li>Respetar los derechos de otros usuarios</li>
              </ul>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold pb-3">
                Propiedad Intelectual
              </h2>
              <p>
                Todos los elementos de Reloj Laboral (software, diseño,
                contenidos, marcas) están protegidos por derechos de propiedad
                intelectual. Queda prohibida su reproducción, distribución o
                modificación sin autorización expresa de GALAGA AGENCY.
              </p>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold pb-3">
                Limitación de Responsabilidad
              </h2>
              <p>
                GALAGA AGENCY realiza los máximos esfuerzos para garantizar la
                disponibilidad y seguridad del servicio, sin perjuicio de las
                interrupciones técnicas inevitables para mantenimiento o causas
                de fuerza mayor.
              </p>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold pb-3">
                Legislación Aplicable
              </h2>
              <p>
                Este aviso legal se rige por la legislación española. Para
                cualquier controversia, las partes se someten a los juzgados y
                tribunales de España.
              </p>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold pb-3">Contacto</h2>
              <p>
                Para consultas sobre el cumplimiento legal o el funcionamiento
                de la aplicación, contacta con nosotros en:{" "}
                <a href="mailto:soporte@galagaagency.com" className="underline">
                  soporte@galagaagency.com
                </a>
              </p>
            </section>
          </article>
        </div>
      </main>
    </div>
  );
}
