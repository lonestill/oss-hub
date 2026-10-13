"use client";

import { useState } from "react";
import { GitHubIssue } from "@/lib/types";
import { CircleDot, MessageSquare, ExternalLink, Plus, Tag } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface ProjectIssuesListProps {
  issues: GitHubIssue[];
  repoUrl: string;
}

export function ProjectIssuesList({ issues, repoUrl }: ProjectIssuesListProps) {
  const { t, locale } = useLanguage();
  const [filter, setFilter] = useState<"all" | "good-first" | "help-wanted">("all");

  const hasGoodFirst = issues.some((i) =>
    i.labels.some((l) => l.name.toLowerCase().includes("good first") || l.name.toLowerCase().includes("beginner"))
  );
  const hasHelpWanted = issues.some((i) =>
    i.labels.some((l) => l.name.toLowerCase().includes("help wanted") || l.name.toLowerCase().includes("help-wanted"))
  );

  const filteredIssues = issues.filter((issue) => {
    if (filter === "good-first") {
      return issue.labels.some((l) =>
        l.name.toLowerCase().includes("good first") || l.name.toLowerCase().includes("beginner")
      );
    }
    if (filter === "help-wanted") {
      return issue.labels.some((l) =>
        l.name.toLowerCase().includes("help wanted") || l.name.toLowerCase().includes("help-wanted")
      );
    }
    return true;
  });

  return (
    <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[#1d212b] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#3fb950]/10 border border-[#3fb950]/20 flex items-center justify-center text-[#3fb950]">
            <CircleDot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">{t.projectPage.issuesTitle}</h3>
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[11px] font-mono text-[#8a92a3]">
                {issues.length}
              </span>
            </div>
            <p className="text-[11px] text-[#8a92a3] mt-0.5">
              {t.projectPage.issuesDesc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter buttons */}
          <div className="flex items-center bg-[#151821] p-0.5 rounded-lg border border-[#1d212b] text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === "all"
                  ? "bg-white/10 text-white font-medium"
                  : "text-[#8a92a3] hover:text-white"
              }`}
            >
              {t.projectPage.issuesAll}
            </button>
            {hasGoodFirst && (
              <button
                onClick={() => setFilter("good-first")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filter === "good-first"
                    ? "bg-[#3fb950]/20 text-[#3fb950] font-medium"
                    : "text-[#8a92a3] hover:text-white"
                }`}
              >
                Good First
              </button>
            )}
            {hasHelpWanted && (
              <button
                onClick={() => setFilter("help-wanted")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filter === "help-wanted"
                    ? "bg-[#e5484d]/20 text-[#e5484d] font-medium"
                    : "text-[#8a92a3] hover:text-white"
                }`}
              >
                Help Wanted
              </button>
            )}
          </div>

          <a
            href={`${repoUrl}/issues/new`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1d212b] bg-[#151821] hover:border-white/20 text-xs font-medium text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.projectPage.issuesNew}</span>
          </a>
        </div>
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-xs text-[#8a92a3]">
            {issues.length === 0
              ? t.projectPage.issuesEmpty
              : t.projectPage.noFilteredTasks}
          </p>
          <a
            href={`${repoUrl}/issues`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-xs text-[#e5484d] hover:underline"
          >
            <span>{t.projectCard.openOnGithub}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      ) : (
        <div className="divide-y divide-[#1d212b]">
          {filteredIssues.map((issue) => (
            <div
              key={issue.id}
              className="p-4 hover:bg-white/[0.02] transition-colors flex items-start justify-between gap-3 group"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <CircleDot className="w-4 h-4 text-[#3fb950] shrink-0 mt-0.5" />
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-baseline flex-wrap gap-2">
                    <a
                      href={issue.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm font-medium text-white hover:text-[#e5484d] transition-colors break-words"
                    >
                      {issue.title}
                    </a>
                  </div>

                  <div className="flex items-center flex-wrap gap-2 text-[11px] text-[#8a92a3]">
                    <span className="font-mono text-[#586071]">#{issue.number}</span>
                    <span>·</span>
                    {issue.user && (
                      <span className="flex items-center gap-1">
                        {locale === "en" ? "by" : "от"} <span className="text-[#a1a7b5]">{issue.user.login}</span>
                      </span>
                    )}
                    <span>·</span>
                    <span>{new Date(issue.created_at).toLocaleDateString(locale === "en" ? "en-US" : "ru-RU")}</span>

                    {/* Labels */}
                    {issue.labels.length > 0 && (
                      <div className="flex items-center flex-wrap gap-1 ml-1">
                        {issue.labels.slice(0, 4).map((label) => (
                          <span
                            key={label.id}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border"
                            style={{
                              backgroundColor: `#${label.color}15`,
                              borderColor: `#${label.color}40`,
                              color: `#${label.color}`,
                            }}
                          >
                            {label.name}
                          </span>
                        ))}
                        {issue.labels.length > 4 && (
                          <span className="text-[10px] text-[#586071]">
                            +{issue.labels.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {issue.comments > 0 && (
                  <div className="flex items-center gap-1 text-[11px] text-[#8a92a3]">
                    <MessageSquare className="w-3.5 h-3.5 text-[#586071]" />
                    <span>{issue.comments}</span>
                  </div>
                )}
                <a
                  href={issue.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-white/10 text-[#8a92a3] hover:text-white transition-all"
                  title={locale === "en" ? "Open on GitHub" : "Открыть на GitHub"}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer link */}
      {issues.length > 0 && (
        <div className="p-3 bg-[#151821]/50 border-t border-[#1d212b] text-center">
          <a
            href={`${repoUrl}/issues`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[#8a92a3] hover:text-white transition-colors"
          >
            <span>{locale === "en" ? `View all Issues on GitHub (${issues.length}+)` : `Смотреть все Issues на GitHub (${issues.length}+)`}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
