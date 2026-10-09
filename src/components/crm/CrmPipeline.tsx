"use client";

import { TaskClaim } from "@/lib/claims";
import { TeamApplication } from "@/lib/types";
import {
  Search,
  MessageSquare,
  X,
  GitPullRequest,
} from "lucide-react";

interface CrmPipelineProps {
  claims: TaskClaim[];
  teamApplications: TeamApplication[];
  pipelineTypeFilter: "all" | "tasks" | "team";
  onSetPipelineTypeFilter: (filter: "all" | "tasks" | "team") => void;
  searchQuery: string;
  onSetSearchQuery: (query: string) => void;
  onOpenClaimDrawer: (claim: TaskClaim) => void;
  onClaimStatusChange: (
    claimId: string,
    newStatus: "pending" | "assigned" | "completed" | "rejected"
  ) => Promise<void>;
  onTeamAppStatusChange: (
    appId: string,
    newStatus: "pending" | "accepted" | "rejected"
  ) => Promise<void>;
}

export function CrmPipeline({
  claims,
  teamApplications,
  pipelineTypeFilter,
  onSetPipelineTypeFilter,
  searchQuery,
  onSetSearchQuery,
  onOpenClaimDrawer,
  onClaimStatusChange,
  onTeamAppStatusChange,
}: CrmPipelineProps) {
  const totalLeads = claims.length + teamApplications.length;
  const completedClaimsCount = claims.filter((c) => c.status === "completed").length;
  const acceptedAppsCount = teamApplications.filter((a) => a.status === "accepted").length;

  return (
    <div className="space-y-4">
      {/* Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8b949e]">Показывать:</span>
          <div className="flex items-center bg-[#161b22] p-0.5 rounded-lg border border-[#30363d] text-xs">
            <button
              type="button"
              onClick={() => onSetPipelineTypeFilter("all")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                pipelineTypeFilter === "all"
                  ? "bg-[#21262d] text-white font-medium"
                  : "text-[#8b949e] hover:text-white"
              }`}
            >
              Все ({totalLeads})
            </button>
            <button
              type="button"
              onClick={() => onSetPipelineTypeFilter("tasks")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                pipelineTypeFilter === "tasks"
                  ? "bg-[#21262d] text-white font-medium"
                  : "text-[#8b949e] hover:text-white"
              }`}
            >
              Задачи ({claims.length})
            </button>
            <button
              type="button"
              onClick={() => onSetPipelineTypeFilter("team")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                pipelineTypeFilter === "team"
                  ? "bg-[#21262d] text-white font-medium"
                  : "text-[#8b949e] hover:text-white"
              }`}
            >
              Команда ({teamApplications.length})
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#8b949e] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSetSearchQuery(e.target.value)}
            placeholder="Поиск по нику или задаче..."
            className="rounded-md bg-[#161b22] border border-[#30363d] pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#58a6ff] w-56"
          />
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
        {/* 1. Новые заявки (Pending) */}
        <div className="rounded-lg border border-[#30363d] bg-[#161b22] overflow-hidden flex flex-col">
          <div className="p-3 border-b border-[#30363d] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#f78166]" />
              <span className="font-semibold text-white text-xs">Новые заявки</span>
            </div>
            <span className="px-1.5 py-0.2 rounded-full bg-[#21262d] font-mono text-[10px] text-[#8b949e]">
              {claims.filter((c) => c.status === "pending").length +
                teamApplications.filter((a) => a.status === "pending").length}
            </span>
          </div>

          <div className="p-2.5 space-y-2.5 bg-[#0d1117] min-h-[300px] max-h-[600px] overflow-y-auto">
            {/* Task Claims */}
            {pipelineTypeFilter !== "team" &&
              claims
                .filter(
                  (c) =>
                    c.status === "pending" &&
                    (searchQuery
                      ? c.user_login.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        c.issue_title.toLowerCase().includes(searchQuery.toLowerCase())
                      : true)
                )
                .map((claim) => (
                  <div
                    key={claim.id}
                    className="p-3 rounded-lg border border-[#30363d] bg-[#161b22] space-y-2 hover:border-[#58a6ff] transition-all shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {claim.user_avatar ? (
                          <img
                            src={claim.user_avatar}
                            alt={claim.user_login}
                            className="w-5 h-5 rounded-md shrink-0"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-md bg-[#21262d] text-white text-[10px] flex items-center justify-center font-bold">
                            {claim.user_login.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-semibold text-white text-xs truncate">
                          @{claim.user_login}
                        </span>
                      </div>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#e5484d]/10 text-[#e5484d] border border-[#e5484d]/20 shrink-0">
                        #{claim.issue_number}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#c9d1d9] line-clamp-2 leading-relaxed">
                      {claim.pitch}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-[#30363d]/60 text-[11px]">
                      <button
                        type="button"
                        onClick={() => onOpenClaimDrawer(claim)}
                        className="text-[#58a6ff] hover:underline flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Тред</span>
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onClaimStatusChange(claim.id, "assigned")}
                          className="px-2 py-0.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-medium text-[10px]"
                        >
                          В работу
                        </button>
                        <button
                          type="button"
                          onClick={() => onClaimStatusChange(claim.id, "rejected")}
                          className="px-1.5 py-0.5 rounded border border-[#30363d] text-[#f85149] hover:bg-[#da3633]/20 text-[10px]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

            {/* Team Apps */}
            {pipelineTypeFilter !== "tasks" &&
              teamApplications
                .filter(
                  (a) =>
                    a.status === "pending" &&
                    (searchQuery
                      ? a.user_login.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        a.role.toLowerCase().includes(searchQuery.toLowerCase())
                      : true)
                )
                .map((app) => (
                  <div
                    key={app.id}
                    className="p-3 rounded-lg border border-[#30363d] bg-[#161b22] space-y-2 hover:border-[#38bdf8] transition-all shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {app.user_avatar ? (
                          <img
                            src={app.user_avatar}
                            alt={app.user_login}
                            className="w-5 h-5 rounded-md shrink-0"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-md bg-[#21262d] text-white text-[10px] flex items-center justify-center font-bold">
                            {app.user_login.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-semibold text-white text-xs truncate">
                          @{app.user_login}
                        </span>
                      </div>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20 shrink-0 truncate max-w-[100px]">
                        {app.role}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#c9d1d9] line-clamp-2 leading-relaxed">
                      {app.experience}
                    </p>

                    {app.contacts && (
                      <span className="text-[10px] text-[#8b949e] block font-mono">
                        {app.contacts}
                      </span>
                    )}

                    <div className="flex items-center justify-end gap-1 pt-1 border-t border-[#30363d]/60">
                      <button
                        type="button"
                        onClick={() => onTeamAppStatusChange(app.id, "accepted")}
                        className="px-2 py-0.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-medium text-[10px]"
                      >
                        В команду
                      </button>
                      <button
                        type="button"
                        onClick={() => onTeamAppStatusChange(app.id, "rejected")}
                        className="px-1.5 py-0.5 rounded border border-[#30363d] text-[#f85149] hover:bg-[#da3633]/20 text-[10px]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* 2. В разработке (In Progress / Assigned) */}
        <div className="rounded-lg border border-[#30363d] bg-[#161b22] overflow-hidden flex flex-col">
          <div className="p-3 border-b border-[#30363d] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#d29922]" />
              <span className="font-semibold text-white text-xs">В разработке</span>
            </div>
            <span className="px-1.5 py-0.2 rounded-full bg-[#21262d] font-mono text-[10px] text-[#8b949e]">
              {claims.filter((c) => c.status === "assigned" && !c.pr_url).length}
            </span>
          </div>

          <div className="p-2.5 space-y-2.5 bg-[#0d1117] min-h-[300px] max-h-[600px] overflow-y-auto">
            {claims
              .filter((c) => c.status === "assigned" && !c.pr_url)
              .map((claim) => (
                <div
                  key={claim.id}
                  className="p-3 rounded-lg border border-[#30363d] bg-[#161b22] space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white text-xs truncate">
                      @{claim.user_login}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#d29922]/10 text-[#d29922] border border-[#d29922]/20">
                      #{claim.issue_number}
                    </span>
                  </div>

                  <span className="text-xs text-[#c9d1d9] font-medium block truncate">
                    {claim.issue_title}
                  </span>

                  <div className="flex items-center justify-between pt-1 border-t border-[#30363d]/60 text-[11px]">
                    <button
                      type="button"
                      onClick={() => onOpenClaimDrawer(claim)}
                      className="text-[#58a6ff] hover:underline flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Чат с исполнителем</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onClaimStatusChange(claim.id, "completed")}
                      className="px-2 py-0.5 rounded bg-[#1f6feb] hover:bg-[#388bfd] text-white text-[10px] font-medium"
                    >
                      Завершить
                    </button>
                  </div>
                </div>
              ))}

            {claims.filter((c) => c.status === "assigned" && !c.pr_url).length === 0 && (
              <div className="py-16 text-center text-[#8b949e] text-[11px]">
                Нет задач в работе
              </div>
            )}
          </div>
        </div>

        {/* 3. PR на ревью (In Review) */}
        <div className="rounded-lg border border-[#30363d] bg-[#161b22] overflow-hidden flex flex-col">
          <div className="p-3 border-b border-[#30363d] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#a371f7]" />
              <span className="font-semibold text-white text-xs">PR на ревью</span>
            </div>
            <span className="px-1.5 py-0.2 rounded-full bg-[#21262d] font-mono text-[10px] text-[#8b949e]">
              {claims.filter((c) => c.status === "assigned" && Boolean(c.pr_url)).length}
            </span>
          </div>

          <div className="p-2.5 space-y-2.5 bg-[#0d1117] min-h-[300px] max-h-[600px] overflow-y-auto">
            {claims
              .filter((c) => c.status === "assigned" && Boolean(c.pr_url))
              .map((claim) => (
                <div
                  key={claim.id}
                  className="p-3 rounded-lg border border-[#30363d] bg-[#161b22] space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white text-xs truncate">
                      @{claim.user_login}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#a371f7]/10 text-[#a371f7] border border-[#a371f7]/20">
                      #{claim.issue_number}
                    </span>
                  </div>

                  <a
                    href={claim.pr_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#58a6ff] hover:underline flex items-center gap-1 font-mono truncate"
                  >
                    <GitPullRequest className="w-3.5 h-3.5 shrink-0 text-[#a371f7]" />
                    <span className="truncate">{claim.pr_url}</span>
                  </a>

                  <div className="flex items-center justify-between pt-1 border-t border-[#30363d]/60 text-[11px]">
                    <button
                      type="button"
                      onClick={() => onOpenClaimDrawer(claim)}
                      className="text-[#58a6ff] hover:underline flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Чат</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onClaimStatusChange(claim.id, "completed")}
                      className="px-2 py-0.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-[10px] font-medium"
                    >
                      Замержено
                    </button>
                  </div>
                </div>
              ))}

            {claims.filter((c) => c.status === "assigned" && Boolean(c.pr_url)).length === 0 && (
              <div className="py-16 text-center text-[#8b949e] text-[11px]">
                Нет открытых PR на ревью
              </div>
            )}
          </div>
        </div>

        {/* 4. Завершено / В команде (Converted) */}
        <div className="rounded-lg border border-[#30363d] bg-[#161b22] overflow-hidden flex flex-col">
          <div className="p-3 border-b border-[#30363d] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#3fb950]" />
              <span className="font-semibold text-white text-xs">Завершено</span>
            </div>
            <span className="px-1.5 py-0.2 rounded-full bg-[#21262d] font-mono text-[10px] text-[#8b949e]">
              {completedClaimsCount + acceptedAppsCount}
            </span>
          </div>

          <div className="p-2.5 space-y-2.5 bg-[#0d1117] min-h-[300px] max-h-[600px] overflow-y-auto">
            {/* Completed tasks */}
            {claims
              .filter((c) => c.status === "completed")
              .map((claim) => (
                <div
                  key={claim.id}
                  className="p-2.5 rounded-lg border border-[#30363d] bg-[#161b22]/70 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white text-xs truncate">
                      @{claim.user_login}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#238636]/10 text-[#3fb950] border border-[#238636]/20">
                      #{claim.issue_number}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8b949e] block truncate">
                    {claim.issue_title}
                  </span>
                </div>
              ))}

            {/* Accepted team members */}
            {teamApplications
              .filter((a) => a.status === "accepted")
              .map((app) => (
                <div
                  key={app.id}
                  className="p-2.5 rounded-lg border border-[#30363d] bg-[#161b22]/70 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white text-xs truncate">
                      @{app.user_login}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20">
                      {app.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#38bdf8] block">
                    Принят в команду
                  </span>
                </div>
              ))}

            {completedClaimsCount + acceptedAppsCount === 0 && (
              <div className="py-16 text-center text-[#8b949e] text-[11px]">
                Пока нет завершённых задач
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
