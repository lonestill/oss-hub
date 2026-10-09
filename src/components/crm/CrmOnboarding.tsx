"use client";

import { useState } from "react";
import { ArchitectureItem } from "@/lib/types";
import { Terminal, FileCode, Layers, Plus, Trash2 } from "lucide-react";

interface CrmOnboardingProps {
  quickstartCommand: string;
  onChangeQuickstartCommand: (val: string) => void;
  archMap: ArchitectureItem[];
  onAddArchItem: (item: ArchitectureItem) => void;
  onDeleteArchItem: (index: number) => void;
  envExample: string;
  onChangeEnvExample: (val: string) => void;
}

export function CrmOnboarding({
  quickstartCommand,
  onChangeQuickstartCommand,
  archMap,
  onAddArchItem,
  onDeleteArchItem,
  envExample,
  onChangeEnvExample,
}: CrmOnboardingProps) {
  const [showAddArch, setShowAddArch] = useState(false);
  const [newArchPath, setNewArchPath] = useState("");
  const [newArchDesc, setNewArchDesc] = useState("");

  function handleSubmit() {
    if (!newArchPath.trim()) return;
    onAddArchItem({
      path: newArchPath.trim(),
      description: newArchDesc.trim(),
    });
    setNewArchPath("");
    setNewArchDesc("");
    setShowAddArch(false);
  }

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Quickstart */}
      <div className="rounded-lg border border-[#30363d] bg-[#161b22] overflow-hidden">
        <div className="p-4 border-b border-[#30363d]">
          <h3 className="font-semibold text-white text-xs flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-[#3fb950]" />
            <span>Команда быстрого старта (1-liner Quickstart)</span>
          </h3>
        </div>
        <div className="p-4 bg-[#0d1117]">
          <input
            type="text"
            value={quickstartCommand}
            onChange={(e) => onChangeQuickstartCommand(e.target.value)}
            placeholder="git clone ... && cd ... && npm install && npm run dev"
            className="w-full rounded-md bg-[#161b22] border border-[#30363d] px-3 py-2 text-xs text-[#38bdf8] font-mono focus:outline-none focus:border-[#58a6ff]"
          />
        </div>
      </div>

      {/* Architecture Map */}
      <div className="rounded-lg border border-[#30363d] bg-[#161b22] overflow-hidden">
        <div className="p-4 border-b border-[#30363d] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white text-xs flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-[#e5484d]" />
              <span>Карта ключевых файлов (Architecture Map)</span>
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowAddArch(!showAddArch)}
            className="px-2.5 py-1 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить файл</span>
          </button>
        </div>

        {showAddArch && (
          <div className="p-4 bg-[#1c2128] border-b border-[#30363d] space-y-2">
            <input
              type="text"
              value={newArchPath}
              onChange={(e) => setNewArchPath(e.target.value)}
              placeholder="Путь: src/lib/db.ts..."
              className="w-full rounded-md bg-[#0d1117] border border-[#30363d] px-3 py-1.5 text-xs text-white font-mono"
            />
            <input
              type="text"
              value={newArchDesc}
              onChange={(e) => setNewArchDesc(e.target.value)}
              placeholder="Назначение файла..."
              className="w-full rounded-md bg-[#0d1117] border border-[#30363d] px-3 py-1.5 text-xs text-white"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddArch(false)}
                className="px-2.5 py-1 text-xs text-[#8b949e]"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-3 py-1 rounded bg-[#238636] text-white font-semibold text-xs"
              >
                Добавить
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-[#30363d] bg-[#0d1117]">
          {archMap.length === 0 ? (
            <div className="p-6 text-center text-[#8b949e]">
              Карта архитектуры пуста. Добавьте 2-3 ключевых файла проекта.
            </div>
          ) : (
            archMap.map((item, idx) => (
              <div
                key={idx}
                className="p-3 flex items-center justify-between gap-3 hover:bg-[#161b22]/50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileCode className="w-3.5 h-3.5 text-[#e5484d] shrink-0" />
                  <span className="font-mono text-white text-xs truncate">
                    {item.path}
                  </span>
                  <span className="text-[#8b949e] text-[11px] truncate">
                    — {item.description}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteArchItem(idx)}
                  className="p-1 text-[#8b949e] hover:text-[#e5484d]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* .env.example */}
      <div className="rounded-lg border border-[#30363d] bg-[#161b22] overflow-hidden">
        <div className="p-4 border-b border-[#30363d]">
          <h3 className="font-semibold text-white text-xs flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Шаблон переменных окружения (.env.example)</span>
          </h3>
        </div>
        <div className="p-4 bg-[#0d1117]">
          <textarea
            rows={4}
            value={envExample}
            onChange={(e) => onChangeEnvExample(e.target.value)}
            placeholder="DATABASE_URL=file:./dev.db&#10;PORT=3000"
            className="w-full rounded-md bg-[#161b22] border border-[#30363d] p-3 text-xs text-white font-mono focus:outline-none focus:border-[#58a6ff] resize-y"
          />
        </div>
      </div>
    </div>
  );
}
