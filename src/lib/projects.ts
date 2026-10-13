import { client, initDb } from "./db";
import { Project, Comment, AuditLog, ProjectComplaint } from "./types";
import { fetchGitHubRepo, parseGitHubUrl } from "./github";
import { analyzeRepository } from "./moderation";
import { parseSearchQuery } from "./search-query";

function getDefaultQuickstart(full_name: string, name: string, language: string | null): string {
  const lang = (language || "").toLowerCase();
  if (lang.includes("typescript") || lang.includes("javascript")) {
    return `git clone https://github.com/${full_name}.git && cd ${name} && npm install && npm run dev`;
  }
  if (lang.includes("rust")) {
    return `git clone https://github.com/${full_name}.git && cd ${name} && cargo build && cargo run`;
  }
  if (lang.includes("python")) {
    return `git clone https://github.com/${full_name}.git && cd ${name} && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt`;
  }
  if (lang.includes("go")) {
    return `git clone https://github.com/${full_name}.git && cd ${name} && go mod download && go run .`;
  }
  if (lang.includes("c++") || lang.includes("c")) {
    return `git clone https://github.com/${full_name}.git && cd ${name} && cmake -B build && cmake --build build`;
  }
  return `git clone https://github.com/${full_name}.git && cd ${name}`;
}

export function mapProjectRow(row: any): Project {
  let flags = [];
  try {
    flags = JSON.parse((row.moderation_flags as string) || "[]");
  } catch {}

  let topics = [];
  try {
    topics = JSON.parse((row.topics as string) || "[]");
  } catch {}

  let roles: string[] = [];
  try {
    roles = JSON.parse((row.contributor_roles as string) || "[]");
  } catch {}

  let parsedTasks: any[] = [];
  if (row.contributor_tasks) {
    try {
      const parsed = JSON.parse(row.contributor_tasks);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsedTasks = parsed;
      }
    } catch {
      if (typeof row.contributor_tasks === "string" && row.contributor_tasks.trim()) {
        parsedTasks = [
          {
            id: "task-custom-1",
            title: "Задачи от мейнтейнера",
            description: row.contributor_tasks.trim(),
            difficulty: "medium",
            tags: roles.length > 0 ? roles : ["Любая помощь"],
            estimated_time: "1-2 дня",
            status: "open",
          },
        ];
      }
    }
  }

  let modes: ("tasks" | "team" | "onboarding")[] = ["tasks", "team", "onboarding"];
  try {
    if (row.modes) modes = JSON.parse(row.modes);
  } catch {}

  let teamRolesData = [];
  try {
    if (row.team_roles_data) teamRolesData = JSON.parse(row.team_roles_data);
  } catch {}

  let archMapData = [];
  try {
    if (row.architecture_map_data) archMapData = JSON.parse(row.architecture_map_data);
  } catch {}

  const quickstart = row.quickstart_command
    ? String(row.quickstart_command)
    : getDefaultQuickstart(String(row.full_name), String(row.name), row.language ? String(row.language) : null);

  return {
    id: String(row.id),
    name: String(row.name),
    full_name: String(row.full_name),
    slug: String(row.slug),
    description: row.description ? String(row.description) : null,
    url: String(row.url),
    homepage: row.homepage ? String(row.homepage) : null,
    stars: Number(row.stars || 0),
    forks: Number(row.forks || 0),
    open_issues: Number(row.open_issues || 0),
    language: row.language ? String(row.language) : null,
    topics,
    readme: row.readme ? String(row.readme) : null,
    owner_avatar: row.owner_avatar ? String(row.owner_avatar) : null,
    owner_login: row.owner_login ? String(row.owner_login) : null,
    looking_for_contributors: Boolean(row.looking_for_contributors),
    contributor_roles: roles,
    contributor_tasks: row.contributor_tasks ? String(row.contributor_tasks) : null,
    parsed_tasks: parsedTasks,
    quickstart_command: quickstart,
    contact_url: row.contact_url ? String(row.contact_url) : null,
    modes,
    team_roles_data: teamRolesData,
    architecture_map_data: archMapData,
    env_example: row.env_example ? String(row.env_example) : null,
    moderation_status: (row.moderation_status as "approved" | "pending" | "rejected") || "approved",
    moderation_score: Number(row.moderation_score ?? 100),
    moderation_flags: flags,
    moderation_reviewed_at: row.moderation_reviewed_at ? Number(row.moderation_reviewed_at) : null,
    moderation_reviewed_by: row.moderation_reviewed_by ? String(row.moderation_reviewed_by) : null,
    moderation_reason: row.moderation_reason ? String(row.moderation_reason) : null,
    is_deleted: Boolean(row.is_deleted),
    created_at: Number(row.created_at),
    updated_at: Number(row.updated_at),
    comments_count: Number(row.comments_count || 0),
    claims_count: Number(row.claims_count || 0),
    team_apps_count: Number(row.team_apps_count || 0),
  };

}

