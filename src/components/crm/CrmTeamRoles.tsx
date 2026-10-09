"use client";

import { useState } from "react";
import { TeamRoleItem } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";

interface CrmTeamRolesProps {
  teamRoles: TeamRoleItem[];
  onAddRole: (role: TeamRoleItem) => void;
  onDeleteRole: (index: number) => void;
}

export function CrmTeamRoles({
  teamRoles,
  onAddRole,
  onDeleteRole,
}: CrmTeamRolesProps) {
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleCommitment, setNewRoleCommitment] = useState("5-10 ч/нед");
  const [newRoleDesc, setNewRoleDesc] = useState("");

  function handleSubmit() {
    if (!newRoleName.trim()) return;
    onAddRole({
      role: newRoleName.trim(),
      commitment: newRoleCommitment.trim() || undefined,
      description: newRoleDesc.trim() || undefined,
    });
    setNewRoleName("");
    setNewRoleCommitment("5-10 ч/нед");
    setNewRoleDesc("");
    setShowAddRole(false);
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="rounded-lg border border-[#30363d] bg-[#161b22] overflow-hidden">
        <div className="p-4 border-b border-[#30363d] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white text-xs">
              Вакансии и роли в команду ({teamRoles.length})
            </h3>
            <p className="text-[11px] text-[#8b949e]">
              Кандидаты могут подать заявку на сайте с указанием опыта и контактов
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddRole(!showAddRole)}
            className="px-3 py-1.5 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить роль</span>
          </button>
        </div>

        {showAddRole && (
          <div className="p-4 bg-[#1c2128] border-b border-[#30363d] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="Название роли: Full-stack разработчик..."
                className="w-full rounded-md bg-[#0d1117] border border-[#30363d] px-3 py-1.5 text-xs text-white"
              />
              <input
                type="text"
                value={newRoleCommitment}
                onChange={(e) => setNewRoleCommitment(e.target.value)}
                placeholder="Занятость: 5-10 ч/нед, Part-time..."
                className="w-full rounded-md bg-[#0d1117] border border-[#30363d] px-3 py-1.5 text-xs text-white"
              />
            </div>
            <textarea
              rows={2}
              value={newRoleDesc}
              onChange={(e) => setNewRoleDesc(e.target.value)}
              placeholder="Обязанности и требования..."
              className="w-full rounded-md bg-[#0d1117] border border-[#30363d] p-2.5 text-xs text-white resize-y"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddRole(false)}
                className="px-3 py-1 rounded-md border border-[#30363d] text-[#8b949e] hover:text-white"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-3 py-1 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white font-semibold"
              >
                Сохранить
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-[#30363d] bg-[#0d1117]">
          {teamRoles.length === 0 ? (
            <div className="p-8 text-center text-[#8b949e]">
              Нет открытых ролей.
            </div>
          ) : (
            teamRoles.map((roleItem, idx) => (
              <div
                key={idx}
                className="p-3.5 hover:bg-[#161b22]/50 transition-colors flex items-start justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-xs">
                      {roleItem.role}
                    </span>
                    {roleItem.commitment && (
                      <span className="px-1.5 py-0.2 rounded bg-[#38bdf8]/10 border border-[#38bdf8]/30 text-[10px] text-[#38bdf8] font-mono">
                        {roleItem.commitment}
                      </span>
                    )}
                  </div>
                  {roleItem.description && (
                    <p className="text-[11px] text-[#8b949e] line-clamp-2">
                      {roleItem.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteRole(idx)}
                  className="p-1 rounded text-[#8b949e] hover:text-[#e5484d] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
