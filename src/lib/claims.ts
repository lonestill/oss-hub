import { client, initDb } from "./db";
import { TeamApplication } from "./types";
export type { TeamApplication } from "./types";

export interface TaskClaim {
  id: string;
  project_id: string;
  project_slug: string;
  issue_number: number;
  issue_title: string;
  user_login: string;
  user_name: string | null;
  user_avatar: string | null;
  pitch: string;
  status: "pending" | "assigned" | "completed" | "rejected";
  pr_url: string | null;
  created_at: number;
  updated_at: number;
  messages_count?: number;
}

export interface TaskMessage {
  id: string;
  claim_id: string;
  project_id: string;
  sender_login: string;
  sender_name: string | null;
  sender_avatar: string | null;
  is_author: boolean;
  content: string;
  created_at: number;
}

export async function createTaskClaim(params: {
  projectId: string;
  projectSlug: string;
  issueNumber: number;
  issueTitle: string;
  userLogin: string;
  userName?: string | null;
  userAvatar?: string | null;
  pitch: string;
}): Promise<TaskClaim> {
  await initDb();
  const id = `claim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = Date.now();

  await client.execute({
    sql: `
      INSERT INTO task_claims (
        id, project_id, project_slug, issue_number, issue_title,
        user_login, user_name, user_avatar, pitch, status,
        pr_url, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, ?, ?)
    `,
    args: [
      id,
      params.projectId,
      params.projectSlug,
      params.issueNumber,
      params.issueTitle,
      params.userLogin,
      params.userName || null,
      params.userAvatar || null,
      params.pitch.trim(),
      now,
      now,
    ],
  });

  return {
    id,
    project_id: params.projectId,
    project_slug: params.projectSlug,
    issue_number: params.issueNumber,
    issue_title: params.issueTitle,
    user_login: params.userLogin,
    user_name: params.userName || null,
    user_avatar: params.userAvatar || null,
    pitch: params.pitch,
    status: "pending",
    pr_url: null,
    created_at: now,
    updated_at: now,
  };
}

export async function getClaimsByProject(projectId: string): Promise<TaskClaim[]> {
  await initDb();
  const result = await client.execute({
    sql: `
      SELECT tc.*, COUNT(tm.id) as messages_count
      FROM task_claims tc
      LEFT JOIN task_messages tm ON tc.id = tm.claim_id
      WHERE tc.project_id = ?
      GROUP BY tc.id
      ORDER BY tc.created_at DESC
    `,
    args: [projectId],
  });

  return result.rows.map((row) => ({
    id: String(row.id),
    project_id: String(row.project_id),
    project_slug: String(row.project_slug),
    issue_number: Number(row.issue_number),
    issue_title: String(row.issue_title),
    user_login: String(row.user_login),
    user_name: row.user_name ? String(row.user_name) : null,
    user_avatar: row.user_avatar ? String(row.user_avatar) : null,
    pitch: String(row.pitch),
    status: (row.status as any) || "pending",
    pr_url: row.pr_url ? String(row.pr_url) : null,
    created_at: Number(row.created_at),
    updated_at: Number(row.updated_at),
    messages_count: Number(row.messages_count || 0),
  }));
}

export async function getClaimsByUser(userLogin: string): Promise<TaskClaim[]> {
  await initDb();
  const result = await client.execute({
    sql: `
      SELECT tc.*, COUNT(tm.id) as messages_count
      FROM task_claims tc
      LEFT JOIN task_messages tm ON tc.id = tm.claim_id
      WHERE LOWER(tc.user_login) = LOWER(?)
      GROUP BY tc.id
      ORDER BY tc.updated_at DESC
    `,
    args: [userLogin],
  });

  return result.rows.map((row) => ({
    id: String(row.id),
    project_id: String(row.project_id),
    project_slug: String(row.project_slug),
    issue_number: Number(row.issue_number),
    issue_title: String(row.issue_title),
    user_login: String(row.user_login),
    user_name: row.user_name ? String(row.user_name) : null,
    user_avatar: row.user_avatar ? String(row.user_avatar) : null,
    pitch: String(row.pitch),
    status: (row.status as any) || "pending",
    pr_url: row.pr_url ? String(row.pr_url) : null,
    created_at: Number(row.created_at),
    updated_at: Number(row.updated_at),
    messages_count: Number(row.messages_count || 0),
  }));
}

export async function getClaimById(claimId: string): Promise<TaskClaim | null> {
  await initDb();
  const result = await client.execute({
    sql: `SELECT * FROM task_claims WHERE id = ? LIMIT 1`,
    args: [claimId],
  });

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: String(row.id),
    project_id: String(row.project_id),
    project_slug: String(row.project_slug),
    issue_number: Number(row.issue_number),
    issue_title: String(row.issue_title),
    user_login: String(row.user_login),
    user_name: row.user_name ? String(row.user_name) : null,
    user_avatar: row.user_avatar ? String(row.user_avatar) : null,
    pitch: String(row.pitch),
    status: (row.status as any) || "pending",
    pr_url: row.pr_url ? String(row.pr_url) : null,
    created_at: Number(row.created_at),
    updated_at: Number(row.updated_at),
  };
}

export async function updateClaimStatus(
  claimId: string,
  status: "pending" | "assigned" | "completed" | "rejected",
  prUrl?: string | null
): Promise<void> {
  await initDb();
  const now = Date.now();

  if (prUrl !== undefined) {
    await client.execute({
      sql: `UPDATE task_claims SET status = ?, pr_url = ?, updated_at = ? WHERE id = ?`,
      args: [status, prUrl, now, claimId],
    });
  } else {
    await client.execute({
      sql: `UPDATE task_claims SET status = ?, updated_at = ? WHERE id = ?`,
      args: [status, now, claimId],
    });
  }
}

export async function cancelTaskClaim(claimId: string): Promise<void> {
  await initDb();
  const now = Date.now();
  await client.execute({
    sql: `UPDATE task_claims SET status = 'rejected', updated_at = ? WHERE id = ?`,
    args: [now, claimId],
  });
}

export async function addTaskMessage(params: {
  claimId: string;
  projectId: string;
  senderLogin: string;
  senderName?: string | null;
  senderAvatar?: string | null;
  isAuthor: boolean;
  content: string;
}): Promise<TaskMessage> {
  await initDb();
  const id = `tmsg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = Date.now();

  await client.execute({
    sql: `
      INSERT INTO task_messages (
        id, claim_id, project_id, sender_login, sender_name,
        sender_avatar, is_author, content, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      id,
      params.claimId,
      params.projectId,
      params.senderLogin,
      params.senderName || null,
      params.senderAvatar || null,
      params.isAuthor ? 1 : 0,
      params.content.trim(),
      now,
    ],
  });

  // Bump updated_at on the claim
  await client.execute({
    sql: `UPDATE task_claims SET updated_at = ? WHERE id = ?`,
    args: [now, params.claimId],
  });

  return {
    id,
    claim_id: params.claimId,
    project_id: params.projectId,
    sender_login: params.senderLogin,
    sender_name: params.senderName || null,
    sender_avatar: params.senderAvatar || null,
    is_author: params.isAuthor,
    content: params.content,
    created_at: now,
  };
}

export async function getTaskMessages(claimId: string): Promise<TaskMessage[]> {
  await initDb();
  const result = await client.execute({
    sql: `SELECT * FROM task_messages WHERE claim_id = ? ORDER BY created_at ASC`,
    args: [claimId],
  });

  return result.rows.map((row) => ({
    id: String(row.id),
    claim_id: String(row.claim_id),
    project_id: String(row.project_id),
    sender_login: String(row.sender_login),
    sender_name: row.sender_name ? String(row.sender_name) : null,
    sender_avatar: row.sender_avatar ? String(row.sender_avatar) : null,
    is_author: Boolean(row.is_author),
    content: String(row.content),
    created_at: Number(row.created_at),
  }));
}

export async function createTeamApplication(params: {
  projectId: string;
  projectSlug: string;
  role: string;
  userLogin: string;
  userName?: string | null;
  userAvatar?: string | null;
  experience: string;
  contacts?: string | null;
}): Promise<TeamApplication> {
  await initDb();
  const id = `team_app_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = Date.now();

  await client.execute({
    sql: `
      INSERT INTO team_applications (
        id, project_id, project_slug, role, user_login,
        user_name, user_avatar, experience, contacts, status,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `,
    args: [
      id,
      params.projectId,
      params.projectSlug,
      params.role.trim(),
      params.userLogin,
      params.userName || null,
      params.userAvatar || null,
      params.experience.trim(),
      params.contacts ? params.contacts.trim() : null,
      now,
      now,
    ],
  });

  return {
    id,
    project_id: params.projectId,
    project_slug: params.projectSlug,
    role: params.role.trim(),
    user_login: params.userLogin,
    user_name: params.userName || null,
    user_avatar: params.userAvatar || null,
    experience: params.experience.trim(),
    contacts: params.contacts ? params.contacts.trim() : null,
    status: "pending",
    created_at: now,
    updated_at: now,
  };
}

export async function getTeamApplicationsByProject(projectId: string): Promise<TeamApplication[]> {
  await initDb();
  const result = await client.execute({
    sql: `SELECT * FROM team_applications WHERE project_id = ? ORDER BY created_at DESC`,
    args: [projectId],
  });

  return result.rows.map((row) => ({
    id: String(row.id),
    project_id: String(row.project_id),
    project_slug: String(row.project_slug),
    role: String(row.role),
    user_login: String(row.user_login),
    user_name: row.user_name ? String(row.user_name) : null,
    user_avatar: row.user_avatar ? String(row.user_avatar) : null,
    experience: String(row.experience),
    contacts: row.contacts ? String(row.contacts) : null,
    status: (row.status as any) || "pending",
    created_at: Number(row.created_at),
    updated_at: Number(row.updated_at),
  }));
}

export async function getTeamApplicationsByUser(userLogin: string): Promise<TeamApplication[]> {
  await initDb();
  const result = await client.execute({
    sql: `SELECT * FROM team_applications WHERE LOWER(user_login) = LOWER(?) ORDER BY updated_at DESC`,
    args: [userLogin],
  });

  return result.rows.map((row) => ({
    id: String(row.id),
    project_id: String(row.project_id),
    project_slug: String(row.project_slug),
    role: String(row.role),
    user_login: String(row.user_login),
    user_name: row.user_name ? String(row.user_name) : null,
    user_avatar: row.user_avatar ? String(row.user_avatar) : null,
    experience: String(row.experience),
    contacts: row.contacts ? String(row.contacts) : null,
    status: (row.status as any) || "pending",
    created_at: Number(row.created_at),
    updated_at: Number(row.updated_at),
  }));
}

export async function updateTeamApplicationStatus(
  appId: string,
  status: "pending" | "accepted" | "rejected"
): Promise<void> {
  await initDb();
  const now = Date.now();
  await client.execute({
    sql: `UPDATE team_applications SET status = ?, updated_at = ? WHERE id = ?`,
    args: [status, now, appId],
  });
}
