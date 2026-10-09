"use client";

import { TeamApplication } from "@/lib/types";
import { TaskClaim } from "@/lib/claims";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

interface CrmRosterProps {
  teamApplications: TeamApplication[];
  claims: TaskClaim[];
  onOpenClaimDrawer: (claim: TaskClaim) => void;
}

export function CrmRoster({
  teamApplications,
  claims,
  onOpenClaimDrawer,
}: CrmRosterProps) {
  const acceptedMembers = teamApplications.filter((a) => a.status === "accepted");
  const activeContributors = claims.filter(
    (c) => c.status === "assigned" || c.status === "completed"
  );

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="rounded-lg border border-[#30363d] bg-[#161b22] overflow-hidden">
        <div className="p-4 border-b border-[#30363d]">
          <h3 className="font-semibold text-white text-xs">
            Ростер контрибьюторов и участников команды
          </h3>
          <p className="text-[11px] text-[#8b949e]">
            База всех подтверждённых контрибьюторов и принятых членов команды
          </p>
        </div>

        <div className="divide-y divide-[#30363d] bg-[#0d1117]">
          {/* Team Members */}
          {acceptedMembers.map((member) => (
            <div
              key={member.id}
              className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#161b22]/50"
            >
              <div className="flex items-center gap-3">
                {member.user_avatar ? (
                  <img
                    src={member.user_avatar}
                    alt={member.user_login}
                    className="w-8 h-8 rounded-lg border border-[#30363d]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[#21262d] flex items-center justify-center font-bold text-white text-xs">
                    {member.user_login.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/users/${member.user_login}`}
                      className="font-semibold text-white text-xs hover:underline"
                    >
                      @{member.user_login}
                    </Link>
                    <span className="px-1.5 py-0.2 rounded bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20 font-mono text-[10px]">
                      {member.role}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8b949e]">
                    Контакты: {member.contacts || "Указаны в заявке"}
                  </span>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30">
                Команда проекта
              </span>
            </div>
          ))}

          {/* Active Assignees */}
          {activeContributors.map((contributor) => (
            <div
              key={contributor.id}
              className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#161b22]/50"
            >
              <div className="flex items-center gap-3">
                {contributor.user_avatar ? (
                  <img
                    src={contributor.user_avatar}
                    alt={contributor.user_login}
                    className="w-8 h-8 rounded-lg border border-[#30363d]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[#21262d] flex items-center justify-center font-bold text-white text-xs">
                    {contributor.user_login.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/users/${contributor.user_login}`}
                      className="font-semibold text-white text-xs hover:underline"
                    >
                      @{contributor.user_login}
                    </Link>
                    <span className="px-1.5 py-0.2 rounded bg-[#d29922]/10 text-[#d29922] border border-[#d29922]/20 font-mono text-[10px]">
                      Задача #{contributor.issue_number}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8b949e] truncate max-w-sm block">
                    {contributor.issue_title}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    contributor.status === "completed"
                      ? "bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30"
                      : "bg-[#d29922]/20 text-[#d29922] border border-[#d29922]/30"
                  }`}
                >
                  {contributor.status === "completed" ? "Завершил таск" : "В работе"}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenClaimDrawer(contributor)}
                  className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-[11px] flex items-center gap-1 border border-[#30363d]"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Чат</span>
                </button>
              </div>
            </div>
          ))}

          {acceptedMembers.length === 0 && activeContributors.length === 0 && (
            <div className="p-8 text-center text-[#8b949e]">
              Пока нет подтверждённых участников в ростере.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
