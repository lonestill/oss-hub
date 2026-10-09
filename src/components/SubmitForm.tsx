"use client";

import { useActionState, useState } from "react";
import { submitProjectAction } from "@/app/actions";
import { UserReposPicker } from "@/components/UserReposPicker";
import { GitHubUserRepo } from "@/lib/user-repos";
import { UserSession } from "@/lib/auth";
import { GithubIcon } from "@/components/GithubIcon";
import Link from "next/link";

export function SubmitForm({
  session,
  userRepos,
}: {
  session: UserSession | null;
  userRepos: GitHubUserRepo[];
}) {
  const [repoUrl, setRepoUrl] = useState("");
  const [looking, setLooking] = useState(false);
  const [state, formAction, isPending] = useActionState(submitProjectAction, null);

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-6 sm:p-8 space-y-6 text-xs"
    >
      {/* If logged in, show User Repos Picker */}
      {session && userRepos.length > 0 && (
        <UserReposPicker
          repos={userRepos}
          onSelectRepo={(url) => setRepoUrl(url)}
        />
      )}

      {/* Repo URL Input */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-[#8a92a3] flex items-center justify-between">
          <span className="flex items-center gap-2 text-white">
            <GithubIcon className="w-4 h-4 text-white" />
            Ссылка на репозиторий GitHub *
          </span>
          {!session && (
            <Link
              href="/login"
              className="text-[#e5484d] hover:underline text-[11px]"
            >
              Войти через GitHub для выбора из своих проектов →
            </Link>
          )}
        </label>
        <input
          type="text"
          name="repoUrl"
          required
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/owner/repo или owner/repo"
          className="w-full rounded-lg bg-[#151821] border border-[#1d212b] px-3.5 py-2.5 text-xs text-white placeholder-[#586071] focus:outline-none focus:border-[#2e3444]"
        />
        <div className="text-[11px] text-[#8a92a3]">
          Поддерживаются любые публичные репозитории GitHub.
        </div>
      </div>

      {/* Looking for contributors toggle */}
      <div className="p-4 rounded-xl border border-[#1d212b] bg-[#151821] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-white block">
              Ищу разработчиков / контрибьюторов
            </span>
            <span className="text-[11px] text-[#8a92a3]">
              Разместить объявление на доске «Ищут разработчиков»
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLooking(!looking)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              looking
                ? "bg-[#e5484d] text-white"
                : "bg-[#0f1117] border border-[#1d212b] text-[#8a92a3] hover:text-white"
            }`}
          >
            {looking ? "Активно" : "Выключено"}
          </button>
          <input
            type="checkbox"
            name="lookingForContributors"
            checked={looking}
            readOnly
            className="hidden"
          />
        </div>

        {/* Conditional Contributor Fields */}
        {looking && (
          <div className="pt-3 border-t border-[#1d212b] space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#8a92a3] block">
                Требуемый стек и роли (через запятую):
              </label>
              <input
                type="text"
                name="contributorRoles"
                placeholder="Frontend (React), Go, DevOps, Rust, UI/UX"
                className="w-full rounded-lg bg-[#0f1117] border border-[#1d212b] px-3 py-2 text-xs text-white placeholder-[#586071] focus:outline-none focus:border-[#2e3444]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#8a92a3] block">
                Фронт работ и задачи:
              </label>
              <textarea
                name="contributorTasks"
                rows={3}
                placeholder="Опишите задачи, баги или новые фичи, в которых требуется помощь..."
                className="w-full rounded-lg bg-[#0f1117] border border-[#1d212b] p-3 text-xs text-white placeholder-[#586071] focus:outline-none focus:border-[#2e3444] resize-y leading-relaxed"
              />
            </div>
          </div>
        )}
      </div>

      {/* Error notification */}
      {state?.error && (
        <div className="p-3 rounded-lg border border-[#e5484d]/30 bg-[#e5484d]/10 text-[#e5484d] text-xs font-medium">
          {state.error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 px-4 rounded-lg bg-[#e5484d] hover:bg-[#cc3e43] active:scale-[0.99] text-white font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shadow-sm border border-[#e5484d]/40"
      >
        {isPending ? "Получение данных из GitHub..." : "Добавить репозиторий в каталог"}
      </button>
    </form>
  );
}
