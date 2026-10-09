"use client";

import { NavSection } from "./types";
import {
  TrendingUp,
  Sparkles,
  Briefcase,
  UserCheck,
  Terminal,
  Settings,
} from "lucide-react";

interface CrmSidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  totalLeads: number;
  pendingCount: number;
  inProgressCount: number;
  acceptedCount: number;
  tasksCount: number;
  rolesCount: number;
  rosterCount: number;
}

export function CrmSidebar({
  activeSection,
  onSelectSection,
  totalLeads,
  pendingCount,
  inProgressCount,
  acceptedCount,
  tasksCount,
  rolesCount,
  rosterCount,
}: CrmSidebarProps) {
  return (
    <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#30363d] bg-[#0d1117] p-3 sm:p-4 space-y-4 shrink-0">
      {/* Quick Metrics Widget */}
      <div className="p-3 rounded-lg bg-[#161b22] border border-[#30363d] space-y-2">
        <span className="text-[10px] font-mono uppercase text-[#8b949e] block font-semibold">
          Метрики воронки
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[11px] text-[#8b949e] block">Отклики</span>
            <span className="font-bold text-white font-mono text-sm">{totalLeads}</span>
          </div>
          <div>
            <span className="text-[11px] text-[#8b949e] block">Новые</span>
            <span className="font-bold text-[#f78166] font-mono text-sm">{pendingCount}</span>
          </div>
          <div>
            <span className="text-[11px] text-[#8b949e] block">В работе</span>
            <span className="font-bold text-[#d29922] font-mono text-sm">{inProgressCount}</span>
          </div>
          <div>
            <span className="text-[11px] text-[#8b949e] block">В команде</span>
            <span className="font-bold text-[#38bdf8] font-mono text-sm">{acceptedCount}</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="space-y-1 text-xs font-medium">
        <button
          type="button"
          onClick={() => onSelectSection("pipeline")}
          className={`w-full px-3 py-2 rounded-md flex items-center justify-between transition-colors ${
            activeSection === "pipeline"
              ? "bg-[#21262d] text-white font-semibold"
              : "text-[#8b949e] hover:text-white hover:bg-[#161b22]"
          }`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#f78166]" />
            <span>Воронка (Pipeline)</span>
          </div>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#e5484d] text-white font-mono text-[10px] font-bold">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectSection("tasks")}
          className={`w-full px-3 py-2 rounded-md flex items-center justify-between transition-colors ${
            activeSection === "tasks"
              ? "bg-[#21262d] text-white font-semibold"
              : "text-[#8b949e] hover:text-white hover:bg-[#161b22]"
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#e5484d]" />
            <span>Бэклог задач</span>
          </div>
          <span className="px-1.5 py-0.2 rounded-full bg-[#161b22] font-mono text-[10px] text-[#8b949e]">
            {tasksCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSection("team")}
          className={`w-full px-3 py-2 rounded-md flex items-center justify-between transition-colors ${
            activeSection === "team"
              ? "bg-[#21262d] text-white font-semibold"
              : "text-[#8b949e] hover:text-white hover:bg-[#161b22]"
          }`}
        >
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#38bdf8]" />
            <span>Вакансии и роли</span>
          </div>
          <span className="px-1.5 py-0.2 rounded-full bg-[#161b22] font-mono text-[10px] text-[#8b949e]">
            {rolesCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSection("roster")}
          className={`w-full px-3 py-2 rounded-md flex items-center justify-between transition-colors ${
            activeSection === "roster"
              ? "bg-[#21262d] text-white font-semibold"
              : "text-[#8b949e] hover:text-white hover:bg-[#161b22]"
          }`}
        >
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#3fb950]" />
            <span>Ростер участников</span>
          </div>
          <span className="px-1.5 py-0.2 rounded-full bg-[#161b22] font-mono text-[10px] text-[#8b949e]">
            {rosterCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSection("onboarding")}
          className={`w-full px-3 py-2 rounded-md flex items-center justify-between transition-colors ${
            activeSection === "onboarding"
              ? "bg-[#21262d] text-white font-semibold"
              : "text-[#8b949e] hover:text-white hover:bg-[#161b22]"
          }`}
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#3fb950]" />
            <span>Онбординг & .env</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectSection("settings")}
          className={`w-full px-3 py-2 rounded-md flex items-center justify-between transition-colors ${
            activeSection === "settings"
              ? "bg-[#21262d] text-white font-semibold"
              : "text-[#8b949e] hover:text-white hover:bg-[#161b22]"
          }`}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span>Конфиг репозитория</span>
          </div>
        </button>
      </nav>
    </aside>
  );
}
