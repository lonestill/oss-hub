"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateClaimStatusAction,
  updateTeamApplicationStatusAction,
  sendTaskMessageAction,
  getTaskMessagesAction,
  updateClaimNotesAction,
  updateProjectGeneralAction,
  updateProjectContributionAction,
  updateProjectTasksAction,
  updateProjectRolesAction,
  syncProjectWithGithubAction,
} from "@/app/actions";
import {
  Project,
  ContributorTask,
  ContributionMode,
  TeamRoleItem,
  TeamApplication,
  GitHubIssue,
} from "@/lib/types";
import { TaskClaim, TaskMessage } from "@/lib/claims";
import { NavSection } from "./crm/types";
import { CrmHeader } from "./crm/CrmHeader";
import { CrmSidebar } from "./crm/CrmSidebar";
import { CrmOverview } from "./crm/CrmOverview";
import { CrmTasks } from "./crm/CrmTasks";
import { CrmTeam } from "./crm/CrmTeam";
import { CrmSettings } from "./crm/CrmSettings";

interface ProjectCrmWorkspaceProps {
  project: Project;
  claims: TaskClaim[];
  teamApplications: TeamApplication[];
  githubIssues?: GitHubIssue[];
  userProjects?: Project[];
  sessionUserLogin: string;
}

