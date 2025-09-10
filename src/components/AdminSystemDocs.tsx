import { useState } from "react";
import {
  FiExternalLink,
  FiClock,
  FiDatabase,
  FiSettings,
  FiCopy,
  FiEye,
  FiEyeOff,
  FiChevronDown,
  FiChevronUp,
  FiGlobe,
  FiGithub,
} from "react-icons/fi";

interface AdminSystemDocumentationProps {
  currentUser: { nombre: string; email: string; isAdmin: boolean };
}

export function AdminSystemDocumentation({
  currentUser,
}: AdminSystemDocumentationProps) {
  const [showPasswords, setShowPasswords] = useState(false);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (!currentUser.isAdmin) return null;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Credentials Section */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 md:pb-4">
          <div className="flex items-center gap-2 min-w-0">
            <FiSettings className="w-5 h-5 text-white shrink-0" />
            <h2 className="text-base md:text-xl font-semibold text-white truncate">
              Credenciales del Sistema
            </h2>
          </div>
          <button
            onClick={() => setShowPasswords(!showPasswords)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
          >
            {showPasswords ? (
              <FiEyeOff className="w-4 h-4" />
            ) : (
              <FiEye className="w-4 h-4" />
            )}
            {showPasswords ? "Ocultar" : "Mostrar"} Contraseñas
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Cron-job.org */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3">
              <div className="flex items-center gap-2">
                <FiClock className="w-5 h-5 text-blue-400" />
                <h3 className="font-medium text-white">Cron-job.org</h3>
                <button
                  onClick={() => toggleSection("cronjob")}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  {expandedSections.cronjob ? (
                    <FiChevronUp className="w-4 h-4 text-white/70" />
                  ) : (
                    <FiChevronDown className="w-4 h-4 text-white/70" />
                  )}
                </button>
              </div>
              <a
                href="https://console.cron-job.org/login"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                Acceder
                <FiExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-white/70 text-sm">Email:</span>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-white font-mono text-sm break-all text-right sm:text-left">
                    thomas@galagaagency.com
                  </span>
                  <button
                    onClick={() => copyToClipboard("thomas@galagaagency.com")}
                    className="p-1 hover:bg-white/10 rounded"
                    title="Copiar email"
                  >
                    <FiCopy className="w-3 h-3 text-white/70" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-white/70 text-sm">Contraseña:</span>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-white font-mono text-sm break-all text-right sm:text-left">
                    {showPasswords ? "Galaga2024*" : "••••••••••"}
                  </span>
                  <button
                    onClick={() => copyToClipboard("Galaga2024*")}
                    className="p-1 hover:bg-white/10 rounded"
                    title="Copiar contraseña"
                  >
                    <FiCopy className="w-3 h-3 text-white/70" />
                  </button>
                </div>
              </div>
            </div>

            {expandedSections.cronjob && (
              <div className="pt-4 border-t border-white/15 mt-3">
                <h4 className="text-white font-medium pb-3">
                  Configuración del Cron Job
                </h4>
                <div className="flex flex-col gap-3 text-sm">
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-white/70 pb-1">Nombre del trabajo:</p>
                    <p className="text-white font-mono break-words">
                      Auto Entries
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-white/70 pb-1">Horario de ejecución:</p>
                    <p className="text-white font-mono break-words">
                      Diariamente a las 00:02 (Atlantic/Canary)
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-white/70 pb-1">URL del endpoint:</p>
                    <p className="text-white font-mono break-all">
                      https://zidsmnghsejxpwqebdil.supabase.co/functions/v1/daily-entries
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Supabase */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3">
              <div className="flex items-center gap-2">
                <FiDatabase className="w-5 h-5 text-green-400" />
                <h3 className="font-medium text-white">Supabase</h3>
                <button
                  onClick={() => toggleSection("supabase")}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  {expandedSections.supabase ? (
                    <FiChevronUp className="w-4 h-4 text-white/70" />
                  ) : (
                    <FiChevronDown className="w-4 h-4 text-white/70" />
                  )}
                </button>
              </div>
              <a
                href="https://supabase.com/dashboard/org/dikwtbpexyhcofseequx"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
              >
                Acceder
                <FiExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-white/70 text-sm">Email:</span>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-white font-mono text-sm break-all">
                    thomas@galagaagency.com
                  </span>
                  <button
                    onClick={() => copyToClipboard("thomas@galagaagency.com")}
                    className="p-1 hover:bg-white/10 rounded"
                    title="Copiar email"
                  >
                    <FiCopy className="w-3 h-3 text-white/70" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-white/70 text-sm">Contraseña:</span>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-white font-mono text-sm break-all">
                    {showPasswords ? "Galaga2024*" : "••••••••••"}
                  </span>
                  <button
                    onClick={() => copyToClipboard("Galaga2024*")}
                    className="p-1 hover:bg-white/10 rounded"
                    title="Copiar contraseña"
                  >
                    <FiCopy className="w-3 h-3 text-white/70" />
                  </button>
                </div>
              </div>
            </div>

            {expandedSections.supabase && (
              <div className="pt-4 border-t border-white/15 mt-3">
                <h4 className="text-white font-medium pb-3">
                  Base de Datos y Funciones
                </h4>
                <div className="flex flex-col gap-3 text-sm">
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-white/70 pb-2">Tablas principales:</p>
                    <div className="flex flex-col gap-1 text-white font-mono text-xs">
                      <p>• usuarios - Datos de usuarios del sistema</p>
                      <p>• registros_tiempo - Registros de entrada/salida</p>
                      <p>• user_work_settings - Configuraciones automáticas</p>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-white/70 pb-2">Edge Functions:</p>
                    <div className="flex flex-col gap-1 text-white font-mono text-xs">
                      <p>• admin-crud-user - CRUD de usuarios para admins</p>
                      <p>• daily-entries</p>
                    </div>
                  </div>
                  <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                    <p className="text-green-200 font-medium pb-2">
                      Edge Function: admin-crud-user
                    </p>
                    <div className="flex flex-col gap-1.5 text-green-100 text-xs leading-5">
                      <p>
                        • Permite crear/actualizar/eliminar usuarios desde el
                        admin panel
                      </p>
                      <p>• Requiere autenticación de admin (is_admin = true)</p>
                      <p>
                        • Maneja la creación de credenciales de autenticación
                      </p>
                      <p>• Actualiza tanto auth.users como public.usuarios</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Netlify */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3">
              <div className="flex items-center gap-2">
                <FiGlobe className="w-5 h-5 text-orange-400" />
                <h3 className="font-medium text-white">Netlify (Hosting)</h3>
                <button
                  onClick={() => toggleSection("netlify")}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  {expandedSections.netlify ? (
                    <FiChevronUp className="w-4 h-4 text-white/70" />
                  ) : (
                    <FiChevronDown className="w-4 h-4 text-white/70" />
                  )}
                </button>
              </div>
              <a
                href="https://app.netlify.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg transition-colors"
              >
                Acceder
                <FiExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-white/70 text-sm">
                  Selecciona Log in with Email - Email:
                </span>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-white font-mono text-sm break-all">
                    thomas@galagaagency.com
                  </span>
                  <button
                    onClick={() => copyToClipboard("thomas@galagaagency.com")}
                    className="p-1 hover:bg-white/10 rounded"
                    title="Copiar email"
                  >
                    <FiCopy className="w-3 h-3 text-white/70" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-white/70 text-sm">Contraseña:</span>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-white font-mono text-sm break-all">
                    {showPasswords ? "netlifyGalaga2024*" : "••••••••••"}
                  </span>
                  <button
                    onClick={() => copyToClipboard("netlifyGalaga2024*")}
                    className="p-1 hover:bg-white/10 rounded"
                    title="Copiar contraseña"
                  >
                    <FiCopy className="w-3 h-3 text-white/70" />
                  </button>
                </div>
              </div>
            </div>

            {expandedSections.netlify && (
              <div className="pt-4 border-t border-white/15 mt-3">
                <h4 className="text-white font-medium pb-3">
                  Configuración de Deploy
                </h4>
                <div className="flex flex-col gap-3 text-sm">
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-white/70 pb-1">Proyecto:</p>
                    <p className="text-white font-mono break-words">
                      reloj-laboral-galaga-agency
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-white/70 pb-1">Build Command:</p>
                    <p className="text-white font-mono break-words">
                      npm run build
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-white/70 pb-1">Publish Directory:</p>
                    <p className="text-white font-mono break-words">dist</p>
                  </div>
                  <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/20">
                    <p className="text-orange-200 font-medium pb-2">
                      Auto Deploy:
                    </p>
                    <div className="flex flex-col gap-1.5 text-orange-100 text-xs leading-5">
                      <p>• Conectado al repositorio de GitHub</p>
                      <p>• Deploy automático en cada push a main</p>
                      <p>• Preview deploys para pull requests</p>
                      <p>• Variables de entorno configuradas para producción</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* GitHub */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3">
              <div className="flex items-center gap-2">
                <FiGithub className="w-5 h-5 text-gray-300" />
                <h3 className="font-medium text-white">GitHub Repository</h3>
                <button
                  onClick={() => toggleSection("github")}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  {expandedSections.github ? (
                    <FiChevronUp className="w-4 h-4 text-white/70" />
                  ) : (
                    <FiChevronDown className="w-4 h-4 text-white/70" />
                  )}
                </button>
              </div>
              <a
                href="https://github.com/Galaga-Agency/reloj_laboral_galaga"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              >
                Ver Repo
                <FiExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-white/70 text-sm pb-1">URL del repositorio:</p>
              <p className="text-white font-mono text-sm break-all">
                https://github.com/Galaga-Agency/reloj_laboral_galaga
              </p>
            </div>

            {expandedSections.github && (
              <div className="pt-4 border-t border-white/15 mt-3">
                <h4 className="text-white font-medium pb-3">
                  Estructura del Proyecto
                </h4>
                <div className="flex flex-col gap-3 text-sm">
                  <div className="bg-gray-500/10 rounded-lg p-3 border border-gray-500/20">
                    <p className="text-gray-200 font-medium pb-2">
                      Stack Tecnológico:
                    </p>
                    <div className="flex flex-col gap-1 text-gray-100 text-xs">
                      <p>• React + TypeScript (Vite)</p>
                      <p>• Tailwind CSS para estilos</p>
                      <p>• Supabase para backend y autenticación</p>
                    </div>
                  </div>
                  <div className="bg-gray-500/10 rounded-lg p-3 border border-gray-500/20">
                    <p className="text-gray-200 font-medium pb-2">
                      Comandos principales:
                    </p>
                    <div className="flex flex-col gap-1 text-gray-100 font-mono text-xs">
                      <p>• npm install - Instalar dependencias</p>
                      <p>• npm run dev - Servidor de desarrollo</p>
                      <p>• npm run build - Build para producción</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* /GitHub */}
        </div>
      </div>
    </div>
  );
}
