"use client";

import { useState } from "react";
import { FileText, History, Tag, ExternalLink, Calendar, User } from "lucide-react";
import { MarkdownViewer } from "./MarkdownViewer";
import { GitHubRelease } from "@/lib/types";

interface ProjectDocsTabsProps {
  readmeContent: string | null;
  releases: GitHubRelease[];
  repoFullName: string;
  repoUrl: string;
}

export function ProjectDocsTabs({
  readmeContent,
  releases,
  repoFullName,
  repoUrl,
}: ProjectDocsTabsProps) {
  const [activeTab, setActiveTab] = useState<"readme" | "changelog">("readme");

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-[#1d212b] pb-2">
        <div className="flex items-center gap-1.5 bg-[#12151d] p-1 rounded-xl border border-[#1d212b]">
          <button
            type="button"
            onClick={() => setActiveTab("readme")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "readme"
                ? "bg-white/10 text-white shadow-sm"
                : "text-[#8a92a3] hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>README.md</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("changelog")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "changelog"
                ? "bg-[#e5484d] text-white shadow-sm"
                : "text-[#8a92a3] hover:text-white"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Changelog / Релизы</span>
            {releases.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                {releases.length}
              </span>
            )}
          </button>
        </div>

        <a
          href={activeTab === "readme" ? `${repoUrl}#readme` : `${repoUrl}/releases`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#8a92a3] hover:text-white transition-colors flex items-center gap-1"
        >
          <span>{activeTab === "readme" ? "README на GitHub" : "Все релизы на GitHub"}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Content Container */}
      <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-6 sm:p-8">
        {activeTab === "readme" ? (
          readmeContent ? (
            <MarkdownViewer content={readmeContent} repoFullName={repoFullName} />
          ) : (
            <div className="py-12 text-center text-[#8a92a3] text-xs">
              README файл отсутствует или пуст в этом репозитории.
            </div>
          )
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#1d212b] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  История релизов и обновлений
                </h3>
                <p className="text-xs text-[#8a92a3] mt-0.5">
                  Данные автоматически подтягиваются из GitHub Releases репозитория.
                </p>
              </div>
            </div>

            {releases.length > 0 ? (
              <div className="space-y-6">
                {releases.map((release) => (
                  <div
                    key={release.id}
                    className="p-5 rounded-xl border border-[#1d212b] bg-[#12151d] space-y-3.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1d212b] pb-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-[#e5484d]/10 text-[#e5484d] border border-[#e5484d]/20">
                          {release.tag_name}
                        </span>
                        <h4 className="text-sm font-bold text-white">
                          {release.name || release.tag_name}
                        </h4>
                        {release.prerelease && (
                          <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-[#d29922]/20 text-[#d29922] border border-[#d29922]/30">
                            Pre-release
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#8a92a3] font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(release.published_at).toLocaleDateString("ru-RU")}</span>
                        </span>
                        {release.author && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>@{release.author.login}</span>
                          </span>
                        )}
                        <a
                          href={release.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-white transition-colors"
                          title="Открыть релиз на GitHub"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {release.body ? (
                      <div className="text-xs text-[#c9d1d9] leading-relaxed">
                        <MarkdownViewer content={release.body} repoFullName={repoFullName} />
                      </div>
                    ) : (
                      <div className="text-xs text-[#8a92a3] italic">
                        Описание для этого релиза не заполнено автором.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-[#8a92a3] text-xs space-y-2">
                <Tag className="w-6 h-6 mx-auto text-[#8a92a3]/40" />
                <div className="font-semibold text-white">Релизы не найдены</div>
                <p className="max-w-md mx-auto">
                  В этом GitHub-репозитории пока не создано ни одного официального релиза (Releases / Tags).
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
