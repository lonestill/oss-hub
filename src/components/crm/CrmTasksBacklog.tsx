"use client";

import { useState } from "react";
import { ContributorTask } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";

interface CrmTasksBacklogProps {
  tasks: ContributorTask[];
  onAddTask: (task: ContributorTask) => void;
  onDeleteTask: (taskId: string) => void;
}

export function CrmTasksBacklog({
  tasks,
  onAddTask,
  onDeleteTask,
}: CrmTasksBacklogProps) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskDiff, setNewTaskDiff] = useState<"easy" | "medium" | "hard">("easy");
  const [newTaskTags, setNewTaskTags] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("");

  function handleSubmit() {
    if (!newTaskTitle.trim()) return;
    const task: ContributorTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim(),
      difficulty: newTaskDiff,
      tags: newTaskTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      estimated_time: newTaskTime.trim() || undefined,
      status: "open",
    };
    onAddTask(task);
    setNewTaskTitle("");
    setNewTaskDesc("");
    setNewTaskTags("");
    setNewTaskTime("");
    setShowAddTask(false);
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="rounded-lg border border-[#30363d] bg-[#161b22] overflow-hidden">
        <div className="p-4 border-b border-[#30363d] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white text-xs">
              Бэклог задач проекта ({tasks.length})
            </h3>
            <p className="text-[11px] text-[#8b949e]">
              Задачи, которые контрибьюторы могут взять в 1 клик прямо на сайте
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddTask(!showAddTask)}
            className="px-3 py-1.5 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить задачу</span>
          </button>
        </div>

        {showAddTask && (
          <div className="p-4 bg-[#1c2128] border-b border-[#30363d] space-y-3">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Название задачи: Рефакторинг роутов на Zod..."
              className="w-full rounded-md bg-[#0d1117] border border-[#30363d] px-3 py-1.5 text-xs text-white"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={newTaskDiff}
                onChange={(e) =>
                  setNewTaskDiff(e.target.value as "easy" | "medium" | "hard")
                }
                className="w-full rounded-md bg-[#0d1117] border border-[#30363d] px-3 py-1.5 text-xs text-white"
              >
                <option value="easy">Легко (Good First)</option>
                <option value="medium">Средне (1-2 дня)</option>
                <option value="hard">Сложно / Архитектура</option>
              </select>
              <input
                type="text"
                value={newTaskTime}
                onChange={(e) => setNewTaskTime(e.target.value)}
                placeholder="Оценка времени: 2 часа, 1 день..."
                className="w-full rounded-md bg-[#0d1117] border border-[#30363d] px-3 py-1.5 text-xs text-white"
              />
            </div>
            <input
              type="text"
              value={newTaskTags}
              onChange={(e) => setNewTaskTags(e.target.value)}
              placeholder="Теги: React, TypeScript, API..."
              className="w-full rounded-md bg-[#0d1117] border border-[#30363d] px-3 py-1.5 text-xs text-white"
            />
            <textarea
              rows={2}
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              placeholder="Описание: что нужно сделать, ссылки на файлы..."
              className="w-full rounded-md bg-[#0d1117] border border-[#30363d] p-2.5 text-xs text-white resize-y"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddTask(false)}
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
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-[#8b949e]">
              Нет ручных задач. Если список пуст, система автоматически подтянет issues из репозитория.
            </div>
          ) : (
            tasks.map((task, idx) => (
              <div
                key={task.id}
                className="p-3.5 hover:bg-[#161b22]/50 transition-colors flex items-start justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#8b949e] text-[11px]">
                      #{idx + 1}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                        task.difficulty === "easy"
                          ? "bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30"
                          : task.difficulty === "medium"
                          ? "bg-[#d29922]/20 text-[#d29922] border border-[#d29922]/30"
                          : "bg-[#e5484d]/20 text-[#e5484d] border border-[#e5484d]/30"
                      }`}
                    >
                      {task.difficulty === "easy"
                        ? "Легко"
                        : task.difficulty === "medium"
                        ? "Средне"
                        : "Сложно"}
                    </span>
                    <span className="font-semibold text-white text-xs truncate">
                      {task.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8b949e] line-clamp-2">
                    {task.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteTask(task.id)}
                  className="p-1 rounded text-[#8b949e] hover:text-[#e5484d] transition-colors shrink-0"
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
