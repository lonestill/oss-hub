"use client";

import { useState } from "react";
import {
  updateProjectOwnerAction,
  updateClaimStatusAction,
  updateTeamApplicationStatusAction,
  sendTaskMessageAction,
  getTaskMessagesAction,
} from "@/app/actions";
import {
  Project,
  ContributorTask,
  ContributionMode,
  TeamRoleItem,
  ArchitectureItem,
  TeamApplication,
} from "@/lib/types";
import { TaskClaim, TaskMessage } from "@/lib/claims";
import { NavSection } from "./crm/types";
import { CrmHeader } from "./crm/CrmHeader";
import { CrmSidebar } from "./crm/CrmSidebar";
import { CrmPipeline } from "./crm/CrmPipeline";
import { CrmTasksBacklog } from "./crm/CrmTasksBacklog";
import { CrmTeamRoles } from "./crm/CrmTeamRoles";
import { CrmRoster } from "./crm/CrmRoster";
import { CrmOnboarding } from "./crm/CrmOnboarding";
import { CrmSettings } from "./crm/CrmSettings";
import { CrmClaimDrawer } from "./crm/CrmClaimDrawer";

interface ProjectCrmWorkspaceProps {
  project: Project;
  claims: TaskClaim[];
  teamApplications: TeamApplication[];
  sessionUserLogin: string;
}

