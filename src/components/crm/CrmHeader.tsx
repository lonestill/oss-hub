"use client";

import Link from "next/link";
import { ArrowLeft, Check, Maximize2, Minimize2, BookOpen } from "lucide-react";

interface CrmHeaderProps {
  projectName: string;
  projectSlug: string;
  ownerLogin: string;
  looking: boolean;
  isSaving: boolean;
  saveFeedback: string | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSave: () => void;
}

export function CrmHeader({
  projectName,
  projectSlug,
  ownerLogin,
  looking,
  isSaving,
  saveFeedback,
  isExpanded,
  onToggleExpand,
  onSave,
}: CrmHeaderProps) {
  return (
    <header className="border-b border-[#30363d] bg-[#161b22] px-4 sm:px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href={`/projects/${projectSlug}`}
          className="p-1.5 rounded-md hover:bg-[#21262d] text-[#8b949e] hover:text-white transition-colors"
          title="Вернуться на страницу проекта"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm tracking-tight truncate">
              {projectName} // Maintainer CRM
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#21262d] text-[#8b949e] border border-[#30363d] hidden sm:inline">
              @{ownerLogin}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#8b949e]">
            <Link
              href={`/projects/${projectSlug}`}
              className="hover:text-white transition-colors underline"
            >
              Публичная страница
            </Link>
            <span>·</span>
            <span className="flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  looking ? "bg-[#3fb950]" : "bg-[#8b949e]"
                }`}
              />
              <span>{looking ? "Поиск активен" : "Поиск отключен"}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {saveFeedback && (
          <span className="text-xs text-[#3fb950] font-medium hidden md:flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>{saveFeedback}</span>
          </span>
        )}

        <Link
          href="/guide?tab=maintainers"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-md border border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white transition-colors"
          title="Справка и руководство по CRM"
        >
          <BookOpen className="w-4 h-4" />
        </Link>

        <button
          type="button"
          onClick={onToggleExpand}
          className="p-1.5 rounded-md border border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white transition-colors"
          title={isExpanded ? "Обычный вид" : "Во весь экран"}
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="px-3.5 py-1.5 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white font-semibold text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
        >
          <Check className="w-3.5 h-3.5" />
          <span>{isSaving ? "Сохранение..." : "Сохранить всё"}</span>
        </button>
      </div>
    </header>
  );
}
