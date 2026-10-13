"use client";

import { TaskClaim } from "@/lib/claims";
import { TeamApplication, TeamRoleItem, Project, ContributorTask } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/context";
import { NavSection } from "./types";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  GitPullRequest,
  UserPlus,
  Briefcase,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Plus,
} from "lucide-react";
import Link from "next/link";

interface CrmOverviewProps {
  project: Project;
  claims: TaskClaim[];
  teamApplications: TeamApplication[];
  teamRoles: TeamRoleItem[];
  tasks: ContributorTask[];
  onSelectSection: (section: NavSection) => void;
  onOpenTask: (taskNumberOrId: number | string) => void;
  onAcceptTeamApp: (appId: string) => Promise<void>;
  onRejectTeamApp: (appId: string) => Promise<void>;
  onOpenNewTaskModal?: () => void;
}

export function CrmOverview({
  project,
  claims,
  teamApplications,
  teamRoles,
  tasks,
  onSelectSection,
  onOpenTask,
  onAcceptTeamApp,
  onRejectTeamApp,
  onOpenNewTaskModal,
}: CrmOverviewProps) {
  const { t } = useLanguage();
  // 1. Attention Events
  const pendingClaims = claims.filter((c) => c.status === "pending");
  const prsToReview = claims.filter((c) => c.status === "assigned" && Boolean(c.pr_url));
  const pendingTeamApps = teamApplications.filter((a) => a.status === "pending");
  // Contributor waiting for reply: last message sent by contributor, not completed/rejected
  const unreadMessagesClaims = claims.filter(
    (c) =>
      c.last_message_is_author === false &&
      c.status !== "rejected" &&
      c.status !== "completed"
  );

  const attentionEventsCount =
    pendingClaims.length + prsToReview.length + pendingTeamApps.length + unreadMessagesClaims.length;

  // 2. Active Work
  const inProgressClaims = claims.filter((c) => c.status === "assigned");

  // 3. Is Project Empty / Needs Onboarding?
  const isNewProject =
    tasks.length === 0 &&
    teamRoles.length === 0 &&
    claims.length === 0 &&
    teamApplications.length === 0;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* 1. Блок «Требует внимания» */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>{t.crm.overview.attentionQueueTitle}</span>
              {attentionEventsCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-[#e5484d] text-white text-[11px] font-mono font-bold">
                  {attentionEventsCount}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30 text-[11px] font-medium">
                  {t.crm.overview.noAttention}
                </span>
              )}
            </h2>
            <p className="text-xs text-[#8b949e] mt-0.5">
              {t.crm.overview.attentionQueueDesc}
            </p>
          </div>
        </div>

        {attentionEventsCount === 0 ? (
          <div className="p-6 rounded-2xl border border-[#21262d] bg-[#161b22]/50 flex items-center gap-4 text-xs text-[#8b949e]">
            <div className="w-10 h-10 rounded-xl bg-[#238636]/10 border border-[#238636]/20 text-[#3fb950] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-white">{t.crm.overview.noAttention}</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {/* PRs for Review */}
            {prsToReview.map((c) => (
              <div
                key={`pr_${c.id}`}
                className="p-4 rounded-xl border border-[#38bdf8]/30 bg-[#38bdf8]/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#38bdf8]/50 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-[#38bdf8]/15 text-[#38bdf8] shrink-0 mt-0.5">
                    <GitPullRequest className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[#38bdf8]/20 text-[#38bdf8] font-bold">
                        {t.crm.overview.prAttached}
                      </span>
                      <span className="text-xs text-white font-medium truncate">
                        {c.issue_title}
                      </span>
                    </div>
                    <div className="text-xs text-[#8b949e] mt-1 flex items-center gap-2 flex-wrap">
                      <span>@{c.user_login}</span>
                      <span>·</span>
                      <a
                        href={c.pr_url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#38bdf8] hover:underline flex items-center gap-1 font-mono"
                      >
                        <span>{t.crm.tasks.openPr}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSection("tasks");
                      onOpenTask(c.issue_number);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#38bdf8] hover:bg-[#60a5fa] text-black font-semibold text-xs transition-colors"
                  >
                    {t.crm.overview.needsReview}
                  </button>
                </div>
              </div>
            ))}

            {/* Pending Task Claims */}
            {pendingClaims.map((c) => (
              <div
                key={`claim_${c.id}`}
                className="p-4 rounded-xl border border-[#e5484d]/30 bg-[#e5484d]/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#e5484d]/50 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {c.user_avatar ? (
                    <img
                      src={c.user_avatar}
                      alt={c.user_login}
                      className="w-9 h-9 rounded-lg border border-white/10 shrink-0 object-cover mt-0.5"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-[#21262d] border border-white/10 flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5">
                      {c.user_login.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[#e5484d]/20 text-[#e5484d] font-bold">
                        {t.crm.overview.pendingClaims}
                      </span>
                      <span className="text-xs text-white font-medium truncate">
                        {c.issue_title}
                      </span>
                    </div>
                    <p className="text-xs text-[#8b949e] mt-1 line-clamp-2">
                      <span className="text-white font-semibold">@{c.user_login}:</span>{" "}
                      {c.pitch}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSection("tasks");
                      onOpenTask(c.issue_number);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#e5484d] hover:bg-[#f2555a] text-white font-semibold text-xs transition-colors"
                  >
                    {t.crm.overview.needsReview}
                  </button>
                </div>
              </div>
            ))}

            {/* Messages waiting for Maintainer Reply */}
            {unreadMessagesClaims.map((c) => (
              <div
                key={`msg_${c.id}`}
                className="p-4 rounded-xl border border-[#a371f7]/30 bg-[#a371f7]/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#a371f7]/50 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-[#a371f7]/15 text-[#a371f7] shrink-0 mt-0.5">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[#a371f7]/20 text-[#a371f7] font-bold">
                        {t.crm.overview.waitingReply}
                      </span>
                      <span className="text-xs text-white font-medium truncate">
                        {c.issue_title}
                      </span>
                    </div>
                    <p className="text-xs text-[#8b949e] mt-1 line-clamp-2">
                      <span className="text-white font-semibold">@{c.last_message_sender || c.user_login}:</span>{" "}
                      {c.last_message_content || t.crm.tasks.chatTitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSection("tasks");
                      onOpenTask(c.task_id || c.issue_number);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#a371f7] hover:bg-[#b085f9] text-white font-semibold text-xs transition-colors"
                  >
                    {t.crm.tasks.send}
                  </button>
                </div>
              </div>
            ))}

            {/* Pending Team Applications */}
            {pendingTeamApps.map((a) => (
              <div
                key={`team_${a.id}`}
                className="p-4 rounded-xl border border-[#d29922]/30 bg-[#d29922]/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#d29922]/50 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {a.user_avatar ? (
                    <img
                      src={a.user_avatar}
                      alt={a.user_login}
                      className="w-9 h-9 rounded-lg border border-white/10 shrink-0 object-cover mt-0.5"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-[#21262d] border border-white/10 flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5">
                      {a.user_login.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[#d29922]/20 text-[#d29922] font-bold">
                        {t.crm.overview.teamApps}
                      </span>
                      <span className="text-xs text-white font-medium">
                        {a.role}
                      </span>
                    </div>
                    <p className="text-xs text-[#8b949e] mt-1 line-clamp-2">
                      <span className="text-white font-semibold">@{a.user_login}:</span>{" "}
                      {a.experience}
                    </p>
                    {a.contacts && (
                      <div className="text-[11px] text-[#8b949e] font-mono mt-0.5">
                        {t.crm.team.contactsLabel} {a.contacts}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onRejectTeamApp(a.id)}
                    className="px-3 py-1.5 rounded-lg border border-[#30363d] bg-[#161b22] hover:bg-[#21262d] text-[#8b949e] hover:text-white text-xs font-medium transition-colors"
                  >
                    {t.crm.team.btnReject}
                  </button>
                  <button
                    type="button"
                    onClick={() => onAcceptTeamApp(a.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold transition-colors"
                  >
                    {t.crm.team.btnAccept}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. Стартовый чеклист (если проект новый и пустой) */}
      {isNewProject && (
        <section className="p-6 rounded-2xl border border-[#30363d] bg-[#161b22] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e5484d]/15 text-[#e5484d] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {t.projectPage.quickstart}
              </h3>
              <p className="text-xs text-[#8b949e] mt-0.5">
                {t.crm.settings.subtitle}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                onSelectSection("tasks");
                if (onOpenNewTaskModal) onOpenNewTaskModal();
              }}
              className="p-4 rounded-xl border border-[#30363d] bg-[#0d1117] hover:border-[#e5484d]/50 text-left transition-colors group"
            >
              <div className="text-xs font-bold text-white group-hover:text-[#e5484d] flex items-center justify-between">
                <span>1. {t.crm.tasks.btnNewTask}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] text-[#8b949e] mt-1.5">
                {t.crm.tasks.subtitle}
              </p>
            </button>

            <button
              type="button"
              onClick={() => onSelectSection("team")}
              className="p-4 rounded-xl border border-[#30363d] bg-[#0d1117] hover:border-[#e5484d]/50 text-left transition-colors group"
            >
              <div className="text-xs font-bold text-white group-hover:text-[#e5484d] flex items-center justify-between">
                <span>2. {t.crm.team.btnAddRole}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] text-[#8b949e] mt-1.5">
                {t.crm.team.subtitle}
              </p>
            </button>

            <button
              type="button"
              onClick={() => onSelectSection("settings")}
              className="p-4 rounded-xl border border-[#30363d] bg-[#0d1117] hover:border-[#e5484d]/50 text-left transition-colors group"
            >
              <div className="text-xs font-bold text-white group-hover:text-[#e5484d] flex items-center justify-between">
                <span>3. {t.crm.settings.title}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] text-[#8b949e] mt-1.5">
                {t.crm.settings.contactUrlLabel}
              </p>
            </button>
          </div>
        </section>
      )}

      {/* 3. Блок «Активная работа» */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-white">{t.crm.overview.metricsTitle}</h2>
          <p className="text-xs text-[#8b949e] mt-0.5">
            {t.crm.overview.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Задачи в работе */}
          <div className="rounded-2xl border border-[#21262d] bg-[#161b22] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#d29922]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  {t.crm.overview.activeContributors} ({inProgressClaims.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSelectSection("tasks")}
                className="text-[11px] text-[#8b949e] hover:text-white transition-colors"
              >
                {t.crm.tasks.filterAll} →
              </button>
            </div>

            {inProgressClaims.length === 0 ? (
              <div className="text-xs text-[#8b949e] py-6 text-center">
                {t.crm.tasks.noTasksFound}
              </div>
            ) : (
              <div className="space-y-2.5">
                {inProgressClaims.map((c) => {
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        onSelectSection("tasks");
                        onOpenTask(c.issue_number);
                      }}
                      className="p-3 rounded-xl border border-[#30363d] bg-[#0d1117] hover:border-[#484f58] transition-colors cursor-pointer flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-white truncate">
                          {c.issue_title}
                        </div>
                        <div className="text-[11px] text-[#8b949e] mt-0.5 flex items-center gap-2">
                          <span>@{c.user_login}</span>
                        </div>
                      </div>

                      {c.pr_url ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#38bdf8]/15 text-[#38bdf8] font-bold shrink-0">
                          {t.crm.tasks.openPr}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#d29922]/15 text-[#d29922] font-medium shrink-0">
                          {t.crm.tasks.statusAssigned}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Открытые позиции в команду */}
          <div className="rounded-2xl border border-[#21262d] bg-[#161b22] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#38bdf8]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  {t.crm.overview.openPositions} ({teamRoles.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSelectSection("team")}
                className="text-[11px] text-[#8b949e] hover:text-white transition-colors"
              >
                {t.crm.overview.manageRoles} →
              </button>
            </div>

            {teamRoles.length === 0 ? (
              <div className="text-xs text-[#8b949e] py-6 text-center">
                {t.crm.overview.noRoles}
              </div>
            ) : (
              <div className="space-y-2.5">
                {teamRoles.map((roleItem, idx) => {
                  const roleName = (roleItem as any)?.role || (roleItem as any)?.title || "";
                  const appsForRole = teamApplications.filter(
                    (a) => (a.role || "").toLowerCase() === roleName.toLowerCase()
                  );
                  return (
                    <div
                      key={`role_${idx}`}
                      onClick={() => onSelectSection("team")}
                      className="p-3 rounded-xl border border-[#30363d] bg-[#0d1117] hover:border-[#484f58] transition-colors cursor-pointer flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-white truncate">
                          {roleName || t.common.notSpecified}
                        </div>
                        <div className="text-[11px] text-[#8b949e] mt-0.5">
                          {(roleItem as any)?.commitment || (roleItem as any)?.description || "5-10 ч/нед"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#21262d] text-[#8b949e]">
                          {appsForRole.length}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
