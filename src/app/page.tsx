import { getProjects } from "@/lib/projects";
import { ProjectCard } from "@/components/ProjectCard";
import { SearchFilters } from "@/components/SearchFilters";
import { Plus, FolderGit2, Skull, Terminal, ExternalLink, ArrowRight } from "lucide-react";
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
    search?: string;
    lang?: string;
    sort?: "stars" | "newest" | "name";
    looking?: string;
  }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search || "";
  const language = params.lang || "";
  const sort = params.sort || "stars";
  const lookingForContributors = params.looking === "true";

  const projects = await getProjects({
    search: search || undefined,
    language: language || undefined,
    sort,
    lookingForContributors,
  });

  const totalProjects = projects.length;
  const lookingCount = projects.filter((p) => p.looking_for_contributors).length;
  const totalStars = projects.reduce((acc, p) => acc + p.stars, 0);

  return (
    <div className="space-y-8">
      {/* Clean Masthead Header */}
      <section className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-[#8a92a3]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]"></span>
              <span>Каталог открытых разработок</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              Находите открытые проекты и единомышленников
            </h1>

            <p className="text-sm text-[#8a92a3] leading-relaxed max-w-xl">
              Платформа для авторов и контрибьюторов. Публикуйте свои репозитории, находите разработчиков в команду и обсуждайте задачи от первого лица.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="rounded-xl border border-[#1d212b] bg-[#151821] px-4 py-3 min-w-[110px]">
              <div className="text-[11px] font-medium text-[#8a92a3]">Проектов</div>
              <div className="text-xl font-bold text-white mt-0.5 font-mono">
                {totalProjects}
              </div>
            </div>

            <div className="rounded-xl border border-[#1d212b] bg-[#151821] px-4 py-3 min-w-[110px]">
              <div className="text-[11px] font-medium text-[#8a92a3]">Ищут команду</div>
              <div className="text-xl font-bold text-[#e5484d] mt-0.5 font-mono">
                {lookingCount}
              </div>
            </div>

            <div className="rounded-xl border border-[#1d212b] bg-[#151821] px-4 py-3 min-w-[110px]">
              <div className="text-[11px] font-medium text-[#8a92a3]">Всего звёзд</div>
              <div className="text-xl font-bold text-white mt-0.5 font-mono">
                {totalStars.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Banner: OSS Hub Open Source Project */}
      <section className="rounded-2xl border border-[#e5484d]/30 bg-gradient-to-r from-[#e5484d]/10 via-[#0f1117] to-[#0f1117] p-5 sm:p-6 relative overflow-hidden shadow-lg shadow-[#e5484d]/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#e5484d]/20 text-[#e5484d] border border-[#e5484d]/30 uppercase tracking-wider">
                Исходный код открыт
              </span>
              <span className="text-xs text-[#8a92a3]">·</span>
              <span className="text-xs font-mono text-white font-semibold">
                lonestill/oss-hub
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              OSS Hub разрабатывается сообществом на GitHub
            </h2>
            <p className="text-xs text-[#8a92a3] leading-relaxed">
              Мы сами используем свои инструменты: берите открытые задачи в воркспейсе платформы, предлагайте фичи в PR и развивайте платформу вместе с нами.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Link
              href="/projects/lonestill-oss-hub"
              className="px-4 py-2 rounded-xl bg-[#e5484d] hover:bg-[#d63d42] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-[#e5484d]/20"
            >
              <span>Задачи проекта</span>
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

      {/* Main Content Area */}
      <div>
        {/* Filters and search */}
        <Suspense fallback={<div className="h-12 bg-[#0f1117] border border-[#1d212b] rounded-xl mb-6" />}>
          <SearchFilters
            activeSearch={search}
            activeLanguage={language}
            activeSort={sort}
            lookingOnly={lookingForContributors}
          />
        </Suspense>

        {/* Projects Grid */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
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
                <span>SECURITY NOTICE</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Пейлоад обнаружен!
              </h2>
            </div>

            <p className="text-sm text-[#cbd5e1] max-w-lg mx-auto leading-relaxed">
              SQLi и XSS здесь закрыты параметризованными запросами Turso и DOMPurify. Но за попытку респект! Напиши{" "}
              <a
                href="https://t.me/lonestill"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#22c55e] font-semibold hover:underline underline-offset-4"
              >
                @lonestill
              </a>
              , если хочешь обсудить баунти.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <a
                href="https://t.me/lonestill"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#e5484d] hover:bg-[#d63b40] text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
              >
                <span>Написать в Telegram</span>
              </a>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1e28] hover:bg-[#252a38] text-[#8a92a3] hover:text-white font-medium text-xs rounded-lg border border-[#2b3142] transition-colors"
              >
                <span>Сбросить поиск</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#8a92a3]">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-white">
              Репозитории не найдены
            </div>
            <p className="text-xs text-[#8a92a3] max-w-sm mx-auto">
              {search || language || lookingForContributors
                ? "По заданным фильтрам ничего не найдено. Попробуйте сбросить параметры поиска."
                : "В каталоге пока нет проектов. Добавьте первый репозиторий через свой GitHub профиль."}
            </p>
            <div className="pt-2">
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#e5484d] hover:bg-[#cc3e43] text-white font-semibold text-xs rounded-lg transition-colors shadow-sm border border-[#e5484d]/40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить репозиторий</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
