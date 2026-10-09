export interface GitHubUserRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  fork: boolean;
  updated_at: string;
}

export async function fetchUserRepos(token?: string, username?: string): Promise<GitHubUserRepo[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "OSS-Hub-Platform",
  };

  const serverToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  let endpoint: string | null = null;

  if (token) {
    // Authenticated user with their own OAuth token
    headers.Authorization = `Bearer ${token}`;
    endpoint = "https://api.github.com/user/repos?per_page=100&sort=updated&type=owner";
  } else if (username) {
    // Unauthenticated or dev login: fetch public repos for that specific username
    if (serverToken) {
      headers.Authorization = `Bearer ${serverToken}`;
    }
    endpoint = `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`;
  }

  if (!endpoint) return [];

  try {
    const res = await fetch(endpoint, {
      headers,
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.warn("Failed to fetch user repos from GitHub API:", res.status, res.statusText);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((r: any) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      description: r.description,
      html_url: r.html_url,
      stargazers_count: r.stargazers_count || 0,
      forks_count: r.forks_count || 0,
      language: r.language,
      fork: Boolean(r.fork),
      updated_at: r.updated_at,
    }));
  } catch (err) {
    console.error("Error fetching user repos:", err);
    return [];
  }
}
