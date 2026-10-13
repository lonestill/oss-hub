import { getProjectBySlug, getComments } from "@/lib/projects";
import { getSession, isUserAdmin } from "@/lib/auth";
import { fetchGitHubIssues, fetchGitHubReleases } from "@/lib/github";
import { notFound } from "next/navigation";
import { Star, GitFork, AlertCircle, ExternalLink, Globe, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { CommentsSection } from "@/components/CommentsSection";
import { ReportProjectModal } from "@/components/ReportProjectModal";
import { ProjectIssuesList } from "@/components/ProjectIssuesList";
import { ProjectDocsTabs } from "@/components/ProjectDocsTabs";
import { ContributorFastTrack } from "@/components/ContributorFastTrack";
import { getClaimsByProject, getTeamApplicationsByProject } from "@/lib/claims";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const session = await getSession();
  const isAdmin = session ? await isUserAdmin(session.login) : false;
  const isOwner = Boolean(
    session &&
      project.owner_login &&
      session.login.toLowerCase() === project.owner_login.toLowerCase()
  );

  // Access control based on moderation status
  if (project.moderation_status === "rejected" && !isAdmin) {
    notFound();
  }

  if (project.moderation_status === "pending" && !isAdmin && !isOwner) {
    notFound();
  }

  const [owner, repo] = project.full_name.split("/");
  const [comments, issues, claims, teamApplications, releases] = await Promise.all([
    getComments(project.id),
    owner && repo ? fetchGitHubIssues(owner, repo) : Promise.resolve([]),
    getClaimsByProject(project.id),
    isOwner || isAdmin ? getTeamApplicationsByProject(project.id) : Promise.resolve([]),
    owner && repo ? fetchGitHubReleases(owner, repo) : Promise.resolve([]),
  ]);

  const attentionCount =
    claims.filter((c) => c.status === "pending").length +
    teamApplications.filter((a) => a.status === "pending").length +
    claims.filter((c) => c.status === "assigned" && Boolean(c.pr_url)).length;

  return (
    <div className="space-y-6">
      {/* Moderation Warning Banners for Owner / Admin */}
      {project.moderation_status === "rejected" && (
        <div className="p-4 rounded-xl border border-[#e5484d]/40 bg-[#e5484d]/10 text-[#e5484d] text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold">ПРОЕКТ ОТКЛОНЁН:</span>
            <span>Этот репозиторий заблокирован администратором и скрыт из общего доступа.</span>
          </div>
          <span className="font-mono text-[10px] uppercase font-bold">REJECTED</span>
        </div>
      )}

      {project.moderation_status === "pending" && (
        <div className="p-4 rounded-xl border border-[#d29922]/40 bg-[#d29922]/10 text-[#d29922] text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold">НА МОДЕРАЦИИ:</span>
            <span>Репозиторий проходит проверку безопасности и виден только вам. В общем каталоге он появится после подтверждения.</span>
          </div>
          <span className="font-mono text-[10px] uppercase font-bold">PENDING</span>
        </div>
      )}
      {/* Breadcrumbs Navigation */}
      <div className="flex items-center gap-2 text-xs text-[#8a92a3]">
        <Link href="/" className="hover:text-white transition-colors">
          Каталог
        </Link>
        <span>/</span>
        <span className="text-white font-medium truncate">{project.full_name}</span>
      </div>

      {/* Main Project Header Card */}
      <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-4">
          <div className="flex items-start gap-4">
            {project.owner_login ? (
              <Link
                href={`/users/${project.owner_login}`}
                className="shrink-0 hover:opacity-80 transition-opacity"
                title={`Профиль @${project.owner_login}`}
              >
                {project.owner_avatar ? (
                  <img
                    src={project.owner_avatar}
                    alt={project.owner_login}
                    className="w-14 h-14 rounded-xl border border-white/10 bg-[#151821] object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl border border-white/10 bg-[#151821] flex items-center justify-center font-bold text-xl text-white">
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
            ) : (
              <div className="w-14 h-14 rounded-xl border border-white/10 bg-[#151821] flex items-center justify-center font-bold text-xl text-white shrink-0">
                {project.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
                {project.name}
              </h1>
              <div className="text-xs text-[#8a92a3] mt-1 font-mono flex items-center gap-1">
                {project.owner_login ? (
                  <Link
                    href={`/users/${project.owner_login}`}
                    className="hover:text-white transition-colors"
                  >
                    @{project.owner_login}
                  </Link>
                ) : null}
                <span>/</span>
                <span className="text-white">{project.name}</span>
              </div>
            </div>
          </div>

          {/* External Links & CRM Shortcut */}
          {/* External Links, Maintainer Entry & Report */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {isOwner && (
              <Link
                href={`/projects/${project.slug}/crm`}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#e5484d] hover:bg-[#f2555a] text-white font-semibold transition-all shadow-sm shadow-[#e5484d]/25 active:scale-95"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Управлять проектом</span>
                {attentionCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-white text-[10px] font-bold font-mono border border-white/20">
                    {attentionCount}
                  </span>
                )}
              </Link>
            )}
            {project.homepage && /^https?:\/\//i.test(project.homepage) && (
              <a
                href={project.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1d212b] bg-[#151821] hover:border-[#2e3444] text-white transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Сайт</span>
              </a>
            )}
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#161a23] hover:bg-[#1f2432] text-white border border-[#2e3444] hover:border-white/20 font-semibold transition-colors shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
            <ReportProjectModal projectId={project.id} projectSlug={project.slug} />
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-[#d1d5db] leading-relaxed max-w-3xl mb-6">
          {project.description || "Описание репозитория отсутствует."}
        </p>

        {/* Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-[#1d212b] pt-4 text-xs">
          <div className="rounded-xl border border-[#1d212b] bg-[#151821] p-3">
            <span className="text-[11px] text-[#8a92a3] block">Звёзды</span>
            <span className="text-base font-bold text-white font-mono mt-0.5 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-[#e5484d] fill-[#e5484d]" />
              <span>{project.stars.toLocaleString()}</span>
            </span>
          </div>

          <div className="rounded-xl border border-[#1d212b] bg-[#151821] p-3">
            <span className="text-[11px] text-[#8a92a3] block">Форки</span>
            <span className="text-base font-bold text-white font-mono mt-0.5 flex items-center gap-1.5">
              <GitFork className="w-3.5 h-3.5 text-[#8a92a3]" />
              <span>{project.forks.toLocaleString()}</span>
            </span>
          </div>

          <div className="rounded-xl border border-[#1d212b] bg-[#151821] p-3">
            <span className="text-[11px] text-[#8a92a3] block">Открытые issue</span>
            <span className="text-base font-bold text-white font-mono mt-0.5 block">
              {project.open_issues}
            </span>
          </div>

          <div className="rounded-xl border border-[#1d212b] bg-[#151821] p-3">
            <span className="text-[11px] text-[#8a92a3] block">Основной язык</span>
            <span className="text-base font-bold text-white mt-0.5 block">
              {project.language || "Не указан"}
            </span>
          </div>
        </div>
      </div>

      {/* Maintainer Verification Prompt if guest */}
      {!session && project.owner_login && (
        <div className="rounded-xl border border-[#1d212b] bg-[#0f1117] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#8a92a3]">
          <span>Вы автор этого репозитория (@{project.owner_login})?</span>
          <Link
            href="/login"
            className="text-white hover:text-[#e5484d] transition-colors font-medium"
          >
            Войти через GitHub для управления →
          </Link>
        </div>
      )}

      {/* Contributor Fast-Track Hub */}
      <ContributorFastTrack
        project={project}
        issues={issues}
        claims={claims}
        currentUserLogin={session?.login}
        currentUserAvatar={session?.avatar_url}
        currentUserName={session?.name}
      />

      {/* GitHub Issues Section */}
      <ProjectIssuesList issues={issues} repoUrl={project.url} />

      {/* Grid: README & Comments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Docs & Changelog Section (Left 2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <ProjectDocsTabs
            readmeContent={project.readme}
            releases={releases}
            repoFullName={project.full_name}
            repoUrl={project.url}
          />
        </div>

        {/* Discussions Section (Right 1 column) */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-5">
              <CommentsSection
                projectId={project.id}
                slug={project.slug}
                comments={comments}
                session={session}
                ownerLogin={project.owner_login}
                isAdmin={isAdmin}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
