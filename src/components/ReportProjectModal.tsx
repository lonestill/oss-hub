"use client";

import { useState } from "react";
import { Flag, X, AlertTriangle, Check } from "lucide-react";
import { reportProjectAction } from "@/app/actions";
import { useLanguage } from "@/lib/i18n";

interface ReportProjectModalProps {
  projectId: string;
  projectSlug: string;
}

export function ReportProjectModal({ projectId, projectSlug }: ReportProjectModalProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append("projectId", projectId);
    formData.append("projectSlug", projectSlug);
    formData.append("reason", reason);

    const res = await reportProjectAction(null, formData);
    setIsSubmitting(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setReason("");
      }, 2000);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#1d212b] bg-[#151821] hover:border-[#e5484d]/40 text-[#8a92a3] hover:text-[#e5484d] transition-colors text-xs"
        title={t.projectPage.reportBtn}
      >
        <Flag className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{t.projectPage.reportBtn}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl border border-[#30363d] bg-[#0d1117] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <AlertTriangle className="w-4 h-4 text-[#e5484d]" />
                <span>{t.projectPage.reportTitle}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-[#8b949e] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isSuccess ? (
              <div className="p-4 rounded-xl border border-[#3fb950]/30 bg-[#3fb950]/10 text-[#3fb950] text-xs flex items-center gap-3">
                <Check className="w-5 h-5 shrink-0" />
                <span>{t.projectPage.reportSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs text-[#8b949e] leading-relaxed">
                  {t.projectPage.reportDesc}
                </p>

                {error && (
                  <div className="p-3 rounded-lg border border-[#e5484d]/40 bg-[#e5484d]/10 text-[#e5484d] text-xs">
                    {error}
                  </div>
                )}

                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t.projectPage.reportPlaceholder}
                  rows={4}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#161b22] text-white placeholder-[#8b949e] focus:outline-none focus:border-[#e5484d]"
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-[#30363d] bg-[#161b22] text-[#8b949e] hover:text-white text-xs font-medium transition-colors"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !reason.trim()}
                    className="px-4 py-1.5 rounded-lg bg-[#e5484d] hover:bg-[#f2555a] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? t.projectPage.reportSubmitting : t.projectPage.reportSubmitBtn}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
