"use client";

import { useState } from "react";
import { GitHubUserRepo } from "@/lib/user-repos";
import { Star, Check } from "lucide-react";

export function UserReposPicker({
  repos,
  onSelectRepo,
}: {
  repos: GitHubUserRepo[];
  onSelectRepo: (url: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  if (repos.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[#1d212b] bg-[#151821] p-4 space-y-3 text-xs">
      <div className="flex items-center justify-between text-xs border-b border-[#1d212b] pb-2.5">
        <span className="font-semibold text-white">
          Ваши репозитории GitHub ({repos.length})
        </span>
        <span className="text-[#8a92a3] text-[11px]">
          Выбор в один клик
        </span>
      </div>

      <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
        {repos.map((repo) => {
          const isCurrent = selected === repo.html_url;
          return (
            <div
              key={repo.id}
              onClick={() => {
                setSelected(repo.html_url);
                onSelectRepo(repo.html_url);
              }}
              className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                isCurrent
                  ? "border-white/40 bg-[#0f1117]"
                  : "border-[#1d212b] bg-[#0f1117] hover:border-[#2e3444]"
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-xs truncate">
                    {repo.name}
                  </span>
                  {repo.language && (
                    <span className="text-[10px] text-[#8a92a3]">
                      {repo.language}
                    </span>
                  )}
                  {repo.fork && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-[#8a92a3]">
                      Fork
                    </span>
                  )}
                </div>
                {repo.description && (
                  <p className="text-xs text-[#8a92a3] truncate mt-0.5">
                    {repo.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="flex items-center gap-1 text-xs text-[#f1f3f7] font-mono">
                  <Star className="w-3.5 h-3.5 text-[#e5484d] fill-[#e5484d]" />
                  {repo.stargazers_count}
                </span>

                <button
                  type="button"
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    isCurrent
                      ? "bg-[#e5484d] text-white"
                      : "bg-[#151821] border border-[#1d212b] text-[#8a92a3] hover:text-white"
                  }`}
                >
                  {isCurrent ? (
                    <span className="flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Выбран</span>
                    </span>
                  ) : (
                    "Выбрать"
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
