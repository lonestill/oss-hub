"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  addOrUpdateProject,
  addComment,
  getProjectBySlug,
  updateProjectModerationStatus,
  deleteProject,
  createAuditLog,
  createProjectComplaint,
  resolveProjectComplaint,
} from "@/lib/projects";
import { getSession, setSession, clearSession, isAdminAuthenticated, setAdminSession, isUserAdmin } from "@/lib/auth";
import { client, initDb } from "@/lib/db";
import { analyzeRepository } from "@/lib/moderation";
import { redirect } from "next/navigation";
import {
  commentActionLimiter,
  submitActionLimiter,
  adminPasswordActionLimiter,
} from "@/lib/rateLimit";
import {
  createTaskClaim,
  getClaimById,
  updateClaimStatus,
  updateClaimInternalNotes,
  cancelTaskClaim,
  addTaskMessage,
  getTaskMessages,
  createTeamApplication,
  updateTeamApplicationStatus,
} from "@/lib/claims";
import { upsertUserAvailability } from "@/lib/user-profile";
import { fetchGitHubRepo } from "@/lib/github";
import { ContributionMode, ContributorTask, TeamRoleItem } from "@/lib/types";

async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return h.get("x-real-ip") || "unknown";
}

export async function submitProjectAction(prevState: { error?: string; success?: boolean } | null, formData: FormData) {
  const ip = await getClientIp();
  const limit = submitActionLimiter.check(ip);
  if (!limit.success) {
    return { error: `Слишком много добавлений. Подождите ${limit.retryAfter} сек.` };
  }

  const repoUrl = formData.get("repoUrl") as string;
  const looking = formData.get("lookingForContributors") === "on";
  const rolesRaw = (formData.get("contributorRoles") as string) || "";
  const tasks = (formData.get("contributorTasks") as string) || "";
  const contact = (formData.get("contactUrl") as string) || "";

  if (!repoUrl) {
    return { error: "Укажите ссылку на репозиторий GitHub." };
  }

  const session = await getSession();
  const isAdmin = session ? await isUserAdmin(session.login) : false;

  const roles = rolesRaw
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);

  let slug = "";
  try {
    const project = await addOrUpdateProject({
      repoUrl,
      lookingForContributors: looking,
      contributorRoles: roles,
      contributorTasks: tasks,
      contactUrl: contact,
      actorLogin: session?.login || null,
      isAdmin,
    });
    slug = project.slug;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ошибка при импорте репозитория.";
    return { error: msg };
  }

  revalidatePath("/");
  revalidatePath("/contributors");
  revalidatePath(`/projects/${slug}`);
  redirect(`/projects/${slug}`);
}

