import { client, initDb } from "./db";
import { Project, Comment } from "./types";
import { fetchGitHubRepo, parseGitHubUrl } from "./github";
import { analyzeRepository } from "./moderation";

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
    created_at: Number(row.created_at),
    updated_at: Number(row.updated_at),
    comments_count: Number(row.comments_count || 0),
    claims_count: Number(row.claims_count || 0),
    team_apps_count: Number(row.team_apps_count || 0),
  };

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

  if (options?.search) {
    query += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.topics LIKE ? OR p.full_name LIKE ?)`;
    const s = `%${options.search}%`;
    args.push(s, s, s, s);
  }

  if (options?.language) {
    query += ` AND LOWER(p.language) = LOWER(?)`;
    args.push(options.language);
  }

  if (options?.lookingForContributors) {
    query += ` AND p.looking_for_contributors = 1`;
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
    sql: `SELECT id, created_at FROM projects WHERE full_name = ? LIMIT 1`,
    args: [details.full_name],
  });

  const id = existing.rows.length > 0 ? String(existing.rows[0].id) : `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const createdAt = existing.rows.length > 0 ? Number(existing.rows[0].created_at) : now;

  await client.execute({
    sql: `
      INSERT INTO projects (
        id, name, full_name, slug, description, url, homepage,
        stars, forks, open_issues, language, topics, readme,
        owner_avatar, owner_login, looking_for_contributors,
        contributor_roles, contributor_tasks, contact_url,
        moderation_status, moderation_score, moderation_flags,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      moderation.status,
      moderation.score,
      JSON.stringify(moderation.flags),
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
  status: "approved" | "pending" | "rejected",
  reviewer: string
) {
  await initDb();
  await client.execute({
    sql: `UPDATE projects SET moderation_status = ?, moderation_reviewed_at = ?, moderation_reviewed_by = ? WHERE id = ?`,
    args: [status, Date.now(), reviewer, id],
  });
}

export async function deleteProject(id: string) {
  await initDb();
  await client.execute({
    sql: `DELETE FROM comments WHERE project_id = ?`,
    args: [id],
  });
  await client.execute({
    sql: `DELETE FROM projects WHERE id = ?`,
    args: [id],
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

