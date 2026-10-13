import { getProjects, getAvailableLanguages } from "@/lib/projects";
import { getAllContributors } from "@/lib/user-profile";
import { ProjectCard } from "@/components/ProjectCard";
import { ContributorCard } from "@/components/ContributorCard";
import { DeveloperCard } from "@/components/DeveloperCard";
import { SearchFilters } from "@/components/SearchFilters";
import { getServerTranslations } from "@/lib/i18n/server";
import {
  Plus,
  FolderGit2,
  Skull,
  Terminal,
  ExternalLink,
  ArrowRight,
  Users,
  Code2,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

const HACKER_PAYLOAD_REGEXES: RegExp[] = [
  /'\s*or\s+1\s*=\s*1/i,
  /"\s*or\s+1\s*=\s*1/i,
  /'\s*or\s*['"0-9a-z]/i,
  /\bor\s+1\s*=\s*1\b/i,
  /\bunion\b/i,
  /\bselect\b/i,
  /<script\b/i,
  /alert\s*\(/i,
  /etc\/passwd/i,
  /\.\.\//,
  /\.\.\\/,
  /javascript:/i,
  /onerror\s*=/i,
  /onload\s*=/i,
  /document\.cookie/i,
  /\bdrop\s+table\b/i,
];

function isHackerPayload(rawSearch: string): boolean {
  if (!rawSearch) return false;
  let decoded = rawSearch;
  try {
    decoded = decodeURIComponent(rawSearch);
  } catch {
    decoded = rawSearch;
  }

  const rawLower = rawSearch.toLowerCase();
  const decodedLower = decoded.toLowerCase();

  const exactKeywords = [
    "' or 1=1",
    "\" or 1=1",
    "union",
    "select",
    "<script>",
    "<script",
    "alert(",
    "etc/passwd",
    "../",
    "javascript:",
  ];

  if (exactKeywords.some((kw) => rawLower.includes(kw) || decodedLower.includes(kw))) {
    return true;
  }

  return HACKER_PAYLOAD_REGEXES.some(
    (rgx) => rgx.test(rawSearch) || rgx.test(decoded)
  );
}

interface PageProps {
  searchParams: Promise<{
    tab?: "projects" | "looking" | "devs";
    search?: string;
    lang?: string;
    sort?: "stars" | "newest" | "name";
    looking?: string;
    role?: string;
    status?: string;
  }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search || "";
  const language = params.lang || "";
  const sort = params.sort || "stars";
  const roleFilter = params.role || "";
  const statusFilter = params.status || "";

  const { t, locale } = await getServerTranslations();

  // Resolve current active tab
  let currentTab: "projects" | "looking" | "devs" = "projects";
  if (params.tab === "looking" || params.tab === "devs") {
    currentTab = params.tab;
  } else if (params.looking === "true") {
    currentTab = "looking";
  }

  const [allProjects, devs, availableLanguages] = await Promise.all([
    getProjects({
      search: search || undefined,
      language: language || undefined,
      sort,
    }),
    getAllContributors({
      stack: language || undefined,
      status: statusFilter || undefined,
      search: search || undefined,
    }),
    getAvailableLanguages(),
  ]);

  const totalProjects = allProjects.length;
  const lookingProjects = allProjects.filter((p) => p.looking_for_contributors);
  const lookingCount = lookingProjects.length;

  const filteredLookingProjects = roleFilter
    ? lookingProjects.filter((p) =>
        p.contributor_roles.some((r) =>
          r.toLowerCase().includes(roleFilter.toLowerCase())
        )
      )
    : lookingProjects;

  const allRoles = Array.from(
    new Set(lookingProjects.flatMap((p) => p.contributor_roles))
  ).filter(Boolean);

  const openDevsCount = devs.filter((d) => d.status === "open").length;

  return (
    <div className="space-y-8">
      {/* 1. Masthead Header */}
      <section className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-[#8a92a3]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
              <span>{t.home.mastheadBadge}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              {t.home.mastheadTitle}
            </h1>

            <p className="text-sm text-[#8a92a3] leading-relaxed max-w-xl">
              {t.home.mastheadDesc}
            </p>
          </div>

          {/* Quick Metrics: interactive triggers to switch tabs */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Link
              href={`/?tab=projects${search ? `&search=${encodeURIComponent(search)}` : ""}`}
              className={`rounded-xl border px-4 py-3 min-w-[110px] transition-all ${
                currentTab === "projects"
                  ? "border-[#38bdf8]/40 bg-[#151821] shadow-sm"
                  : "border-[#1d212b] bg-[#12151d] hover:border-[#2e3444]"
              }`}
            >
              <div className="text-[11px] font-medium text-[#8a92a3]">{t.home.metricsProjects}</div>
              <div className="text-xl font-bold text-white mt-0.5 font-mono">
                {totalProjects}
              </div>
            </Link>

            <Link
              href={`/?tab=looking${search ? `&search=${encodeURIComponent(search)}` : ""}`}
              className={`rounded-xl border px-4 py-3 min-w-[110px] transition-all ${
                currentTab === "looking"
                  ? "border-[#e5484d]/40 bg-[#151821] shadow-sm"
                  : "border-[#1d212b] bg-[#12151d] hover:border-[#2e3444]"
              }`}
            >
              <div className="text-[11px] font-medium text-[#8a92a3]">{t.home.metricsLooking}</div>
              <div className="text-xl font-bold text-[#e5484d] mt-0.5 font-mono">
                {lookingCount}
              </div>
            </Link>

            <Link
              href={`/?tab=devs${search ? `&search=${encodeURIComponent(search)}` : ""}`}
              className={`rounded-xl border px-4 py-3 min-w-[110px] transition-all ${
                currentTab === "devs"
                  ? "border-[#3fb950]/40 bg-[#151821] shadow-sm"
                  : "border-[#1d212b] bg-[#12151d] hover:border-[#2e3444]"
              }`}
            >
              <div className="text-[11px] font-medium text-[#8a92a3]">{t.home.metricsDevs}</div>
              <div className="text-xl font-bold text-[#3fb950] mt-0.5 font-mono">
                {devs.length}
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Featured Banner: OSS Hub Open Source Project */}
      <section className="rounded-2xl border border-[#e5484d]/30 bg-gradient-to-r from-[#e5484d]/10 via-[#0f1117] to-[#0f1117] p-5 sm:p-6 relative overflow-hidden shadow-lg shadow-[#e5484d]/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#e5484d]/20 text-[#e5484d] border border-[#e5484d]/30 uppercase tracking-wider">
                {t.home.bannerBadge}
              </span>
              <span className="text-xs text-[#8a92a3]">·</span>
              <span className="text-xs font-mono text-white font-semibold">
                lonestill/oss-hub
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {t.home.bannerTitle}
            </h2>
            <p className="text-xs text-[#8a92a3] leading-relaxed">
              {t.home.bannerDesc}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Link
              href="/projects/lonestill-oss-hub"
              className="px-4 py-2 rounded-xl bg-[#e5484d] hover:bg-[#d63d42] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-[#e5484d]/20"
            >
              <span>{t.home.bannerTasksBtn}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <a
              href="https://github.com/lonestill/oss-hub"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-[#161a23] hover:bg-[#1f2432] text-white border border-[#2e3444] hover:border-white/20 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* 3. Primary Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1d212b] pb-3 text-xs">
        <div className="inline-flex rounded-xl p-1 bg-[#0f1117] border border-[#1d212b] gap-1 self-start">
          <Link
            href={`/?tab=projects${search ? `&search=${encodeURIComponent(search)}` : ""}${language ? `&lang=${encodeURIComponent(language)}` : ""}`}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              currentTab === "projects"
                ? "bg-[#1f2433] text-white border border-[#2e3444] shadow-sm"
                : "text-[#8a92a3] hover:text-white"
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>{t.home.tabProjects} ({totalProjects})</span>
          </Link>

          <Link
            href={`/?tab=looking${search ? `&search=${encodeURIComponent(search)}` : ""}${language ? `&lang=${encodeURIComponent(language)}` : ""}`}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              currentTab === "looking"
                ? "bg-[#1f2433] text-white border border-[#2e3444] shadow-sm"
                : "text-[#8a92a3] hover:text-white"
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-[#e5484d]" />
            <span>{t.home.tabLooking} ({lookingCount})</span>
          </Link>

          <Link
            href={`/?tab=devs${search ? `&search=${encodeURIComponent(search)}` : ""}${language ? `&lang=${encodeURIComponent(language)}` : ""}`}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              currentTab === "devs"
                ? "bg-[#1f2433] text-white border border-[#2e3444] shadow-sm"
                : "text-[#8a92a3] hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#3fb950]" />
            <span>{t.home.tabDevs} ({devs.length})</span>
          </Link>
        </div>

        {currentTab === "devs" ? (
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-xs text-[#8a92a3] hover:text-white transition-colors"
          >
            <span>{t.home.setupAvailability}</span>
            <ArrowRight className="w-3 h-3 text-[#e5484d]" />
          </Link>
        ) : (
          <Link
            href="/submit"
            className="inline-flex items-center gap-1.5 text-xs text-[#8a92a3] hover:text-white transition-colors"
          >
            <span>{t.home.addRepo}</span>
            <ArrowRight className="w-3 h-3 text-[#e5484d]" />
          </Link>
        )}
      </div>

      {/* 4. TAB 1: ALL PROJECTS */}
      {currentTab === "projects" && (
        <div className="space-y-6">
          <Suspense fallback={<div className="h-12 bg-[#0f1117] border border-[#1d212b] rounded-xl mb-6" />}>
            <SearchFilters
              activeSearch={search}
              activeLanguage={language}
              activeSort={sort}
              lookingOnly={false}
              availableLanguages={availableLanguages}
            />
          </Suspense>

          {allProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allProjects.map((project) => (
                <ProjectCard key={project.id} project={project} locale={locale} />
              ))}
            </div>
          ) : isHackerPayload(search) ? (
            <div className="rounded-2xl border border-[#e5484d]/30 bg-[#120d12] p-8 sm:p-12 text-center space-y-4 shadow-[0_0_30px_rgba(229,72,77,0.1)] relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#e5484d] to-transparent opacity-80" />

              <div className="w-14 h-14 rounded-2xl bg-[#e5484d]/10 border border-[#e5484d]/30 flex items-center justify-center mx-auto text-[#e5484d] shadow-[0_0_20px_rgba(229,72,77,0.2)]">
                <Skull className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e5484d]/15 border border-[#e5484d]/30 text-[11px] font-mono text-[#e5484d] font-semibold">
                  <Terminal className="w-3 h-3" />
                  <span>{t.home.hackerBadge}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {t.home.hackerTitle}
                </h2>
              </div>

              <p className="text-sm text-[#cbd5e1] max-w-lg mx-auto leading-relaxed">
                {t.home.hackerDesc1}
                <a
                  href="https://t.me/lonestill"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#22c55e] font-semibold hover:underline underline-offset-4"
                >
                  @lonestill
                </a>
                {t.home.hackerDesc2}
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="https://t.me/lonestill"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#e5484d] hover:bg-[#d63b40] text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
                >
                  <span>{t.home.writeTelegram}</span>
                </a>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1e28] hover:bg-[#252a38] text-[#8a92a3] hover:text-white font-medium text-xs rounded-lg border border-[#2b3142] transition-colors"
                >
                  <span>{t.home.resetSearch}</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#8a92a3]">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <div className="text-sm font-semibold text-white">
                {t.home.noProjectsTitle}
              </div>
              <p className="text-xs text-[#8a92a3] max-w-sm mx-auto">
                {search || language
                  ? t.home.noProjectsDescFiltered
                  : t.home.noProjectsDescEmpty}
              </p>
              <div className="pt-2">
                <Link
                  href="/submit"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#e5484d] hover:bg-[#cc3e43] text-white font-semibold text-xs rounded-lg transition-colors shadow-sm border border-[#e5484d]/40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.home.addRepo}</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 2: PROJECTS LOOKING FOR CONTRIBUTORS */}
      {currentTab === "looking" && (
        <div className="space-y-6">
          {/* Role Filter Chips */}
          {allRoles.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <span className="text-[#8a92a3] mr-1">{t.home.specificRole}</span>
              <Link
                href={`/?tab=looking${language ? `&lang=${encodeURIComponent(language)}` : ""}`}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ${
                  !roleFilter
                    ? "bg-[#1f2433] text-white border border-[#2e3444] shadow-sm font-semibold"
                    : "bg-[#0f1117] border border-[#1d212b] text-[#8a92a3] hover:border-[#2e3444] hover:text-white"
                }`}
              >
                {t.home.allRoles} ({lookingCount})
              </Link>
              {allRoles.map((role) => {
                const isActive = roleFilter.toLowerCase() === role.toLowerCase();
                return (
                  <Link
                    key={role}
                    href={`/?tab=looking&role=${encodeURIComponent(role)}${
                      language ? `&lang=${encodeURIComponent(language)}` : ""
                    }`}
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

          {/* Looking Projects Grid */}
          {filteredLookingProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLookingProjects.map((project) => (
                <ContributorCard key={project.id} project={project} locale={locale} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#8a92a3]">
                <Code2 className="w-5 h-5" />
              </div>
              <div className="text-sm font-semibold text-white">
                {t.home.noLookingTitle}
              </div>
              <p className="text-xs text-[#8a92a3] max-w-sm mx-auto">
                {t.home.noLookingDesc}
              </p>
              <div className="pt-2">
                <Link
                  href="/submit"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#e5484d] hover:bg-[#cc3e43] text-white font-semibold text-xs rounded-lg transition-colors shadow-sm border border-[#e5484d]/40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.home.addProject}</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 3: DEVELOPERS DIRECTORY */}
      {currentTab === "devs" && (
        <div className="space-y-6">
          {/* Subfilter Bar for Developers */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            {/* Stack Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[#586071] font-mono mr-1">{t.home.stackLabel}</span>
              <Link
                href={`/?tab=devs${statusFilter ? `&status=${encodeURIComponent(statusFilter)}` : ""}`}
                className={`px-2.5 py-1 rounded-md transition-colors shrink-0 ${
                  !language
                    ? "bg-[#1f2433] border border-[#3e475e] text-white font-semibold"
                    : "bg-[#0f1117] border border-[#1d212b] text-[#8a92a3] hover:text-white"
                }`}
              >
                {t.home.allStack}
              </Link>
              {availableLanguages.map((lang) => {
                const isActive = language.toLowerCase() === lang.toLowerCase();
                return (
                  <Link
                    key={lang}
                    href={`/?tab=devs&lang=${encodeURIComponent(lang)}${
                      statusFilter ? `&status=${encodeURIComponent(statusFilter)}` : ""
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
                href={`/?tab=devs${language ? `&lang=${encodeURIComponent(language)}` : ""}`}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  !statusFilter
                    ? "bg-[#1f2433] text-white font-semibold"
                    : "text-[#8a92a3] hover:text-white"
                }`}
              >
                {t.home.statusAll}
              </Link>
              <Link
                href={`/?tab=devs&status=open${language ? `&lang=${encodeURIComponent(language)}` : ""}`}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === "open"
                    ? "bg-[#3fb950]/20 text-[#3fb950] font-semibold"
                    : "text-[#8a92a3] hover:text-white"
                }`}
              >
                {t.home.statusOpen} ({openDevsCount})
              </Link>
              <Link
                href={`/?tab=devs&status=mentor${language ? `&lang=${encodeURIComponent(language)}` : ""}`}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === "mentor"
                    ? "bg-[#38bdf8]/20 text-[#38bdf8] font-semibold"
                    : "text-[#8a92a3] hover:text-white"
                }`}
              >
                {t.home.statusMentor}
              </Link>
            </div>
          </div>

          {/* Developers Grid */}
          {devs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devs.map((dev) => (
                <DeveloperCard key={dev.login} dev={dev} locale={locale} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#8a92a3]">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-sm font-semibold text-white">
                {t.home.noDevsTitle}
              </div>
              <p className="text-xs text-[#8a92a3] max-w-sm mx-auto">
                {t.home.noDevsDesc}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
