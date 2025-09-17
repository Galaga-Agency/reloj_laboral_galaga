import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  FiFileText,
  FiDownload,
  FiEye,
  FiAlertTriangle,
  FiMail,
  FiCheck,
  FiActivity,
  FiCalendar,
  FiClock,
} from "react-icons/fi";
import type { MonthlyReport } from "@/services/monthly-reports-service";
import { MonthlyReportsService } from "@/services/monthly-reports-service";
import PrimaryButton from "@/components/ui/PrimaryButton";

interface MonthlyReportModalProps {
  report: MonthlyReport;
  onAccept: () => void;
  onClose: () => void;
}

export function MonthlyReportModal({
  report,
  onAccept,
  onClose,
}: MonthlyReportModalProps) {
  const [hasViewed, setHasViewed] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [contestMessage, setContestMessage] = useState("");
  const [showContestForm, setShowContestForm] = useState(false);
  const [isContesting, setIsContesting] = useState(false);

  const monthName = format(
    new Date(report.year, report.month - 1),
    "MMMM yyyy",
    { locale: es }
  );

  useEffect(() => {
    if (!report.viewedAt) {
      MonthlyReportsService.markReportAsViewed(report.id).catch(console.error);
    }
    setHasViewed(true);
  }, [report.id, report.viewedAt]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await MonthlyReportsService.generateAndDownloadReport(report);
    } catch (error) {
      console.error("Error downloading report:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await MonthlyReportsService.acceptReport(report.id);
      onAccept();
    } catch (error) {
      console.error("Error accepting report:", error);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleContest = async () => {
    if (!contestMessage.trim()) return;

    setIsContesting(true);
    try {
      await MonthlyReportsService.contestReport(report.id, contestMessage);

      const emailData = MonthlyReportsService.createContestEmailData(
        report,
        contestMessage
      );

      const mailtoLink = `mailto:soporte@galagaagency.com?subject=${encodeURIComponent(
        emailData.subject
      )}&body=${encodeURIComponent(emailData.body)}`;

      window.location.href = mailtoLink;

      onAccept();
    } catch (error) {
      console.error("Error contesting report:", error);
    } finally {
      setIsContesting(false);
    }
  };

  const canAccept = hasViewed;

  return (
    <div className="fixed inset-0 bg-azul-profundo/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-teal/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-azul-profundo to-teal p-6 text-white">
          <div className="flex items-center gap-3">
            <FiFileText className="text-2xl" />
            <div>
              <h2 className="text-2xl font-bold">Informe Mensual</h2>
              <p className="text-white/90">{monthName}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Warning Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6  shadow-sm flex items-start gap-3">
            <FiAlertTriangle className="text-azul-profundo text-xl mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-azul-profundo mb-1">
                Revisión Mensual Obligatoria
              </h3>
              <p className="text-azul-profundo/70 text-sm leading-relaxed">
                Debe revisar su informe mensual de horas trabajadas y aceptarlo
                para continuar usando el sistema. Si encuentra discrepancias,
                puede contestar el informe antes de aceptarlo.
              </p>
            </div>
          </div>

          {/* Report Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-teal/20 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-teal font-medium pb-2">
                <FiCalendar className="w-4 h-4" />
                Días Trabajados
              </div>
              <div className="text-2xl font-bold text-azul-profundo">
                {report.reportData.estadisticas.diasTrabajados}
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-teal/20 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-teal font-medium pb-2">
                <FiClock className="w-4 h-4" />
                Tiempo Total
              </div>
              <div className="text-2xl font-bold text-azul-profundo">
                {report.reportData.estadisticas.tiempoTotal}
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-teal/20 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-teal font-medium pb-2">
                <FiActivity className="w-4 h-4" />
                Total Registros
              </div>
              <div className="text-2xl font-bold text-azul-profundo">
                {report.reportData.registros.length}
              </div>
            </div>
          </div>

          {/* Period Info */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 mb-6 border border-teal/20 shadow-sm">
            <h4 className="font-semibold text-azul-profundo mb-2">
              Período del Informe
            </h4>
            <div className="text-azul-profundo/70 text-sm space-y-2">
              <p>
                <span className="font-medium">Desde:</span>{" "}
                {format(
                  report.reportData.fechaInicio,
                  "dd 'de' MMMM 'de' yyyy",
                  {
                    locale: es,
                  }
                )}
              </p>
              <p>
                <span className="font-medium">Hasta:</span>{" "}
                {format(report.reportData.fechaFin, "dd 'de' MMMM 'de' yyyy", {
                  locale: es,
                })}
              </p>
              <p>
                <span className="font-medium">Promedio diario:</span>{" "}
                {report.reportData.estadisticas.promedioDiario}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <PrimaryButton
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1"
            >
              <FiDownload className={isDownloading ? "animate-bounce" : ""} />
              {isDownloading ? "Descargando..." : "Descargar PDF"}
            </PrimaryButton>

            <button
              onClick={() => setShowContestForm(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-azul-profundo/30 text-azul-profundo rounded-xl hover:bg-azul-profundo/10 transition-colors font-medium"
            >
              <FiMail />
              Contestar Informe
            </button>
          </div>

          {/* Contest Form */}
          {showContestForm && (
            <div className="bg-white/95 backdrop-blur-sm border border-azul-profundo/30 rounded-xl p-4 mb-6 shadow-sm">
              <h4 className="font-semibold text-azul-profundo mb-3">
                Contestar Informe
              </h4>
              <p className="text-azul-profundo/70 text-sm mb-3">
                Explique las razones por las cuales considera que el informe
                contiene errores:
              </p>
              <textarea
                value={contestMessage}
                onChange={(e) => setContestMessage(e.target.value)}
                className="w-full p-3 border border-teal/30 rounded-xl resize-none focus:ring-2 focus:ring-teal focus:border-teal"
                rows={4}
                placeholder="Describa detalladamente las discrepancias encontradas..."
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleContest}
                  disabled={!contestMessage.trim() || isContesting}
                  className="px-4 py-2 bg-azul-profundo text-white rounded-xl hover:bg-azul-profundo/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {isContesting ? "Enviando..." : "Enviar Contestación"}
                </button>
                <button
                  onClick={() => {
                    setShowContestForm(false);
                    setContestMessage("");
                  }}
                  className="px-4 py-2 border border-azul-profundo/30 text-azul-profundo rounded-xl hover:bg-azul-profundo/10 text-sm font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Agreement */}
          <div className="bg-white/95 backdrop-blur-sm border border-teal rounded-xl p-4 shadow-sm">
            <div className="flex flex-col items-start gap-3">
              <div className="flex-1">
                <div className="flex gap-2">
                  <FiCheck className="text-teal text-xl mt-0.5 flex-shrink-0" />
                  <h4 className="font-semibold text-azul-profundo mb-2">
                    Confirmación de Revisión
                  </h4>
                </div>
                <p className="text-azul-profundo/70 text-sm mb-4">
                  Al hacer clic en "Aceptar y Continuar", confirmo que he
                  revisado mi informe mensual de horas trabajadas y acepto la
                  información presentada como correcta.
                </p>
                <div className="flex items-center gap-2 text-teal text-sm mb-4">
                  <FiEye className="text-teal" />
                  <span>Informe revisado {hasViewed ? "✓" : "..."}</span>
                </div>
              </div>{" "}
              <PrimaryButton
                onClick={handleAccept}
                disabled={!canAccept || isAccepting}
                className="w-full"
              >
                <FiCheck />
                {isAccepting ? "Procesando..." : "Aceptar y Continuar"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
