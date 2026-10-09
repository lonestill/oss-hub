import { getProjectBySlug } from "@/lib/projects";
import { getSession } from "@/lib/auth";
import { getClaimsByProject, getTeamApplicationsByProject } from "@/lib/claims";
import { notFound, redirect } from "next/navigation";
import { ProjectCrmWorkspace } from "@/components/ProjectCrmWorkspace";
import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogIn } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Maintainer CRM | OSS Hub" };
  return {
    title: `Maintainer CRM - ${project.name} | OSS Hub`,
    description: `CRM-система управления контрибьюторами, задачами и пайплайном ${project.full_name}`,
  };
}

export default async function ProjectCrmPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const session = await getSession();

  // If not logged in -> redirect to login with returnUrl
  if (!session) {
    redirect(`/login?returnUrl=/projects/${slug}/crm`);
  }

  const isOwner = Boolean(
    project.owner_login &&
      session.login.toLowerCase() === project.owner_login.toLowerCase()
  );

  // Access check: only repository maintainer (strict isolation)
  if (!isOwner) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl border border-[#30363d] bg-[#0d1117] text-center space-y-6 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-[#e5484d]/10 border border-[#e5484d]/20 text-[#e5484d] flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white tracking-tight">
            Доступ к Maintainer CRM ограничен
          </h1>
          <p className="text-xs text-[#8b949e] leading-relaxed max-w-md mx-auto">
            Вы авторизованы как <span className="text-white font-mono font-semibold">@{session.login}</span>. 
            Управлять пайплайном, бэклогом и заявками репозитория <span className="text-white font-mono font-semibold">{project.full_name}</span> может только автор проекта (<span className="text-white font-mono font-semibold">@{project.owner_login}</span>) либо администратор платформы.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href={`/projects/${project.slug}`}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-[#30363d] bg-[#161b22] hover:bg-[#21262d] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Вернуться к проекту</span>
          </Link>
          <a
            href="/api/auth/logout"
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-[#30363d] bg-[#0d1117] hover:bg-[#161b22] text-[#8b949e] hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>Сменить аккаунт</span>
          </a>
        </div>
      </div>
    );
  }

  // Load claims & applications for this project
  const [claims, teamApplications] = await Promise.all([
    getClaimsByProject(project.id),
    getTeamApplicationsByProject(project.id),
  ]);

  return (
    <ProjectCrmWorkspace
      project={project}
      claims={claims}
      teamApplications={teamApplications}
      sessionUserLogin={session.login}
    />
  );
}