export function ProjectCrmWorkspace({
  project,
  claims: initialClaims,
  teamApplications: initialTeamApps,
  sessionUserLogin,
}: ProjectCrmWorkspaceProps) {
  const [activeSection, setActiveSection] = useState<NavSection>("pipeline");
  const [isExpanded, setIsExpanded] = useState(false);

  const [claims, setClaims] = useState<TaskClaim[]>(initialClaims);
  const [teamApplications, setTeamApplications] = useState<TeamApplication[]>(initialTeamApps);

  // Drawer Chat State
  const [inspectClaim, setInspectClaim] = useState<TaskClaim | null>(null);
  const [claimMessages, setClaimMessages] = useState<TaskMessage[]>([]);
  const [newChatText, setNewChatText] = useState("");
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Pipeline Filter
  const [pipelineTypeFilter, setPipelineTypeFilter] = useState<"all" | "tasks" | "team">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Settings / Config State
  const initialModes: ContributionMode[] =
    project.modes && project.modes.length > 0
      ? project.modes
      : ["tasks", "team", "onboarding"];
  const [modes, setModes] = useState<ContributionMode[]>(initialModes);
  const [looking, setLooking] = useState(project.looking_for_contributors);
  const [contactUrl, setContactUrl] = useState(project.contact_url || "");
  const [quickstartCommand, setQuickstartCommand] = useState(
    project.quickstart_command || ""
  );
  const [envExample, setEnvExample] = useState(project.env_example || "");

  // Tasks Backlog State
  const initialTasks: ContributorTask[] = project.parsed_tasks || [];
  const [tasks, setTasks] = useState<ContributorTask[]>(initialTasks);

  // Team Roles State
  const initialTeamRoles: TeamRoleItem[] =
    project.team_roles_data && project.team_roles_data.length > 0
      ? project.team_roles_data
      : project.contributor_roles.map((r) => ({
          role: r,
          commitment: "5-10 ч/нед",
          description: "Участие в развитии архитектуры, разработка ключевых компонентов и ревью.",
        }));
  const [teamRoles, setTeamRoles] = useState<TeamRoleItem[]>(initialTeamRoles);

  // Architecture Map State
  const initialArchMap: ArchitectureItem[] = project.architecture_map_data || [];
  const [archMap, setArchMap] = useState<ArchitectureItem[]>(initialArchMap);

  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Metrics
  const pendingClaimsCount = claims.filter((c) => c.status === "pending").length;
  const inProgressClaimsCount = claims.filter((c) => c.status === "assigned").length;
  const completedClaimsCount = claims.filter((c) => c.status === "completed").length;
  const pendingAppsCount = teamApplications.filter((a) => a.status === "pending").length;
  const acceptedAppsCount = teamApplications.filter((a) => a.status === "accepted").length;
  const totalLeads = claims.length + teamApplications.length;

  function toggleMode(mode: ContributionMode) {
    if (modes.includes(mode)) {
      if (modes.length === 1) return;
      setModes(modes.filter((m) => m !== mode));
    } else {
      setModes([...modes, mode]);
    }
  }

  async function openClaimDrawer(claim: TaskClaim) {
    setInspectClaim(claim);
    setIsLoadingChat(true);
    try {
      const msgs = await getTaskMessagesAction(claim.id);
      setClaimMessages(msgs);
    } catch {
      setClaimMessages([]);
    } finally {
      setIsLoadingChat(false);
    }
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!inspectClaim || !newChatText.trim()) return;

    setIsSendingChat(true);
    await sendTaskMessageAction(inspectClaim.id, project.slug, newChatText.trim());
    const updated = await getTaskMessagesAction(inspectClaim.id);
    setClaimMessages(updated);
    setNewChatText("");
    setIsSendingChat(false);
  }

  async function handleClaimStatusChange(
    claimId: string,
    newStatus: "pending" | "assigned" | "completed" | "rejected"
  ) {
    await updateClaimStatusAction(claimId, project.slug, newStatus);
    setClaims(
      claims.map((c) => (c.id === claimId ? { ...c, status: newStatus } : c))
    );
    if (inspectClaim && inspectClaim.id === claimId) {
      setInspectClaim({ ...inspectClaim, status: newStatus });
    }
  }

  async function handleTeamAppStatusChange(
    appId: string,
    newStatus: "pending" | "accepted" | "rejected"
  ) {
    await updateTeamApplicationStatusAction(appId, project.slug, newStatus);
    setTeamApplications(
      teamApplications.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );
  }

  async function handleSaveConfig() {
    setIsSaving(true);
    setSaveFeedback(null);

    const formData = new FormData();
    formData.set("slug", project.slug);
    if (looking) {
      formData.set("lookingForContributors", "on");
    }
    formData.set("contactUrl", contactUrl);
    formData.set("quickstartCommand", quickstartCommand);
    formData.set("contributorTasks", JSON.stringify(tasks));
    formData.set("modes", JSON.stringify(modes));
    formData.set("teamRolesData", JSON.stringify(teamRoles));
    formData.set("architectureMapData", JSON.stringify(archMap));
    formData.set("envExample", envExample);

    const roleNames = teamRoles.map((r) => r.role);
    formData.set("contributorRoles", roleNames.join(", "));

    const res = await updateProjectOwnerAction(formData);
    setIsSaving(false);

    if (res?.error) {
      setSaveFeedback(res.error);
    } else {
      setSaveFeedback("Все параметры CRM успешно сохранены");
      setTimeout(() => setSaveFeedback(null), 3000);
    }
  }

  return (
    <div
      className={`bg-[#090b10] text-[#c9d1d9] flex flex-col font-sans transition-all ${
        isExpanded
          ? "fixed inset-0 z-50 overflow-y-auto"
          : "min-h-[calc(100vh-8rem)] rounded-2xl border border-[#30363d] overflow-hidden shadow-2xl"
      }`}
    >
      <CrmHeader
        projectName={project.name}
        projectSlug={project.slug}
        ownerLogin={project.owner_login || ""}
        looking={looking}
        isSaving={isSaving}
        saveFeedback={saveFeedback}
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
        onSave={handleSaveConfig}
      />

      <div className="flex-1 flex flex-col md:flex-row">
        <CrmSidebar
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          totalLeads={totalLeads}
          pendingCount={pendingClaimsCount + pendingAppsCount}
          inProgressCount={inProgressClaimsCount}
          acceptedCount={acceptedAppsCount}
          tasksCount={tasks.length}
          rolesCount={teamRoles.length}
          rosterCount={completedClaimsCount + acceptedAppsCount}
        />

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {activeSection === "pipeline" && (
            <CrmPipeline
              claims={claims}
              teamApplications={teamApplications}
              pipelineTypeFilter={pipelineTypeFilter}
              onSetPipelineTypeFilter={setPipelineTypeFilter}
              searchQuery={searchQuery}
              onSetSearchQuery={setSearchQuery}
              onOpenClaimDrawer={openClaimDrawer}
              onClaimStatusChange={handleClaimStatusChange}
              onTeamAppStatusChange={handleTeamAppStatusChange}
            />
          )}

          {activeSection === "tasks" && (
            <CrmTasksBacklog
              tasks={tasks}
              onAddTask={(task) => setTasks([...tasks, task])}
              onDeleteTask={(id) => setTasks(tasks.filter((t) => t.id !== id))}
            />
          )}

          {activeSection === "team" && (
            <CrmTeamRoles
              teamRoles={teamRoles}
              onAddRole={(role) => setTeamRoles([...teamRoles, role])}
              onDeleteRole={(idx) => setTeamRoles(teamRoles.filter((_, i) => i !== idx))}
            />
          )}

          {activeSection === "roster" && (
            <CrmRoster
              teamApplications={teamApplications}
              claims={claims}
              onOpenClaimDrawer={openClaimDrawer}
            />
          )}

          {activeSection === "onboarding" && (
            <CrmOnboarding
              quickstartCommand={quickstartCommand}
              onChangeQuickstartCommand={setQuickstartCommand}
              archMap={archMap}
              onAddArchItem={(item) => setArchMap([...archMap, item])}
              onDeleteArchItem={(idx) => setArchMap(archMap.filter((_, i) => i !== idx))}
              envExample={envExample}
              onChangeEnvExample={setEnvExample}
            />
          )}

          {activeSection === "settings" && (
            <CrmSettings
              looking={looking}
              onToggleLooking={() => setLooking(!looking)}
              modes={modes}
              onToggleMode={toggleMode}
              contactUrl={contactUrl}
              onChangeContactUrl={setContactUrl}
            />
          )}
        </main>
      </div>

      {inspectClaim && (
        <CrmClaimDrawer
          claim={inspectClaim}
          onClose={() => setInspectClaim(null)}
          onClaimStatusChange={handleClaimStatusChange}
          messages={claimMessages}
          isLoadingChat={isLoadingChat}
          isSendingChat={isSendingChat}
          newChatText={newChatText}
          onChangeNewChatText={setNewChatText}
          onSendReply={handleSendReply}
        />
      )}
    </div>
  );
}