export async function addCommentAction(prevState: { error?: string } | null, formData: FormData) {
  const ip = await getClientIp();
  const limit = commentActionLimiter.check(ip);
  if (!limit.success) {
    return { error: `Слишком частая отправка комментариев. Подождите ${limit.retryAfter} сек.` };
  }

  const projectId = formData.get("projectId") as string;
  const slug = formData.get("slug") as string;
  let authorName = formData.get("authorName") as string;
  let authorHandle = formData.get("authorHandle") as string;
  const content = formData.get("content") as string;

  const session = await getSession();
  if (session) {
    authorName = session.name || session.login;
    authorHandle = session.login;
  } else {
    const cleanHandle = (authorHandle || "").trim().toLowerCase().replace(/^@/, "");
    const cleanName = (authorName || "").trim().toLowerCase();
    if (
      cleanHandle === "lonestill" ||
      cleanName === "lonestill" ||
      cleanHandle === "admin" ||
      cleanName === "admin"
    ) {
      return { error: "Этот никнейм зарезервирован. Войдите через GitHub, чтобы писать от этого имени." };
    }
  }

  if (!projectId || !content?.trim() || !authorName?.trim()) {
    return { error: "Заполните имя и текст комментария." };
  }

  try {
    await addComment({
      projectId,
      authorName,
      authorHandle,
      authorAvatar: session?.avatar_url,
      content,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Не удалось отправить комментарий.";
    return { error: msg };
  }

  revalidatePath(`/projects/${slug}`);
  return { error: undefined };
}

export async function updateProjectOwnerAction(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: "Необходима авторизация." };
  }

  const slug = formData.get("slug") as string;
  const looking = formData.get("lookingForContributors") === "on";
  const rolesRaw = (formData.get("contributorRoles") as string) || "";
  const tasks = (formData.get("contributorTasks") as string) || "";
  const contact = (formData.get("contactUrl") as string) || "";
  const quickstart = (formData.get("quickstartCommand") as string) || "";

  await initDb();
  const project = await getProjectBySlug(slug);
  if (!project) {
    return { error: "Проект не найден." };
  }

  if (project.owner_login?.toLowerCase() !== session.login.toLowerCase()) {
    return { error: "Только владелец репозитория может редактировать статус." };
  }

  const roles = rolesRaw
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);

  const modesRaw = formData.get("modes") as string | null;
  const teamRolesRaw = formData.get("teamRolesData") as string | null;
  const archMapRaw = formData.get("architectureMapData") as string | null;
  const envExample = (formData.get("envExample") as string) || "";

  let modes = project.modes || ["tasks", "team", "onboarding"];
  if (modesRaw) {
    try {
      const parsed = JSON.parse(modesRaw);
      if (Array.isArray(parsed)) modes = parsed;
    } catch {}
  }

  let teamRolesData = project.team_roles_data || [];
  if (teamRolesRaw) {
    try {
      const parsed = JSON.parse(teamRolesRaw);
      if (Array.isArray(parsed)) teamRolesData = parsed;
    } catch {}
  }

  let archMapData = project.architecture_map_data || [];
  if (archMapRaw) {
    try {
      const parsed = JSON.parse(archMapRaw);
      if (Array.isArray(parsed)) archMapData = parsed;
    } catch {}
  }

  const description = formData.has("description")
    ? (formData.get("description") as string)?.trim() || null
    : project.description;

  await client.execute({
    sql: `
      UPDATE projects
      SET description = ?,
          looking_for_contributors = ?,
          contributor_roles = ?,
          contributor_tasks = ?,
          quickstart_command = ?,
          contact_url = ?,
          modes = ?,
          team_roles_data = ?,
          architecture_map_data = ?,
          env_example = ?,
          updated_at = ?
      WHERE slug = ?
    `,
    args: [
      description,
      looking ? 1 : 0,
      JSON.stringify(roles),
      tasks.trim() || null,
      quickstart.trim() || null,
      contact.trim() || null,
      JSON.stringify(modes),
      JSON.stringify(teamRolesData),
      JSON.stringify(archMapData),
      envExample.trim() || null,
      Date.now(),
      slug,
    ],
  });

  revalidatePath(`/projects/${slug}`);
  revalidatePath("/contributors");
  revalidatePath("/");
  return { success: true };
}

export async function logoutAction() {
  await clearSession();
  revalidatePath("/");
  redirect("/");
}

export async function adminLoginAction(formData: FormData) {
  const ip = await getClientIp();
  const limit = adminPasswordActionLimiter.check(ip);
  if (!limit.success) {
    redirect(`/admin/login?error=rate_limited&retry=${limit.retryAfter}`);
  }

  const password = formData.get("password") as string;
  const ok = await setAdminSession(password || "");
  if (!ok) {
    redirect("/admin/login?error=invalid_password");
  }
  redirect("/admin");
}

export async function adminUpdateStatusAction(
  projectId: string,
  status: "approved" | "pending" | "rejected" | "hidden",
  reason?: string
) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) throw new Error("Unauthorized");
  const session = await getSession();
  const actor = session?.login || "admin";
  await updateProjectModerationStatus(projectId, status, actor, reason);
  await createAuditLog({
    actorLogin: actor,
    action: `MODERATION_${status.toUpperCase()}`,
    targetType: "project",
    targetId: projectId,
    details: reason ? `Причина: ${reason}` : `Статус изменен на ${status}`,
  });
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/contributors");
}

