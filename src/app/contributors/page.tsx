import { getProjects, getAvailableLanguages } from "@/lib/projects";
import { getAllContributors } from "@/lib/user-profile";
import { ContributorCard } from "@/components/ContributorCard";
import { DeveloperCard } from "@/components/DeveloperCard";
import { Plus, Users, Code2, Search, SlidersHorizontal, ArrowRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    tab?: "devs" | "projects";
    role?: string;
    lang?: string;
    status?: string;
    search?: string;
  }>;
}

export default async function ContributorsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentTab = params.tab || "devs";
  const roleFilter = params.role || "";
  const langFilter = params.lang || "";
  const statusFilter = params.status || "";
  const searchFilter = params.search || "";

  const [projects, devs, availableLanguages] = await Promise.all([
    getProjects({
      lookingForContributors: true,
      language: langFilter || undefined,
    }),
    getAllContributors({
      stack: langFilter || undefined,
      status: statusFilter || undefined,
      search: searchFilter || undefined,
    }),
    getAvailableLanguages(),
  ]);

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

  const openDevsCount = devs.filter((d) => d.status === "open").length;

  return (
    <div className="space-y-6">
      {/* 1. Header Hero */}
      <section className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#e5484d]/10 text-[#e5484d] text-xs font-semibold border border-[#e5484d]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e5484d]" />
              <span>Двусторонний маркетплейс контрибуций</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              Биржа открытых разработчиков
            </h1>
            <p className="text-sm text-[#8a92a3] leading-relaxed">
              Находите инженеров в команду под свой стек или выбирайте открытые задачи и подключайтесь к интересным проектам.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="rounded-xl border border-[#1d212b] bg-[#151821] px-4 py-3 min-w-[120px]">
              <span className="text-[11px] font-medium text-[#8a92a3] block">
                Разработчиков
              </span>
              <span className="text-xl font-bold text-[#38bdf8] font-mono mt-0.5 block">
                {devs.length}
              </span>
            </div>

            <div className="rounded-xl border border-[#1d212b] bg-[#151821] px-4 py-3 min-w-[120px]">
              <span className="text-[11px] font-medium text-[#8a92a3] block">
                Ищут команду
              </span>
              <span className="text-xl font-bold text-[#e5484d] font-mono mt-0.5 block">
                {projects.length}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Primary Marketplace Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1d212b] pb-3 text-xs">
        <div className="inline-flex rounded-lg p-1 bg-[#0f1117] border border-[#1d212b] gap-1 self-start">
          <Link
            href="/contributors?tab=devs"
            className={`px-3.5 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              currentTab === "devs"
                ? "bg-[#1f2433] text-white border border-[#2e3444] shadow-sm"
                : "text-[#8a92a3] hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Разработчики ({devs.length})</span>
          </Link>

          <Link
            href="/contributors?tab=projects"
            className={`px-3.5 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              currentTab === "projects"
                ? "bg-[#1f2433] text-white border border-[#2e3444] shadow-sm"
                : "text-[#8a92a3] hover:text-white"
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-[#e5484d]" />
            <span>Проекты ({projects.length})</span>
          </Link>
        </div>

        {/* Action Link for logged-in user */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-xs text-[#8a92a3] hover:text-white transition-colors"
        >
          <span>Настроить свой статус доступности</span>
          <ArrowRight className="w-3 h-3 text-[#e5484d]" />
        </Link>
      </div>

      {/* 3. TAB CONTENT: DEVELOPERS DIRECTORY */}
      {currentTab === "devs" && (
        <div className="space-y-6">
          {/* Subfilter Bar for Developers */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            {/* Stack Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[#586071] font-mono mr-1">Стек:</span>
              <Link
                href={`/contributors?tab=devs${statusFilter ? `&status=${statusFilter}` : ""}`}
                className={`px-2.5 py-1 rounded-md transition-colors shrink-0 ${
                  !langFilter
                    ? "bg-[#1f2433] border border-[#3e475e] text-white font-semibold"
                    : "bg-[#0f1117] border border-[#1d212b] text-[#8a92a3] hover:text-white"
                }`}
              >
                Все
              </Link>
              {availableLanguages.map((lang) => {
                const isActive = langFilter.toLowerCase() === lang.toLowerCase();
                return (
                  <Link
                    key={lang}
                    href={`/contributors?tab=devs&lang=${encodeURIComponent(lang)}${
                      statusFilter ? `&status=${statusFilter}` : ""
                    }`}
                    className={`px-2.5 py-1 rounded-md transition-colors shrink-0 ${
                      isActive
                        ? "bg-[#1f2433] border border-[#3e475e] text-white font-semibold"
                        : "bg-[#0f1117] border border-[#1d212b] text-[#8a92a3] hover:text-white"
                    }`}
                  >
                    {lang}
                  </Link>
                );
              })}
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-[#12151d] p-0.5 rounded-lg border border-[#1d212b] self-start sm:self-auto">
              <Link
                href={`/contributors?tab=devs${langFilter ? `&lang=${langFilter}` : ""}`}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  !statusFilter
                    ? "bg-[#1f2433] text-white font-semibold"
                    : "text-[#8a92a3] hover:text-white"
                }`}
              >
                Все
              </Link>
              <Link
                href={`/contributors?tab=devs&status=open${langFilter ? `&lang=${langFilter}` : ""}`}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === "open"
                    ? "bg-[#3fb950]/20 text-[#3fb950] font-semibold"
                    : "text-[#8a92a3] hover:text-white"
                }`}
              >
                Открыты ({openDevsCount})
              </Link>
              <Link
                href={`/contributors?tab=devs&status=mentor${langFilter ? `&lang=${langFilter}` : ""}`}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === "mentor"
                    ? "bg-[#38bdf8]/20 text-[#38bdf8] font-semibold"
                    : "text-[#8a92a3] hover:text-white"
                }`}
              >
                Менторы
              </Link>
            </div>
          </div>

          {/* Developers Grid */}
          {devs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devs.map((dev) => (
                <DeveloperCard key={dev.login} dev={dev} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#8a92a3]">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-sm font-semibold text-white">
                Разработчики не найдены
              </div>
              <p className="text-xs text-[#8a92a3] max-w-sm mx-auto">
                По выбранным фильтрам пока нет разработчиков. Сбросьте фильтры или станьте первым, настроив статус доступности.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. TAB CONTENT: PROJECTS LOOKING FOR HELP */}
      {currentTab === "projects" && (
        <div className="space-y-6">
          {/* Role filter chips */}
          {allRoles.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <span className="text-[#8a92a3] mr-1">Специфика:</span>
              <Link
                href="/contributors?tab=projects"
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
                    href={`/contributors?tab=projects&role=${encodeURIComponent(role)}`}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ${
                      isActive
                        ? "bg-[#e5484d] text-white shadow-sm font-semibold"
                        : "bg-[#0f1117] border border-[#1d212b] text-[#8a92a3] hover:border-[#2e3444] hover:text-white"
                    }`}
                  >
                    {role}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Projects Cards Grid */}
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
      )}
    </div>
  );
}
