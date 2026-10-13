"use client";

import { useState, useMemo, useEffect } from "react";
import { ContributorTask, GitHubIssue } from "@/lib/types";
import { TaskClaim, TaskMessage } from "@/lib/claims";
import { TaskSourceFilter, TaskStatusFilter } from "./types";
import { useLanguage } from "@/lib/i18n/context";
import {
  Search,
  Filter,
  Plus,
  GitPullRequest,
  CheckCircle2,
  Clock,
  User,
  MessageSquare,
  Lock,
  Edit2,
  Save,
  X,
  ExternalLink,
  ChevronRight,
  Send,
  AlertCircle,
  Tag,
  UserCheck,
  UserMinus,
} from "lucide-react";

interface UnifiedTaskItem {
  id: string;
  source: "github" | "manual";
  number?: number;
  title: string;
  description: string;
  tags: string[];
  difficulty?: "easy" | "medium" | "hard";
  status: "open" | "in_progress" | "review" | "completed";
  assignee?: {
    login: string;
    avatar?: string | null;
  } | null;
  prUrl?: string | null;
  rawGithub?: GitHubIssue;
  rawTask?: ContributorTask;
}

interface CrmTasksProps {
  tasks: ContributorTask[];
  githubIssues: GitHubIssue[];
  claims: TaskClaim[];
  selectedTaskParam?: number | string | null;
  onUpdateTaskDescription: (taskId: string, newDesc: string) => Promise<void>;
  onAssignCandidate: (claimId: string, prUrl?: string) => Promise<void>;
  onRejectCandidate: (claimId: string) => Promise<void>;
  onUnassignTask: (claimId: string) => Promise<void>;
  onCompleteTask: (claimId: string) => Promise<void>;
  onSaveClaimNotes: (claimId: string, notes: string) => Promise<void>;
  onSendTaskMessage: (claimId: string, text: string) => Promise<void>;
  onLoadTaskMessages: (claimId: string) => Promise<TaskMessage[]>;
  onAddNewTask: (newTask: ContributorTask) => Promise<void>;
}