export async function adminDeleteProjectAction(projectId: string) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) throw new Error("Unauthorized");
  const session = await getSession();
  await deleteProject(projectId);
  if (session) {
    await createAuditLog({
      actorLogin: session.login,
      action: "DELETE_PROJECT",
      targetType: "project",
      targetId: projectId,
      details: "Проект полностью удален из платформы со всеми связанными данными",
    });
  }
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/contributors");
}

export async function adminRescanProjectAction(projectId: string, owner: string, repo: string) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) throw new Error("Unauthorized");
  const session = await getSession();
  const moderation = await analyzeRepository(owner, repo);

  // Check if manual decision was already made - do not overwrite manual decision!
  const current = await client.execute({
    sql: "SELECT moderation_reviewed_at, moderation_status FROM projects WHERE id = ? LIMIT 1",
    args: [projectId],
  });
  const hasManualDecision = current.rows.length > 0 && current.rows[0].moderation_reviewed_at;

  if (hasManualDecision) {
    await client.execute({
      sql: `UPDATE projects SET moderation_score = ?, moderation_flags = ? WHERE id = ?`,
      args: [moderation.score, JSON.stringify(moderation.flags), projectId],
    });
  } else {
    await client.execute({
      sql: `UPDATE projects SET moderation_status = ?, moderation_score = ?, moderation_flags = ? WHERE id = ?`,
      args: [moderation.status, moderation.score, JSON.stringify(moderation.flags), projectId],
    });
  }

  if (session) {
    await createAuditLog({
      actorLogin: session.login,
      action: "RESCAN_PROJECT",
      targetType: "project",
      targetId: projectId,
      details: `Пересканирован ${owner}/${repo}. Оценка: ${moderation.score}/100. Ручное решение сохранено.`,
    });
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteCommentAction(commentId: string, slug: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  await initDb();
  const isSuperAdmin = await isUserAdmin(session.login);
  const isAuth = await isAdminAuthenticated();

  const project = await getProjectBySlug(slug);
  if (!project) {
    throw new Error("Проект не найден");
  }

  const isOwner = Boolean(
    project.owner_login &&
    project.owner_login.toLowerCase() === session.login.toLowerCase()
  );

  if (!isSuperAdmin && !isAuth && !isOwner) {
    throw new Error("Forbidden");
  }

  // Strict ownership check: comment MUST belong to this project!
  const commentRow = await client.execute({
    sql: "SELECT project_id FROM comments WHERE id = ? LIMIT 1",
    args: [commentId],
  });

  if (commentRow.rows.length === 0 || String(commentRow.rows[0].project_id) !== project.id) {
    throw new Error("Комментарий не принадлежит данному проекту");
  }

  await client.execute({
    sql: "DELETE FROM comments WHERE id = ?",
    args: [commentId],
  });

  revalidatePath(`/projects/${slug}`);
}

export async function claimTaskAction(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const ip = await getClientIp();
  const limit = commentActionLimiter.check(ip);
  if (!limit.success) {
    return { error: `Слишком частые действия. Подождите ${limit.retryAfter} сек.` };
  }

  const session = await getSession();
  if (!session) {
    return { error: "Для отклика на задачу необходимо войти через GitHub." };
  }

  const projectId = formData.get("projectId") as string;
  const projectSlug = formData.get("projectSlug") as string;
  const issueNumber = Number(formData.get("issueNumber")) || 0;
  const taskId = (formData.get("taskId") as string) || null;
  const source = (formData.get("source") as "github" | "manual") || (taskId ? "manual" : "github");
  const issueTitle = (formData.get("issueTitle") as string) || `Задача #${issueNumber || taskId}`;
  const pitch = (formData.get("pitch") as string) || "";

  if (!projectId || !projectSlug || (!issueNumber && !taskId) || !pitch.trim()) {
    return { error: "Опишите, как вы планируете решить задачу (стек, опыт или вопросы к автору)." };
  }

  await initDb();
  // Anti-fraud: Deduplication check to prevent spamming identical claims
  const existingClaim = await client.execute({
    sql: `SELECT id FROM task_claims 
          WHERE project_id = ? 
            AND (
              (? != 0 AND issue_number = ?)
              OR
              (? IS NOT NULL AND task_id = ?)
            )
            AND LOWER(user_login) = LOWER(?) 
            AND status IN ('pending', 'assigned') 
          LIMIT 1`,
    args: [projectId, issueNumber, issueNumber, taskId, taskId || "", session.login],
  });
  if (existingClaim.rows.length > 0) {
    return { error: "Вы уже отправили заявку на эту задачу. Дождитесь рассмотрения мейнтейнером." };
  }

  try {
    await createTaskClaim({
      projectId,
      projectSlug,
      issueNumber,
      issueTitle,
      taskId,
      source,
      userLogin: session.login,
      userName: session.name || session.login,
      userAvatar: session.avatar_url,
      pitch,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Не удалось отправить заявку.";
    return { error: msg };
  }

  revalidatePath(`/projects/${projectSlug}`);
  return { success: true };
}

export async function updateClaimStatusAction(
  claimId: string,
  slug: string,
  status: "pending" | "assigned" | "completed" | "rejected",
  prUrl?: string | null,
  internalNotes?: string | null
) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const currentClaim = await getClaimById(claimId);
  if (!currentClaim) {
    throw new Error("Claim not found");
  }

  // Strict project match check: prevent cross-project IDOR
  if (currentClaim.project_slug !== slug) {
    throw new Error("Claim project mismatch");
  }

  const project = await getProjectBySlug(currentClaim.project_slug);
  if (!project) {
    throw new Error("Project not found");
  }

  const isOwner = Boolean(
    project.owner_login &&
    project.owner_login.toLowerCase() === session.login.toLowerCase()
  );
  const isSuperAdmin = await isUserAdmin(session.login);
  const isClaimAuthor = currentClaim.user_login.toLowerCase() === session.login.toLowerCase();

  // Author of claim can ONLY self-cancel (rejected) or submit PR (assigned with prUrl)
  const isSelfCancel = isClaimAuthor && status === "rejected";
  const isSelfPr = isClaimAuthor && status === "assigned" && Boolean(prUrl);

  // Security check: only maintainer or superadmin can complete, unassign (pending), or assign, OR edit internalNotes!
  if (!isOwner && !isSuperAdmin) {
    if (!isSelfCancel && !isSelfPr) {
      throw new Error("Forbidden: You cannot modify this claim status");
    }
    // Non-maintainer cannot pass or alter internalNotes
    internalNotes = undefined;
  }

  // When status is pending (unassigned), guarantee pr_url is cleared in DB
  const finalPrUrl = status === "pending" ? null : prUrl;

  await updateClaimStatus(claimId, status, finalPrUrl, internalNotes);
  revalidatePath(`/projects/${currentClaim.project_slug}`);
  revalidatePath(`/projects/${currentClaim.project_slug}/crm`);
  revalidatePath(`/users/${currentClaim.user_login}`);
  return { success: true };
}

export async function updateClaimNotesAction(claimId: string, slug: string, notes: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const claim = await getClaimById(claimId);
  if (!claim) throw new Error("Claim not found");
  if (claim.project_slug !== slug) throw new Error("Claim project mismatch");

  const project = await getProjectBySlug(claim.project_slug);
  if (!project) throw new Error("Project not found");

  const isOwner = Boolean(
    project.owner_login &&
    project.owner_login.toLowerCase() === session.login.toLowerCase()
  );
  const isSuperAdmin = await isUserAdmin(session.login);

  if (!isOwner && !isSuperAdmin) {
    throw new Error("Forbidden: Only project maintainer can edit private notes");
  }

  await updateClaimInternalNotes(claimId, notes);
  revalidatePath(`/projects/${claim.project_slug}/crm`);
  return { success: true };
}

export async function cancelClaimAction(claimId: string, slug: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const claim = await getClaimById(claimId);
  if (!claim) {
    throw new Error("Claim not found");
  }
  if (claim.project_slug !== slug) {
    throw new Error("Claim project mismatch");
  }

  const project = await getProjectBySlug(claim.project_slug);
  const isOwner = Boolean(
    project &&
    project.owner_login &&
    project.owner_login.toLowerCase() === session.login.toLowerCase()
  );
  const isSuperAdmin = await isUserAdmin(session.login);
  const isClaimAuthor = claim.user_login.toLowerCase() === session.login.toLowerCase();

  if (!isOwner && !isSuperAdmin && !isClaimAuthor) {
    throw new Error("Forbidden");
  }

  await cancelTaskClaim(claimId);
  revalidatePath(`/projects/${claim.project_slug}`);
  revalidatePath(`/projects/${claim.project_slug}/crm`);
  revalidatePath(`/users/${session.login}`);
  return { success: true };
}

export async function sendTaskMessageAction(
  claimId: string,
  slug: string,
  content: string
) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  if (!content?.trim()) {
    return { error: "Пустое сообщение" };
  }

  const claim = await getClaimById(claimId);
  if (!claim) throw new Error("Claim not found");
  if (claim.project_slug !== slug) throw new Error("Claim project mismatch");

  const project = await getProjectBySlug(claim.project_slug);
  if (!project) throw new Error("Project not found");

  const isOwner = Boolean(
    project.owner_login &&
    project.owner_login.toLowerCase() === session.login.toLowerCase()
  );
  const isClaimAuthor = claim.user_login.toLowerCase() === session.login.toLowerCase();
  const isSuperAdmin = await isUserAdmin(session.login);

  if (!isOwner && !isClaimAuthor && !isSuperAdmin) {
    throw new Error("Forbidden: You cannot access this private thread");
  }

  await addTaskMessage({
    claimId,
    projectId: project.id,
    senderLogin: session.login,
    senderName: session.name || session.login,
    senderAvatar: session.avatar_url,
    isAuthor: isOwner,
    content,
  });

  revalidatePath(`/projects/${claim.project_slug}`);
  revalidatePath(`/projects/${claim.project_slug}/crm`);
  return { success: true };
}

export async function updateProjectGeneralAction(
  slug: string,
  data: { description: string; contactUrl: string; looking: boolean }
) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  await initDb();
  const project = await getProjectBySlug(slug);
  if (!project) return { error: "Project not found" };

  const isOwner = project.owner_login?.toLowerCase() === session.login.toLowerCase();
  const isSuperAdmin = await isUserAdmin(session.login);
  if (!isOwner && !isSuperAdmin) return { error: "Forbidden" };

  await client.execute({
    sql: `UPDATE projects SET description = ?, contact_url = ?, looking_for_contributors = ?, updated_at = ? WHERE slug = ?`,
    args: [data.description.trim() || null, data.contactUrl.trim() || null, data.looking ? 1 : 0, Date.now(), slug],
  });

  revalidatePath(`/projects/${slug}`);
  revalidatePath(`/projects/${slug}/crm`);
  return { success: true };
}

