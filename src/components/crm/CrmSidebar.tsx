"use client";

import { NavSection } from "./types";
import { useLanguage } from "@/lib/i18n/context";
import {
  LayoutDashboard,
  CheckSquare,
  Users2,
  Settings,
} from "lucide-react";

interface CrmSidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  attentionCount: number;
  tasksCount: number;
  teamCount: number;
}

export function CrmSidebar({
  activeSection,
  onSelectSection,
  attentionCount,
  tasksCount,
  teamCount,
}: CrmSidebarProps) {
  const { t } = useLanguage();

  return (
    <aside className="w-full md:w-60 border-b md:border-b-0 md:border-r border-[#21262d] bg-[#0d1117] p-3 sm:p-4 flex flex-col justify-between shrink-0 select-none">
      {/* Top Main Navigation */}
      <div className="space-y-1">
        <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[#8b949e] font-semibold mb-1">
          {t.crm.nav.overview}
        </div>

        <button
          type="button"
          onClick={() => onSelectSection("overview")}
          className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-xs transition-all ${
            activeSection === "overview"
              ? "bg-[#e5484d] text-white font-semibold shadow-sm shadow-[#e5484d]/20"
              : "text-[#8b949e] hover:text-white hover:bg-[#161b22]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <LayoutDashboard className="w-4 h-4" />
            <span>{t.crm.nav.overview}</span>
          </div>
          {attentionCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold ${
                activeSection === "overview"
                  ? "bg-black/30 text-white"
                  : "bg-[#e5484d] text-white animate-pulse"
              }`}
            >
              {attentionCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectSection("tasks")}
          className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-xs transition-all ${
            activeSection === "tasks"
              ? "bg-[#e5484d] text-white font-semibold shadow-sm shadow-[#e5484d]/20"
              : "text-[#8b949e] hover:text-white hover:bg-[#161b22]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckSquare className="w-4 h-4" />
            <span>{t.crm.nav.tasks}</span>
          </div>
          <span
            className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
              activeSection === "tasks"
                ? "bg-black/30 text-white"
                : "bg-[#161b22] text-[#8b949e]"
            }`}
          >
            {tasksCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSection("team")}
          className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-xs transition-all ${
            activeSection === "team"
              ? "bg-[#e5484d] text-white font-semibold shadow-sm shadow-[#e5484d]/20"
              : "text-[#8b949e] hover:text-white hover:bg-[#161b22]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Users2 className="w-4 h-4" />
            <span>{t.crm.nav.team}</span>
          </div>
          <span
            className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
              activeSection === "team"
                ? "bg-black/30 text-white"
                : "bg-[#161b22] text-[#8b949e]"
            }`}
          >
            {teamCount}
          </span>
        </button>
      </div>

      {/* Bottom Sidebar: Settings */}
      <div className="pt-4 border-t border-[#21262d] mt-6 md:mt-auto">
        <button
          type="button"
          onClick={() => onSelectSection("settings")}
          className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-2.5 text-xs transition-all ${
            activeSection === "settings"
              ? "bg-[#21262d] text-white font-semibold border border-[#30363d]"
              : "text-[#8b949e] hover:text-white hover:bg-[#161b22]"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>{t.crm.nav.settings}</span>
        </button>
      </div>
    </aside>
  );
}
