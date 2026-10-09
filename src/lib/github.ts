import { GitHubRepoDetails, GitHubIssue, GitHubRelease } from "./types";

export function parseGitHubUrl(input: string): { owner: string; repo: string } | null {
  const cleaned = input.trim();
  // match full URLs like https://github.com/owner/repo or github.com/owner/repo
  const urlMatch = cleaned.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(?:\/.*)?$/);
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, "") };
  }

  // match shorthand like owner/repo
  const shortMatch = cleaned.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (shortMatch) {
    return { owner: shortMatch[1], repo: shortMatch[2].replace(/\.git$/, "") };
  }

  return null;
}

export async function fetchGitHubRepo(owner: string, repo: string): Promise<GitHubRepoDetails> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "OSS-Hub-Platform",
  };

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers,
    next: { revalidate: 300 }, // cache 5 min
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Репозиторий ${owner}/${repo} не найден или является приватным.`);
    }
    if (res.status === 403) {
      throw new Error(`Превышен лимит запросов GitHub API. Попробуйте позже.`);
    }
    throw new Error(`Ошибка GitHub API: ${res.statusText}`);
  }

  const data = await res.json();

  // Try fetching README
  let readme_content = "";
  try {
    const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers,
      next: { revalidate: 300 },
    });
    if (readmeRes.ok) {
      const readmeData = await readmeRes.json();
      if (readmeData.content && readmeData.encoding === "base64") {
        readme_content = Buffer.from(readmeData.content, "base64").toString("utf-8");
      }
    }
  } catch (err) {
    console.warn("Failed to fetch README via API, trying raw:", err);
  }

  // Fallback to raw README if empty
  if (!readme_content) {
    try {
      const rawRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/README.md`);
      if (rawRes.ok) {
        readme_content = await rawRes.text();
      }
    } catch {
      // ignore
    }
  }

  return {
    name: data.name,
    full_name: data.full_name,
    description: data.description,
    html_url: data.html_url,
    homepage: data.homepage,
    stargazers_count: data.stargazers_count,
    forks_count: data.forks_count,
    open_issues_count: data.open_issues_count,
    language: data.language,
    topics: data.topics || [],
    owner: {
      login: data.owner.login,
      avatar_url: data.owner.avatar_url,
    },
    readme_content,
  };
}

export async function fetchGitHubIssues(owner: string, repo: string): Promise<GitHubIssue[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "OSS-Hub-Platform",
  };

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=15&sort=updated`, {
      headers,
      next: { revalidate: 120 }, // 2 min cache
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      // Filter out pull requests as GitHub issues endpoint returns both
      .filter((item: any) => !item.pull_request)
      .map((item: any) => ({
        id: item.id,
        number: item.number,
        title: item.title,
        html_url: item.html_url,
        state: item.state,
        comments: item.comments || 0,
        created_at: item.created_at,
        updated_at: item.updated_at,
        user: item.user
          ? {
              login: item.user.login,
              avatar_url: item.user.avatar_url,
            }
          : null,
        labels: Array.isArray(item.labels)
          ? item.labels.map((l: any) => ({
              id: l.id,
              name: l.name,
              color: l.color,
              description: l.description,
            }))
          : [],
        body: item.body || "",
      }));
  } catch (err) {
    console.error(`Failed to fetch issues for ${owner}/${repo}:`, err);
    return [];
  }
}

export async function fetchGitHubReleases(owner: string, repo: string): Promise<GitHubRelease[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "OSS-Hub-Platform",
  };

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases?per_page=10`, {
      headers,
      next: { revalidate: 300 }, // 5 min cache
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
      id: item.id,
      tag_name: item.tag_name,
      name: item.name || item.tag_name,
      body: item.body || "",
      html_url: item.html_url,
      published_at: item.published_at || item.created_at,
      prerelease: Boolean(item.prerelease),
      author: item.author
        ? {
            login: item.author.login,
            avatar_url: item.author.avatar_url,
          }
        : null,
    }));
  } catch (err) {
    console.error(`Failed to fetch releases for ${owner}/${repo}:`, err);
    return [];
  }
}