export async function updateProjectContributionAction(
  slug: string,
  data: { modes: ContributionMode[]; quickstart: string; envExample: string }
) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  await initDb();
  const project = await getProjectBySlug(slug);
  if (!project) return { error: "Project not found" };

  const isOwner = project.owner_login?.toLowerCase() === session.login.toLowerCase();
  const isSuperAdmin = await isUserAdmin(session.login);
  if (!isOwner && !isSuperAdmin) return { error: "Forbidden" };

  await client.execute({
    sql: `UPDATE projects SET modes = ?, quickstart_command = ?, env_example = ?, updated_at = ? WHERE slug = ?`,
    args: [JSON.stringify(data.modes), data.quickstart.trim() || null, data.envExample.trim() || null, Date.now(), slug],
  });

  revalidatePath(`/projects/${slug}`);
  revalidatePath(`/projects/${slug}/crm`);
  return { success: true };
}

export async function updateProjectTasksAction(slug: string, tasks: ContributorTask[]) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  await initDb();
  const project = await getProjectBySlug(slug);
  if (!project) return { error: "Project not found" };

  const isOwner = project.owner_login?.toLowerCase() === session.login.toLowerCase();
  const isSuperAdmin = await isUserAdmin(session.login);
  if (!isOwner && !isSuperAdmin) return { error: "Forbidden" };

  await client.execute({
    sql: `UPDATE projects SET contributor_tasks = ?, updated_at = ? WHERE slug = ?`,
    args: [JSON.stringify(tasks), Date.now(), slug],
  });

  revalidatePath(`/projects/${slug}`);
  revalidatePath(`/projects/${slug}/crm`);
  return { success: true };
}

