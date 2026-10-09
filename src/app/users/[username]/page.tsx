import { getSession } from "@/lib/auth";
import { getProjectsByOwner, getCommentsByAuthor } from "@/lib/projects";
import { fetchUserRepos } from "@/lib/user-repos";
import { getClaimsByUser, getTeamApplicationsByUser } from "@/lib/claims";
import {
  getUserAvailability,
  calculateUserBadges,
  calculateUserStack,
} from "@/lib/user-profile";
import { UserProfileTabs } from "@/components/UserProfileTabs";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ExternalLink,
  MapPin,
  Globe,
  Building,
  Star,
  Users,
  FolderGit2,
  Sparkles,
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

  const [
    githubUser,
    session,
    userProjects,
    userComments,
    userClaims,
    userTeamApps,
    userAvailability,
  ] = await Promise.all([
    fetchGitHubUserProfile(cleanUsername),
    getSession(),
    getProjectsByOwner(cleanUsername),
    getCommentsByAuthor(cleanUsername),
    getClaimsByUser(cleanUsername),
    getTeamApplicationsByUser(cleanUsername),
    getUserAvailability(cleanUsername),
  ]);

  if (
    !githubUser &&
    userProjects.length === 0 &&
    userClaims.length === 0 &&
    userTeamApps.length === 0
  ) {
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

  const badges = calculateUserBadges({
    projects: userProjects,
    claims: userClaims,
    teamApps: userTeamApps,
    comments: userComments,
    totalStars,
  });

  const stack = calculateUserStack(userProjects, userClaims);

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

      {/* Interactive Tabs: Projects, Tasks, Teams, Badges, Activity, README Badge */}
      <UserProfileTabs
        cleanUsername={cleanUsername}
        isOwner={isOwner}
        projects={userProjects}
        claims={userClaims}
        teamApps={userTeamApps}
        comments={userComments}
        availability={userAvailability}
        badges={badges}
        stack={stack}
        userRepos={userRepos}
        session={session}
      />
    </div>
  );
}
