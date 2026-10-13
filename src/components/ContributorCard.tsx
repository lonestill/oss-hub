import Link from "next/link";
import { Star, ExternalLink, MessageSquare, CircleDot } from "lucide-react";
import { Project } from "@/lib/types";
import { Locale } from "@/lib/i18n/types";

export function ContributorCard({
  project,
  locale = "ru",
}: {
  project: Project;
  locale?: Locale;
}) {
  const isRu = locale !== "en";

  return (
    <div className="rounded-xl border border-[#1d212b] bg-[#0f1117] hover:border-[#2e3444] p-5 flex flex-col justify-between transition-all">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          {project.owner_login ? (
            <Link
              href={`/users/${project.owner_login}`}
              className="flex items-center gap-2 group/author hover:opacity-80 transition-opacity"
            >
              {project.owner_avatar ? (
                <img
                  src={project.owner_avatar}
                  alt={project.owner_login}
                  className="w-5 h-5 rounded-full border border-white/10 object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white font-bold">
                  {project.owner_login.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs text-[#8a92a3] group-hover/author:text-white transition-colors">
                {project.owner_login}
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white font-bold">
                {project.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-[#8a92a3]">oss</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-xs text-white">
              <Star className="w-3.5 h-3.5 text-[#e5484d] fill-[#e5484d]" />
              <span className="font-mono">{project.stars.toLocaleString()}</span>
            </div>
            {project.open_issues > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#3fb950]/10 border border-[#3fb950]/20 text-xs text-[#3fb950]">
                <CircleDot className="w-3.5 h-3.5" />
                <span className="font-mono">{project.open_issues}</span>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <Link
          href={`/projects/${project.slug}`}
          className="text-lg font-semibold text-white hover:underline block mb-3"
        >
          {project.name}
        </Link>

        {/* Required Roles */}
        <div className="mb-3 space-y-1.5">
          <span className="text-[11px] font-medium text-[#8a92a3] block">
            {isRu ? "Требуемый стек и задачи:" : "Required stack & tasks:"}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {project.contributor_roles.length > 0 ? (
              project.contributor_roles.map((role) => (
                <span
                  key={role}
                  className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-white text-xs font-medium"
                >
                  {role}
                </span>
              ))
            ) : (
              <span className="text-xs text-[#8a92a3]">
                {isRu ? "Любая помощь приветствуется" : "Any help is welcome"}
              </span>
            )}
          </div>
        </div>

        {/* Task description */}
        <div className="mb-4 rounded-lg bg-[#151821] p-3 border border-[#1d212b] text-xs text-[#d1d5db] whitespace-pre-line leading-relaxed">
          {project.contributor_tasks ||
            project.description ||
            (isRu
              ? "Помощь с разработкой, документацией или тестированием."
              : "Help with development, documentation, or testing.")}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-[#1d212b] text-xs">
        <Link
          href={`/projects/${project.slug}`}
          className="inline-flex items-center gap-1.5 text-[#8a92a3] hover:text-white transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>
            {isRu ? "Обсуждение" : "Discussion"} ({project.comments_count || 0})
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg border border-[#1d212b] bg-[#151821] hover:border-white/20 text-[#8a92a3] hover:text-white transition-colors"
            title="GitHub"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href={`${project.url}/issues`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e5484d] hover:bg-[#d03d42] text-white font-medium text-xs transition-colors shadow-sm"
          >
            <span>Issues</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
