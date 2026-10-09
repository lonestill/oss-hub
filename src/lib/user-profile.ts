import { client, initDb } from "./db";
import { Project, Comment, TeamApplication } from "./types";
import { TaskClaim } from "./claims";

export interface UserAvailability {
  login: string;
  status: "open" | "busy" | "mentor" | "maintainer";
  status_text: string | null;
  preferred_stack: string | null;
  hours_per_week: string | null;
  telegram: string | null;
  updated_at: number;
}

export interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  category: "code" | "maintainer" | "community" | "stack";
  unlocked: boolean;
  progressText?: string;
}

export interface LanguageStat {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

const LANGUAGE_COLORS: Record<string, string> = {
  rust: "#dea584",
  typescript: "#3178c6",
  "c++": "#f34b7d",
  c: "#555555",
  python: "#3572a5",
  go: "#00add8",
  javascript: "#f1e05a",
  html: "#e34c26",
  css: "#563d7c",
  shell: "#89e051",
  zig: "#ec915c",
};

export async function getUserAvailability(login: string): Promise<UserAvailability | null> {
  await initDb();
  const cleanLogin = login.trim().toLowerCase();
  const res = await client.execute({
    sql: `SELECT * FROM user_profiles WHERE LOWER(login) = ? LIMIT 1`,
    args: [cleanLogin],
  });

  if (res.rows.length === 0) {
    return null;
  }

  const row = res.rows[0];
  return {
    login: String(row.login),
    status: (row.status as any) || "open",
    status_text: row.status_text ? String(row.status_text) : null,
    preferred_stack: row.preferred_stack ? String(row.preferred_stack) : null,
    hours_per_week: row.hours_per_week ? String(row.hours_per_week) : null,
    telegram: row.telegram ? String(row.telegram) : null,
    updated_at: Number(row.updated_at),
  };
}

export async function upsertUserAvailability(data: {
  login: string;
  status: "open" | "busy" | "mentor" | "maintainer";
  status_text?: string | null;
  preferred_stack?: string | null;
  hours_per_week?: string | null;
  telegram?: string | null;
}): Promise<void> {
  await initDb();
  const cleanLogin = data.login.trim().toLowerCase();
  const now = Date.now();

  await client.execute({
    sql: `
      INSERT INTO user_profiles (login, status, status_text, preferred_stack, hours_per_week, telegram, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(login) DO UPDATE SET
        status = excluded.status,
        status_text = excluded.status_text,
        preferred_stack = excluded.preferred_stack,
        hours_per_week = excluded.hours_per_week,
        telegram = excluded.telegram,
        updated_at = excluded.updated_at
    `,
    args: [
      cleanLogin,
      data.status || "open",
      data.status_text?.trim() || null,
      data.preferred_stack?.trim() || null,
      data.hours_per_week?.trim() || null,
      data.telegram?.trim() || null,
      now,
    ],
  });
}

export function calculateUserStack(
  projects: Project[],
  claims: TaskClaim[]
): LanguageStat[] {
  const counts: Record<string, number> = {};

  for (const p of projects) {
    if (p.language && p.language.trim()) {
      const lang = p.language.trim();
      counts[lang] = (counts[lang] || 0) + 3; // heavier weight for own projects
    }
  }

  // Also include topics or task language if available
  for (const c of claims) {
    // Project slug can help infer, but we mostly count active claims
    counts["Rust"] = (counts["Rust"] || 0); // ensure entry exists if relevant
  }

  const entries = Object.entries(counts).filter(([_, count]) => count > 0);
  const total = entries.reduce((sum, [_, count]) => sum + count, 0);

  if (total === 0) return [];

  return entries
    .map(([name, count]) => {
      const percentage = Math.round((count / total) * 100);
      const color =
        LANGUAGE_COLORS[name.toLowerCase()] || "#8a92a3";
      return {
        name,
        count,
        percentage,
        color,
      };
    })
    .sort((a, b) => b.percentage - a.percentage);
}

export function calculateUserBadges(params: {
  projects: Project[];
  claims: TaskClaim[];
  teamApps: TeamApplication[];
  comments: Comment[];
  totalStars: number;
}): AchievementBadge[] {
  const { projects, claims, teamApps, comments, totalStars } = params;

  const hasPR = claims.some((c) => Boolean(c.pr_url && c.pr_url.trim()));
  const acceptedTeam = teamApps.some((a) => a.status === "accepted");
  const completedTask = claims.some((c) => c.status === "completed");
  const uniqueLangs = new Set(
    projects.map((p) => (p.language || "").trim().toLowerCase()).filter(Boolean)
  );

  return [
    {
      id: "maintainer",
      name: "Maintainer",
      description: "Опубликовал собственный открытый репозиторий в каталоге",
      category: "maintainer",
      unlocked: projects.length >= 1,
      progressText: `${projects.length} / 1 проект`,
    },
    {
      id: "code_shipper",
      name: "Code Shipper",
      description: "Привязал открытый Pull Request к задаче на платформе",
      category: "code",
      unlocked: hasPR,
      progressText: hasPR ? "Выполнен PR" : "0 / 1 PR",
    },
    {
      id: "star_collector",
      name: "Star Collector",
      description: "Суммарно собрал более 10 звёзд на своих репозиториях",
      category: "maintainer",
      unlocked: totalStars >= 10,
      progressText: `${totalStars} / 10 звёзд`,
    },
    {
      id: "team_player",
      name: "Team Player",
      description: "Успешно принят в команду проекта через воронку заявок",
      category: "community",
      unlocked: acceptedTeam,
      progressText: acceptedTeam ? "В команде" : "0 / 1 команда",
    },
    {
      id: "task_hunter",
      name: "Task Hunter",
      description: "Взял в работу и подтвердил задачу из бэклога",
      category: "code",
      unlocked: claims.length >= 1,
      progressText: `${claims.length} / 1 задача`,
    },
    {
      id: "polyglot",
      name: "Polyglot",
      description: "Создаёт проекты или контрибьютит на 2+ разных языках",
      category: "stack",
      unlocked: uniqueLangs.size >= 2,
      progressText: `${uniqueLangs.size} / 2 языка`,
    },
    {
      id: "active_voice",
      name: "Active Voice",
      description: "Участвует в технических дискуссиях и ревью проектов",
      category: "community",
      unlocked: comments.length >= 1,
      progressText: `${comments.length} / 1 комментарий`,
    },
  ];
}