export async function getAvailableLanguages(): Promise<string[]> {
  await initDb();
  const result = await client.execute({
    sql: `
      SELECT DISTINCT language 
      FROM projects 
      WHERE language IS NOT NULL AND length(trim(language)) > 0
      ORDER BY language COLLATE NOCASE ASC
    `,
    args: [],
  });
  return result.rows
    .map((r) => String(r.language || "").trim())
    .filter(Boolean);
}

export async function getProjects(options?: {
  search?: string;
  language?: string;
  lookingForContributors?: boolean;
  sort?: "stars" | "newest" | "name";
  moderationStatus?: "approved" | "pending" | "rejected" | "all";
}): Promise<Project[]> {
  await initDb();

  let query = `
    SELECT p.*, COUNT(c.id) as comments_count 
    FROM projects p
    LEFT JOIN comments c ON p.id = c.project_id
    WHERE 1=1
  `;
  const args: (string | number)[] = [];

  if (options?.moderationStatus && options.moderationStatus !== "all") {
    query += ` AND p.moderation_status = ?`;
    args.push(options.moderationStatus);
  } else if (!options?.moderationStatus) {
    // Default: only approved projects shown to public catalog
    query += ` AND (p.moderation_status = 'approved' OR p.moderation_status IS NULL)`;
  }

  const parsed = options?.search ? parseSearchQuery(options.search) : null;
  const effectiveLanguage = options?.language || parsed?.language;
  const effectiveLooking = Boolean(options?.lookingForContributors || parsed?.isLooking);

  if (parsed?.cleanText) {
    query += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.topics LIKE ? OR p.full_name LIKE ?)`;
    const s = `%${parsed.cleanText}%`;
    args.push(s, s, s, s);
  }

  if (effectiveLanguage) {
    query += ` AND LOWER(p.language) = LOWER(?)`;
    args.push(effectiveLanguage);
  }

  if (effectiveLooking) {
    query += ` AND p.looking_for_contributors = 1`;
  }

  if (parsed?.owner) {
    query += ` AND LOWER(p.owner_login) = LOWER(?)`;
    args.push(parsed.owner);
  }

  if (parsed?.stars) {
    const op = parsed.stars.operator;
    if (op === ">" || op === ">=" || op === "<" || op === "<=" || op === "=") {
      query += ` AND p.stars ${op} ?`;
      args.push(parsed.stars.value);
    }
  }

  if (parsed?.forks) {
    const op = parsed.forks.operator;
    if (op === ">" || op === ">=" || op === "<" || op === "<=" || op === "=") {
      query += ` AND p.forks ${op} ?`;
      args.push(parsed.forks.value);
    }
  }

  if (parsed?.topic) {
    query += ` AND LOWER(p.topics) LIKE ?`;
    args.push(`%${parsed.topic.toLowerCase()}%`);
  }

  query += ` GROUP BY p.id`;

  if (options?.sort === "stars") {
    query += ` ORDER BY p.stars DESC, p.created_at DESC`;
  } else if (options?.sort === "name") {
    query += ` ORDER BY p.name ASC`;
  } else {
    // Default newest
    query += ` ORDER BY p.created_at DESC`;
  }

  const result = await client.execute({ sql: query, args });
  return result.rows.map(mapProjectRow);
}


export async function getProjectBySlug(slug: string): Promise<Project | null> {
  await initDb();

  const result = await client.execute({
    sql: `
      SELECT p.*, COUNT(c.id) as comments_count 
      FROM projects p
      LEFT JOIN comments c ON p.id = c.project_id
      WHERE p.slug = ?
      GROUP BY p.id
      LIMIT 1
    `,
    args: [slug],
  });

  if (result.rows.length === 0) return null;
  return mapProjectRow(result.rows[0]);
}

export async function getComments(projectId: string): Promise<Comment[]> {
  await initDb();

  const result = await client.execute({
    sql: `SELECT * FROM comments WHERE project_id = ? ORDER BY created_at ASC`,
    args: [projectId],
  });

  return result.rows.map((row) => ({
    id: String(row.id),
    project_id: String(row.project_id),
    author_name: String(row.author_name),
    author_handle: row.author_handle ? String(row.author_handle) : null,
    author_avatar: row.author_avatar ? String(row.author_avatar) : null,
    content: String(row.content),
    created_at: Number(row.created_at),
  }));
}

export async function addComment(params: {
  projectId: string;
  authorName: string;
  authorHandle?: string;
  authorAvatar?: string;
  content: string;
}): Promise<Comment> {
  await initDb();

  const id = `comm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = Date.now();

  await client.execute({
    sql: `
      INSERT INTO comments (id, project_id, author_name, author_handle, author_avatar, content, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      id,
      params.projectId,
      params.authorName.trim(),
      params.authorHandle?.trim() || null,
      params.authorAvatar?.trim() || null,
      params.content.trim(),
      now,
    ],
  });

  return {
    id,
    project_id: params.projectId,
    author_name: params.authorName,
    author_handle: params.authorHandle || null,
    author_avatar: params.authorAvatar || null,
    content: params.content,
    created_at: now,
  };
}

export async function addOrUpdateProject(params: {
  repoUrl: string;
  lookingForContributors?: boolean;
  contributorRoles?: string[];
  contributorTasks?: string;
  contactUrl?: string;
  actorLogin?: string | null;
  isAdmin?: boolean;
}): Promise<Project> {
  await initDb();

  const parsed = parseGitHubUrl(params.repoUrl);
  if (!parsed) {
    throw new Error("Некорректная ссылка на репозиторий GitHub. Укажите в формате https://github.com/owner/repo или owner/repo.");
  }

  const details = await fetchGitHubRepo(parsed.owner, parsed.repo);
  const moderation = await analyzeRepository(parsed.owner, parsed.repo);
  const slug = details.full_name.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  const now = Date.now();

  const existing = await client.execute({
    sql: `SELECT id, created_at, owner_login, moderation_status, moderation_reviewed_at, moderation_reviewed_by, moderation_reason FROM projects WHERE full_name = ? LIMIT 1`,
    args: [details.full_name],
  });

  const existingRow = existing.rows[0];
  const isExisting = Boolean(existingRow);

  if (isExisting) {
    const existingOwner = String(existingRow.owner_login || "").toLowerCase();
    const actor = (params.actorLogin || "").toLowerCase();
    const canUpdate = params.isAdmin || (actor && (actor === existingOwner || actor === details.owner.login.toLowerCase()));

    if (!canUpdate) {
      throw new Error(
        `Репозиторий ${details.full_name} уже добавлен в каталог. Обновлять параметры проекта может только его автор (@${existingRow.owner_login || details.owner.login}).`
      );
    }
  }

  const id = isExisting ? String(existingRow.id) : `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const createdAt = isExisting ? Number(existingRow.created_at) : now;

  // Preserve manual moderation decision if already reviewed!
  const hasManualDecision = isExisting && existingRow.moderation_reviewed_at;
  const finalModerationStatus = hasManualDecision
    ? String(existingRow.moderation_status)
    : moderation.status;
  const finalReviewedAt = hasManualDecision ? Number(existingRow.moderation_reviewed_at) : null;
  const finalReviewedBy = hasManualDecision ? String(existingRow.moderation_reviewed_by) : null;
  const finalReason = hasManualDecision && existingRow.moderation_reason ? String(existingRow.moderation_reason) : null;

  await client.execute({
    sql: `
      INSERT INTO projects (
        id, name, full_name, slug, description, url, homepage,
        stars, forks, open_issues, language, topics, readme,
        owner_avatar, owner_login, looking_for_contributors,
        contributor_roles, contributor_tasks, contact_url,
        moderation_status, moderation_score, moderation_flags,
        moderation_reviewed_at, moderation_reviewed_by, moderation_reason,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(full_name) DO UPDATE SET
        name = excluded.name,
        slug = excluded.slug,
        description = excluded.description,
        url = excluded.url,
        homepage = excluded.homepage,
        stars = excluded.stars,
        forks = excluded.forks,
        open_issues = excluded.open_issues,
        language = excluded.language,
        topics = excluded.topics,
        readme = excluded.readme,
        owner_avatar = excluded.owner_avatar,
        owner_login = excluded.owner_login,
        looking_for_contributors = excluded.looking_for_contributors,
        contributor_roles = excluded.contributor_roles,
        contributor_tasks = excluded.contributor_tasks,
        contact_url = excluded.contact_url,
        moderation_status = excluded.moderation_status,
        moderation_score = excluded.moderation_score,
        moderation_flags = excluded.moderation_flags,
        moderation_reviewed_at = excluded.moderation_reviewed_at,
        moderation_reviewed_by = excluded.moderation_reviewed_by,
        moderation_reason = excluded.moderation_reason,
        updated_at = excluded.updated_at
    `,
    args: [
      id,
      details.name,
      details.full_name,
      slug,
      details.description,
      details.html_url,
      details.homepage,
      details.stargazers_count,
      details.forks_count,
      details.open_issues_count,
      details.language,
      JSON.stringify(details.topics),
      details.readme_content || null,
      details.owner.avatar_url,
      details.owner.login,
      params.lookingForContributors ? 1 : 0,
      JSON.stringify(params.contributorRoles || []),
      params.contributorTasks?.trim() || null,
      params.contactUrl?.trim() || null,
      finalModerationStatus,
      moderation.score,
      JSON.stringify(moderation.flags),
      finalReviewedAt,
      finalReviewedBy,
      finalReason,
      createdAt,
      now,
    ],
  });

  return (await getProjectBySlug(slug))!;
}

export async function getProjectsByOwner(ownerLogin: string): Promise<Project[]> {
  await initDb();
  const query = `
    SELECT p.*, COUNT(c.id) as comments_count 
    FROM projects p
    LEFT JOIN comments c ON p.id = c.project_id
    WHERE LOWER(p.owner_login) = LOWER(?)
    GROUP BY p.id
    ORDER BY p.stars DESC, p.created_at DESC
  `;
  const result = await client.execute({ sql: query, args: [ownerLogin] });
  return result.rows.map(mapProjectRow);
}

export async function updateProjectModerationStatus(
  id: string,
  status: "approved" | "pending" | "rejected" | "hidden",
  reviewer: string,
  reason?: string
) {
  await initDb();
  await client.execute({
    sql: `UPDATE projects SET moderation_status = ?, moderation_reviewed_at = ?, moderation_reviewed_by = ?, moderation_reason = ? WHERE id = ?`,
    args: [status, Date.now(), reviewer, reason?.trim() || null, id],
  });
}

export async function deleteProject(id: string) {
  await initDb();
  await client.execute({
    sql: `DELETE FROM comments WHERE project_id = ?`,
    args: [id],
  });
  await client.execute({
    sql: `DELETE FROM task_messages WHERE project_id = ?`,
    args: [id],
  });
  await client.execute({
    sql: `DELETE FROM task_claims WHERE project_id = ?`,
    args: [id],
  });
  await client.execute({
    sql: `DELETE FROM team_applications WHERE project_id = ?`,
    args: [id],
  });
  await client.execute({
    sql: `DELETE FROM project_complaints WHERE project_id = ?`,
    args: [id],
  });
  await client.execute({
    sql: `DELETE FROM projects WHERE id = ?`,
    args: [id],
  });
}

export async function createAuditLog(params: {
  actorLogin: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: string;
}) {
  await initDb();
  const id = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  await client.execute({
    sql: `INSERT INTO audit_logs (id, actor_login, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, params.actorLogin, params.action, params.targetType, params.targetId, params.details || null, Date.now()],
  });
}

export async function getAuditLogs(limit = 50): Promise<AuditLog[]> {
  await initDb();
  const result = await client.execute({
    sql: `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?`,
    args: [limit],
  });
  return result.rows.map((row) => ({
    id: String(row.id),
    actor_login: String(row.actor_login),
    action: String(row.action),
    target_type: String(row.target_type),
    target_id: String(row.target_id),
    details: row.details ? String(row.details) : null,
    created_at: Number(row.created_at),
  }));
}

export async function createProjectComplaint(params: {
  projectId: string;
  projectSlug: string;
  reporterLogin: string;
  reason: string;
}): Promise<void> {
  await initDb();
  const id = `complaint_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  await client.execute({
    sql: `INSERT INTO project_complaints (id, project_id, project_slug, reporter_login, reason, status, created_at) VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    args: [id, params.projectId, params.projectSlug, params.reporterLogin, params.reason.trim(), Date.now()],
  });
}

export async function getProjectComplaints(status?: string): Promise<ProjectComplaint[]> {
  await initDb();
  const sql = status
    ? `SELECT * FROM project_complaints WHERE status = ? ORDER BY created_at DESC`
    : `SELECT * FROM project_complaints ORDER BY created_at DESC`;
  const args = status ? [status] : [];
  const result = await client.execute({ sql, args });
  return result.rows.map((row) => ({
    id: String(row.id),
    project_id: String(row.project_id),
    project_slug: String(row.project_slug),
    reporter_login: String(row.reporter_login),
    reason: String(row.reason),
    status: (row.status as "pending" | "resolved" | "dismissed") || "pending",
    resolution: row.resolution ? String(row.resolution) : null,
    resolved_by: row.resolved_by ? String(row.resolved_by) : null,
    created_at: Number(row.created_at),
    resolved_at: row.resolved_at ? Number(row.resolved_at) : null,
  }));
}

export async function resolveProjectComplaint(
  id: string,
  resolution: string,
  resolverLogin: string,
  status: "resolved" | "dismissed" = "resolved"
): Promise<void> {
  await initDb();
  await client.execute({
    sql: `UPDATE project_complaints SET status = ?, resolution = ?, resolved_by = ?, resolved_at = ? WHERE id = ?`,
    args: [status, resolution.trim(), resolverLogin, Date.now(), id],
  });
}

export async function getCommentsByAuthor(authorHandle: string): Promise<(Comment & { project_name?: string; project_slug?: string })[]> {
  await initDb();
  const clean = authorHandle.replace(/^@/, "");
  const query = `
    SELECT c.*, p.name as project_name, p.slug as project_slug
    FROM comments c
    LEFT JOIN projects p ON c.project_id = p.id
    WHERE LOWER(c.author_handle) = LOWER(?) OR LOWER(c.author_name) = LOWER(?)
    ORDER BY c.created_at DESC
    LIMIT 50
  `;
  const result = await client.execute({ sql: query, args: [clean, clean] });
  return result.rows.map((row) => ({
    id: String(row.id),
    project_id: String(row.project_id),
    author_name: String(row.author_name),
    author_handle: row.author_handle ? String(row.author_handle) : null,
    author_avatar: row.author_avatar ? String(row.author_avatar) : null,
    content: String(row.content),
    created_at: Number(row.created_at),
    project_name: row.project_name ? String(row.project_name) : undefined,
    project_slug: row.project_slug ? String(row.project_slug) : undefined,
  }));
}

