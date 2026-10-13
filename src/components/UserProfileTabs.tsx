"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FolderGit2,
  Sparkles,
  Users,
  MessageSquare,
  Award,
  GitPullRequest,
  CheckCircle2,
  Lock,
  Code2,
  Share2,
  Copy,
  Check,
  Send,
  Clock,
  Wrench,
  SlidersHorizontal,
  ExternalLink,
} from "lucide-react";
import { Project, Comment, TeamApplication } from "@/lib/types";
import { TaskClaim } from "@/lib/claims";
import {
  UserAvailability,
  AchievementBadge,
  LanguageStat,
} from "@/lib/user-profile";
import { ProjectCard } from "@/components/ProjectCard";
import { SubmitForm } from "@/components/SubmitForm";
import { updateUserAvailabilityAction } from "@/app/actions";
import { useLanguage } from "@/lib/i18n";

export type UserProfileComment = Comment & {
  project_name?: string;
  project_slug?: string;
};

interface UserProfileTabsProps {
  cleanUsername: string;
  isOwner: boolean;
  projects: Project[];
  claims: TaskClaim[];
  teamApps: TeamApplication[];
  comments: UserProfileComment[];
  availability: UserAvailability | null;
  badges: AchievementBadge[];
  stack: LanguageStat[];
  userRepos: any[];
  session: any;
}