export async function updateProjectRolesAction(slug: string, roles: TeamRoleItem[]) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  await initDb();
  const project = await getProjectBySlug(slug);
  if (!project) return { error: "Project not found" };

  const isOwner = project.owner_login?.toLowerCase() === session.login.toLowerCase();
  const isSuperAdmin = await isUserAdmin(session.login);
  if (!isOwner && !isSuperAdmin) return { error: "Forbidden" };

  const roleNames = roles.map((r) => r.role).filter(Boolean);

  await client.execute({
    sql: `UPDATE projects SET contributor_roles = ?, team_roles_data = ?, updated_at = ? WHERE slug = ?`,
    args: [JSON.stringify(roleNames), JSON.stringify(roles), Date.now(), slug],
  });

  revalidatePath(`/projects/${slug}`);
  revalidatePath(`/projects/${slug}/crm`);
  return { success: true };
}

export async function syncProjectWithGithubAction(slug: string) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  await initDb();
  const project = await getProjectBySlug(slug);
  if (!project) return { error: "Project not found" };

  const isOwner = project.owner_login?.toLowerCase() === session.login.toLowerCase();
  const isSuperAdmin = await isUserAdmin(session.login);
  if (!isOwner && !isSuperAdmin) return { error: "Forbidden" };

  const [owner, repo] = project.full_name.split("/");
  if (!owner || !repo) return { error: "Invalid repository format" };

  try {
    const gh = await fetchGitHubRepo(owner, repo);
    await client.execute({
      sql: `UPDATE projects SET stars = ?, forks = ?, open_issues = ?, description = COALESCE(description, ?), readme = ?, updated_at = ? WHERE slug = ?`,
      args: [gh.stargazers_count, gh.forks_count, gh.open_issues_count, gh.description || null, gh.readme_content || null, Date.now(), slug],
    });

    revalidatePath(`/projects/${slug}`);
    revalidatePath(`/projects/${slug}/crm`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "GitHub API sync failed";
    return { error: msg };
  }
}

