"use client";

import { useState, useTransition } from "react";
import { Project } from "@/lib/types";
import {
  adminUpdateStatusAction,
  adminDeleteProjectAction,
  adminRescanProjectAction,
} from "@/app/actions";
import {
  Check,
  X,
  Trash2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Star,
} from "lucide-react";
import Link from "next/link";

export function AdminProjectRow({ project }: { project: Project }) {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);

  const status = project.moderation_status || "approved";
  const score = project.moderation_score ?? 100;
  const flags = project.moderation_flags || [];

  const handleStatusChange = (newStatus: "approved" | "pending" | "rejected") => {
    let reason: string | undefined = undefined;
    if (newStatus === "rejected") {
      const input = prompt("Укажите причину отклонения проекта (спам, малварь, накрутка, фрод):");
      if (input === null) return;
      reason = input.trim();
    }
    startTransition(async () => {
      await adminUpdateStatusAction(project.id, newStatus, reason);
    });
  };

  const handleDelete = () => {
    if (confirm(`Вы точно хотите безвозвратно удалить проект ${project.full_name}?`)) {
      startTransition(async () => {
        await adminDeleteProjectAction(project.id);
      });
    }
  };

  const handleRescan = () => {
    const [owner, repo] = project.full_name.split("/");
    if (!owner || !repo) return;
    startTransition(async () => {
      await adminRescanProjectAction(project.id, owner, repo);
    });
  };

  return (
    <div className="rounded-xl border border-[#1d212b] bg-[#0f1117] overflow-hidden transition-all text-xs">
      {/* Row Header */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Project Info */}
        <div className="flex items-start gap-3 min-w-0">
          {project.owner_avatar ? (
            <img
              src={project.owner_avatar}
              alt=""
              className="w-10 h-10 rounded-xl border border-white/10 bg-[#151821] object-cover shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold shrink-0">
              {project.name.charAt(0)}
            </div>
          )}

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/projects/${project.slug}`}
                className="font-semibold text-white hover:text-[#e5484d] transition-colors truncate text-sm"
              >
                {project.full_name}
              </Link>

              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8a92a3] hover:text-white"
                title="GitHub"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* Status Badge */}
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  status === "approved"
                    ? "bg-[#3fb950]/10 text-[#3fb950] border-[#3fb950]/20"
                    : status === "pending"
                    ? "bg-[#d29922]/10 text-[#d29922] border-[#d29922]/20"
                    : "bg-[#e5484d]/10 text-[#e5484d] border-[#e5484d]/20"
                }`}
              >
                {status.toUpperCase()}
              </span>

              {/* Security Score Badge */}
              <span
                className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold flex items-center gap-1 border ${
                  score >= 85
                    ? "bg-[#3fb950]/10 text-[#3fb950] border-[#3fb950]/20"
                    : score >= 60
                    ? "bg-[#d29922]/10 text-[#d29922] border-[#d29922]/20"
                    : "bg-[#e5484d]/10 text-[#e5484d] border-[#e5484d]/20"
                }`}
              >
                {score >= 85 ? (
                  <ShieldCheck className="w-3 h-3" />
                ) : score >= 60 ? (
                  <AlertTriangle className="w-3 h-3" />
                ) : (
                  <ShieldAlert className="w-3 h-3" />
                )}
                <span>Score: {score}/100</span>
              </span>
            </div>

            <p className="text-[#8a92a3] text-[11px] truncate max-w-xl">
              {project.description || "Без описания"}
            </p>

            <div className="flex items-center gap-3 text-[11px] text-[#586071]">
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-[#e5484d] fill-[#e5484d]" />
                <span>{project.stars}</span>
              </span>
              <span>·</span>
              <span>Автор: @{project.owner_login || "unknown"}</span>
              <span>·</span>
              <span>Добавлен: {new Date(project.created_at).toLocaleDateString("ru-RU")}</span>
              {flags.length > 0 && (
                <>
                  <span>·</span>
                  <span className="text-[#e5484d] font-medium">
                    Флагов риска: {flags.length}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg border border-[#1d212b] bg-[#151821] hover:border-white/20 text-[#8a92a3] hover:text-white transition-colors"
            title="Детали проверки"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={handleRescan}
            disabled={isPending}
            className="p-1.5 rounded-lg border border-[#1d212b] bg-[#151821] hover:border-white/20 text-[#8a92a3] hover:text-white transition-colors disabled:opacity-50"
            title="Пересканировать безопасность"
          >
            <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
          </button>

          {status !== "approved" && (
            <button
              onClick={() => handleStatusChange("approved")}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3fb950] hover:bg-[#2ea043] text-black font-semibold text-xs transition-colors disabled:opacity-50 shadow-sm"
              title="Одобрить"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Одобрить</span>
            </button>
          )}

          {status !== "rejected" && (
            <button
              onClick={() => handleStatusChange("rejected")}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e5484d]/30 bg-[#e5484d]/10 hover:bg-[#e5484d]/20 text-[#e5484d] font-semibold text-xs transition-colors disabled:opacity-50"
              title="Отклонить"
            >
              <X className="w-3.5 h-3.5" />
              <span>Отклонить</span>
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-1.5 rounded-lg border border-[#1d212b] bg-[#151821] hover:border-[#e5484d]/40 text-[#8a92a3] hover:text-[#e5484d] transition-colors disabled:opacity-50"
            title="Удалить проект"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Security Flags Report */}
      {expanded && (
        <div className="border-t border-[#1d212b] bg-[#151821]/60 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-white">
            <span>Отчёт безопасности репозитория</span>
            <span className="font-mono text-[#8a92a3]">ID: {project.id}</span>
          </div>

          {project.moderation_reason && (
            <div className="p-3 rounded-lg bg-[#e5484d]/10 border border-[#e5484d]/30 text-[#e5484d] text-xs">
              <span className="font-bold">Причина решения модератора:</span> {project.moderation_reason}
            </div>
          )}

          {flags.length === 0 ? (
            <div className="p-3 rounded-lg bg-[#3fb950]/10 border border-[#3fb950]/20 text-[#3fb950] text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Критичных аномалий или подозрительных файлов не обнаружено. Репозиторий чист.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {flags.map((flag, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                    flag.level === "danger"
                      ? "bg-[#e5484d]/10 border-[#e5484d]/30 text-[#e5484d]"
                      : flag.level === "warning"
                      ? "bg-[#d29922]/10 border-[#d29922]/30 text-[#d29922]"
                      : "bg-white/5 border-white/10 text-[#8a92a3]"
                  }`}
                >
                  {flag.level === "danger" ? (
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-mono font-bold block text-[10px] tracking-wider mb-0.5">
                      {flag.code}
                    </span>
                    <span className="leading-relaxed">{flag.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {project.moderation_reviewed_by && (
            <div className="text-[11px] text-[#586071] pt-1">
              Проверено: @{project.moderation_reviewed_by} (
              {project.moderation_reviewed_at
                ? new Date(project.moderation_reviewed_at).toLocaleString("ru-RU")
                : ""}
              )
            </div>
          )}
        </div>
      )}
    </div>
  );
}
