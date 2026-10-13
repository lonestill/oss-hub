"use client";

import { useState } from "react";
import { Project, ContributionMode } from "@/lib/types";
import {
  Save,
  Check,
  RefreshCw,
  Shield,
  AlertTriangle,
  GitBranch,
  Terminal,
  FileCode,
  Globe,
  Mail,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface CrmSettingsProps {
  project: Project;
  onSaveGeneral: (data: {
    description: string;
    contactUrl: string;
    looking: boolean;
  }) => Promise<void>;
  onSaveContribution: (data: {
    modes: ContributionMode[];
    quickstart: string;
    envExample: string;
  }) => Promise<void>;
  onRescanGithub: () => Promise<void>;
}

export function CrmSettings({
  project,
  onSaveGeneral,
  onSaveContribution,
  onRescanGithub,
}: CrmSettingsProps) {
  // Block 1: General State
  const [description, setDescription] = useState(project.description || "");
  const [contactUrl, setContactUrl] = useState(project.contact_url || "");
  const [looking, setLooking] = useState(project.looking_for_contributors);

  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [savedGeneralFeedback, setSavedGeneralFeedback] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const isGeneralDirty =
    description !== (project.description || "") ||
    contactUrl !== (project.contact_url || "") ||
    looking !== project.looking_for_contributors;

  // Block 2: Contribution State
  const initialModes: ContributionMode[] =
    project.modes && project.modes.length > 0
      ? project.modes
      : ["tasks", "team", "onboarding"];
  const [modes, setModes] = useState<ContributionMode[]>(initialModes);
  const [quickstart, setQuickstart] = useState(project.quickstart_command || "");
  const [envExample, setEnvExample] = useState(project.env_example || "");

  const [isSavingContrib, setIsSavingContrib] = useState(false);
  const [savedContribFeedback, setSavedContribFeedback] = useState(false);
  const [contribError, setContribError] = useState<string | null>(null);

  const isContribDirty =
    JSON.stringify(modes) !== JSON.stringify(initialModes) ||
    quickstart !== (project.quickstart_command || "") ||
    envExample !== (project.env_example || "");

  // Block 3: GitHub State
  const [isRescanning, setIsRescanning] = useState(false);
  const [rescanFeedback, setRescanFeedback] = useState<string | null>(null);

  const toggleMode = (m: ContributionMode) => {
    setModes((prev) =>
      prev.includes(m) ? prev.filter((item) => item !== m) : [...prev, m]
    );
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGeneral(true);
    setGeneralError(null);
    try {
      await onSaveGeneral({ description, contactUrl, looking });
      setSavedGeneralFeedback(true);
      setTimeout(() => setSavedGeneralFeedback(false), 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ошибка сохранения";
      setGeneralError(msg);
      setTimeout(() => setGeneralError(null), 4000);
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const handleSaveContrib = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingContrib(true);
    setContribError(null);
    try {
      await onSaveContribution({ modes, quickstart, envExample });
      setSavedContribFeedback(true);
      setTimeout(() => setSavedContribFeedback(false), 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ошибка сохранения";
      setContribError(msg);
      setTimeout(() => setContribError(null), 4000);
    } finally {
      setIsSavingContrib(false);
    }
  };

  const handleRescan = async () => {
    setIsRescanning(true);
    setRescanFeedback(null);
    try {
      await onRescanGithub();
      setRescanFeedback("Синхронизировано успешно!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ошибка синхронизации";
      setRescanFeedback(msg);
    } finally {
      setIsRescanning(false);
      setTimeout(() => setRescanFeedback(null), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-base font-bold text-white">Настройки репозитория</h2>
        <p className="text-xs text-[#8b949e] mt-0.5">
          Каждый блок сохраняется независимо, чтобы не терять введенные данные
        </p>
      </div>

      {/* Блок 1: Основное */}
      <form
        onSubmit={handleSaveGeneral}
        className="p-6 rounded-2xl border border-[#21262d] bg-[#161b22] space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[#21262d] pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#38bdf8]" />
            <h3 className="text-sm font-bold text-white">Основная информация</h3>
          </div>
          {isGeneralDirty && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#d29922]/20 text-[#d29922] font-semibold">
              Есть несохранённые правки
            </span>
          )}
        </div>

        <div className="space-y-3.5">
          {/* Status Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#30363d] bg-[#0d1117]">
            <div>
              <div className="text-xs font-semibold text-white">
                Поиск контрибьюторов на платформе
              </div>
              <div className="text-[11px] text-[#8b949e] mt-0.5">
                Показывать репозиторий в каталоге с бейджем «Ищет помощь»
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLooking(!looking)}
              className="text-white hover:opacity-80 transition-opacity"
            >
              {looking ? (
                <ToggleRight className="w-8 h-8 text-[#3fb950]" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-[#8b949e]" />
              )}
            </button>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-mono text-[#8b949e] uppercase block mb-1">
              Краткое описание проекта для витрины
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-xl border border-[#30363d] bg-[#0d1117] text-xs text-white focus:outline-none focus:border-[#e5484d]"
              placeholder="Опишите ценность репозитория, архитектуру и задачи..."
            />
          </div>

          {/* Contact URL */}
          <div>
            <label className="text-[11px] font-mono text-[#8b949e] uppercase block mb-1">
              Прямой контакт для связи (Telegram, Discord, Email)
            </label>
            <input
              type="text"
              value={contactUrl}
              onChange={(e) => setContactUrl(e.target.value)}
              placeholder="https://t.me/username или @username"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white focus:outline-none focus:border-[#e5484d]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#21262d]">
          <div>
            {savedGeneralFeedback && (
              <span className="text-xs text-[#3fb950] font-medium flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Основное сохранено!</span>
              </span>
            )}
            {generalError && (
              <span className="text-xs text-[#e5484d] font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>{generalError}</span>
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={isSavingGeneral || !isGeneralDirty}
            className="px-4 py-1.5 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSavingGeneral ? "Сохранение..." : "Сохранить основное"}</span>
          </button>
        </div>
      </form>

      {/* Блок 2: Контрибьюция */}
      <form
        onSubmit={handleSaveContrib}
        className="p-6 rounded-2xl border border-[#21262d] bg-[#161b22] space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[#21262d] pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#e5484d]" />
            <h3 className="text-sm font-bold text-white">Контрибьюция и онбординг</h3>
          </div>
          {isContribDirty && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#d29922]/20 text-[#d29922] font-semibold">
              Есть несохранённые правки
            </span>
          )}
        </div>

        <div className="space-y-4">
          {/* Modes Checkboxes */}
          <div>
            <label className="text-[11px] font-mono text-[#8b949e] uppercase block mb-2">
              Активные сценарии участия в проекте:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <label
                onClick={() => toggleMode("tasks")}
                className={`p-3 rounded-xl border cursor-pointer text-xs transition-colors flex items-center gap-2.5 ${
                  modes.includes("tasks")
                    ? "border-[#e5484d] bg-[#e5484d]/10 text-white font-medium"
                    : "border-[#30363d] bg-[#0d1117] text-[#8b949e]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={modes.includes("tasks")}
                  onChange={() => {}}
                  className="hidden"
                />
                <span className="font-semibold">Разовые задачи</span>
              </label>

              <label
                onClick={() => toggleMode("team")}
                className={`p-3 rounded-xl border cursor-pointer text-xs transition-colors flex items-center gap-2.5 ${
                  modes.includes("team")
                    ? "border-[#38bdf8] bg-[#38bdf8]/10 text-white font-medium"
                    : "border-[#30363d] bg-[#0d1117] text-[#8b949e]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={modes.includes("team")}
                  onChange={() => {}}
                  className="hidden"
                />
                <span className="font-semibold">Набор в команду</span>
              </label>

              <label
                onClick={() => toggleMode("onboarding")}
                className={`p-3 rounded-xl border cursor-pointer text-xs transition-colors flex items-center gap-2.5 ${
                  modes.includes("onboarding")
                    ? "border-[#3fb950] bg-[#3fb950]/10 text-white font-medium"
                    : "border-[#30363d] bg-[#0d1117] text-[#8b949e]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={modes.includes("onboarding")}
                  onChange={() => {}}
                  className="hidden"
                />
                <span className="font-semibold">Онбординг & .env</span>
              </label>
            </div>
          </div>

          {/* Quickstart Command */}
          <div>
            <label className="text-[11px] font-mono text-[#8b949e] uppercase block mb-1">
              Команда быстрого старта (Quickstart command)
            </label>
            <input
              type="text"
              value={quickstart}
              onChange={(e) => setQuickstart(e.target.value)}
              placeholder="git clone ... && npm install && npm run dev"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white font-mono focus:outline-none focus:border-[#e5484d]"
            />
          </div>

          {/* Env Example */}
          <div>
            <label className="text-[11px] font-mono text-[#8b949e] uppercase block mb-1">
              Шаблон переменных окружения (.env.example)
            </label>
            <textarea
              value={envExample}
              onChange={(e) => setEnvExample(e.target.value)}
              rows={4}
              placeholder="DATABASE_URL=...&#10;API_KEY=...&#10;PORT=3000"
              className="w-full p-3 rounded-xl border border-[#30363d] bg-[#0d1117] text-xs text-white font-mono focus:outline-none focus:border-[#e5484d]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#21262d]">
          <div>
            {savedContribFeedback && (
              <span className="text-xs text-[#3fb950] font-medium flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Контрибьюция сохранена!</span>
              </span>
            )}
            {contribError && (
              <span className="text-xs text-[#e5484d] font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>{contribError}</span>
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={isSavingContrib || !isContribDirty}
            className="px-4 py-1.5 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSavingContrib ? "Сохранение..." : "Сохранить контрибьюцию"}</span>
          </button>
        </div>
      </form>

      {/* Блок 3: Интеграция с GitHub */}
      <div className="p-6 rounded-2xl border border-[#21262d] bg-[#161b22] space-y-4">
        <div className="flex items-center justify-between border-b border-[#21262d] pb-3">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-white" />
            <h3 className="text-sm font-bold text-white">Интеграция с GitHub</h3>
          </div>
          <span className="text-xs font-mono text-[#8b949e]">
            {project.full_name}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-[#30363d] bg-[#0d1117] space-y-1">
            <span className="text-[11px] text-[#8b949e] block font-mono">Статус синхронизации</span>
            <div className="text-white font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3fb950]" />
              <span>Репозиторий подключен</span>
            </div>
            <div className="text-[11px] text-[#8b949e] font-mono mt-1">
              Issues: {project.open_issues} · Stars: {project.stars}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-[#30363d] bg-[#0d1117] space-y-1">
            <span className="text-[11px] text-[#8b949e] block font-mono">Оценка антифрода</span>
            <div className="text-white font-medium flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>{project.moderation_score ?? 100} / 100</span>
            </div>
            <div className="text-[11px] text-[#8b949e]">
              Статус проверки: {project.moderation_status || "approved"}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#21262d]">
          <span className="text-xs text-[#38bdf8] font-medium">
            {rescanFeedback}
          </span>
          <button
            type="button"
            onClick={handleRescan}
            disabled={isRescanning}
            className="px-4 py-1.5 rounded-xl border border-[#30363d] bg-[#0d1117] hover:bg-[#21262d] text-white text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRescanning ? "animate-spin" : ""}`} />
            <span>{isRescanning ? "Синхронизация..." : "Синхронизировать с GitHub"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
