"use client";

import { useState, useTransition } from "react";
import {
  Project,
  ContributorTask,
  GitHubIssue,
  ContributionMode,
  TeamRoleItem,
  ArchitectureItem,
} from "@/lib/types";
import { TaskClaim, TaskMessage } from "@/lib/claims";
import {
  claimTaskAction,
  applyToTeamAction,
  sendTaskMessageAction,
  updateClaimStatusAction,
  cancelClaimAction,
  getTaskMessagesAction,
} from "@/app/actions";
import {
  Terminal,
  Copy,
  Check,
  Zap,
  Clock,
  Sparkles,
  Users,
  ExternalLink,
  MessageSquare,
  Send,
  GitPullRequest,
  CheckCircle2,
  X,
  UserX,
  Code2,
  FileCode,
  Shield,
  Layers,
  ChevronRight,
  Info,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

interface ContributorFastTrackProps {
  project: Project;
  issues: GitHubIssue[];
  claims?: TaskClaim[];
  currentUserLogin?: string | null;
  currentUserAvatar?: string | null;
  currentUserName?: string | null;
}

export function ContributorFastTrack({
  project,
  issues,
  claims = [],
  currentUserLogin,
  currentUserAvatar,
  currentUserName,
}: ContributorFastTrackProps) {
  const { t } = useLanguage();
  const activeModes: ContributionMode[] =
    project.modes && project.modes.length > 0
      ? project.modes
      : ["tasks", "team", "onboarding"];

  const [activeTab, setActiveTab] = useState<ContributionMode>(activeModes[0] || "tasks");
  const [copiedQuickstart, setCopiedQuickstart] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [filterDifficulty, setFilterDifficulty] = useState<"all" | "easy" | "medium" | "hard">("all");
  const [filterSource, setFilterSource] = useState<"all" | "manual" | "github">("all");

  // Modal: Claim Task
  const [selectedTaskForClaim, setSelectedTaskForClaim] = useState<{
    id?: string;
    number: number;
    title: string;
    description?: string;
    source?: "github" | "manual";
  } | null>(null);
  const [claimPitch, setClaimPitch] = useState("");
  const [claimStatusMsg, setClaimStatusMsg] = useState<{ error?: string; success?: boolean } | null>(null);
  const [isPendingClaim, startClaimTransition] = useTransition();

  // Modal: Team Application
  const [selectedRoleForApply, setSelectedRoleForApply] = useState<TeamRoleItem | null>(null);
  const [teamExperience, setTeamExperience] = useState("");
  const [teamContacts, setTeamContacts] = useState("");
  const [teamStatusMsg, setTeamStatusMsg] = useState<{ error?: string; success?: boolean } | null>(null);
  const [isPendingTeam, startTeamTransition] = useTransition();

  // Modal / Drawer: Task Discussion & PR
  const [activeDiscussionClaim, setActiveDiscussionClaim] = useState<TaskClaim | null>(null);
  const [discussionMessages, setDiscussionMessages] = useState<TaskMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [newPrUrl, setNewPrUrl] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isCancelingClaim, setIsCancelingClaim] = useState(false);

  // Quickstart command
  const quickstart =
    project.quickstart_command ||
    `git clone ${project.url}.git && cd ${project.name} && npm install && npm run dev`;

  function handleCopyQuickstart() {
    navigator.clipboard.writeText(quickstart);
    setCopiedQuickstart(true);
    setTimeout(() => setCopiedQuickstart(false), 2000);
  }

  function handleCopyEnv() {
    if (!project.env_example) return;
    navigator.clipboard.writeText(project.env_example);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  }

  // Build unified tasks list: both local manual tasks and GitHub issues together
  const customTasks: ContributorTask[] = project.parsed_tasks || [];
  const manualItems = customTasks.map((t, idx) => ({
    id: t.id,
    number: t.issue_number || idx + 1,
    title: t.title,
    description: t.description,
    difficulty: t.difficulty,
    tags: t.tags || [],
    estimated_time: t.estimated_time,
    source: "manual" as const,
    isManual: true,
  }));

  const issueItems = issues.map((issue) => {
    const isGoodFirst = issue.labels.some((l) => {
      const name = l.name.toLowerCase();
      return (
        name.includes("good first") ||
        name.includes("beginner") ||
        name.includes("easy") ||
        name.includes("first-timers")
      );
    });
    const isHard = issue.labels.some((l) => {
      const name = l.name.toLowerCase();
      return (
        name.includes("hard") ||
        name.includes("complex") ||
        name.includes("architecture")
      );
    });
    return {
      id: `gh_${issue.number}`,
      number: issue.number,
      title: issue.title,
      description: issue.body ? issue.body.slice(0, 180) + "..." : t.projectPage.githubIssue,
      difficulty: (isGoodFirst ? "easy" : isHard ? "hard" : "medium") as "easy" | "medium" | "hard",
      tags: issue.labels.map((l) => l.name),
      estimated_time: isGoodFirst ? "1-2h" : undefined,
      source: "github" as const,
      isManual: false,
    };
  });

  const tasksList = [...manualItems, ...issueItems];

  const filteredTasks = tasksList.filter((t) => {
    if (filterSource !== "all" && t.source !== filterSource) return false;
    if (filterDifficulty !== "all" && t.difficulty !== filterDifficulty) return false;
    return true;
  });

  // Team roles
  const teamRoles: TeamRoleItem[] =
    project.team_roles_data && project.team_roles_data.length > 0
      ? project.team_roles_data
      : project.contributor_roles.map((r) => ({
          role: r,
          commitment: "5-10h/week",
          description: t.projectPage.defaultRoleDesc,
        }));

  // Architecture items
  const archItems: ArchitectureItem[] = project.architecture_map_data || [];

  // Claim handler
  function handleClaimSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTaskForClaim || !claimPitch.trim()) return;

    const fd = new FormData();
    fd.set("projectId", project.id);
    fd.set("projectSlug", project.slug);
    fd.set("issueNumber", String(selectedTaskForClaim.number || 0));
    fd.set("taskId", selectedTaskForClaim.id || "");
    fd.set("source", selectedTaskForClaim.source || "github");
    fd.set("issueTitle", selectedTaskForClaim.title);
    fd.set("pitch", claimPitch);

    startClaimTransition(async () => {
      const res = await claimTaskAction(null, fd);
      if (res?.error) {
        setClaimStatusMsg({ error: res.error });
      } else {
        setClaimStatusMsg({ success: true });
        setTimeout(() => {
          setSelectedTaskForClaim(null);
          setClaimPitch("");
          setClaimStatusMsg(null);
        }, 1800);
      }
    });
  }

  // Team apply handler
  function handleTeamApplySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRoleForApply || !teamExperience.trim()) return;

    const fd = new FormData();
    fd.set("projectId", project.id);
    fd.set("projectSlug", project.slug);
    fd.set("role", selectedRoleForApply.role);
    fd.set("experience", teamExperience);
    fd.set("contacts", teamContacts);

    startTeamTransition(async () => {
      const res = await applyToTeamAction(null, fd);
      if (res?.error) {
        setTeamStatusMsg({ error: res.error });
      } else {
        setTeamStatusMsg({ success: true });
        setTimeout(() => {
          setSelectedRoleForApply(null);
          setTeamExperience("");
          setTeamContacts("");
          setTeamStatusMsg(null);
        }, 1800);
      }
    });
  }

  // Open discussion thread
  async function openDiscussion(claim: TaskClaim) {
    setActiveDiscussionClaim(claim);
    setIsLoadingMessages(true);
    try {
      const msgs = await getTaskMessagesAction(claim.id);
      setDiscussionMessages(msgs);
    } catch {
      setDiscussionMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!activeDiscussionClaim || !newMessageText.trim()) return;

    setIsSendingMessage(true);
    await sendTaskMessageAction(activeDiscussionClaim.id, project.slug, newMessageText);
    const updated = await getTaskMessagesAction(activeDiscussionClaim.id);
    setDiscussionMessages(updated);
    setNewMessageText("");
    setIsSendingMessage(false);
  }

  async function handleCancelClaim() {
    if (!activeDiscussionClaim) return;
    const confirmed = window.confirm(t.projectPage.cancelClaimConfirm);
    if (!confirmed) return;

    setIsCancelingClaim(true);
    try {
      await cancelClaimAction(activeDiscussionClaim.id, project.slug);
      setActiveDiscussionClaim(null);
    } catch (err) {
      console.error("Failed to cancel claim:", err);
    } finally {
      setIsCancelingClaim(false);
    }
  }

  async function handleAttachPr(e: React.FormEvent) {
    e.preventDefault();
    if (!activeDiscussionClaim || !newPrUrl.trim()) return;
    await updateClaimStatusAction(activeDiscussionClaim.id, project.slug, "assigned", newPrUrl.trim());
    setActiveDiscussionClaim({ ...activeDiscussionClaim, pr_url: newPrUrl.trim() });
    setNewPrUrl("");
  }

  return (
    <section className="rounded-2xl border border-[#2e3444] bg-[#0c0e14] overflow-hidden shadow-xl space-y-0">
      {/* 1. Header Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-[#151923] via-[#0f121a] to-[#0c0e14] border-b border-[#1d212b] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#e5484d]/10 border border-[#e5484d]/30 flex items-center justify-center text-[#e5484d] shrink-0 shadow-inner">
            <Zap className="w-5 h-5 fill-[#e5484d]/20 text-[#e5484d]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white tracking-tight">
                {t.projectPage.centerContribution}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#3fb950]/10 border border-[#3fb950]/30 text-[#3fb950] text-[11px] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse"></span>
                {t.projectPage.allOnSite}
              </span>
            </div>
            <p className="text-xs text-[#8a92a3] mt-1 max-w-xl">
              {t.projectPage.centerDesc}
            </p>
          </div>
        </div>

        {/* Mode switcher tabs */}
        <div className="flex items-center bg-[#151821] p-1 rounded-xl border border-[#1d212b] self-start md:self-auto">
          {activeModes.includes("tasks") && (
            <button
              onClick={() => setActiveTab("tasks")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "tasks"
                  ? "bg-[#e5484d] text-white shadow-sm"
                  : "text-[#8a92a3] hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.projectPage.tasksTab} ({tasksList.length})</span>
            </button>
          )}

          {activeModes.includes("team") && (
            <button
              onClick={() => setActiveTab("team")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "team"
                  ? "bg-[#38bdf8] text-black shadow-sm"
                  : "text-[#8a92a3] hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{t.projectPage.teamTab} ({teamRoles.length})</span>
            </button>
          )}

          {activeModes.includes("onboarding") && (
            <button
              onClick={() => setActiveTab("onboarding")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "onboarding"
                  ? "bg-[#3fb950] text-black shadow-sm"
                  : "text-[#8a92a3] hover:text-white"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{t.projectPage.onboardingTab}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. TAB 1: Tasks (Claims & Live Coordination) */}
      {activeTab === "tasks" && (
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">
                {t.projectPage.availableTasks}
              </span>
              <span className="text-[11px] font-mono text-[#8a92a3]">
                ({filteredTasks.length})
              </span>
            </div>

            {/* Filters: Source and Difficulty */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Source filter buttons */}
              <div className="flex items-center bg-[#151821] p-0.5 rounded-lg border border-[#1d212b] text-xs">
                <button
                  onClick={() => setFilterSource("all")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterSource === "all"
                      ? "bg-white/10 text-white font-medium"
                      : "text-[#8a92a3] hover:text-white"
                  }`}
                >
                  {t.projectPage.allSources} ({tasksList.length})
                </button>
                <button
                  onClick={() => setFilterSource("manual")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterSource === "manual"
                      ? "bg-[#e5484d]/20 text-[#e5484d] font-medium"
                      : "text-[#8a92a3] hover:text-white"
                  }`}
                >
                  {t.projectPage.manualTasks} ({manualItems.length})
                </button>
                <button
                  onClick={() => setFilterSource("github")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterSource === "github"
                      ? "bg-[#38bdf8]/20 text-[#38bdf8] font-medium"
                      : "text-[#8a92a3] hover:text-white"
                  }`}
                >
                  GitHub Issues ({issueItems.length})
                </button>
              </div>

              {/* Difficulty filter buttons */}
              <div className="flex items-center bg-[#151821] p-0.5 rounded-lg border border-[#1d212b] text-xs">
                <button
                  onClick={() => setFilterDifficulty("all")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterDifficulty === "all"
                      ? "bg-white/10 text-white font-medium"
                      : "text-[#8a92a3] hover:text-white"
                  }`}
                >
                  {t.projectPage.allDifficulties}
                </button>
                <button
                  onClick={() => setFilterDifficulty("easy")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterDifficulty === "easy"
                      ? "bg-[#3fb950]/20 text-[#3fb950] font-medium"
                      : "text-[#8a92a3] hover:text-white"
                  }`}
                >
                  {t.projectPage.easy}
                </button>
                <button
                  onClick={() => setFilterDifficulty("medium")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterDifficulty === "medium"
                      ? "bg-[#d29922]/20 text-[#d29922] font-medium"
                      : "text-[#8a92a3] hover:text-white"
                  }`}
                >
                  {t.projectPage.medium}
                </button>
                <button
                  onClick={() => setFilterDifficulty("hard")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterDifficulty === "hard"
                      ? "bg-[#e5484d]/20 text-[#e5484d] font-medium"
                      : "text-[#8a92a3] hover:text-white"
                  }`}
                >
                  {t.projectPage.hard}
                </button>
              </div>
            </div>
          </div>

          {filteredTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredTasks.map((task) => {
                const claim = claims.find((c) => {
                  if (task.isManual) {
                    if (task.id && c.task_id === task.id) return true;
                    if (task.number && c.issue_number === task.number) return true;
                    return false;
                  }
                  return c.issue_number === task.number && c.source !== "manual";
                });
                const isClaimedByMe =
                  Boolean(currentUserLogin && claim && claim.user_login.toLowerCase() === currentUserLogin.toLowerCase());

                const badge = {
                  easy: { label: t.projectPage.easy, color: "text-[#3fb950] bg-[#3fb950]/10 border-[#3fb950]/20" },
                  medium: { label: t.projectPage.medium, color: "text-[#d29922] bg-[#d29922]/10 border-[#d29922]/20" },
                  hard: { label: t.projectPage.hard, color: "text-[#e5484d] bg-[#e5484d]/10 border-[#e5484d]/20" },
                }[task.difficulty];

                return (
                  <div
                    key={task.id || `${task.source}_${task.number}`}
                    className="rounded-xl border border-[#1d212b] bg-[#12151d] p-4 flex flex-col justify-between hover:border-[#2e3444] transition-all"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-[#181d28] border border-white/5 text-[10px] font-mono text-[#8a92a3]">
                            {task.isManual ? t.projectPage.taskProject : t.projectPage.githubIssue}
                          </span>
                        </div>

                        {/* Claim Status Badge */}
                        {claim ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                claim.status === "assigned"
                                  ? "bg-[#d29922]/20 text-[#d29922] border border-[#d29922]/30"
                                  : claim.status === "completed"
                                  ? "bg-[#3fb950]/20 text-[#3fb950] border border-[#3fb950]/30"
                                  : "bg-white/10 text-white border border-white/20"
                              }`}
                            >
                              {claim.status === "assigned"
                                ? t.projectPage.statusAssigned.replace("{login}", claim.user_login)
                                : claim.status === "completed"
                                ? t.projectPage.statusCompleted
                                : t.projectPage.statusPending.replace("{login}", claim.user_login)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#3fb950] font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{t.projectPage.statusAvailable}</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-semibold text-white leading-snug">
                        #{task.number} {task.title}
                      </h4>

                      <p className="text-xs text-[#8a92a3] line-clamp-3 leading-relaxed">
                        {task.description}
                      </p>

                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {task.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded bg-[#181d28] border border-white/5 text-[10px] font-mono text-[#8a92a3]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 mt-3 border-t border-[#1d212b] flex items-center justify-between">
                      {claim ? (
                        <button
                          type="button"
                          onClick={() => openDiscussion(claim)}
                          className="px-3 py-1.5 rounded-lg border border-[#2e3444] bg-[#151821] hover:border-white/30 text-white font-medium text-xs transition-colors flex items-center gap-1.5 w-full justify-center"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[#38bdf8]" />
                          <span>{t.projectPage.taskDiscussion}</span>
                          {claim.messages_count ? (
                            <span className="px-1.5 py-0.2 rounded-full bg-white/10 font-mono text-[10px]">
                              {claim.messages_count}
                            </span>
                          ) : null}
                          {isClaimedByMe && (
                            <span className="ml-1 text-[10px] text-[#3fb950] font-semibold">
                              {t.projectPage.youAreAssignee}
                            </span>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedTaskForClaim(task)}
                          className="px-3 py-1.5 rounded-lg bg-[#e5484d] hover:bg-[#cc3e43] text-white font-semibold text-xs transition-colors shadow-sm w-full border border-[#e5484d]/40"
                        >
                          {t.projectPage.takeTaskAction}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-[#1d212b] rounded-xl text-[#8a92a3] text-xs">
              {t.projectPage.noFilteredTasks}
            </div>
          )}
        </div>
      )}

      {/* 3. TAB 2: Team (Roles & Applications) */}
      {activeTab === "team" && (
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">
                {t.projectPage.teamOpeningsTitle}
              </h3>
              <p className="text-xs text-[#8a92a3] mt-0.5">
                {t.projectPage.teamOpeningsDesc}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {teamRoles.map((roleItem, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#1d212b] bg-[#12151d] p-4 flex flex-col justify-between hover:border-[#38bdf8]/40 transition-all group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-white group-hover:text-[#38bdf8] transition-colors">
                      {roleItem.role}
                    </span>
                    {roleItem.commitment && (
                      <span className="px-2 py-0.5 rounded-md bg-[#38bdf8]/10 border border-[#38bdf8]/20 text-[11px] font-mono text-[#38bdf8]">
                        {roleItem.commitment}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#8a92a3] leading-relaxed">
                    {roleItem.description || t.projectPage.defaultRoleDesc}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-[#1d212b]">
                  <button
                    type="button"
                    onClick={() => setSelectedRoleForApply(roleItem)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#38bdf8] hover:bg-[#0284c7] text-black font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{t.projectPage.applyToTeamBtn}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB 3: Onboarding (1-liner, Map, .env) */}
      {activeTab === "onboarding" && (
        <div className="p-5 sm:p-6 space-y-5">
          {/* 1-liner command */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white font-semibold flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-[#3fb950]" />
                <span>{t.projectPage.quickstartSetup}</span>
              </span>
              <span className="text-[11px] font-mono text-[#8a92a3]">
                Bash / Terminal
              </span>
            </div>

            <div className="relative group">
              <pre className="p-3.5 pr-24 rounded-xl bg-[#050608] border border-[#1d212b] font-mono text-xs text-[#38bdf8] overflow-x-auto whitespace-pre selection:bg-[#38bdf8]/30">
                <code>{quickstart}</code>
              </pre>
              <button
                onClick={handleCopyQuickstart}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-[#151923] hover:bg-[#1f2433] border border-[#2e3444] text-xs font-medium text-white transition-all flex items-center gap-1.5 shadow-sm"
              >
                {copiedQuickstart ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#3fb950]" />
                    <span className="text-[#3fb950]">{t.projectPage.copied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#8a92a3]" />
                    <span>{t.projectPage.copy}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Architecture Map */}
          {archItems.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-[#1d212b]">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#e5484d]" />
                <span className="text-xs font-semibold text-white">
                  {t.projectPage.archMapTitle}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {archItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[#12151d] border border-[#1d212b] flex items-start gap-2.5"
                  >
                    <FileCode className="w-3.5 h-3.5 text-[#e5484d] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="font-mono text-xs text-white block truncate">
                        {item.path}
                      </span>
                      <p className="text-[11px] text-[#8a92a3] mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* .env.example */}
          {project.env_example && (
            <div className="space-y-2 pt-2 border-t border-[#1d212b]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white font-semibold flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#38bdf8]" />
                  <span>{t.projectPage.envExampleTitle}</span>
                </span>
                <button
                  onClick={handleCopyEnv}
                  className="text-[11px] text-[#8a92a3] hover:text-white flex items-center gap-1"
                >
                  {copiedEnv ? (
                    <span className="text-[#3fb950] font-medium">{t.projectPage.copied}</span>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>{t.projectPage.copyEnvBtn}</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-3 rounded-xl bg-[#050608] border border-[#1d212b] font-mono text-xs text-[#a1a7b5] overflow-x-auto whitespace-pre">
                <code>{project.env_example}</code>
              </pre>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Claim Task */}
      {selectedTaskForClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-[#2e3444] bg-[#0f121a] p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedTaskForClaim(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-[#8a92a3] hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#e5484d] block">
                {t.projectPage.claimModalTitle}
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                #{selectedTaskForClaim.number} {selectedTaskForClaim.title}
              </h3>
            </div>

            {!currentUserLogin ? (
              <div className="p-4 rounded-xl bg-[#151821] border border-[#1d212b] space-y-3 text-center">
                <p className="text-xs text-[#8a92a3]">
                  {t.projectPage.loginToClaim}
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#161a23] hover:bg-[#1f2432] text-white border border-[#2e3444] hover:border-white/20 font-semibold text-xs transition-colors"
                >
                  {t.projectPage.signInGithub}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs text-[#8a92a3] block mb-1.5">
                    {t.projectPage.pitchLabel}
                  </label>
                  <textarea
                    rows={4}
                    value={claimPitch}
                    onChange={(e) => setClaimPitch(e.target.value)}
                    placeholder={t.projectPage.pitchPlaceholder}
                    className="w-full rounded-xl bg-[#090b10] border border-[#1d212b] p-3 text-xs text-white focus:outline-none focus:border-[#e5484d] resize-y"
                    required
                  />
                </div>

                {claimStatusMsg?.error && (
                  <div className="text-xs text-[#e5484d] p-3 rounded-lg bg-[#e5484d]/10 border border-[#e5484d]/20">
                    {claimStatusMsg.error}
                  </div>
                )}

                {claimStatusMsg?.success && (
                  <div className="text-xs text-[#3fb950] p-3 rounded-lg bg-[#3fb950]/10 border border-[#3fb950]/20 font-medium">
                    {t.projectPage.pitchSuccess}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedTaskForClaim(null)}
                    className="px-3 py-1.5 rounded-lg border border-[#1d212b] text-[#8a92a3] hover:text-white text-xs"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isPendingClaim || !claimPitch.trim()}
                    className="px-4 py-2 rounded-lg bg-[#e5484d] hover:bg-[#cc3e43] text-white font-semibold text-xs transition-colors disabled:opacity-50"
                  >
                    {isPendingClaim ? t.projectPage.sending : t.projectPage.sendClaimBtn}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Team Application */}
      {selectedRoleForApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-[#2e3444] bg-[#0f121a] p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedRoleForApply(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-[#8a92a3] hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#38bdf8] block">
                {t.projectPage.teamApplyTitle}
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                {selectedRoleForApply.role}
              </h3>
            </div>

            {!currentUserLogin ? (
              <div className="p-4 rounded-xl bg-[#151821] border border-[#1d212b] space-y-3 text-center">
                <p className="text-xs text-[#8a92a3]">
                  {t.projectPage.loginToApplyTeam}
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#161a23] hover:bg-[#1f2432] text-white border border-[#2e3444] hover:border-white/20 font-semibold text-xs transition-colors"
                >
                  {t.projectPage.signInGithub}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleTeamApplySubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs text-[#8a92a3] block mb-1.5">
                    {t.projectPage.experienceLabel}
                  </label>
                  <textarea
                    rows={4}
                    value={teamExperience}
                    onChange={(e) => setTeamExperience(e.target.value)}
                    placeholder={t.projectPage.experiencePlaceholder}
                    className="w-full rounded-xl bg-[#090b10] border border-[#1d212b] p-3 text-xs text-white focus:outline-none focus:border-[#38bdf8] resize-y"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-[#8a92a3] block mb-1.5">
                    {t.projectPage.contactsLabel}
                  </label>
                  <input
                    type="text"
                    value={teamContacts}
                    onChange={(e) => setTeamContacts(e.target.value)}
                    placeholder={t.projectPage.contactsPlaceholder}
                    className="w-full rounded-lg bg-[#090b10] border border-[#1d212b] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#38bdf8]"
                  />
                </div>

                {teamStatusMsg?.error && (
                  <div className="text-xs text-[#e5484d] p-3 rounded-lg bg-[#e5484d]/10 border border-[#e5484d]/20">
                    {teamStatusMsg.error}
                  </div>
                )}

                {teamStatusMsg?.success && (
                  <div className="text-xs text-[#3fb950] p-3 rounded-lg bg-[#3fb950]/10 border border-[#3fb950]/20 font-medium">
                    {t.projectPage.teamApplySuccess}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedRoleForApply(null)}
                    className="px-3 py-1.5 rounded-lg border border-[#1d212b] text-[#8a92a3] hover:text-white text-xs"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isPendingTeam || !teamExperience.trim()}
                    className="px-4 py-2 rounded-lg bg-[#38bdf8] hover:bg-[#0284c7] text-black font-semibold text-xs transition-colors disabled:opacity-50"
                  >
                    {isPendingTeam ? t.projectPage.sending : t.projectPage.sendTeamApplyBtn}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: Live Discussion Drawer for Task */}
      {activeDiscussionClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-2xl border border-[#2e3444] bg-[#0f121a] p-6 space-y-4 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setActiveDiscussionClaim(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-[#8a92a3] hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#38bdf8] block">
                  {t.projectPage.threadTitle} #{activeDiscussionClaim.issue_number}
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {activeDiscussionClaim.issue_title}
                </h3>
              </div>
              {currentUserLogin?.toLowerCase() === activeDiscussionClaim.user_login.toLowerCase() && (
                <button
                  type="button"
                  disabled={isCancelingClaim}
                  onClick={handleCancelClaim}
                  className="px-2.5 py-1 rounded-lg border border-[#e5484d]/30 bg-[#e5484d]/10 hover:bg-[#e5484d]/20 text-[#e5484d] text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  title={t.projectPage.cancelClaimHint}
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>{isCancelingClaim ? t.projectPage.canceling : t.projectPage.cancelClaimBtn}</span>
                </button>
              )}
            </div>

            {/* Initial pitch from contributor */}
            <div className="p-3 rounded-xl bg-[#090b10] border border-[#1d212b] text-xs space-y-1">
              <div className="flex items-center justify-between text-[#8a92a3] text-[11px]">
                <span className="font-semibold text-white">
                  {t.projectPage.claimAuthorPitch.replace("{login}", activeDiscussionClaim.user_login)}
                </span>
                <span className="font-mono">
                  {new Date(activeDiscussionClaim.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-[#d1d5db] leading-relaxed">
                {activeDiscussionClaim.pitch}
              </p>
            </div>

            {/* PR link section if assigned */}
            {activeDiscussionClaim.pr_url ? (
              <div className="p-3 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/20 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <GitPullRequest className="w-4 h-4 text-[#38bdf8]" />
                  <span className="text-white font-medium">{t.projectPage.attachedPr}</span>
                </div>
                <a
                  href={activeDiscussionClaim.pr_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#38bdf8] hover:underline font-mono text-[11px] flex items-center gap-1"
                >
                  <span>{t.projectPage.openPr}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : currentUserLogin?.toLowerCase() === activeDiscussionClaim.user_login.toLowerCase() ? (
              <form onSubmit={handleAttachPr} className="flex gap-2">
                <input
                  type="url"
                  value={newPrUrl}
                  onChange={(e) => setNewPrUrl(e.target.value)}
                  placeholder={t.projectPage.attachPrPlaceholder}
                  className="flex-1 rounded-lg bg-[#090b10] border border-[#1d212b] px-3 py-1.5 text-xs text-white"
                  required
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-[#38bdf8] text-black font-semibold text-xs whitespace-nowrap"
                >
                  {t.projectPage.attachPrBtn}
                </button>
              </form>
            ) : null}

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-2.5 p-3 rounded-xl bg-[#090b10] border border-[#1d212b] min-h-[140px] max-h-[260px]">
              {isLoadingMessages ? (
                <div className="text-center py-6 text-xs text-[#8a92a3]">
                  {t.projectPage.loadingMessages}
                </div>
              ) : discussionMessages.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#8a92a3]">
                  {t.projectPage.noMessages}
                </div>
              ) : (
                discussionMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-2.5 rounded-lg text-xs space-y-1 ${
                      msg.is_author
                        ? "bg-[#151923] border border-[#e5484d]/30 ml-4"
                        : "bg-[#11131a] border border-white/5 mr-4"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-[#8a92a3]">
                      <span className="font-semibold text-white flex items-center gap-1">
                        @{msg.sender_login}
                        {msg.is_author && (
                          <span className="px-1 py-0.2 rounded bg-[#e5484d]/20 text-[#e5484d] text-[9px] font-bold">
                            {t.projectPage.maintainerBadge}
                          </span>
                        )}
                      </span>
                      <span>
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-[#d1d5db] leading-relaxed">{msg.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Send message box */}
            {currentUserLogin ? (
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder={t.projectPage.writeMessagePlaceholder}
                  className="flex-1 rounded-lg bg-[#090b10] border border-[#1d212b] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#38bdf8]"
                  required
                />
                <button
                  type="submit"
                  disabled={isSendingMessage || !newMessageText.trim()}
                  className="px-4 py-2 rounded-lg bg-[#161a23] hover:bg-[#1f2432] text-white border border-[#2e3444] hover:border-[#38bdf8]/50 font-semibold text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>{t.projectPage.sendBtn}</span>
                </button>
              </form>
            ) : (
              <div className="text-center text-xs text-[#8a92a3] pt-1">
                <Link href="/login" className="text-white hover:underline">
                  {t.projectPage.signInGithub}
                </Link>
                {t.projectPage.loginToChat}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
