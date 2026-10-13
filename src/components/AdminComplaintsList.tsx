"use client";

import { useState, useTransition } from "react";
import { ProjectComplaint } from "@/lib/types";
import { adminResolveComplaintAction } from "@/app/actions";
import { AlertTriangle, CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";

export function AdminComplaintsList({
  complaints,
}: {
  complaints: ProjectComplaint[];
}) {
  const [isPending, startTransition] = useTransition();

  const handleResolve = (id: string, status: "resolved" | "dismissed") => {
    const resolution = prompt(
      status === "resolved"
        ? "Укажите принятые меры (проект заблокирован / автор предупрежден):"
        : "Причина отклонения жалобы (нарушений не найдено):"
    );
    if (!resolution) return;

    startTransition(async () => {
      await adminResolveComplaintAction(id, resolution, status);
    });
  };

  if (complaints.length === 0) {
    return (
      <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-12 text-center text-[#8a92a3] text-xs">
        Очередь жалоб пуста. Нарушений не зафиксировано.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {complaints.map((c) => {
        const isResolved = c.status === "resolved";
        const isDismissed = c.status === "dismissed";
        const isPendingComplaint = c.status === "pending";

        return (
          <div
            key={c.id}
            className="p-4 rounded-xl border border-[#1d212b] bg-[#0f1117] space-y-3 text-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div
                  className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                    isPendingComplaint
                      ? "bg-[#e5484d]/10 text-[#e5484d]"
                      : isResolved
                      ? "bg-[#3fb950]/10 text-[#3fb950]"
                      : "bg-[#8a92a3]/10 text-[#8a92a3]"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white">
                      Жалоба на проект:
                    </span>
                    <Link
                      href={`/projects/${c.project_slug}`}
                      className="text-[#38bdf8] hover:underline font-mono"
                    >
                      {c.project_slug}
                    </Link>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                        isPendingComplaint
                          ? "bg-[#e5484d]/20 text-[#e5484d]"
                          : isResolved
                          ? "bg-[#3fb950]/20 text-[#3fb950]"
                          : "bg-[#8a92a3]/20 text-[#8a92a3]"
                      }`}
                    >
                      {c.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[#8a92a3] text-[11px] mt-0.5">
                    Заявитель: @{c.reporter_login} ·{" "}
                    {new Date(c.created_at).toLocaleString("ru-RU")}
                  </div>
                </div>
              </div>

              {isPendingComplaint && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleResolve(c.id, "dismissed")}
                    disabled={isPending}
                    className="px-3 py-1.5 rounded-lg border border-[#1d212b] bg-[#151821] hover:bg-[#21262d] text-[#8a92a3] hover:text-white transition-colors"
                  >
                    Отклонить жалобу
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResolve(c.id, "resolved")}
                    disabled={isPending}
                    className="px-3.5 py-1.5 rounded-lg bg-[#e5484d] hover:bg-[#f2555a] text-white font-semibold transition-colors"
                  >
                    Принять меры
                  </button>
                </div>
              )}
            </div>

            <div className="p-3 rounded-lg bg-[#151821] border border-[#1d212b] text-white leading-relaxed">
              <span className="text-[#8a92a3] block text-[10px] font-mono uppercase mb-0.5">
                Суть претензии:
              </span>
              {c.reason}
            </div>

            {c.resolution && (
              <div className="text-[11px] text-[#3fb950] bg-[#3fb950]/5 border border-[#3fb950]/20 p-2.5 rounded-lg">
                <span className="font-bold">Решение ({c.resolved_by}):</span>{" "}
                {c.resolution}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
