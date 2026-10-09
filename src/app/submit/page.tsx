import { getSession } from "@/lib/auth";
import { fetchUserRepos } from "@/lib/user-repos";
import { SubmitForm } from "@/components/SubmitForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const session = await getSession();
  const userRepos = session
    ? await fetchUserRepos(session.token, session.login)
    : [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#8a92a3] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Назад в каталог</span>
        </Link>
      </div>

      <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
          Добавить репозиторий
        </h1>
        <p className="text-xs text-[#8a92a3] leading-relaxed mt-2">
          {session
            ? `Вы авторизованы как @${session.login}. Выберите проект из списка ваших репозиториев ниже или укажите ссылку на любой публичный проект.`
            : "Укажите ссылку на публичный GitHub-репозиторий или войдите через GitHub, чтобы выбрать свой проект в один клик."}
        </p>
        <div className="mt-3 pt-3 border-t border-[#1d212b] text-[11px] text-[#8a92a3]">
          Впервые на платформе? Ознакомьтесь с{" "}
          <Link
            href="/guide?tab=maintainers"
            className="text-[#e5484d] hover:underline font-semibold"
          >
            руководством мейнтейнера →
          </Link>
        </div>
      </div>

      <SubmitForm session={session} userRepos={userRepos} />
    </div>
  );
}
