import { getSession } from "@/lib/auth";
import { getProjectsByOwner, getCommentsByAuthor } from "@/lib/projects";
import { fetchUserRepos } from "@/lib/user-repos";
import { ProjectCard } from "@/components/ProjectCard";
import { SubmitForm } from "@/components/SubmitForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getClaimsByUser, getTeamApplicationsByUser } from "@/lib/claims";
import {
  ExternalLink,
  MapPin,
  Globe,
  Building,
  Star,
  Users,
  FolderGit2,
  MessageSquare,
  Plus,
  Sparkles,
  CheckCircle2,
  GitPullRequest,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

interface GitHubUserProfile {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  blog: string | null;
  company: string | null;
  location: string | null;
  public_repos: number;
  followers: number;
  following: number;
  html_url: string;
}

async function fetchGitHubUserProfile(username: string): Promise<GitHubUserProfile | null> {
  const clean = username.trim().replace(/^@/, "");
  try {
    const res = await fetch(`https://api.github.com/users/${clean}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "OSS-Hub-Platform",
      },
      next: { revalidate: 300 },
    });
    if (res.ok) {
      return (await res.json()) as GitHubUserProfile;
    }
  } catch (err) {
    console.error("Failed to fetch user from GitHub API:", err);
  }
  return null;
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;
  const cleanUsername = decodeURIComponent(username).trim().replace(/^@/, "");

  const [githubUser, session, userProjects, userComments, userClaims, userTeamApps] = await Promise.all([
    fetchGitHubUserProfile(cleanUsername),
    getSession(),
    getProjectsByOwner(cleanUsername),
    getCommentsByAuthor(cleanUsername),
    getClaimsByUser(cleanUsername),
    getTeamApplicationsByUser(cleanUsername),
  ]);

  if (!githubUser && userProjects.length === 0 && userClaims.length === 0 && userTeamApps.length === 0) {
    notFound();
  }

  const isOwner = Boolean(
    session && session.login.toLowerCase() === cleanUsername.toLowerCase()
  );

  const userRepos = isOwner
    ? await fetchUserRepos(session?.token, session?.login)
    : [];

  const displayName = githubUser?.name || cleanUsername;
  const avatarUrl =
    githubUser?.avatar_url || userProjects[0]?.owner_avatar || "";
  const totalStars = userProjects.reduce((sum, p) => sum + p.stars, 0);
  const lookingCount = userProjects.filter((p) => p.looking_for_contributors).length;

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-[#8a92a3]">
        <Link href="/" className="hover:text-white transition-colors">
          Каталог
        </Link>
        <span>/</span>
        <span className="text-white font-medium">@{cleanUsername}</span>
      </div>

      {/* Profile Header Card */}
      <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-20 h-20 rounded-2xl border border-white/10 bg-[#151821] object-cover shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl border border-white/10 bg-[#151821] flex items-center justify-center font-bold text-2xl text-white shrink-0">
                {cleanUsername.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
                  {displayName}
                </h1>
                {isOwner && (
                  <span className="px-2 py-0.5 rounded-md bg-[#e5484d]/10 text-[#e5484d] text-xs font-semibold border border-[#e5484d]/20">
                    Ваш профиль
                  </span>
                )}
              </div>
              <div className="text-xs text-[#8a92a3] font-mono">
                @{cleanUsername}
              </div>

              {githubUser?.bio && (
                <p className="text-xs text-[#d1d5db] leading-relaxed max-w-xl pt-1">
                  {githubUser.bio}
                </p>
              )}

              {/* Meta details */}
              <div className="flex items-center gap-4 text-xs text-[#8a92a3] flex-wrap pt-2">
                {githubUser?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{githubUser.location}</span>
                  </span>
                )}
                {githubUser?.company && (
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5" />
                    <span>{githubUser.company}</span>
                  </span>
                )}
                {githubUser?.blog && (
                  <a
                    href={
                      githubUser.blog.startsWith("http")
                        ? githubUser.blog
                        : `https://${githubUser.blog}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{githubUser.blog}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* External Profile Link */}
          <div className="shrink-0">
            <a
              href={githubUser?.html_url || `https://github.com/${cleanUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-[#1d212b] bg-[#151821] hover:border-[#2e3444] text-xs font-medium text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>GitHub профиль</span>
            </a>
          </div>
        </div>

        {/* Platform Telemetry Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-[#1d212b] pt-5 mt-6 text-xs">
          <div className="rounded-xl border border-[#1d212b] bg-[#151821] p-3">
            <span className="text-[11px] text-[#8a92a3] block">Проектов на платформе</span>
            <span className="text-lg font-bold text-white font-mono mt-0.5 block">
              {userProjects.length}
            </span>
          </div>

          <div className="rounded-xl border border-[#1d212b] bg-[#151821] p-3">
            <span className="text-[11px] text-[#8a92a3] block">Задач в работе</span>
            <span className="text-lg font-bold text-[#e5484d] font-mono mt-0.5 block">
              {userClaims.length}
            </span>
          </div>

          <div className="rounded-xl border border-[#1d212b] bg-[#151821] p-3">
            <span className="text-[11px] text-[#8a92a3] block">Заявок в команды</span>
            <span className="text-lg font-bold text-[#38bdf8] font-mono mt-0.5 block">
              {userTeamApps.length}
            </span>
          </div>

          <div className="rounded-xl border border-[#1d212b] bg-[#151821] p-3">
            <span className="text-[11px] text-[#8a92a3] block">Всего звёзд</span>
            <span className="text-lg font-bold text-white font-mono mt-0.5 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-[#e5484d] fill-[#e5484d]" />
              <span>{totalStars.toLocaleString()}</span>
            </span>
          </div>
        </div>
      </div>

      {/* If viewing own profile, show Add Project section */}
      {isOwner && (
        <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Опубликовать репозиторий
              </h2>
              <p className="text-xs text-[#8a92a3]">
                Добавьте проект из своего аккаунта GitHub или укажите ссылку на любой публичный репозиторий.
              </p>
            </div>
          </div>
          <SubmitForm session={session} userRepos={userRepos} />
        </div>
      )}

      {/* User's Platform Projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#1d212b] pb-3">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-[#8a92a3]" />
            <h2 className="text-base font-semibold text-white">
              Опубликованные проекты ({userProjects.length})
            </h2>
          </div>
        </div>

        {userProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-10 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#8a92a3]">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-white">
              {isOwner
                ? "У вас пока нет опубликованных проектов"
                : "У пользователя пока нет опубликованных проектов"}
            </div>
            <p className="text-xs text-[#8a92a3] max-w-sm mx-auto">
              {isOwner
                ? "Выберите один из ваших репозиториев выше, чтобы добавить его на платформу."
                : "Автор ещё не добавил свои репозитории в каталог."}
            </p>
          </div>
        )}
      </div>

      {/* Contributor Activity: Task Claims & Team Applications */}
      {(userClaims.length > 0 || userTeamApps.length > 0) && (
        <div className="space-y-6 pt-2">
          {/* 1. Claims */}
          {userClaims.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#1d212b] pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#e5484d]" />
                  <h2 className="text-base font-semibold text-white">
                    Задачи в работе ({userClaims.length})
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {userClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="p-4 rounded-xl border border-[#1d212b] bg-[#0f1117] space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/projects/${claim.project_slug}`}
                        className="text-xs text-[#8a92a3] hover:text-white transition-colors truncate"
                      >
                        {claim.project_slug}
                      </Link>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          claim.status === "assigned"
                            ? "bg-[#d29922]/20 text-[#d29922]"
                            : claim.status === "completed"
                            ? "bg-[#3fb950]/20 text-[#3fb950]"
                            : claim.status === "rejected"
                            ? "bg-[#e5484d]/20 text-[#e5484d]"
                            : "bg-white/10 text-white"
                        }`}
                      >
                        {claim.status === "assigned"
                          ? "В работе"
                          : claim.status === "completed"
                          ? "Выполнено"
                          : claim.status === "rejected"
                          ? "Отклонено"
                          : "На рассмотрении"}
                      </span>
                    </div>

                    <Link
                      href={`/projects/${claim.project_slug}`}
                      className="font-semibold text-white text-xs block hover:text-[#e5484d] transition-colors leading-snug"
                    >
                      #{claim.issue_number} {claim.issue_title}
                    </Link>

                    <p className="text-[11px] text-[#8a92a3] line-clamp-2">
                      {claim.pitch}
                    </p>

                    {claim.pr_url && (
                      <div className="pt-2 border-t border-[#1d212b] flex items-center gap-1.5 text-[11px]">
                        <GitPullRequest className="w-3.5 h-3.5 text-[#38bdf8]" />
                        <a
                          href={claim.pr_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#38bdf8] hover:underline font-mono truncate"
                        >
                          {claim.pr_url}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Team Applications */}
          {userTeamApps.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#1d212b] pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#38bdf8]" />
                  <h2 className="text-base font-semibold text-white">
                    Заявки в команды ({userTeamApps.length})
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {userTeamApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl border border-[#1d212b] bg-[#0f1117] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/projects/${app.project_slug}`}
                        className="text-xs text-[#8a92a3] hover:text-white transition-colors truncate"
                      >
                        {app.project_slug}
                      </Link>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          app.status === "accepted"
                            ? "bg-[#3fb950]/20 text-[#3fb950]"
                            : app.status === "rejected"
                            ? "bg-[#e5484d]/20 text-[#e5484d]"
                            : "bg-white/10 text-white"
                        }`}
                      >
                        {app.status === "accepted"
                          ? "Принят в команду"
                          : app.status === "rejected"
                          ? "Отклонено"
                          : "Ожидает ответа"}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-white">
                      Роль: <span className="text-[#38bdf8]">{app.role}</span>
                    </div>

                    <p className="text-[11px] text-[#8a92a3] line-clamp-2">
                      {app.experience}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Comments / Activity */}
      {userComments.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-[#1d212b] pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#8a92a3]" />
              <h2 className="text-base font-semibold text-white">
                Активность в обсуждениях ({userComments.length})
              </h2>
            </div>
          </div>

          <div className="space-y-2.5">
            {userComments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-xl border border-[#1d212b] bg-[#0f1117] p-4 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[#8a92a3]">В проекте:</span>
                    {comment.project_slug ? (
                      <Link
                        href={`/projects/${comment.project_slug}`}
                        className="font-semibold text-white hover:underline truncate"
                      >
                        {comment.project_name || comment.project_slug}
                      </Link>
                    ) : (
                      <span className="font-semibold text-white">
                        {comment.project_name || "Проект"}
                      </span>
                    )}
                  </div>
                  <span className="text-[#8a92a3] text-[11px] shrink-0">
                    {new Date(comment.created_at).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
                <p className="text-xs text-[#d1d5db] whitespace-pre-wrap leading-relaxed">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
