"use client";

import { useState } from "react";
import { Project, TeamApplication } from "@/lib/types";
import { TaskClaim } from "@/lib/claims";
import { LayoutDashboard, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import Link from "next/link";
import { ProjectCrmWorkspace } from "./ProjectCrmWorkspace";
import { useLanguage } from "@/lib/i18n";

interface OwnerControlPanelProps {
  project: Project;
  claims?: TaskClaim[];
  teamApplications?: TeamApplication[];
}

export function OwnerControlPanel({
  project,
  claims = [],
  teamApplications = [],
}: OwnerControlPanelProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const pendingCount =
    claims.filter((c) => c.status === "pending").length +
    teamApplications.filter((a) => a.status === "pending").length;

  return (
    <section className="rounded-xl border border-[#30363d] bg-[#0d1117] overflow-hidden shadow-md text-xs transition-all">
      {/* Quick Summary Bar */}
      <div className="p-4 bg-[#161b22] border-b border-[#30363d] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#e5484d] shrink-0">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-sm tracking-tight">
                {t.projectPage.ownerPanelTitle}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                @{project.owner_login} / {project.name}
              </span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#e5484d] text-white text-[10px] font-bold">
                  +{pendingCount} {t.projectPage.newClaims}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#8b949e] mt-0.5">
              {t.projectPage.ownerPanelSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${project.slug}/crm`}
            className="px-3.5 py-1.5 rounded-md border border-[#e5484d]/40 bg-[#e5484d]/10 hover:bg-[#e5484d]/20 text-[#e5484d] hover:text-white font-medium text-xs transition-colors flex items-center gap-1.5"
            title={t.projectPage.openFullCrm}
          >
            <span>{t.projectPage.workspaceCrm}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="px-3 py-1.5 rounded-md border border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-white font-medium text-xs transition-colors flex items-center gap-1.5"
          >
            <span>{isOpen ? t.projectPage.collapse : t.projectPage.quickView}</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Embedded CRM Workspace when expanded */}
      {isOpen && (
        <div className="p-3 sm:p-4 bg-[#090b10]">
          <ProjectCrmWorkspace
            project={project}
            claims={claims}
            teamApplications={teamApplications}
            sessionUserLogin={project.owner_login || ""}
          />
        </div>
      )}
    </section>
  );
}
