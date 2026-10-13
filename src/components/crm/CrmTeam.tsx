"use client";

import { useState } from "react";
import { TeamRoleItem, TeamApplication } from "@/lib/types";
import { TaskClaim } from "@/lib/claims";
import { useLanguage } from "@/lib/i18n/context";
import {
  Users2,
  UserPlus,
  Briefcase,
  CheckCircle2,
  X,
  Edit2,
  Trash2,
  Plus,
  Save,
  MessageSquare,
  Clock,
  ExternalLink,
  Mail,
  UserCheck,
} from "lucide-react";
import Link from "next/link";

interface CrmTeamProps {
  teamRoles: TeamRoleItem[];
  teamApplications: TeamApplication[];
  claims: TaskClaim[];
  onUpdateTeamRoles: (roles: TeamRoleItem[]) => Promise<void>;
  onAcceptApplication: (appId: string) => Promise<void>;
  onRejectApplication: (appId: string) => Promise<void>;
}

export function CrmTeam({
  teamRoles,
  teamApplications,
  claims,
  onUpdateTeamRoles,
  onAcceptApplication,
  onRejectApplication,
}: CrmTeamProps) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<"members" | "recruiting">("members");

  // Editing Role State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editCommitment, setEditCommitment] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Add New Role State
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [newCommitment, setNewCommitment] = useState("5-10 ч/нед");
  const [newDescription, setNewDescription] = useState("");

  // 1. Members: accepted team applications + assigned/completed claim contributors
  const acceptedApps = teamApplications.filter((a) => a.status === "accepted");
  const activeContributors = claims.filter(
    (c) => c.status === "assigned" || c.status === "completed"
  );

  // Group contributors by login
  const membersMap = new Map<
    string,
    {
      login: string;
      name?: string | null;
      avatar?: string | null;
      roleTitle: string;
      tasks: string[];
      contacts?: string | null;
      joinedAt?: number;
    }
  >();

  for (const app of acceptedApps) {
    const key = app.user_login.toLowerCase();
    membersMap.set(key, {
      login: app.user_login,
      name: app.user_name,
      avatar: app.user_avatar,
      roleTitle: app.role,
      tasks: [],
      contacts: app.contacts,
      joinedAt: app.updated_at,
    });
  }

  for (const claim of activeContributors) {
    const key = claim.user_login.toLowerCase();
    const existing = membersMap.get(key);
    if (existing) {
      if (!existing.tasks.includes(claim.issue_title)) {
        existing.tasks.push(claim.issue_title);
      }
    } else {
      membersMap.set(key, {
        login: claim.user_login,
        name: claim.user_name,
        avatar: claim.user_avatar,
        roleTitle: "Контрибьютор",
        tasks: [claim.issue_title],
        joinedAt: claim.updated_at,
      });
    }
  }

  const membersList = Array.from(membersMap.values());

  // Handle Save Role Edit
  const handleSaveRole = async (idx: number) => {
    const updated = [...teamRoles];
    updated[idx] = {
      role: editRole.trim() || updated[idx].role,
      commitment: editCommitment.trim() || "5-10 ч/нед",
      description: editDescription.trim(),
    };
    await onUpdateTeamRoles(updated);
    setEditingIndex(null);
  };

  // Handle Delete Role
  const handleDeleteRole = async (idx: number) => {
    const updated = teamRoles.filter((_, i) => i !== idx);
    await onUpdateTeamRoles(updated);
    if (editingIndex === idx) setEditingIndex(null);
  };

  // Handle Create Role
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.trim()) return;

    const updated: TeamRoleItem[] = [
      ...teamRoles,
      {
        role: newRole.trim(),
        commitment: newCommitment.trim() || "5-10 ч/нед",
        description: newDescription.trim() || "Участие в развитии репозитория.",
      },
    ];

    await onUpdateTeamRoles(updated);
    setIsAddingRole(false);
    setNewRole("");
    setNewCommitment("5-10 ч/нед");
    setNewDescription("");
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Tabs */}
      <div className="flex items-center gap-2 border-b border-[#21262d] pb-3">
        <button
          type="button"
          onClick={() => setTab("members")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
            tab === "members"
              ? "bg-[#21262d] text-white border border-[#30363d]"
              : "text-[#8b949e] hover:text-white hover:bg-[#161b22]"
          }`}
        >
          <Users2 className="w-4 h-4 text-[#3fb950]" />
          <span>{t.crm.team.membersTab} ({membersList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("recruiting")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
            tab === "recruiting"
              ? "bg-[#21262d] text-white border border-[#30363d]"
              : "text-[#8b949e] hover:text-white hover:bg-[#161b22]"
          }`}
        >
          <Briefcase className="w-4 h-4 text-[#38bdf8]" />
          <span>{t.crm.team.recruitingTab} ({teamRoles.length})</span>
        </button>
      </div>

      {/* 1. Members Tab */}
      {tab === "members" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">{t.crm.team.membersTitle}</h2>
              <p className="text-xs text-[#8b949e] mt-0.5">
                {t.crm.team.membersSubtitle}
              </p>
            </div>
          </div>

          {membersList.length === 0 ? (
            <div className="p-12 rounded-2xl border border-[#21262d] bg-[#161b22] text-center space-y-3">
              <Users2 className="w-8 h-8 text-[#8b949e] mx-auto opacity-40" />
              <div className="text-xs text-[#8b949e]">
                {t.crm.team.noMembers}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {membersList.map((m) => (
                <div
                  key={m.login}
                  className="p-4 rounded-2xl border border-[#21262d] bg-[#161b22] space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3">
                      {m.avatar ? (
                        <img
                          src={m.avatar}
                          alt={m.login}
                          className="w-10 h-10 rounded-xl border border-white/10 object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-[#21262d] text-white flex items-center justify-center font-bold text-sm">
                          {m.login.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link
                          href={`/users/${m.login}`}
                          target="_blank"
                          className="font-bold text-white text-xs hover:text-[#e5484d] transition-colors truncate block"
                        >
                          @{m.login}
                        </Link>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#3fb950]/15 text-[#3fb950] font-semibold">
                          {m.roleTitle}
                        </span>
                      </div>
                    </div>

                    {m.tasks.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-mono text-[#8b949e] uppercase block">
                          {t.crm.team.tasksInProgress}
                        </span>
                        <div className="space-y-1">
                          {m.tasks.map((taskTitle, idx) => (
                            <div
                              key={idx}
                              className="text-xs text-white bg-[#0d1117] p-2 rounded-lg border border-[#21262d] truncate"
                              title={taskTitle}
                            >
                              {taskTitle}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {m.contacts && (
                      <div className="text-[11px] text-[#8b949e] flex items-center gap-1.5 font-mono pt-1">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{m.contacts}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#21262d] flex items-center justify-between text-[11px] text-[#8b949e]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#3fb950]" />
                      <span>{t.crm.team.statusActive}</span>
                    </span>
                    <Link
                      href={`/users/${m.login}`}
                      target="_blank"
                      className="hover:text-white transition-colors flex items-center gap-1"
                    >
                      <span>{t.crm.team.toProfile}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Recruiting Tab */}
      {tab === "recruiting" && (
        <div className="space-y-8">
          {/* Header & Add Role Button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">{t.crm.team.recruitingTitle}</h2>
              <p className="text-xs text-[#8b949e] mt-0.5">
                {t.crm.team.recruitingSubtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingRole(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#e5484d] hover:bg-[#f2555a] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.crm.team.btnAddRole}</span>
            </button>
          </div>

          {/* Form: Add Role */}
          {isAddingRole && (
            <form
              onSubmit={handleCreateRole}
              className="p-5 rounded-2xl border border-[#30363d] bg-[#161b22] space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase font-mono">
                  {t.crm.team.newRoleTitle}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddingRole(false)}
                  className="text-[#8b949e] hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-[#8b949e] uppercase block mb-1">
                    {t.crm.team.roleName}
                  </label>
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="e.g. Rust Core Developer"
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-[#8b949e] uppercase block mb-1">
                    {t.crm.team.commitmentLabel}
                  </label>
                  <input
                    type="text"
                    value={newCommitment}
                    onChange={(e) => setNewCommitment(e.target.value)}
                    placeholder="5-10 h/wk"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#8b949e] uppercase block mb-1">
                  {t.crm.team.descLabel}
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingRole(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#8b949e] text-xs font-medium"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!newRole.trim()}
                  className="px-4 py-1.5 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {t.crm.team.saveRole}
                </button>
              </div>
            </form>
          )}

          {/* Roles List */}
          <div className="space-y-4">
            {teamRoles.map((r, idx) => {
              const roleName = (r as any)?.role || (r as any)?.title || "";
              const isEditing = editingIndex === idx;
              const roleCandidates = teamApplications.filter(
                (a) => (a.role || "").toLowerCase() === roleName.toLowerCase()
              );

              return (
                <div
                  key={`role_card_${idx}`}
                  className="p-5 rounded-2xl border border-[#21262d] bg-[#161b22] space-y-4"
                >
                  {/* Role Header */}
                  {isEditing ? (
                    <div className="space-y-3 p-4 rounded-xl border border-[#30363d] bg-[#0d1117]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          placeholder={t.crm.team.roleName}
                          className="px-3 py-1.5 text-xs rounded-lg border border-[#30363d] bg-[#161b22] text-white focus:outline-none"
                        />
                        <input
                          type="text"
                          value={editCommitment}
                          onChange={(e) => setEditCommitment(e.target.value)}
                          placeholder={t.crm.team.commitment}
                          className="px-3 py-1.5 text-xs rounded-lg border border-[#30363d] bg-[#161b22] text-white focus:outline-none"
                        />
                      </div>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder={t.crm.team.description}
                        rows={3}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#30363d] bg-[#161b22] text-white focus:outline-none"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingIndex(null)}
                          className="px-3 py-1 rounded-lg text-xs text-[#8b949e]"
                        >
                          {t.common.cancel}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveRole(idx)}
                          className="px-3.5 py-1 rounded-lg bg-[#238636] text-white text-xs font-semibold"
                        >
                          {t.common.save}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-white tracking-tight">
                            {roleName || t.crm.team.unnamedRole}
                          </h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#21262d] text-[#8b949e]">
                            {r.commitment || "5-10 h/wk"}
                          </span>
                        </div>
                        <p className="text-xs text-[#8b949e] leading-relaxed max-w-2xl">
                          {r.description || ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingIndex(idx);
                            setEditRole(roleName);
                            setEditCommitment(r.commitment || "5-10 h/wk");
                            setEditDescription(r.description || "");
                          }}
                          className="p-1.5 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
                          title={t.crm.team.editRole}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRole(idx)}
                          className="p-1.5 rounded-lg text-[#8b949e] hover:text-[#e5484d] hover:bg-[#21262d] transition-colors"
                          title={t.crm.team.deleteRole}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Candidates for this role */}
                  <div className="pt-3 border-t border-[#21262d] space-y-2.5">
                    <span className="text-[11px] font-mono uppercase text-[#8b949e] font-semibold block">
                      {t.crm.team.roleApplications} ({roleCandidates.length})
                    </span>

                    {roleCandidates.length === 0 ? (
                      <div className="p-3 rounded-xl bg-[#0d1117] text-xs text-[#8b949e] text-center border border-[#21262d]">
                        {t.crm.team.noRoleApps}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {roleCandidates.map((cand) => (
                          <div
                            key={cand.id}
                            className="p-3.5 rounded-xl border border-[#30363d] bg-[#0d1117] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              {cand.user_avatar ? (
                                <img
                                  src={cand.user_avatar}
                                  alt={cand.user_login}
                                  className="w-8 h-8 rounded-lg border border-white/10 shrink-0 object-cover mt-0.5"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-[#21262d] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                  {cand.user_login.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white">
                                    @{cand.user_login}
                                  </span>
                                  {cand.status === "accepted" && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#3fb950]/20 text-[#3fb950] font-bold">
                                      {t.crm.team.acceptedBadge}
                                    </span>
                                  )}
                                  {cand.status === "rejected" && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#8b949e]/20 text-[#8b949e]">
                                      {t.crm.team.rejectedBadge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-[#8b949e] mt-1">
                                  {cand.experience}
                                </p>
                                {cand.contacts && (
                                  <div className="text-[11px] text-[#8b949e] font-mono mt-0.5">
                                    {t.crm.team.contactsLabel} {cand.contacts}
                                  </div>
                                )}
                              </div>
                            </div>

                            {cand.status === "pending" && (
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => onRejectApplication(cand.id)}
                                  className="px-3 py-1 rounded-lg border border-[#30363d] bg-[#161b22] text-[#8b949e] hover:text-white text-xs font-medium"
                                >
                                  {t.crm.team.btnReject}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onAcceptApplication(cand.id)}
                                  className="px-3.5 py-1 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold flex items-center gap-1"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>{t.crm.team.btnAccept}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
