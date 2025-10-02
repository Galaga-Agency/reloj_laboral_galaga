import { BackButton } from "@/components/ui/BackButton";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";
import { useTimeRecords } from "@/hooks/useTimeRecords";
import { initEntranceAnimation } from "@/utils/animations/entrance-animations";

export function PrivacyPolicyPage() {
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

            <p className="fade-up opacity-0">
              En <strong>GALAGA AGENCY - Reloj Laboral</strong> protegemos tus
              datos personales cumpliendo estrictamente con el RGPD, la LOPDGDD
              y la normativa laboral española de control horario digital. Te
              informamos de manera transparente sobre el tratamiento de tus
              datos.
            </p>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold pb-3">
                1. Responsable del Tratamiento
              </h2>
              <div className="flex flex-col gap-2">
                <p>
                  <strong>Identidad:</strong> GALAGA AGENCY
                </p>
                <p>
                  <strong>Finalidad principal:</strong> Prestación de servicios
                  de control horario digital
                </p>
                <p>
                  <strong>Contacto general:</strong>{" "}
                  <a
                    href="mailto:soporte@galagaagency.com"
                    className="underline"
                  >
                    soporte@galagaagency.com
                  </a>
                </p>
              </div>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold mb-3">
                2. Datos Personales que Tratamos
              </h2>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">
                  2.1. Datos de identificación y contacto:
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Nombre y apellidos</li>
                  <li>Email corporativo</li>
                  <li>DNI/NIE (cuando sea requerido por la empresa)</li>
                  <li>Datos de contacto profesional</li>
                </ul>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">
                  2.2. Datos de registro horario (Art. 34.9 ET):
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Fecha y hora exacta de entrada y salida</li>
                  <li>Tiempo de pausas y descansos</li>
                  <li>Jornada total trabajada</li>
                  <li>Horas extraordinarias realizadas</li>
                  <li>Tipo de jornada (presencial, teletrabajo, mixta)</li>
                </ul>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">2.3. Metadatos técnicos:</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Dirección IP (para seguridad del sistema)</li>
                  <li>Tipo de dispositivo utilizado</li>
                  <li>
                    Datos de geolocalización (solo si está activada y
                    consentida)
                  </li>
                  <li>Logs de acceso y uso de la aplicación</li>
                </ul>
              </div>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold mb-3">
                3. Finalidades del Tratamiento
              </h2>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">
                  3.1. Cumplimiento de obligaciones legales:
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Registro diario de jornada según Art. 34.9 del Estatuto de
                    los Trabajadores
                  </li>
                  <li>Control de límites de jornada laboral (40h semanales)</li>
                  <li>
                    Seguimiento de horas extraordinarias (máximo 80h anuales)
                  </li>
                  <li>
                    Conservación de registros durante 4 años para Inspección de
                    Trabajo
                  </li>
                </ul>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">
                  3.2. Prestación del servicio:
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Gestión de cuentas de usuario</li>
                  <li>Generación de informes mensuales de jornada</li>
                  <li>Notificaciones de horas extra y alertas legales</li>
                  <li>Soporte técnico y resolución de incidencias</li>
                </ul>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">3.3. Seguridad y mejora:</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Prevención de fraudes y uso indebido</li>
                  <li>Mejora de la funcionalidad y usabilidad</li>
                  <li>Análisis estadísticos anonimizados</li>
                </ul>
              </div>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold mb-3">
                4. Base Jurídica del Tratamiento
              </h2>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>Obligación legal (Art. 6.1.c RGPD):</strong>{" "}
                  Cumplimiento del registro horario obligatorio
                </li>
                <li>
                  <strong>Ejecución de contrato (Art. 6.1.b RGPD):</strong>{" "}
                  Prestación del servicio de control horario
                </li>
                <li>
                  <strong>Interés legítimo (Art. 6.1.f RGPD):</strong> Seguridad
                  del sistema y prevención de fraudes
                </li>
                <li>
                  <strong>Consentimiento (Art. 6.1.a RGPD):</strong>{" "}
                  Geolocalización y funcionalidades opcionales
                </li>
              </ul>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold mb-3">
                5. Conservación de Datos
              </h2>
              <div className="space-y-3">
                <p>
                  <strong>Registros horarios:</strong> Mínimo 4 años desde su
                  generación (obligación legal laboral)
                </p>
                <p>
                  <strong>Datos de cuenta:</strong> Durante la vigencia de la
                  relación contractual + 6 años (prescripción fiscal)
                </p>
                <p>
                  <strong>Logs de seguridad:</strong> Máximo 12 meses desde su
                  generación
                </p>
                <p>
                  <strong>Datos anonimizados:</strong> Sin límite temporal para
                  estadísticas
                </p>
                <p>
                  <strong>Procedimiento de eliminación:</strong> Al finalizar
                  los plazos, los datos se eliminan de forma segura e
                  irreversible o se anonimizan para impedir la identificación
                  del titular.
                </p>
              </div>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold mb-3">
                6. Destinatarios de los Datos
              </h2>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">
                  6.1. Acceso legalmente establecido:
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Inspección de Trabajo y Seguridad Social (acceso telemático
                    directo)
                  </li>
                  <li>Representantes legales de los trabajadores</li>
                  <li>Autoridades judiciales o administrativas competentes</li>
                </ul>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">
                  6.2. Proveedores de servicios (Encargados de Tratamiento):
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Servicios de hosting y infraestructura cloud (UE/adecuado)
                  </li>
                  <li>Servicios de email y notificaciones</li>
                  <li>Proveedores de seguridad y monitorización</li>
                  <li>Soporte técnico especializado</li>
                </ul>
                <p className="mt-2 text-sm opacity-90">
                  Todos con contratos de encargo que garantizan la protección de
                  datos conforme al RGPD.
                </p>
              </div>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold mb-3">
                7. Transferencias Internacionales
              </h2>
              <p>
                Todos los datos se almacenan en servidores ubicados en la Unión
                Europea. En caso de transferencias a terceros países, se
                garantizan las medidas de protección adecuadas (decisiones de
                adecuación, cláusulas contractuales tipo UE).
              </p>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold mb-3">
                8. Derechos del Interesado
              </h2>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">
                  Puedes ejercer los siguientes derechos:
                </h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong>Acceso:</strong> Obtener información sobre tus datos
                    y una copia de los mismos
                  </li>
                  <li>
                    <strong>Rectificación:</strong> Corregir datos inexactos o
                    incompletos
                  </li>
                  <li>
                    <strong>Supresión:</strong> Solicitar la eliminación cuando
                    ya no sean necesarios
                  </li>
                  <li>
                    <strong>Limitación:</strong> Restringir el tratamiento en
                    determinadas circunstancias
                  </li>
                  <li>
                    <strong>Oposición:</strong> Oponerte al tratamiento por
                    motivos legítimos
                  </li>
                  <li>
                    <strong>Portabilidad:</strong> Recibir tus datos en formato
                    estructurado
                  </li>
                  <li>
                    <strong>No decisiones automatizadas:</strong> No aplicamos
                    perfilado automatizado
                  </li>
                </ul>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">
                  Cómo ejercer tus derechos:
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Email:{" "}
                    <a
                      href="mailto:soporte@galagaagency.com"
                      className="underline"
                    >
                      soporte@galagaagency.com
                    </a>
                  </li>
                  <li>
                    Identificación requerida: DNI/NIE o documento equivalente
                  </li>
                  <li>
                    Plazo de respuesta: Máximo 1 mes (prorrogable 2 meses si es
                    complejo)
                  </li>
                  <li>
                    Gratuito (salvo solicitudes manifiestamente infundadas o
                    excesivas)
                  </li>
                </ul>
              </div>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold mb-3">
                9. Medidas de Seguridad
              </h2>
              <p className="mb-3">
                Implementamos medidas técnicas y organizativas apropiadas:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>Cifrado:</strong> Datos en tránsito (TLS) y en reposo
                  (AES-256)
                </li>
                <li>
                  <strong>Acceso controlado:</strong> Autenticación fuerte y
                  principio de menor privilegio
                </li>
                <li>
                  <strong>Monitorización:</strong> Detección de accesos no
                  autorizados 24/7
                </li>
                <li>
                  <strong>Backups seguros:</strong> Copias de seguridad cifradas
                  y probadas
                </li>
                <li>
                  <strong>Formación:</strong> Personal formado en protección de
                  datos
                </li>
                <li>
                  <strong>Auditorías:</strong> Revisiones periódicas de
                  seguridad
                </li>
              </ul>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold mb-3">
                10. Cookies y Tecnologías Similares
              </h2>
              <p className="mb-3">
                Utilizamos únicamente cookies técnicas esenciales:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Cookies de sesión para mantener la autenticación</li>
                <li>Cookies de preferencias de usuario</li>
                <li>No utilizamos cookies de publicidad ni seguimiento</li>
              </ul>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold mb-3">11. Reclamaciones</h2>
              <p>
                Si consideras que el tratamiento de tus datos no se ajusta a la
                normativa, puedes presentar una reclamación ante la Agencia
                Española de Protección de Datos (AEPD):
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>
                  Web:{" "}
                  <a
                    href="https://www.aepd.es"
                    className="underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    www.aepd.es
                  </a>
                </li>
                <li>Dirección: C/ Jorge Juan, 6, 28001 Madrid</li>
                <li>Teléfono: 901 100 099</li>
              </ul>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold mb-3">
                12. Actualizaciones de la Política
              </h2>
              <p>
                Esta Política de Privacidad puede actualizarse para reflejar
                cambios en la normativa, nuestros servicios o prácticas de
                tratamiento. Las modificaciones se comunicarán con antelación
                suficiente y se mantendrá disponible la fecha de última
                actualización.
              </p>
            </section>

            <section className="fade-up opacity-0">
              <h2 className="text-xl font-semibold mb-3">13. Contacto</h2>
              <p>
                Para cualquier consulta sobre esta Política de Privacidad o el
                tratamiento de tus datos:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>
                  Delegado de Protección de Datos y Soporte general:{" "}
                  <a
                    href="mailto:soporte@galagaagency.com"
                    className="underline"
                  >
                    soporte@galagaagency.com
                  </a>
                </li>
              </ul>
            </section>
          </article>
        </div>
      </main>
    </div>
  );
}
