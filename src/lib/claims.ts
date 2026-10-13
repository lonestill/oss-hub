import { client, initDb } from "./db";
import { TeamApplication } from "./types";
export type { TeamApplication } from "./types";

export interface PublicTaskClaim {
  id: string;
  project_id: string;
  project_slug: string;
  issue_number: number;
  issue_title: string;
  task_id?: string | null;
  source?: "github" | "manual";
  user_login: string;
  user_name: string | null;
  user_avatar: string | null;
  pitch: string;
  status: "pending" | "assigned" | "completed" | "rejected";
  pr_url: string | null;
  created_at: number;
  updated_at: number;
  messages_count?: number;
  last_message_sender?: string | null;
  last_message_is_author?: boolean | null;
  last_message_content?: string | null;
}

export interface TaskClaim extends PublicTaskClaim {
  internal_notes?: string | null;
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
  taskId?: string | null;
  source?: "github" | "manual";
  userLogin: string;
  userName?: string | null;
  userAvatar?: string | null;
  pitch: string;
}): Promise<PublicTaskClaim> {
  await initDb();
  const id = `claim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = Date.now();
  const taskId = params.taskId || (params.source === "github" ? `gh_${params.issueNumber}` : null);
  const source = params.source || "github";

  await client.execute({
    sql: `
      INSERT INTO task_claims (
        id, project_id, project_slug, issue_number, issue_title,
        task_id, source, user_login, user_name, user_avatar, pitch, status,
        pr_url, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, ?, ?)
    `,
    args: [
      id,
      params.projectId,
      params.projectSlug,
      params.issueNumber,
      params.issueTitle,
      taskId,
      source,
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
    task_id: taskId,
    source,
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

export async function getClaimsByProject(
  projectId: string
): Promise<PublicTaskClaim[]> {
  await initDb();
  const result = await client.execute({
    sql: `
      SELECT tc.id, tc.project_id, tc.project_slug, tc.issue_number, tc.issue_title,
             tc.task_id, tc.source, tc.user_login, tc.user_name, tc.user_avatar,
             tc.pitch, tc.status, tc.pr_url, tc.created_at, tc.updated_at,
        COUNT(tm.id) as messages_count,
        (SELECT sender_login FROM task_messages WHERE claim_id = tc.id ORDER BY created_at DESC LIMIT 1) as last_message_sender,
        (SELECT is_author FROM task_messages WHERE claim_id = tc.id ORDER BY created_at DESC LIMIT 1) as last_message_is_author,
        (SELECT content FROM task_messages WHERE claim_id = tc.id ORDER BY created_at DESC LIMIT 1) as last_message_content
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
    task_id: row.task_id ? String(row.task_id) : null,
    source: (row.source as "github" | "manual") || "github",
    user_login: String(row.user_login),
    user_name: row.user_name ? String(row.user_name) : null,
    user_avatar: row.user_avatar ? String(row.user_avatar) : null,
    pitch: String(row.pitch),
    status: (row.status as any) || "pending",
    pr_url: row.pr_url ? String(row.pr_url) : null,
    created_at: Number(row.created_at),
    updated_at: Number(row.updated_at),
    messages_count: Number(row.messages_count || 0),
    last_message_sender: row.last_message_sender ? String(row.last_message_sender) : null,
    last_message_is_author: row.last_message_is_author !== null && row.last_message_is_author !== undefined ? Boolean(row.last_message_is_author) : null,
    last_message_content: row.last_message_content ? String(row.last_message_content) : null,
  }));
}