export function CrmTasks({
  tasks,
  githubIssues,
  claims,
  selectedTaskParam,
  onUpdateTaskDescription,
  onAssignCandidate,
  onRejectCandidate,
  onUnassignTask,
  onCompleteTask,
  onSaveClaimNotes,
  onSendTaskMessage,
  onLoadTaskMessages,
  onAddNewTask,
}: CrmTasksProps) {
  const { t } = useLanguage();
  // Filters State
  const [sourceFilter, setSourceFilter] = useState<TaskSourceFilter>("all");
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Split-View Selection
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    selectedTaskParam ? String(selectedTaskParam) : null
  );

  // Selected Candidate Claim ID for Chat and Notes
  const [selectedCandidateClaimId, setSelectedCandidateClaimId] = useState<string | null>(null);

  // Inline Description Edit State
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editedDesc, setEditedDesc] = useState("");

  // Private Note State
  const [privateNoteText, setPrivateNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Task Chat State
  const [chatMessages, setChatMessages] = useState<TaskMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Add Task Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newDifficulty, setNewDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  // Merge GitHub issues and local tasks into unified list
  const unifiedTasks: UnifiedTaskItem[] = useMemo(() => {
    const list: UnifiedTaskItem[] = [];

    // 1. Add GitHub issues
    for (const issue of githubIssues) {
      const issueClaims = claims.filter((c) => c.issue_number === issue.number);
      const assignedClaim = issueClaims.find((c) => c.status === "assigned");
      const completedClaim = issueClaims.find((c) => c.status === "completed");

      let status: "open" | "in_progress" | "review" | "completed" = "open";
      if (completedClaim || issue.state === "closed") {
        status = "completed";
      } else if (assignedClaim) {
        status = assignedClaim.pr_url ? "review" : "in_progress";
      }

      list.push({
        id: `gh_${issue.number}`,
        source: "github",
        number: issue.number,
        title: issue.title,
        description: issue.body || "Описание issue в GitHub отсутствует.",
        tags: issue.labels.map((l) => l.name),
        status,
        assignee: assignedClaim
          ? { login: assignedClaim.user_login, avatar: assignedClaim.user_avatar }
          : issue.user
          ? null
          : null,
        prUrl: assignedClaim?.pr_url || null,
        rawGithub: issue,
      });
    }

    // 2. Add local manual tasks
    for (const t of tasks) {
      // Find matching claims strictly by task_id or positive issue_number
      const taskClaims = claims.filter((c) => {
        if (c.source === "manual" || c.task_id) {
          if (t.id && c.task_id === t.id) return true;
          if (t.issue_number && c.issue_number === t.issue_number) return true;
          return false;
        }
        return false;
      });
      const assignedClaim = taskClaims.find((c) => c.status === "assigned");
      const completedClaim = taskClaims.find((c) => c.status === "completed");

      let status: "open" | "in_progress" | "review" | "completed" = "open";
      if (t.status === "completed" || t.status === "closed" || completedClaim) {
        status = "completed";
      } else if (assignedClaim || t.status === "in_progress") {
        status = assignedClaim?.pr_url ? "review" : "in_progress";
      }

      list.push({
        id: t.id,
        source: "manual",
        number: t.issue_number,
        title: t.title,
        description: t.description,
        tags: t.tags || [],
        difficulty: t.difficulty,
        status,
        assignee: assignedClaim
          ? { login: assignedClaim.user_login, avatar: assignedClaim.user_avatar }
          : t.assignee || null,
        prUrl: assignedClaim?.pr_url || null,
        rawTask: t,
      });
    }

    return list;
  }, [tasks, githubIssues, claims]);

  // Filtered List
  const filteredTasks = useMemo(() => {
    return unifiedTasks.filter((item) => {
      // Source filter
      if (sourceFilter === "github" && item.source !== "github") return false;
      if (sourceFilter === "manual" && item.source !== "manual") return false;

      // Status filter
      if (statusFilter !== "all" && item.status !== statusFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchNum = item.number?.toString().includes(q);
        const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchNum && !matchTags) return false;
      }

      return true;
    });
  }, [unifiedTasks, sourceFilter, statusFilter, searchQuery]);

  // Currently Selected Task
  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return (
      unifiedTasks.find(
        (t) =>
          t.id === selectedItemId ||
          (t.number && t.number.toString() === selectedItemId)
      ) || null
    );
  }, [unifiedTasks, selectedItemId]);

  // Claims (candidates) for currently selected task
  const taskCandidates = useMemo(() => {
    if (!selectedItem) return [];
    return claims.filter((c) => {
      if (selectedItem.source === "manual") {
        if (selectedItem.id && c.task_id === selectedItem.id) return true;
        if (selectedItem.number && c.issue_number === selectedItem.number) return true;
        return false;
      }
      if (selectedItem.source === "github") {
        if (selectedItem.number && c.issue_number === selectedItem.number && c.source !== "manual") return true;
        return false;
      }
      return false;
    });
  }, [claims, selectedItem]);

  const activeClaim = useMemo(() => {
    if (!taskCandidates.length) return null;
    if (selectedCandidateClaimId) {
      const found = taskCandidates.find((c) => c.id === selectedCandidateClaimId);
      if (found) return found;
    }
    return (
      taskCandidates.find((c) => c.status === "assigned") ||
      taskCandidates[0] ||
      null
    );
  }, [taskCandidates, selectedCandidateClaimId]);

  // Sync messages & notes with active candidate claim
  useEffect(() => {
    if (!activeClaim) {
      setPrivateNoteText("");
      setChatMessages([]);
      return;
    }

    setPrivateNoteText(activeClaim.internal_notes || "");
    setIsLoadingChat(true);
    onLoadTaskMessages(activeClaim.id)
      .then((msgs) => setChatMessages(msgs))
      .catch(() => setChatMessages([]))
      .finally(() => setIsLoadingChat(false));
  }, [activeClaim?.id]);

  // Handle Selection
  const handleSelectItem = (item: UnifiedTaskItem) => {
    setSelectedItemId(item.id);
    setIsEditingDesc(false);
    setEditedDesc(item.description);
    setSelectedCandidateClaimId(null);
  };

  // Handle Save Description (only for manual tasks)
  const handleSaveDescription = async () => {
    if (!selectedItem || selectedItem.source !== "manual") return;
    await onUpdateTaskDescription(selectedItem.id, editedDesc);
    setIsEditingDesc(false);
  };

  // Handle Save Note
  const handleSaveNote = async () => {
    if (!activeClaim) return;
    setIsSavingNote(true);
    try {
      await onSaveClaimNotes(activeClaim.id, privateNoteText);
    } finally {
      setIsSavingNote(false);
    }
  };

  // Handle Send Chat
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClaim || !newMessageText.trim()) return;

    setIsSendingChat(true);
    try {
      await onSendTaskMessage(activeClaim.id, newMessageText.trim());
      setNewMessageText("");
      const updated = await onLoadTaskMessages(activeClaim.id);
      setChatMessages(updated);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Handle Create Local Task with Stable Non-Colliding Numbering
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const maxNumber = Math.max(
      0,
      ...tasks.map((t) => t.issue_number || 0),
      ...githubIssues.map((g) => g.number)
    );

    const newTask: ContributorTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      issue_number: maxNumber + 1,
      source: "manual",
      title: newTitle.trim(),
      description: newDesc.trim() || "Описание задачи.",
      difficulty: newDifficulty,
      tags: newTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      status: "open",
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    await onAddNewTask(newTask);
    setIsAddModalOpen(false);
    setNewTitle("");
    setNewDesc("");
    setNewTags("");
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#161b22] p-3 rounded-2xl border border-[#21262d]">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Source Filter */}
          <div className="flex items-center p-1 rounded-xl bg-[#0d1117] border border-[#30363d]">
            <button
              type="button"
              onClick={() => setSourceFilter("all")}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                sourceFilter === "all"
                  ? "bg-[#21262d] text-white font-semibold"
                  : "text-[#8b949e] hover:text-white"
              }`}
            >
              {t.crm.tasks.allSources}
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter("github")}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                sourceFilter === "github"
                  ? "bg-[#21262d] text-white font-semibold"
                  : "text-[#8b949e] hover:text-white"
              }`}
            >
              {t.crm.tasks.githubSources} ({githubIssues.length})
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter("manual")}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                sourceFilter === "manual"
                  ? "bg-[#21262d] text-white font-semibold"
                  : "text-[#8b949e] hover:text-white"
              }`}
            >
              {t.crm.tasks.manualSources} ({tasks.length})
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-white text-xs focus:outline-none"
          >
            <option value="all">{t.crm.tasks.statusAny}</option>
            <option value="open">{t.crm.tasks.filterOpen}</option>
            <option value="in_progress">{t.crm.tasks.filterInProgress}</option>
            <option value="review">{t.crm.tasks.statusReview}</option>
            <option value="completed">{t.crm.tasks.filterCompleted}</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-[#8b949e] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.crm.tasks.searchPlaceholder}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-[#8b949e] focus:outline-none"
            />
          </div>

          {/* Add Task Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#e5484d] hover:bg-[#f2555a] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.crm.tasks.btnNewTask}</span>
          </button>
        </div>
      </div>

      {/* Split-View Container */}
      <div className="flex flex-col lg:flex-row gap-4 items-start min-h-[600px]">
        {/* Left Side: Tasks List */}
        <div
          className={`w-full transition-all duration-200 ${
            selectedItem ? "lg:flex-1" : "lg:w-full"
          } space-y-2.5`}
        >
          {filteredTasks.length === 0 ? (
            <div className="p-12 rounded-2xl border border-[#21262d] bg-[#161b22] text-center space-y-3">
              <div className="text-xs text-[#8b949e]">{t.crm.tasks.noTasksFound}</div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-semibold inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{t.crm.tasks.createFirstTask}</span>
              </button>
            </div>
          ) : (
            filteredTasks.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              const matchingClaims = claims.filter((c) => {
                if (item.number && c.issue_number === item.number) return true;
                return (c.issue_title || "").toLowerCase() === (item.title || "").toLowerCase();
              });
              const candidatesCount = matchingClaims.length;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#e5484d] bg-[#e5484d]/5 shadow-sm"
                      : "border-[#21262d] bg-[#161b22] hover:border-[#38404d]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap text-[11px]">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                            item.source === "github"
                              ? "bg-[#21262d] text-[#8b949e]"
                              : "bg-[#e5484d]/15 text-[#e5484d]"
                          }`}
                        >
                          {item.source === "github"
                            ? `#${item.number || "GH"}`
                            : t.crm.tasks.manualSources}
                        </span>

                        {item.status === "open" && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#238636]/15 text-[#3fb950] font-medium">
                            {t.crm.tasks.filterOpen.toLowerCase()}
                          </span>
                        )}
                        {item.status === "in_progress" && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#d29922]/15 text-[#d29922] font-medium">
                            {t.crm.tasks.filterInProgress.toLowerCase()}
                          </span>
                        )}
                        {item.status === "review" && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#38bdf8]/15 text-[#38bdf8] font-bold">
                            {t.crm.tasks.statusReview}
                          </span>
                        )}
                        {item.status === "completed" && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#8b949e]/15 text-[#8b949e] font-medium">
                            {t.crm.tasks.filterCompleted.toLowerCase()}
                          </span>
                        )}

                        {item.difficulty && (
                          <span className="text-[#8b949e] text-[10px]">
                            {item.difficulty === "easy"
                              ? t.crm.tasks.difficultyEasy
                              : item.difficulty === "hard"
                              ? t.crm.tasks.difficultyHard
                              : t.crm.tasks.difficultyMedium}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-white tracking-tight leading-snug">
                        {item.title}
                      </h3>

                      <p className="text-xs text-[#8b949e] line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isSelected ? "text-[#e5484d] translate-x-1" : "text-[#8b949e]"
                      }`}
                    />
                  </div>

                  {/* Footer Strip */}
                  <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-[#21262d] text-xs text-[#8b949e]">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.assignee ? (
                        <div className="flex items-center gap-1.5 text-white">
                          <User className="w-3.5 h-3.5 text-[#3fb950]" />
                          <span>@{item.assignee.login}</span>
                        </div>
                      ) : (
                        <span>{t.crm.tasks.noAssignee}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {candidatesCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#e5484d]/15 text-[#e5484d] font-mono text-[11px] font-bold">
                          {candidatesCount} {t.crm.tasks.candidatesCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Side: Split-View Task Detail Panel (500–650px) */}
        {selectedItem && (
          <div className="w-full lg:w-[580px] rounded-2xl border border-[#30363d] bg-[#0d1117] p-5 space-y-6 shrink-0 sticky top-20 shadow-2xl">
            {/* Header & Close */}
            <div className="flex items-start justify-between gap-3 border-b border-[#21262d] pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#8b949e]">
                  <span>{selectedItem.source === "github" ? "GitHub Issue" : t.crm.tasks.manualSources}</span>
                  {selectedItem.number && <span>#{selectedItem.number}</span>}
                </div>
                <h2 className="text-base font-bold text-white mt-1 leading-snug">
                  {selectedItem.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemId(null)}
                className="p-1 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
                title={t.common.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description with Quick Inline Edit for Manual Tasks */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-[#8b949e] font-semibold">
                  {t.crm.tasks.taskDescRequirements}
                </span>
                {selectedItem.source === "github" ? (
                  <a
                    href={selectedItem.rawGithub?.html_url || `https://github.com`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#58a6ff] hover:underline flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>{t.crm.tasks.openGithubIssue} ↗</span>
                  </a>
                ) : !isEditingDesc ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingDesc(true);
                      setEditedDesc(selectedItem.description);
                    }}
                    className="text-xs text-[#8b949e] hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>{t.common.edit}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingDesc(false)}
                      className="text-xs text-[#8b949e] hover:text-white transition-colors"
                    >
                      {t.common.cancel}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveDescription}
                      className="text-xs text-[#3fb950] font-semibold flex items-center gap-1 hover:underline"
                    >
                      <Save className="w-3 h-3" />
                      <span>{t.common.save}</span>
                    </button>
                  </div>
                )}
              </div>

              {isEditingDesc && selectedItem.source === "manual" ? (
                <textarea
                  value={editedDesc}
                  onChange={(e) => setEditedDesc(e.target.value)}
                  rows={6}
                  className="w-full p-3 rounded-xl border border-[#30363d] bg-[#161b22] text-xs text-white focus:outline-none focus:border-[#e5484d]"
                />
              ) : (
                <div className="p-3 rounded-xl bg-[#161b22] border border-[#21262d] text-xs text-[#d1d5db] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {selectedItem.description}
                </div>
              )}
            </div>

            {/* Current Assignee & Situational Actions */}
            <div className="p-4 rounded-xl border border-[#21262d] bg-[#161b22] space-y-3">
              <span className="text-[11px] font-mono uppercase text-[#8b949e] font-semibold block">
                {t.common.status} & {t.crm.tasks.statusAssigned}
              </span>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {selectedItem.assignee ? (
                    <>
                      {selectedItem.assignee.avatar ? (
                        <img
                          src={selectedItem.assignee.avatar}
                          alt={selectedItem.assignee.login}
                          className="w-8 h-8 rounded-lg border border-white/10 object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-[#21262d] text-white flex items-center justify-center font-bold text-xs">
                          {selectedItem.assignee.login.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-semibold text-white">
                          @{selectedItem.assignee.login}
                        </div>
                        <div className="text-[11px] text-[#3fb950]">{t.crm.tasks.assignedWorking}</div>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-[#8b949e]">{t.crm.tasks.noAssignee}</div>
                  )}
                </div>

                {/* Situational Action Buttons */}
                <div className="flex items-center gap-2">
                  {selectedItem.assignee && (
                    <>
                      {(() => {
                        const assignedClaim = taskCandidates.find((c) => c.status === "assigned");
                        if (!assignedClaim) return null;
                        return selectedItem.status === "review" || assignedClaim.pr_url ? (
                          <button
                            type="button"
                            onClick={() => onCompleteTask(assignedClaim.id)}
                            className="px-3 py-1.5 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{t.crm.tasks.acceptPrClose}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onUnassignTask(assignedClaim.id)}
                            className="px-3 py-1.5 rounded-lg border border-[#30363d] bg-[#0d1117] hover:bg-[#e5484d]/10 text-[#8b949e] hover:text-[#e5484d] text-xs transition-colors flex items-center gap-1.5"
                            title={t.crm.tasks.btnUnassign}
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                            <span>{t.crm.tasks.unassign}</span>
                          </button>
                        );
                      })()}
                    </>
                  )}
                </div>
              </div>

              {selectedItem.prUrl && (
                <div className="p-2.5 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#38bdf8]">
                    <GitPullRequest className="w-4 h-4" />
                    <span className="font-medium">{t.crm.tasks.pullRequestOpen}</span>
                  </div>
                  <a
                    href={selectedItem.prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#38bdf8] hover:underline flex items-center gap-1 text-[11px] font-mono"
                  >
                    <span>{t.crm.tasks.openPr} ↗</span>
                  </a>
                </div>
              )}
            </div>

            {/* Candidates Comparison List */}
            <div className="space-y-3">
              <span className="text-[11px] font-mono uppercase text-[#8b949e] font-semibold flex items-center justify-between">
                <span>{t.crm.tasks.candidatesTitle} ({taskCandidates.length})</span>
                <span className="text-[10px] text-[#8b949e] normal-case">
                  {t.crm.tasks.clickCandidateHint}
                </span>
              </span>

              {taskCandidates.length === 0 ? (
                <div className="p-4 rounded-xl border border-[#21262d] bg-[#161b22] text-xs text-[#8b949e] text-center">
                  {t.crm.tasks.noCandidates}
                </div>
              ) : (
                <div className="space-y-2">
                  {taskCandidates.map((c) => {
                    const isAssigned = c.status === "assigned";
                    const isRejected = c.status === "rejected";
                    const isSelectedForChat = activeClaim?.id === c.id;

                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCandidateClaimId(c.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelectedForChat
                            ? "border-[#e5484d] ring-1 ring-[#e5484d] bg-[#161b22]"
                            : isAssigned
                            ? "border-[#3fb950]/40 bg-[#3fb950]/5 hover:border-[#3fb950]/60"
                            : isRejected
                            ? "border-[#21262d] bg-[#161b22]/40 opacity-60 hover:opacity-80"
                            : "border-[#30363d] bg-[#161b22] hover:border-[#484f58]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            {c.user_avatar ? (
                              <img
                                src={c.user_avatar}
                                alt={c.user_login}
                                className="w-8 h-8 rounded-lg border border-white/10 shrink-0 object-cover mt-0.5"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-[#21262d] border border-white/10 flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5">
                                {c.user_login.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white text-xs">
                                  @{c.user_login}
                                </span>
                                {isAssigned && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#3fb950]/20 text-[#3fb950] font-bold">
                                    {t.crm.tasks.statusAssigned}
                                  </span>
                                )}
                                {isSelectedForChat && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#e5484d]/20 text-[#e5484d] font-bold">
                                    {t.crm.tasks.selectedInChat}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#8b949e] mt-1 leading-relaxed">
                                {c.pitch}
                              </p>
                            </div>
                          </div>

                          <div
                            className="flex items-center gap-1.5 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {!isAssigned && !isRejected && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onRejectCandidate(c.id)}
                                  className="px-2.5 py-1 rounded-lg border border-[#30363d] bg-[#0d1117] hover:bg-[#21262d] text-[#8b949e] hover:text-white text-xs transition-colors"
                                >
                                  {t.crm.tasks.btnReject}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onAssignCandidate(c.id)}
                                  className="px-3 py-1 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold transition-colors flex items-center gap-1"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>{t.crm.tasks.btnAssign}</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Private Maintainer Notes (Only for Maintainer) */}
            {activeClaim && (
              <div className="p-4 rounded-xl border border-[#30363d] bg-[#161b22] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase text-[#e5484d] font-semibold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>{t.crm.tasks.privateNotesOn} @{activeClaim.user_login}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    disabled={isSavingNote}
                    className="text-xs text-[#3fb950] font-semibold hover:underline disabled:opacity-50"
                  >
                    {isSavingNote ? t.common.saving : t.crm.tasks.saveNotes}
                  </button>
                </div>
                <textarea
                  value={privateNoteText}
                  onChange={(e) => setPrivateNoteText(e.target.value)}
                  placeholder={t.crm.tasks.notesPlaceholder}
                  rows={2}
                  className="w-full p-2.5 rounded-lg border border-[#30363d] bg-[#0d1117] text-xs text-white placeholder-[#8b949e] focus:outline-none focus:border-[#e5484d]"
                />
              </div>
            )}

            {/* Task Discussion with Candidate */}
            {activeClaim && (
              <div className="space-y-3 pt-2 border-t border-[#21262d]">
                <span className="text-[11px] font-mono uppercase text-[#8b949e] font-semibold flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{t.crm.tasks.chatWith} @{activeClaim.user_login}</span>
                </span>

                <div className="p-3 rounded-xl bg-[#161b22] border border-[#21262d] max-h-48 overflow-y-auto space-y-2.5">
                  {isLoadingChat ? (
                    <div className="text-xs text-[#8b949e] text-center py-4">
                      {t.common.loading}
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="text-xs text-[#8b949e] text-center py-4">
                      {t.crm.tasks.chatEmpty}
                    </div>
                  ) : (
                    chatMessages.map((m) => {
                      const isMe = m.is_author;
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col text-xs ${
                            isMe ? "items-end" : "items-start"
                          }`}
                        >
                          <span className="text-[10px] text-[#8b949e] mb-0.5">
                            {isMe ? t.crm.tasks.youMaintainer : `@${m.sender_login}`}
                          </span>
                          <div
                            className={`p-2.5 rounded-xl max-w-[85%] leading-relaxed ${
                              isMe
                                ? "bg-[#e5484d] text-white"
                                : "bg-[#21262d] text-white border border-[#30363d]"
                            }`}
                          >
                            {m.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Send Input */}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder={t.crm.tasks.chatPlaceholder}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#161b22] text-white placeholder-[#8b949e] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSendingChat || !newMessageText.trim()}
                    className="p-2 rounded-xl bg-[#e5484d] hover:bg-[#f2555a] text-white disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Add New Task */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#30363d] bg-[#0d1117] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#e5484d]" />
                <span>{t.crm.tasks.createTaskModalTitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-md text-[#8b949e] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-mono text-[#8b949e] uppercase block mb-1">
                  {t.crm.tasks.taskTitle}
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Task title..."
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#161b22] text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#8b949e] uppercase block mb-1">
                  {t.crm.tasks.taskDifficulty}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewDifficulty("easy")}
                    className={`p-2 rounded-xl text-xs font-semibold border transition-colors ${
                      newDifficulty === "easy"
                        ? "bg-[#238636]/20 border-[#238636] text-[#3fb950]"
                        : "border-[#30363d] bg-[#161b22] text-[#8b949e]"
                    }`}
                  >
                    {t.crm.tasks.difficultyEasy}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewDifficulty("medium")}
                    className={`p-2 rounded-xl text-xs font-semibold border transition-colors ${
                      newDifficulty === "medium"
                        ? "bg-[#d29922]/20 border-[#d29922] text-[#d29922]"
                        : "border-[#30363d] bg-[#161b22] text-[#8b949e]"
                    }`}
                  >
                    {t.crm.tasks.difficultyMedium}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewDifficulty("hard")}
                    className={`p-2 rounded-xl text-xs font-semibold border transition-colors ${
                      newDifficulty === "hard"
                        ? "bg-[#e5484d]/20 border-[#e5484d] text-[#e5484d]"
                        : "border-[#30363d] bg-[#161b22] text-[#8b949e]"
                    }`}
                  >
                    {t.crm.tasks.difficultyHard}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#8b949e] uppercase block mb-1">
                  {t.crm.tasks.taskTags}
                </label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="TypeScript, React, Tailwind, Good First Issue"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#161b22] text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#8b949e] uppercase block mb-1">
                  {t.crm.tasks.taskDescRequirements}
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="..."
                  rows={4}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#161b22] text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-[#30363d] bg-[#161b22] text-[#8b949e] hover:text-white text-xs font-medium"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-4 py-1.5 rounded-xl bg-[#e5484d] hover:bg-[#f2555a] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {t.crm.tasks.btnNewTask}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
