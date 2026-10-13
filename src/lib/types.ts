export type ContributionMode = "tasks" | "team" | "onboarding";

export interface TeamRoleItem {
  role: string;
  commitment?: string;
  description?: string;
}

export interface ArchitectureItem {
  path: string;
  description: string;
}

export interface ContributorTask {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  estimated_time?: string;
  status?: "open" | "in_progress" | "review" | "completed" | "cancelled" | "closed";
  assignee?: {
    login: string;
    name?: string | null;
    avatar?: string | null;
  } | null;
  issue_number?: number;
  source?: "manual" | "github";
  created_at?: number;
  updated_at?: number;
}

export interface Project {
  id: string;
  name: string;
  full_name: string;
  slug: string;
  description: string | null;
  url: string;
  homepage: string | null;
  stars: number;
  forks: number;
  open_issues: number;
  language: string | null;
  topics: string[];
  readme: string | null;
  owner_avatar: string | null;
  owner_login: string | null;
  looking_for_contributors: boolean;
  contributor_roles: string[];
  contributor_tasks: string | null;
  parsed_tasks?: ContributorTask[];
  quickstart_command?: string | null;
  contact_url: string | null;
  modes?: ContributionMode[];
  team_roles_data?: TeamRoleItem[];
  architecture_map_data?: ArchitectureItem[];
  env_example?: string | null;
  created_at: number;
  updated_at: number;
  comments_count?: number;
  claims_count?: number;
  team_apps_count?: number;
  moderation_status?: "approved" | "pending" | "rejected" | "hidden";
  moderation_score?: number;
  moderation_flags?: {
    level: "danger" | "warning" | "info";
    code: string;
    message: string;
  }[];
  moderation_reviewed_at?: number | null;
  moderation_reviewed_by?: string | null;
  moderation_reason?: string | null;
  is_deleted?: boolean;
}

export interface AuditLog {
  id: string;
  actor_login: string;
  action: string;
  target_type: string;
  target_id: string;
  details?: string | null;
  created_at: number;
}

export interface ProjectComplaint {
  id: string;
  project_id: string;
  project_slug: string;
  reporter_login: string;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  resolution?: string | null;
  resolved_by?: string | null;
  created_at: number;
  resolved_at?: number | null;
}


export interface TeamApplication {
  id: string;
  project_id: string;
  project_slug: string;
  role: string;
  user_login: string;
  user_name: string | null;
  user_avatar: string | null;
  experience: string;
  contacts?: string | null;
  status: "pending" | "accepted" | "rejected";
  created_at: number;
  updated_at: number;
}


export interface Comment {
  id: string;
  project_id: string;
  author_name: string;
  author_handle: string | null;
  author_avatar: string | null;
  content: string;
  created_at: number;
}

export interface GitHubRepoDetails {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  topics: string[];
  owner: {
    login: string;
    avatar_url: string;
  };
  readme_content?: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: string;
  comments: number;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  } | null;
  labels: {
    id: number;
    name: string;
    color: string;
    description?: string;
  }[];
  body?: string;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string | null;
  body: string | null;
  html_url: string;
  published_at: string;
  prerelease: boolean;
  author: {
    login: string;
    avatar_url: string;
  } | null;
}