export async function applyToTeamAction(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const ip = await getClientIp();
  const limit = commentActionLimiter.check(ip);
  if (!limit.success) {
    return { error: `Слишком частые действия. Подождите ${limit.retryAfter} сек.` };
  }

  const session = await getSession();
  if (!session) {
    return { error: "Для подачи заявки в команду необходимо войти через GitHub." };
  }

  const projectId = formData.get("projectId") as string;
  const projectSlug = formData.get("projectSlug") as string;
  const role = (formData.get("role") as string) || "";
  const experience = (formData.get("experience") as string) || "";
  const contacts = (formData.get("contacts") as string) || "";

  if (!projectId || !projectSlug || !role.trim() || !experience.trim()) {
    return { error: "Укажите роль и расскажите о своём опыте." };
  }

  try {
    await createTeamApplication({
      projectId,
      projectSlug,
      role,
      userLogin: session.login,
      userName: session.name || session.login,
      userAvatar: session.avatar_url,
      experience,
      contacts,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Не удалось отправить заявку в команду.";
    return { error: msg };
  }

  revalidatePath(`/projects/${projectSlug}`);
  return { success: true };
}

export async function updateTeamApplicationStatusAction(
  appId: string,
  slug: string,
  status: "pending" | "accepted" | "rejected"
) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const project = await getProjectBySlug(slug);
  const isOwner = Boolean(
    project &&
    project.owner_login &&
    project.owner_login.toLowerCase() === session.login.toLowerCase()
  );
  const isSuperAdmin = await isUserAdmin(session.login);

  if (!isOwner && !isSuperAdmin) {
    throw new Error("Forbidden");
  }

  await updateTeamApplicationStatus(appId, status);
  revalidatePath(`/projects/${slug}`);
  revalidatePath(`/projects/${slug}/crm`);
  revalidatePath(`/users/${session.login}`);
  return { success: true };
}

export async function getTaskMessagesAction(claimId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const claim = await getClaimById(claimId);
  if (!claim) return [];
  const project = await getProjectBySlug(claim.project_slug);
  const isOwner = Boolean(
    project &&
    project.owner_login &&
    project.owner_login.toLowerCase() === session.login.toLowerCase()
  );
  const isClaimAuthor = claim.user_login.toLowerCase() === session.login.toLowerCase();
  const isSuperAdmin = await isUserAdmin(session.login);
  if (!isOwner && !isClaimAuthor && !isSuperAdmin) {
    throw new Error("Forbidden");
  }
  return await getTaskMessages(claimId);
}

export async function updateUserAvailabilityAction(formData: FormData) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const status = (formData.get("status") as any) || "open";
  const status_text = formData.get("status_text") as string;
  const preferred_stack = formData.get("preferred_stack") as string;
  const hours_per_week = formData.get("hours_per_week") as string;
  const telegram = formData.get("telegram") as string;

  await upsertUserAvailability({
    login: session.login,
    status,
    status_text,
    preferred_stack,
    hours_per_week,
    telegram,
  });

  revalidatePath(`/users/${session.login}`);
  return { success: true };
}

