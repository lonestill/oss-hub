"use client";

import { ContributionMode } from "@/lib/types";

interface CrmSettingsProps {
  looking: boolean;
  onToggleLooking: () => void;
  modes: ContributionMode[];
  onToggleMode: (mode: ContributionMode) => void;
  contactUrl: string;
  onChangeContactUrl: (val: string) => void;
}

export function CrmSettings({
  looking,
  onToggleLooking,
  modes,
  onToggleMode,
  contactUrl,
  onChangeContactUrl,
}: CrmSettingsProps) {
  return (
    <div className="space-y-4 max-w-4xl">
      <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4 flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-white text-xs">
            Статус поиска контрибьюторов
          </h4>
          <p className="text-[11px] text-[#8b949e]">
            Отображать проект в фильтрах каталога OSS Hub
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleLooking}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
            looking
              ? "bg-[#238636] text-white"
              : "bg-[#21262d] border border-[#30363d] text-[#8b949e]"
          }`}
        >
          {looking ? "Активен" : "Выключен"}
        </button>
      </div>

      <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4 space-y-3">
        <h4 className="font-semibold text-white text-xs">
          Включенные режимы контрибуции на странице:
        </h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={modes.includes("tasks")}
              onChange={() => onToggleMode("tasks")}
              className="rounded bg-[#0d1117] border-[#30363d] text-[#238636]"
            />
            <span className="text-white text-xs font-medium">
              1. Разовые задачи (Claims)
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={modes.includes("team")}
              onChange={() => onToggleMode("team")}
              className="rounded bg-[#0d1117] border-[#30363d] text-[#238636]"
            />
            <span className="text-white text-xs font-medium">
              2. Набор в команду (Team Finder)
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={modes.includes("onboarding")}
              onChange={() => onToggleMode("onboarding")}
              className="rounded bg-[#0d1117] border-[#30363d] text-[#238636]"
            />
            <span className="text-white text-xs font-medium">
              3. Fast-Track Онбординг
            </span>
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4 space-y-2">
        <label className="text-[11px] text-[#8b949e] block font-medium">
          Прямой контакт мейнтейнера (Telegram):
        </label>
        <input
          type="text"
          value={contactUrl}
          onChange={(e) => onChangeContactUrl(e.target.value)}
          placeholder="@username или https://t.me/username"
          className="w-full rounded-md bg-[#0d1117] border border-[#30363d] px-3 py-2 text-xs text-white"
        />
      </div>
    </div>
  );
}