export function ProjectCrmWorkspace({
  project,
  claims: initialClaims,
  teamApplications: initialTeamApps,
  githubIssues = [],
  userProjects = [project],
  sessionUserLogin,
}: ProjectCrmWorkspaceProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<NavSection>("overview");
  const [claims, setClaims] = useState<TaskClaim[]>(initialClaims);
  const [teamApplications, setTeamApplications] = useState<TeamApplication[]>(initialTeamApps);

  // Selected task in tasks split view (passed from overview attention card)
  const [selectedTaskNumberOrId, setSelectedTaskNumberOrId] = useState<string | number | null>(null);

  // Tasks & Roles State
  const [tasks, setTasks] = useState<ContributorTask[]>(project.parsed_tasks || []);
  const initialTeamRoles: TeamRoleItem[] =
    project.team_roles_data && project.team_roles_data.length > 0
      ? project.team_roles_data
      : project.contributor_roles.map((r) => ({
          role: r,
          commitment: "5-10 ч/нед",
          description: "Участие в развитии репозитория, код-ревью и реализация фич.",
        }));
  const [teamRoles, setTeamRoles] = useState<TeamRoleItem[]>(initialTeamRoles);

  // Config State
  const [looking, setLooking] = useState(project.looking_for_contributors);
  const [contactUrl, setContactUrl] = useState(project.contact_url || "");
  const [modes, setModes] = useState<ContributionMode[]>(
    project.modes && project.modes.length > 0
      ? project.modes
      : ["tasks", "team", "onboarding"]
  );
  const [quickstartCommand, setQuickstartCommand] = useState(
    project.quickstart_command || ""
  );
  const [envExample, setEnvExample] = useState(project.env_example || "");
  const [description, setDescription] = useState(project.description || "");

  // Attention Count Metric
  const pendingClaims = claims.filter((c) => c.status === "pending");
  const prsToReview = claims.filter((c) => c.status === "assigned" && Boolean(c.pr_url));
  const pendingTeamApps = teamApplications.filter((a) => a.status === "pending");
  const unreadMessagesClaims = claims.filter(
    (c) =>
      c.last_message_is_author === false &&
      c.status !== "rejected" &&
      c.status !== "completed"
  );
  const attentionCount =
    pendingClaims.length + prsToReview.length + pendingTeamApps.length + unreadMessagesClaims.length;

  // Counts for sidebar
  const totalTasksCount = tasks.length + githubIssues.length;
  const acceptedAppsCount = teamApplications.filter((a) => a.status === "accepted").length;
  const assignedContributorsCount = claims.filter((c) => c.status === "assigned" || c.status === "completed").length;
  const totalTeamCount = Math.max(acceptedAppsCount + assignedContributorsCount, teamRoles.length);

  // 1. Claim Actions
  const handleAssignCandidate = async (claimId: string, prUrl?: string) => {
    const res = await updateClaimStatusAction(claimId, project.slug, "assigned", prUrl);
    if (res && "error" in res && res.error) {
      alert(`Ошибка назначения: ${res.error}`);
      return;
    }

    const targetClaim = claims.find((c) => c.id === claimId);
    // Update local state: target becomes assigned, other pending for same issue become rejected
    setClaims((prev) =>
      prev.map((c) => {
        if (c.id === claimId) {
          return { ...c, status: "assigned", pr_url: prUrl || c.pr_url };
        }
        if (
          targetClaim &&
          ((targetClaim.task_id && c.task_id === targetClaim.task_id) ||
            (targetClaim.issue_number && c.issue_number === targetClaim.issue_number)) &&
          c.id !== claimId &&
          (c.status === "pending" || c.status === "assigned")
        ) {
          return { ...c, status: "rejected" };
        }
        return c;
      })
    );
  };

  const handleRejectCandidate = async (claimId: string) => {
    const res = await updateClaimStatusAction(claimId, project.slug, "rejected");
    if (res && "error" in res && res.error) {
      alert(`Ошибка: ${res.error}`);
      return;
    }
    setClaims((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, status: "rejected" } : c))
    );
  };

  const handleUnassignTask = async (claimId: string) => {
    const res = await updateClaimStatusAction(claimId, project.slug, "pending");
    if (res && "error" in res && res.error) {
      alert(`Ошибка снятия: ${res.error}`);
      return;
    }
    setClaims((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, status: "pending", pr_url: null } : c))
    );
  };

  const handleCompleteTask = async (claimId: string) => {
    const res = await updateClaimStatusAction(claimId, project.slug, "completed");
    if (res && "error" in res && res.error) {
      alert(`Ошибка завершения задачи: ${res.error}`);
      return;
    }
    setClaims((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, status: "completed" } : c))
    );
  };

  const handleSaveClaimNotes = async (claimId: string, notes: string) => {
    const res = await updateClaimNotesAction(claimId, project.slug, notes);
    if (res && "error" in res && res.error) {
      alert(`Ошибка сохранения заметок: ${res.error}`);
      return;
    }
    setClaims((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, internal_notes: notes } : c))
    );
  };

  const handleSendTaskMessage = async (claimId: string, content: string) => {
    const res = await sendTaskMessageAction(claimId, project.slug, content);
    if (res && "error" in res && res.error) {
      alert(`Ошибка отправки сообщения: ${res.error}`);
      return;
    }
    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId ? { ...c, messages_count: (c.messages_count || 0) + 1 } : c
      )
    );
  };

  const handleLoadTaskMessages = async (claimId: string): Promise<TaskMessage[]> => {
    return await getTaskMessagesAction(claimId);
  };

  // 2. Team Application Actions
  const handleAcceptTeamApp = async (appId: string) => {
    try {
      await updateTeamApplicationStatusAction(appId, project.slug, "accepted");
      setTeamApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: "accepted" } : a))
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ошибка принятия заявки";
      alert(msg);
    }
  };

  const handleRejectTeamApp = async (appId: string) => {
    try {
      await updateTeamApplicationStatusAction(appId, project.slug, "rejected");
      setTeamApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: "rejected" } : a))
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ошибка отклонения заявки";
      alert(msg);
    }
  };

  // 3. Task Management Actions (Isolated)
  const handleUpdateTaskDescription = async (taskId: string, newDesc: string) => {
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, description: newDesc } : t));
    const res = await updateProjectTasksAction(project.slug, updated);
    if (res && "error" in res && res.error) {
      throw new Error(res.error);
    }
    setTasks(updated);
  };

  const handleAddNewTask = async (newTask: ContributorTask) => {
    const updated = [newTask, ...tasks];
    const res = await updateProjectTasksAction(project.slug, updated);
    if (res && "error" in res && res.error) {
      throw new Error(res.error);
    }
    setTasks(updated);
  };

  // 4. Team Roles Management (Isolated)
  const handleUpdateTeamRoles = async (roles: TeamRoleItem[]) => {
    const res = await updateProjectRolesAction(project.slug, roles);
    if (res && "error" in res && res.error) {
      throw new Error(res.error);
    }
    setTeamRoles(roles);
  };

  // 5. Settings Modular Saves (Isolated)
  const handleSaveGeneral = async (data: {
    description: string;
    contactUrl: string;
    looking: boolean;
  }) => {
    const res = await updateProjectGeneralAction(project.slug, data);
    if (res && "error" in res && res.error) {
      throw new Error(res.error);
    }
    setDescription(data.description);
    setContactUrl(data.contactUrl);
    setLooking(data.looking);
  };

  const handleSaveContribution = async (data: {
    modes: ContributionMode[];
    quickstart: string;
    envExample: string;
  }) => {
    const res = await updateProjectContributionAction(project.slug, data);
    if (res && "error" in res && res.error) {
      throw new Error(res.error);
    }
    setModes(data.modes);
    setQuickstartCommand(data.quickstart);
    setEnvExample(data.envExample);
  };

  const handleRescanGithub = async () => {
    const res = await syncProjectWithGithubAction(project.slug);
    if (res && "error" in res && res.error) {
      throw new Error(res.error);
    }
    router.refresh();
  };

  return (
    <div className="min-h-screen w-full bg-[#090b10] text-[#e6edf3] flex flex-col font-sans selection:bg-[#e5484d] selection:text-white">
      {/* Top Navbar */}
      <CrmHeader
        project={project}
        userProjects={userProjects}
        looking={looking}
        attentionCount={attentionCount}
      />

      {/* Main Container: Sidebar + Content Area */}
      <div className="flex-1 flex flex-col md:flex-row w-full">
        {/* Left Sidebar */}
        <CrmSidebar
          activeSection={activeSection}
          onSelectSection={(section) => {
            setActiveSection(section);
            if (section !== "tasks") {
              setSelectedTaskNumberOrId(null);
            }
          }}
          attentionCount={attentionCount}
          tasksCount={totalTasksCount}
          teamCount={totalTeamCount}
        />

        {/* Workspace Content Area: Keep all tabs mounted to preserve form drafts & scroll states */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className={activeSection === "overview" ? "block" : "hidden"}>
            <CrmOverview
              project={project}
              claims={claims}
              teamApplications={teamApplications}
              teamRoles={teamRoles}
              tasks={tasks}
              onSelectSection={setActiveSection}
              onOpenTask={(taskNumOrId) => {
                setSelectedTaskNumberOrId(taskNumOrId);
                setActiveSection("tasks");
              }}
              onAcceptTeamApp={handleAcceptTeamApp}
              onRejectTeamApp={handleRejectTeamApp}
              onOpenNewTaskModal={() => {
                setActiveSection("tasks");
              }}
            />
          </div>

          <div className={activeSection === "tasks" ? "block" : "hidden"}>
            <CrmTasks
              tasks={tasks}
              githubIssues={githubIssues}
              claims={claims}
              selectedTaskParam={selectedTaskNumberOrId}
              onUpdateTaskDescription={handleUpdateTaskDescription}
              onAssignCandidate={handleAssignCandidate}
              onRejectCandidate={handleRejectCandidate}
              onUnassignTask={handleUnassignTask}
              onCompleteTask={handleCompleteTask}
              onSaveClaimNotes={handleSaveClaimNotes}
              onSendTaskMessage={handleSendTaskMessage}
              onLoadTaskMessages={handleLoadTaskMessages}
              onAddNewTask={handleAddNewTask}
            />
          </div>

          <div className={activeSection === "team" ? "block" : "hidden"}>
            <CrmTeam
              teamRoles={teamRoles}
              teamApplications={teamApplications}
              claims={claims}
              onUpdateTeamRoles={handleUpdateTeamRoles}
              onAcceptApplication={handleAcceptTeamApp}
              onRejectApplication={handleRejectTeamApp}
            />
          </div>

          <div className={activeSection === "settings" ? "block" : "hidden"}>
            <CrmSettings
              project={project}
              onSaveGeneral={handleSaveGeneral}
              onSaveContribution={handleSaveContribution}
              onRescanGithub={handleRescanGithub}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
