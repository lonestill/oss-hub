import Link from "next/link";
import { Star, GitFork, ExternalLink, MessageSquare, CircleDot } from "lucide-react";
import { Project } from "@/lib/types";

const languageColors: Record<string, string> = {
  typescript: "#3178c6",
  javascript: "#f7df1e",
  python: "#3572a5",
  go: "#00add8",
  rust: "#dea584",
  "c++": "#f34b7d",
  c: "#555555",
  java: "#b07219",
  kotlin: "#a97bff",
  swift: "#f05138",
  php: "#4f5d95",
  ruby: "#701516",
};

export function ProjectCard({ project }: { project: Project }) {
  const langKey = project.language?.toLowerCase() || "";
  const langColor = languageColors[langKey] || "#8a92a3";

  return (
    <div className="group rounded-xl border border-[#1d212b] bg-[#0f1117] hover:border-[#2e3444] p-5 transition-all flex flex-col justify-between">
      <div>
        {/* Author Header & Sourcing Status */}
        <div className="flex items-center justify-between gap-3 mb-3">
          {project.owner_login ? (
            <Link
              href={`/users/${project.owner_login}`}
              className="flex items-center gap-2 min-w-0 group/author hover:opacity-80 transition-opacity"
            >
              {project.owner_avatar ? (
                <img
                  src={project.owner_avatar}
                  alt={project.owner_login}
                  className="w-5 h-5 rounded-full border border-white/10 object-cover shrink-0"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                  {project.owner_login.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs text-[#8a92a3] group-hover/author:text-white transition-colors truncate">
                {project.owner_login}
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                {project.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-[#8a92a3] truncate">oss</span>
            </div>
          )}

          {project.looking_for_contributors && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#e5484d]/10 text-[#e5484d] text-[11px] font-medium border border-[#e5484d]/20 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e5484d] animate-pulse"></span>
              {project.parsed_tasks && project.parsed_tasks.length > 0
                ? `${project.parsed_tasks.length} ${
                    project.parsed_tasks.length === 1
                      ? "задача"
                      : project.parsed_tasks.length < 5
                      ? "задачи"
                      : "задач"
                  }`
                : "Ищут людей"}
            </span>
          )}
        </div>

        {/* Title */}
        <Link
          href={`/projects/${project.slug}`}
          className="text-base font-semibold text-white hover:text-white transition-colors block truncate"
        >
          {project.name}
        </Link>

        {/* Description */}
        <p className="text-xs text-[#8a92a3] line-clamp-2 mt-1.5 leading-relaxed min-h-[36px]">
          {project.description || "Описание репозитория отсутствует."}
        </p>

        {/* Roles Needed Chips */}
        {project.looking_for_contributors && project.contributor_roles.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#1d212b] flex flex-wrap gap-1">
            {project.contributor_roles.slice(0, 3).map((role) => (
              <span
                key={role}
                className="px-2 py-0.5 rounded-md bg-white/5 text-[#f1f3f7] text-[11px] font-medium border border-white/5"
              >
                {role}
              </span>
            ))}
            {project.contributor_roles.length > 3 && (
              <span className="px-1.5 py-0.5 text-[11px] text-[#8a92a3]">
                +{project.contributor_roles.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Strip */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#1d212b] text-xs text-[#8a92a3]">
        <div className="flex items-center gap-3">
          {project.language && (
            <span className="flex items-center gap-1.5 font-medium text-white">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: langColor }}
              />
              <span>{project.language}</span>
            </span>
          )}
          <span className="flex items-center gap-1 text-[#f1f3f7]">
            <Star className="w-3.5 h-3.5 text-[#e5484d] fill-[#e5484d]" />
            <span className="font-mono">{project.stars.toLocaleString()}</span>
          </span>
          <span className="flex items-center gap-1">
            <GitFork className="w-3.5 h-3.5" />
            <span className="font-mono">{project.forks}</span>
          </span>
          {project.open_issues > 0 && (
            <span className="flex items-center gap-1 text-[#8a92a3]" title="Открытые Issues">
              <CircleDot className="w-3.5 h-3.5 text-[#3fb950]" />
              <span className="font-mono">{project.open_issues}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Открыть на GitHub"
            className="text-[#8a92a3] hover:text-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <Link
            href={`/projects/${project.slug}`}
            className="text-xs font-medium text-white hover:underline"
          >
            Открыть →
          </Link>
        </div>
      </div>
    </div>
  );
}