export async function getMaintainerClaimsByProject(
  projectId: string
): Promise<TaskClaim[]> {
  await initDb();
  const result = await client.execute({
    sql: `
      SELECT tc.id, tc.project_id, tc.project_slug, tc.issue_number, tc.issue_title,
             tc.task_id, tc.source, tc.user_login, tc.user_name, tc.user_avatar,
             tc.pitch, tc.status, tc.pr_url, tc.internal_notes, tc.created_at, tc.updated_at,
        COUNT(tm.id) as messages_count,
        (SELECT sender_login FROM task_messages WHERE claim_id = tc.id ORDER BY created_at DESC LIMIT 1) as last_message_sender,
        (SELECT is_author FROM task_messages WHERE claim_id = tc.id ORDER BY created_at DESC LIMIT 1) as last_message_is_author,
        (SELECT content FROM task_messages WHERE claim_id = tc.id ORDER BY created_at DESC LIMIT 1) as last_message_content
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
    task_id: row.task_id ? String(row.task_id) : null,
    source: (row.source as "github" | "manual") || "github",
    user_login: String(row.user_login),
    user_name: row.user_name ? String(row.user_name) : null,
    user_avatar: row.user_avatar ? String(row.user_avatar) : null,
    pitch: String(row.pitch),
    status: (row.status as any) || "pending",
    pr_url: row.pr_url ? String(row.pr_url) : null,
    internal_notes: row.internal_notes ? String(row.internal_notes) : null,
    created_at: Number(row.created_at),
    updated_at: Number(row.updated_at),
    messages_count: Number(row.messages_count || 0),
    last_message_sender: row.last_message_sender ? String(row.last_message_sender) : null,
    last_message_is_author: row.last_message_is_author !== null && row.last_message_is_author !== undefined ? Boolean(row.last_message_is_author) : null,
    last_message_content: row.last_message_content ? String(row.last_message_content) : null,
  }));
}

export async function getClaimsByUser(userLogin: string): Promise<PublicTaskClaim[]> {
  await initDb();
  const result = await client.execute({
    sql: `
      SELECT tc.id, tc.project_id, tc.project_slug, tc.issue_number, tc.issue_title,
             tc.task_id, tc.source, tc.user_login, tc.user_name, tc.user_avatar,
             tc.pitch, tc.status, tc.pr_url, tc.created_at, tc.updated_at,
             COUNT(tm.id) as messages_count
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
    task_id: row.task_id ? String(row.task_id) : null,
    source: (row.source as "github" | "manual") || "github",
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
    task_id: row.task_id ? String(row.task_id) : null,
    source: (row.source as "github" | "manual") || "github",
    user_login: String(row.user_login),
    user_name: row.user_name ? String(row.user_name) : null,
    user_avatar: row.user_avatar ? String(row.user_avatar) : null,
    pitch: String(row.pitch),
    status: (row.status as any) || "pending",
    pr_url: row.pr_url ? String(row.pr_url) : null,
    internal_notes: row.internal_notes ? String(row.internal_notes) : null,
    created_at: Number(row.created_at),
    updated_at: Number(row.updated_at),
  };
}

export async function updateClaimStatus(
  claimId: string,
  status: "pending" | "assigned" | "completed" | "rejected",
  prUrl?: string | null,
  internalNotes?: string | null
): Promise<void> {
  await initDb();
  const now = Date.now();
  const cur = await getClaimById(claimId);
  if (!cur) throw new Error("Claim not found");

  // Guarantee single assignee:
  // When assigning, atomically reject ALL other claims on this issue/task (both pending and previously assigned)
  if (status === "assigned") {
    if (cur.task_id) {
      await client.execute({
        sql: `UPDATE task_claims SET status = 'rejected', updated_at = ? WHERE project_id = ? AND task_id = ? AND id != ? AND status IN ('pending', 'assigned')`,
        args: [now, cur.project_id, cur.task_id, claimId],
      });
    }
    if (cur.issue_number && cur.issue_number > 0) {
      await client.execute({
        sql: `UPDATE task_claims SET status = 'rejected', updated_at = ? WHERE project_id = ? AND issue_number = ? AND id != ? AND status IN ('pending', 'assigned')`,
        args: [now, cur.project_id, cur.issue_number, claimId],
      });
    }
  }

  const updates: string[] = ["status = ?", "updated_at = ?"];
  const args: any[] = [status, now];

  // If status is pending (unassigned), ALWAYS wipe pr_url to NULL in DB!
  if (status === "pending" || prUrl === null) {
    updates.push("pr_url = NULL");
  } else if (prUrl !== undefined) {
    updates.push("pr_url = ?");
    args.push(prUrl);
  }

  if (internalNotes !== undefined) {
    updates.push("internal_notes = ?");
    args.push(internalNotes);
  }

  args.push(claimId);
  await client.execute({
    sql: `UPDATE task_claims SET ${updates.join(", ")} WHERE id = ?`,
    args,
  });
}

export async function updateClaimInternalNotes(claimId: string, notes: string): Promise<void> {
  await initDb();
  await client.execute({
    sql: `UPDATE task_claims SET internal_notes = ?, updated_at = ? WHERE id = ?`,
    args: [notes, Date.now(), claimId],
  });
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
