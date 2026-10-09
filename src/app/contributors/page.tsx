import { getProjects } from "@/lib/projects";
import { ContributorCard } from "@/components/ContributorCard";
import { Plus, Users } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    role?: string;
    lang?: string;
  }>;
}

export default async function ContributorsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const roleFilter = params.role || "";
  const langFilter = params.lang || "";

  const projects = await getProjects({
    lookingForContributors: true,
    language: langFilter || undefined,
  });

  const filteredProjects = roleFilter
    ? projects.filter((p) =>
        p.contributor_roles.some((r) =>
          r.toLowerCase().includes(roleFilter.toLowerCase())
        )
      )
    : projects;

  const allRoles = Array.from(
    new Set(projects.flatMap((p) => p.contributor_roles))
  ).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Masthead Header */}
      <section className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#e5484d]/10 text-[#e5484d] text-xs font-medium border border-[#e5484d]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e5484d]"></span>
              <span>Поиск разработчиков</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              Проекты, которым нужна помощь
            </h1>
            <p className="text-sm text-[#8a92a3] leading-relaxed">
              Репозитории с открытыми задачами. Выбирайте проект, пишите автору напрямую и подключайтесь к разработке без бюрократии.
            </p>
          </div>

          <div className="rounded-xl border border-[#1d212b] bg-[#151821] px-4 py-3 shrink-0">
            <span className="text-[11px] font-medium text-[#8a92a3] block">
              Ищут контрибьюторов
            </span>
            <span className="text-xl font-bold text-[#e5484d] font-mono">
              {projects.length}
            </span>
          </div>
        </div>
      </section>

      {/* Role filter chips */}
      {allRoles.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[#8a92a3] mr-1">Стек:</span>
          <Link
            href="/contributors"
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ${
              !roleFilter
                ? "bg-[#1f2433] text-white border border-[#2e3444] shadow-sm font-semibold"
                : "bg-[#0f1117] border border-[#1d212b] text-[#8a92a3] hover:border-[#2e3444] hover:text-white"
            }`}
          >
            Все ({projects.length})
          </Link>
          {allRoles.map((role) => {
            const isActive = roleFilter.toLowerCase() === role.toLowerCase();
            return (
              <Link
                key={role}
                href={`/contributors?role=${encodeURIComponent(role)}`}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ${
                  isActive
                    ? "bg-[#e5484d] text-white shadow-sm"
                    : "bg-[#0f1117] border border-[#1d212b] text-[#8a92a3] hover:border-[#2e3444] hover:text-white"
                }`}
              >
                {role}
              </Link>
            );
          })}
        </div>
      )}

      {/* Cards Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((project) => (
            <ContributorCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-12 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#8a92a3]">
            <Users className="w-5 h-5" />
          </div>
          <div className="text-sm font-semibold text-white">
            Пока нет активных объявлений
          </div>
          <p className="text-xs text-[#8a92a3] max-w-sm mx-auto">
            Ни один автор пока не разместил объявление о поиске контрибьюторов. Если вы мейнтейнер — добавьте свой проект.
          </p>
          <div className="pt-2">
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#e5484d] hover:bg-[#cc3e43] text-white font-semibold text-xs rounded-lg transition-colors shadow-sm border border-[#e5484d]/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Добавить проект</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
