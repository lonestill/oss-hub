"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { addOrUpdateProject, addComment, getProjectBySlug, updateProjectModerationStatus, deleteProject } from "@/lib/projects";
import { getSession, setSession, clearSession, isAdminAuthenticated, setAdminSession } from "@/lib/auth";
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
  cancelTaskClaim,
  addTaskMessage,
  getTaskMessages,
  createTeamApplication,
  updateTeamApplicationStatus,
} from "@/lib/claims";

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

  await client.execute({
    sql: `
      UPDATE projects
      SET looking_for_contributors = ?,
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

export async function adminUpdateStatusAction(projectId: string, status: "approved" | "pending" | "rejected") {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) throw new Error("Unauthorized");
  const session = await getSession();
  await updateProjectModerationStatus(projectId, status, session?.login || "lonestill");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/contributors");
}

export async function adminDeleteProjectAction(projectId: string) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) throw new Error("Unauthorized");
  await deleteProject(projectId);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/contributors");
}

export async function adminRescanProjectAction(projectId: string, owner: string, repo: string) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) throw new Error("Unauthorized");
  const moderation = await analyzeRepository(owner, repo);
  await client.execute({
    sql: `UPDATE projects SET moderation_status = ?, moderation_score = ?, moderation_flags = ? WHERE id = ?`,
    args: [moderation.status, moderation.score, JSON.stringify(moderation.flags), projectId],
  });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteCommentAction(commentId: string, slug: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  await initDb();
  const isSuperAdmin = session.login.toLowerCase() === "lonestill";
  const isAuth = await isAdminAuthenticated();

  const project = await getProjectBySlug(slug);
  const isOwner = Boolean(
    project &&
    project.owner_login &&
    project.owner_login.toLowerCase() === session.login.toLowerCase()
  );

  if (!isSuperAdmin && !isAuth && !isOwner) {
    throw new Error("Forbidden");
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
  const issueNumber = Number(formData.get("issueNumber"));
  const issueTitle = (formData.get("issueTitle") as string) || `Задача #${issueNumber}`;
  const pitch = (formData.get("pitch") as string) || "";

  if (!projectId || !projectSlug || !issueNumber || !pitch.trim()) {
    return { error: "Опишите, как вы планируете решить задачу (стек, опыт или вопросы к автору)." };
  }

  try {
    await createTaskClaim({
      projectId,
      projectSlug,
      issueNumber,
      issueTitle,
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
  prUrl?: string
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
  const isSuperAdmin = session.login.toLowerCase() === "lonestill";

  // Check if current user is the author of this claim (can withdraw / reject their own claim or submit PR)
  const currentClaim = await getClaimById(claimId);
  const isClaimAuthor = Boolean(
    currentClaim &&
    currentClaim.user_login.toLowerCase() === session.login.toLowerCase()
  );

  // Author of the claim is allowed to submit a PR (assigned with prUrl) or cancel/reject their own claim
  const isSelfCancel = isClaimAuthor && status === "rejected";
  const isSelfPr = isClaimAuthor && status === "assigned" && Boolean(prUrl);

  if (!isOwner && !isSuperAdmin && status !== "completed" && !isSelfCancel && !isSelfPr) {
    throw new Error("Forbidden");
  }

  await updateClaimStatus(claimId, status, prUrl);
  revalidatePath(`/projects/${slug}`);
  revalidatePath(`/users/${session.login}`);
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

  const project = await getProjectBySlug(slug);
  const isOwner = Boolean(
    project &&
    project.owner_login &&
    project.owner_login.toLowerCase() === session.login.toLowerCase()
  );
  const isSuperAdmin = session.login.toLowerCase() === "lonestill";
  const isClaimAuthor = claim.user_login.toLowerCase() === session.login.toLowerCase();

  if (!isOwner && !isSuperAdmin && !isClaimAuthor) {
    throw new Error("Forbidden");
  }

  await cancelTaskClaim(claimId);
  revalidatePath(`/projects/${slug}`);
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
    return;
  }

  const project = await getProjectBySlug(slug);
  const isOwner = Boolean(
    project &&
    project.owner_login &&
    project.owner_login.toLowerCase() === session.login.toLowerCase()
  );

  await addTaskMessage({
    claimId,
    projectId: project?.id || "",
    senderLogin: session.login,
    senderName: session.name || session.login,
    senderAvatar: session.avatar_url,
    isAuthor: isOwner,
    content,
  });

  revalidatePath(`/projects/${slug}`);
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
  const isSuperAdmin = session.login.toLowerCase() === "lonestill";

  if (!isOwner && !isSuperAdmin) {
    throw new Error("Forbidden");
  }

  await updateTeamApplicationStatus(appId, status);
  revalidatePath(`/projects/${slug}`);
  revalidatePath(`/users/${session.login}`);
}

export async function getTaskMessagesAction(claimId: string) {
  return await getTaskMessages(claimId);
}