export function UserProfileTabs({
  cleanUsername,
  isOwner,
  projects,
  claims,
  teamApps,
  comments,
  availability,
  badges,
  stack,
  userRepos,
  session,
}: UserProfileTabsProps) {
  const { t, locale } = useLanguage();
  const [activeTab, setActiveTab] = useState<
    "projects" | "tasks" | "teams" | "badges" | "activity" | "badge"
  >("projects");
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const [copiedBadge, setCopiedBadge] = useState(false);

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const badgeMarkdown = `[![OSS Hub Profile](https://oss-hub-nu.vercel.app/api/badge/${cleanUsername})](https://oss-hub-nu.vercel.app/users/${cleanUsername})`;

  function handleCopyBadge() {
    navigator.clipboard.writeText(badgeMarkdown);
    setCopiedBadge(true);
    setTimeout(() => setCopiedBadge(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* 1. Developer Stack & Availability Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Languages Breakdown */}
        <div className="lg:col-span-2 rounded-2xl border border-[#1d212b] bg-[#0f1117] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-[#e5484d]" />
              <span>{t.profile.techStackTitle}</span>
            </span>
            <span className="text-[11px] text-[#8a92a3] font-mono">
              {stack.length > 0 ? `${stack.length} ${t.profile.techCount}` : t.profile.noData}
            </span>
          </div>

          {stack.length > 0 ? (
            <div className="space-y-3">
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#161a23] border border-[#1d212b]">
                {stack.map((s) => (
                  <div
                    key={s.name}
                    style={{ width: `${s.percentage}%`, backgroundColor: s.color }}
                    title={`${s.name}: ${s.percentage}%`}
                    className="h-full transition-all"
                  />
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3.5 text-xs">
                {stack.map((s) => (
                  <span key={s.name} className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="font-medium text-white">{s.name}</span>
                    <span className="text-[#586071] font-mono text-[11px]">
                      {s.percentage}%
                    </span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#8a92a3]">
              {t.profile.stackAutoNotice}
            </p>
          )}
        </div>

        {/* Availability / Collaboration Card */}
        <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>{t.profile.availabilityTitle}</span>
              </span>

              {isOwner && (
                <button
                  type="button"
                  onClick={() => setIsEditingAvailability(!isEditingAvailability)}
                  className="text-[11px] text-[#38bdf8] hover:underline"
                >
                  {isEditingAvailability ? t.profile.cancel : t.profile.edit}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  availability?.status === "busy"
                    ? "bg-[#d29922]"
                    : availability?.status === "mentor"
                    ? "bg-[#38bdf8]"
                    : "bg-[#3fb950]"
                }`}
              />
              <span className="text-xs font-semibold text-white">
                {availability?.status === "busy"
                  ? t.profile.statusBusyDesc
                  : availability?.status === "mentor"
                  ? t.profile.statusMentorDesc
                  : t.profile.statusOpenDesc}
              </span>
            </div>

            {availability?.status_text && (
              <p className="text-xs text-[#d1d5db] leading-relaxed line-clamp-2">
                {availability.status_text}
              </p>
            )}

            <div className="text-[11px] text-[#8a92a3] space-y-1 pt-1">
              {availability?.hours_per_week && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[#586071]" />
                  <span>{t.profile.readiness}: {availability.hours_per_week}</span>
                </div>
              )}
              {availability?.preferred_stack && (
                <div className="flex items-center gap-1.5">
                  <Wrench className="w-3 h-3 text-[#586071]" />
                  <span className="truncate">{t.profile.interested}: {availability.preferred_stack}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action button: Telegram or setup */}
          <div>
            {availability?.telegram ? (
              <a
                href={
                  availability.telegram.startsWith("http")
                    ? availability.telegram
                    : `https://t.me/${availability.telegram.replace(/^@/, "")}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161a23] hover:bg-[#1f2432] text-white border border-[#2e3444] text-xs font-semibold transition-colors"
              >
                <Send className="w-3 h-3 text-[#38bdf8]" />
                <span>{t.profile.writeTelegram}</span>
              </a>
            ) : isOwner ? (
              <button
                type="button"
                onClick={() => setIsEditingAvailability(true)}
                className="w-full text-center px-3 py-1.5 rounded-lg bg-[#161a23] hover:bg-[#1f2432] text-[#8a92a3] hover:text-white border border-[#1d212b] text-xs transition-colors"
              >
                {t.profile.specifyContacts}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Inline Availability Editor for Profile Owner */}
      {isOwner && isEditingAvailability && (
        <form
          action={async (formData) => {
            await updateUserAvailabilityAction(formData);
            setIsEditingAvailability(false);
          }}
          className="rounded-2xl border border-[#2e3444] bg-[#12151d] p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#1d212b] pb-3">
            <h3 className="text-sm font-bold text-white">
              {t.profile.availabilityEditTitle}
            </h3>
            <span className="text-xs text-[#8a92a3]">
              {t.profile.availabilityVisibleTo}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-[#8a92a3] font-medium">{t.profile.statusLabel}</label>
              <select
                name="status"
                defaultValue={availability?.status || "open"}
                className="w-full rounded-lg border border-[#1d212b] bg-[#0f1117] px-3 py-2 text-white focus:outline-none focus:border-[#2e3444]"
              >
                <option value="open">{t.profile.statusOpen}</option>
                <option value="busy">{t.profile.statusBusy}</option>
                <option value="mentor">{t.profile.statusMentor}</option>
                <option value="maintainer">{t.profile.statusMaintainer}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[#8a92a3] font-medium">{t.profile.readiness}</label>
              <input
                type="text"
                name="hours_per_week"
                defaultValue={availability?.hours_per_week || "5-10 ч/нед"}
                placeholder={t.profile.hoursPlaceholder}
                className="w-full rounded-lg border border-[#1d212b] bg-[#0f1117] px-3 py-2 text-white placeholder-[#586071] focus:outline-none focus:border-[#2e3444]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[#8a92a3] font-medium">{t.profile.stackLabel}</label>
              <input
                type="text"
                name="preferred_stack"
                defaultValue={availability?.preferred_stack || ""}
                placeholder={t.profile.stackPlaceholder}
                className="w-full rounded-lg border border-[#1d212b] bg-[#0f1117] px-3 py-2 text-white placeholder-[#586071] focus:outline-none focus:border-[#2e3444]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[#8a92a3] font-medium">{t.profile.telegramLabel}</label>
              <input
                type="text"
                name="telegram"
                defaultValue={availability?.telegram || ""}
                placeholder="@username"
                className="w-full rounded-lg border border-[#1d212b] bg-[#0f1117] px-3 py-2 text-white placeholder-[#586071] focus:outline-none focus:border-[#2e3444]"
              />
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <label className="text-[#8a92a3] font-medium">{t.profile.commentLabel}</label>
            <textarea
              name="status_text"
              rows={2}
              defaultValue={availability?.status_text || ""}
              placeholder={t.profile.commentPlaceholder}
              className="w-full rounded-lg border border-[#1d212b] bg-[#0f1117] px-3 py-2 text-white placeholder-[#586071] focus:outline-none focus:border-[#2e3444] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setIsEditingAvailability(false)}
              className="px-3 py-1.5 rounded-lg border border-[#1d212b] bg-[#161a23] text-xs text-[#8a92a3] hover:text-white"
            >
              {t.profile.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#e5484d] hover:bg-[#cc3e43] text-xs font-bold text-white transition-colors"
            >
              {t.profile.saveStatusBtn}
            </button>
          </div>
        </form>
      )}

      {/* 2. Primary Tabs Switcher */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-[#1d212b] text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("projects")}
          className={`px-3 py-2 rounded-t-lg font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === "projects"
              ? "bg-[#0f1117] text-white border-t border-x border-[#1d212b]"
              : "text-[#8a92a3] hover:text-white"
          }`}
        >
          <FolderGit2 className="w-3.5 h-3.5" />
          <span>{t.profile.projectsTab} ({projects.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tasks")}
          className={`px-3 py-2 rounded-t-lg font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === "tasks"
              ? "bg-[#0f1117] text-white border-t border-x border-[#1d212b]"
              : "text-[#8a92a3] hover:text-white"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#e5484d]" />
          <span>{t.profile.tasksAndPrsTab} ({claims.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("teams")}
          className={`px-3 py-2 rounded-t-lg font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === "teams"
              ? "bg-[#0f1117] text-white border-t border-x border-[#1d212b]"
              : "text-[#8a92a3] hover:text-white"
          }`}
        >
          <Users className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>{t.profile.teamsTab} ({teamApps.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("badges")}
          className={`px-3 py-2 rounded-t-lg font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === "badges"
              ? "bg-[#0f1117] text-white border-t border-x border-[#1d212b]"
              : "text-[#8a92a3] hover:text-white"
          }`}
        >
          <Award className="w-3.5 h-3.5 text-[#d29922]" />
          <span>{t.profile.badgesTabTitle} ({unlockedCount}/{badges.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("activity")}
          className={`px-3 py-2 rounded-t-lg font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === "activity"
              ? "bg-[#0f1117] text-white border-t border-x border-[#1d212b]"
              : "text-[#8a92a3] hover:text-white"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{t.profile.activityTab} ({comments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("badge")}
          className={`px-3 py-2 rounded-t-lg font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === "badge"
              ? "bg-[#0f1117] text-white border-t border-x border-[#1d212b]"
              : "text-[#8a92a3] hover:text-white"
          }`}
        >
          <Share2 className="w-3.5 h-3.5 text-[#3fb950]" />
          <span>{t.profile.badgeTab}</span>
        </button>
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: PROJECTS */}
      {activeTab === "projects" && (
        <div className="space-y-6">
          {/* Submit form if owner */}
          {isOwner && (
            <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-6 space-y-3">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {t.profile.publishRepoTitle}
                </h3>
                <p className="text-xs text-[#8a92a3]">
                  {t.profile.publishRepoDesc}
                </p>
              </div>
              <SubmitForm session={session} userRepos={userRepos} />
            </div>
          )}

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-10 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#8a92a3]">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <div className="text-sm font-semibold text-white">
                {isOwner
                  ? t.profile.noProjectsOwner
                  : t.profile.noProjectsUser}
              </div>
              <p className="text-xs text-[#8a92a3] max-w-sm mx-auto">
                {isOwner
                  ? t.profile.noProjectsOwnerDesc
                  : t.profile.noProjectsUserDesc}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TASKS & PRS */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          {claims.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {claims.map((claim) => (
                <div
                  key={claim.id}
                  className="p-4 rounded-xl border border-[#1d212b] bg-[#0f1117] space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/projects/${claim.project_slug}`}
                      className="text-xs font-mono text-[#8a92a3] hover:text-white transition-colors truncate"
                    >
                      {claim.project_slug}
                    </Link>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        claim.status === "assigned"
                          ? "bg-[#d29922]/10 text-[#d29922] border-[#d29922]/30"
                          : claim.status === "completed"
                          ? "bg-[#3fb950]/10 text-[#3fb950] border-[#3fb950]/30"
                          : claim.status === "rejected"
                          ? "bg-[#e5484d]/10 text-[#e5484d] border-[#e5484d]/30"
                          : "bg-white/5 text-[#8a92a3] border-white/10"
                      }`}
                    >
                      {claim.status === "assigned"
                        ? t.profile.statusInDev
                        : claim.status === "completed"
                        ? t.profile.statusCompleted
                        : claim.status === "rejected"
                        ? t.profile.statusRejected
                        : t.profile.statusUnderReview}
                    </span>
                  </div>

                  <Link
                    href={`/projects/${claim.project_slug}`}
                    className="font-semibold text-white text-xs block hover:text-[#e5484d] transition-colors leading-snug"
                  >
                    #{claim.issue_number} {claim.issue_title}
                  </Link>

                  <p className="text-[11px] text-[#8a92a3] line-clamp-2">
                    {claim.pitch}
                  </p>

                  {claim.pr_url && (
                    <div className="pt-2 border-t border-[#1d212b] flex items-center gap-1.5 text-[11px]">
                      <GitPullRequest className="w-3.5 h-3.5 text-[#38bdf8]" />
                      <a
                        href={claim.pr_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#38bdf8] hover:underline font-mono truncate"
                      >
                        {claim.pr_url}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-10 text-center space-y-2">
              <div className="text-sm font-semibold text-white">
                {t.profile.noTasksTitle}
              </div>
              <p className="text-xs text-[#8a92a3]">
                {isOwner
                  ? t.profile.noTasksOwnerDesc
                  : t.profile.noTasksUserDesc}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TEAMS */}
      {activeTab === "teams" && (
        <div className="space-y-4">
          {teamApps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {teamApps.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-xl border border-[#1d212b] bg-[#0f1117] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/projects/${app.project_slug}`}
                      className="text-xs font-mono text-[#8a92a3] hover:text-white transition-colors truncate"
                    >
                      {app.project_slug}
                    </Link>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        app.status === "accepted"
                          ? "bg-[#3fb950]/10 text-[#3fb950] border-[#3fb950]/30"
                          : app.status === "rejected"
                          ? "bg-[#e5484d]/10 text-[#e5484d] border-[#e5484d]/30"
                          : "bg-white/5 text-[#8a92a3] border-white/10"
                      }`}
                    >
                      {app.status === "accepted"
                        ? t.profile.teamAccepted
                        : app.status === "rejected"
                        ? t.profile.statusRejected
                        : t.profile.teamWaiting}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-white">
                    {t.profile.teamRoleLabel} <span className="text-[#38bdf8]">{app.role}</span>
                  </div>

                  <p className="text-[11px] text-[#8a92a3] line-clamp-2">
                    {app.experience}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-10 text-center space-y-2">
              <div className="text-sm font-semibold text-white">
                {t.profile.noTeamsTitle}
              </div>
              <p className="text-xs text-[#8a92a3]">
                {isOwner
                  ? t.profile.noTeamsOwnerDesc
                  : t.profile.noTeamsUserDesc}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ACHIEVEMENTS & BADGES */}
      {activeTab === "badges" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#1d212b] pb-3 text-xs">
            <span className="text-[#8a92a3]">
              {t.profile.achievementsUnlocked} <span className="text-white font-bold">{unlockedCount}</span> {t.profile.of} {badges.length}
            </span>
            <span className="text-[#586071] font-mono">
              {t.profile.calculatedAuto}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-4 rounded-xl border transition-all space-y-2 ${
                  badge.unlocked
                    ? "bg-[#12151d] border-[#2e3444] shadow-sm"
                    : "bg-[#0f1117]/60 border-[#1d212b] opacity-60"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    {badge.unlocked ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#3fb950]" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-[#586071]" />
                    )}
                    <span>{badge.name}</span>
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      badge.unlocked
                        ? "bg-[#3fb950]/10 text-[#3fb950] border border-[#3fb950]/20"
                        : "bg-white/5 text-[#586071]"
                    }`}
                  >
                    {badge.unlocked ? t.profile.badgeEarned : t.profile.badgeInProgress}
                  </span>
                </div>

                <p className="text-[11px] text-[#8a92a3] leading-relaxed">
                  {badge.description}
                </p>

                {badge.progressText && (
                  <div className="pt-1 text-[10px] font-mono text-[#586071] border-t border-[#1d212b]">
                    {t.profile.badgeProgress} {badge.progressText}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: RECENT COMMENTS / DISCUSSIONS */}
      {activeTab === "activity" && (
        <div className="space-y-3">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-xl border border-[#1d212b] bg-[#0f1117] p-4 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[#8a92a3]">{t.profile.inRepo}</span>
                    {comment.project_slug ? (
                      <Link
                        href={`/projects/${comment.project_slug}`}
                        className="font-semibold text-white hover:underline truncate"
                      >
                        {comment.project_name || comment.project_slug}
                      </Link>
                    ) : (
                      <span className="font-semibold text-white">
                        {comment.project_name || "Проект"}
                      </span>
                    )}
                  </div>
                  <span className="text-[#8a92a3] text-[11px] shrink-0 font-mono">
                    {new Date(comment.created_at).toLocaleDateString(locale === "en" ? "en-US" : "ru-RU", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
                <p className="text-xs text-[#d1d5db] whitespace-pre-wrap leading-relaxed">
                  {comment.content}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-10 text-center space-y-2">
              <div className="text-sm font-semibold text-white">
                {t.profile.noActivityTitle}
              </div>
              <p className="text-xs text-[#8a92a3]">
                {t.profile.noActivityDesc}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: GITHUB README BADGE */}
      {activeTab === "badge" && (
        <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white tracking-tight">
              {t.profile.readmeBadgeTitle}
            </h3>
            <p className="text-xs text-[#8a92a3]">
              {t.profile.readmeBadgeDesc}
            </p>
          </div>

          {/* Live Preview */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono text-[#8a92a3] uppercase tracking-wider block">
              {t.profile.badgePreview}
            </span>
            <div className="p-4 rounded-xl border border-[#1d212b] bg-[#090a0f] flex items-center justify-center overflow-x-auto">
              <img
                src={`/api/badge/${cleanUsername}`}
                alt={`OSS Hub Pass - @${cleanUsername}`}
                className="max-w-full rounded-xl shadow-lg border border-[#1d212b]"
              />
            </div>
          </div>

          {/* Markdown Code & Copy Button */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono text-[#8a92a3] uppercase tracking-wider block">
              {t.profile.badgeMarkdownCode}
            </span>
            <div className="relative rounded-xl border border-[#1d212b] bg-[#12151d] p-3.5 font-mono text-xs text-[#c9d1d9] overflow-x-auto">
              <code>{badgeMarkdown}</code>
              <button
                type="button"
                onClick={handleCopyBadge}
                className="absolute right-2.5 top-2.5 px-3 py-1.5 rounded-lg bg-[#1a1e29] hover:bg-[#252b3b] text-white border border-[#2e3444] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {copiedBadge ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#3fb950]" />
                    <span className="text-[#3fb950]">{t.profile.badgeCopied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t.profile.badgeCopy}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
