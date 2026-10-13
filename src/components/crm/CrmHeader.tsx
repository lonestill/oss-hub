"use client";

import Link from "next/link";
import { useState } from "react";
import { Project } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/context";
import {
  ExternalLink,
  ChevronDown,
  FolderGit2,
  HelpCircle,
} from "lucide-react";

interface CrmHeaderProps {
  project: Project;
  userProjects: Project[];
  looking: boolean;
  attentionCount: number;
}

export function CrmHeader({
  project,
  userProjects,
  looking,
  attentionCount,
}: CrmHeaderProps) {
  const { t } = useLanguage();
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);

  return (
    <header className="border-b border-[#21262d] bg-[#0d1117] px-4 sm:px-6 py-3 sticky top-0 z-40 flex items-center justify-between gap-4 w-full">
      {/* Left: Project Brand & Project Switcher */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProjectsOpen(!isProjectsOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] hover:border-[#484f58] transition-colors text-left"
            title={t.crm.nav.switchProject}
          >
            <div className="w-6 h-6 rounded-lg bg-[#e5484d]/15 border border-[#e5484d]/30 text-[#e5484d] flex items-center justify-center font-bold text-xs shrink-0">
              {project.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-xs sm:text-sm tracking-tight truncate max-w-[140px] sm:max-w-[200px]">
                  {project.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8b949e] shrink-0" />
              </div>
            </div>
          </button>

          {/* Project Switcher Dropdown */}
          {isProjectsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsProjectsOpen(false)}
              />
              <div className="absolute left-0 top-full mt-2 w-72 rounded-xl border border-[#30363d] bg-[#161b22] p-2 shadow-2xl z-50 space-y-1 animate-fadeIn">
                <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase text-[#8b949e] font-semibold border-b border-[#21262d]">
                  {t.profile.myProjects} ({userProjects.length})
                </div>
                <div className="max-h-60 overflow-y-auto space-y-0.5">
                  {userProjects.map((p) => {
                    const isCurrent = p.id === project.id;
                    return (
                      <Link
                        key={p.id}
                        href={`/projects/${p.slug}/crm`}
                        onClick={() => setIsProjectsOpen(false)}
                        className={`w-full px-2.5 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                          isCurrent
                            ? "bg-[#21262d] text-white font-semibold"
                            : "text-[#8b949e] hover:text-white hover:bg-[#1f242c]"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FolderGit2 className="w-3.5 h-3.5 text-[#8b949e] shrink-0" />
                          <span className="truncate">{p.name}</span>
                        </div>
                        {isCurrent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Status Indicator */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#161b22] border border-[#21262d] text-[11px] text-[#8b949e]">
          <span
            className={`w-2 h-2 rounded-full ${
              looking ? "bg-[#3fb950] animate-pulse" : "bg-[#8b949e]"
            }`}
          />
          <span>{looking ? t.home.statusOpen : t.developerCard.statusBusy}</span>
        </div>
      </div>

      {/* Right: Public Page Link & Help */}
      <div className="flex items-center gap-2.5 shrink-0">
        <Link
          href={`/projects/${project.slug}`}
          target="_blank"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#30363d] bg-[#161b22] hover:bg-[#21262d] text-white text-xs font-medium transition-colors"
        >
          <span>{t.crm.nav.publicPage}</span>
          <ExternalLink className="w-3.5 h-3.5 text-[#8b949e]" />
        </Link>

        <Link
          href="/guide?tab=maintainers"
          target="_blank"
          className="p-2 rounded-xl border border-[#30363d] bg-[#161b22] hover:bg-[#21262d] text-[#8b949e] hover:text-white transition-colors hidden sm:flex"
          title={t.nav.guide}
        >
          <HelpCircle className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
}
