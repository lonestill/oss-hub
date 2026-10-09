import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const url = process.env.TURSO_DATABASE_URL || (process.env.VERCEL ? "file:/tmp/oss_hub.db" : "file:oss_hub.db");
const authToken = process.env.TURSO_AUTH_TOKEN;

export const client = createClient({
  url,
  authToken,
});

export const db = drizzle(client);

let isInitialized = false;

export async function initDb() {
  if (isInitialized) return;

  await client.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      full_name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      url TEXT NOT NULL,
      homepage TEXT,
      stars INTEGER DEFAULT 0,
      forks INTEGER DEFAULT 0,
      open_issues INTEGER DEFAULT 0,
      language TEXT,
      topics TEXT DEFAULT '[]',
      readme TEXT,
      owner_avatar TEXT,
      owner_login TEXT,
      looking_for_contributors INTEGER DEFAULT 0,
      contributor_roles TEXT DEFAULT '[]',
      contributor_tasks TEXT,
      quickstart_command TEXT,
      contact_url TEXT,
      moderation_status TEXT DEFAULT 'approved',
      moderation_score INTEGER DEFAULT 100,
      moderation_flags TEXT DEFAULT '[]',
      moderation_reviewed_at INTEGER,
      moderation_reviewed_by TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  try {
    await client.execute(`ALTER TABLE projects ADD COLUMN quickstart_command TEXT;`);
  } catch {}

  await client.execute(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_handle TEXT,
      author_avatar TEXT,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_projects_stars ON projects(stars);
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_comments_project_id ON comments(project_id);
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS task_claims (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      project_slug TEXT NOT NULL,
      issue_number INTEGER NOT NULL,
      issue_title TEXT NOT NULL,
      user_login TEXT NOT NULL,
      user_name TEXT,
      user_avatar TEXT,
      pitch TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      pr_url TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS task_messages (
      id TEXT PRIMARY KEY,
      claim_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      sender_login TEXT NOT NULL,
      sender_name TEXT,
      sender_avatar TEXT,
      is_author INTEGER DEFAULT 0,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_task_claims_project ON task_claims(project_id);
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_task_claims_user ON task_claims(user_login);
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_task_messages_claim ON task_messages(claim_id);
  `);

  try {
    await client.execute(`ALTER TABLE projects ADD COLUMN modes TEXT DEFAULT '["tasks","team","onboarding"]';`);
  } catch {}
  try {
    await client.execute(`ALTER TABLE projects ADD COLUMN team_roles_data TEXT DEFAULT '[]';`);
  } catch {}
  try {
    await client.execute(`ALTER TABLE projects ADD COLUMN architecture_map_data TEXT DEFAULT '[]';`);
  } catch {}
  try {
    await client.execute(`ALTER TABLE projects ADD COLUMN env_example TEXT;`);
  } catch {}

  await client.execute(`
    CREATE TABLE IF NOT EXISTS team_applications (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      project_slug TEXT NOT NULL,
      role TEXT NOT NULL,
      user_login TEXT NOT NULL,
      user_name TEXT,
      user_avatar TEXT,
      experience TEXT NOT NULL,
      contacts TEXT,
      status TEXT DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_team_apps_project ON team_applications(project_id);
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_team_apps_user ON team_applications(user_login);
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS admins (
      login TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL
    );
  `);

  isInitialized = true;
}
