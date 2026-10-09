export interface ModerationFlag {
  level: "danger" | "warning" | "info";
  code: string;
  message: string;
}

export interface ModerationResult {
  status: "approved" | "pending" | "rejected";
  score: number;
  flags: ModerationFlag[];
  details: {
    hasWorkflows: boolean;
    manualReleasesCount: number;
    actionsReleasesCount: number;
    suspiciousFiles: string[];
    authorAgeDays?: number;
    rootFilesCount: number;
  };
}

const SUSPICIOUS_EXTENSIONS = /\.(exe|scr|bat|cmd|vbs|ps1|dll|bin|iso|msi|pif|lnk|hta|cpl)$/i;
const ARCHIVE_EXTENSIONS = /\.(zip|rar|7z|tar|gz|bz2)$/i;

export async function analyzeRepository(owner: string, repo: string): Promise<ModerationResult> {
  const flags: ModerationFlag[] = [];
  let score = 100;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "OSS-Hub-Platform",
  };

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let hasWorkflows = false;
  let manualReleasesCount = 0;
  let actionsReleasesCount = 0;
  const suspiciousFiles: string[] = [];
  let authorAgeDays: number | undefined;
  let rootFilesCount = 0;

  // 1. Check Root Directory Contents
  try {
    const contentsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
      headers,
      next: { revalidate: 60 },
    });

    if (contentsRes.ok) {
      const items = await contentsRes.json();
      if (Array.isArray(items)) {
        rootFilesCount = items.length;

        for (const item of items) {
          const name = item.name.toLowerCase();

          if (SUSPICIOUS_EXTENSIONS.test(name)) {
            suspiciousFiles.push(item.name);
          } else if (ARCHIVE_EXTENSIONS.test(name)) {
            suspiciousFiles.push(item.name);
          }
        }

        if (suspiciousFiles.length > 0) {
          flags.push({
            level: "danger",
            code: "SUSPICIOUS_ROOT_FILES",
            message: `В корне обнаружены подозрительные бинарные файлы/архивы: ${suspiciousFiles.join(", ")}`,
          });
          score -= 45;
        }

        if (rootFilesCount <= 2) {
          flags.push({
            level: "warning",
            code: "MINIMAL_FILES",
            message: `В репозитории подозрительно мало файлов (${rootFilesCount}). Возможна заглушка или дроппер.`,
          });
          score -= 15;
        }
      }
    } else if (contentsRes.status === 404) {
      flags.push({
        level: "danger",
        code: "EMPTY_REPOSITORY",
        message: "Репозиторий пуст или не содержит файлов в основной ветке. Возможен фейк.",
      });
      score -= 50;
    }
  } catch (err) {
    console.warn("Failed to check repo contents:", err);
  }

  // 1.1 Check XSS and Malicious scripts in repo metadata
  try {
    const repoMetaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
      next: { revalidate: 60 },
    });
    if (repoMetaRes.ok) {
      const repoData = await repoMetaRes.json();
      const desc = (repoData.description || "").toLowerCase();
      const hp = (repoData.homepage || "").toLowerCase();
      if (
        desc.includes("javascript:") ||
        desc.includes("<script") ||
        desc.includes("onerror=") ||
        desc.includes("onload=") ||
        hp.includes("javascript:")
      ) {
        flags.push({
          level: "danger",
          code: "XSS_METADATA_INJECTION",
          message: "В описании или homepage репозитория обнаружен явный XSS-пейлоад (javascript: URI или тег скрипта).",
        });
        score -= 60;
      }
    }
  } catch (err) {
    console.warn("Failed to check repo metadata for XSS:", err);
  }

  // 2. Check GitHub Actions Workflows
  try {
    const wfRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/.github/workflows`, {
      headers,
      next: { revalidate: 60 },
    });
    if (wfRes.ok) {
      const wfItems = await wfRes.json();
      hasWorkflows = Array.isArray(wfItems) && wfItems.length > 0;
    }
  } catch {
    hasWorkflows = false;
  }

  // 3. Check Releases (Manual vs GitHub Actions)
  try {
    const relRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases?per_page=10`, {
      headers,
      next: { revalidate: 60 },
    });

    if (relRes.ok) {
      const releases = await relRes.json();
      if (Array.isArray(releases) && releases.length > 0) {
        let manualWithBinaries = 0;

        for (const rel of releases) {
          const authorLogin = rel.author?.login?.toLowerCase() || "";
          const isBot =
            authorLogin.includes("bot") ||
            authorLogin.includes("action") ||
            authorLogin === "github-actions[bot]";

          if (isBot) {
            actionsReleasesCount++;
          } else {
            manualReleasesCount++;
            const hasAssets = Array.isArray(rel.assets) && rel.assets.length > 0;
            if (hasAssets) {
              manualWithBinaries++;
            }
          }
        }

        if (manualWithBinaries > 0) {
          flags.push({
            level: "danger",
            code: "MANUAL_BINARY_RELEASES",
            message: `${manualWithBinaries} релиз(ов) с бинарными файлами загружены вручную аккаунтом пользователя, а не через проверенный CI/CD (GitHub Actions). Повышенный риск вредоносных билдов.`,
          });
          score -= 40;
        } else if (manualReleasesCount > 0 && !hasWorkflows) {
          flags.push({
            level: "warning",
            code: "MANUAL_RELEASES_NO_CI",
            message: "Релизы создаются вручную без использования GitHub Actions workflows.",
          });
          score -= 20;
        }
      }
    }
  } catch (err) {
    console.warn("Failed to check repo releases:", err);
  }

  // 4. Check Author Profile Age
  try {
    const userRes = await fetch(`https://api.github.com/users/${owner}`, {
      headers,
      next: { revalidate: 300 },
    });

    if (userRes.ok) {
      const userData = await userRes.json();
      if (userData.created_at) {
        const createdMs = new Date(userData.created_at).getTime();
        const nowMs = Date.now();
        authorAgeDays = Math.floor((nowMs - createdMs) / (1000 * 60 * 60 * 24));

        if (authorAgeDays < 14) {
          flags.push({
            level: "danger",
            code: "NEW_ACCOUNT_DANGER",
            message: `Аккаунт автора создан всего ${authorAgeDays} дн. назад (< 14 дней). Высокий риск фейка или одноразового профиля.`,
          });
          score -= 35;
        } else if (authorAgeDays < 60) {
          flags.push({
            level: "warning",
            code: "NEW_ACCOUNT_WARNING",
            message: `Аккаунт автора создан недавно (${authorAgeDays} дн. назад).`,
          });
          score -= 15;
        }
      }
    }
  } catch (err) {
    console.warn("Failed to check user info:", err);
  }

  // Final score clamping
  score = Math.max(0, Math.min(100, score));

  // Determine Moderation Status
  let status: "approved" | "pending" | "rejected" = "approved";
  const hasDanger = flags.some((f) => f.level === "danger");
  const warningsCount = flags.filter((f) => f.level === "warning").length;

  if (hasDanger || score < 60 || warningsCount >= 2) {
    status = "pending";
  }

  return {
    status,
    score,
    flags,
    details: {
      hasWorkflows,
      manualReleasesCount,
      actionsReleasesCount,
      suspiciousFiles,
      authorAgeDays,
      rootFilesCount,
    },
  };
}