export async function reportProjectAction(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const ip = await getClientIp();
  const limit = commentActionLimiter.check(ip);
  if (!limit.success) {
    return { error: `Слишком частые действия. Подождите ${limit.retryAfter} сек.` };
  }

  const session = await getSession();
  const reporterLogin = session?.login || `anon_${ip.replace(/[^a-zA-Z0-9]/g, "_")}`;
  const projectId = formData.get("projectId") as string;
  const projectSlug = formData.get("projectSlug") as string;
  const reason = (formData.get("reason") as string) || "";

  if (!projectId || !projectSlug || !reason.trim()) {
    return { error: "Укажите причину жалобы." };
  }

  try {
    await createProjectComplaint({
      projectId,
      projectSlug,
      reporterLogin,
      reason,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Не удалось отправить жалобу.";
    return { error: msg };
  }

  return { success: true };
}

export async function adminResolveComplaintAction(
  complaintId: string,
  resolution: string,
  status: "resolved" | "dismissed" = "resolved"
) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) throw new Error("Unauthorized");
  const session = await getSession();
  const resolver = session?.login || "admin";
  await resolveProjectComplaint(complaintId, resolution, resolver, status);
  await createAuditLog({
    actorLogin: resolver,
    action: `RESOLVE_COMPLAINT_${status.toUpperCase()}`,
    targetType: "complaint",
    targetId: complaintId,
    details: resolution,
  });
  revalidatePath("/admin");
}


