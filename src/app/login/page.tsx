import { getSession } from "@/lib/auth";
import { GithubIcon } from "@/components/GithubIcon";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/submit");
  }

  return (
    <div className="max-w-md mx-auto space-y-6 text-xs">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#8a92a3] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Назад</span>
        </Link>
      </div>

      <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-6 sm:p-8 space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">
          Авторизация
        </h1>
        <p className="text-xs text-[#8a92a3] leading-relaxed">
          Войдите через GitHub, чтобы подтвердить владение своими репозиториями, публиковать их в каталог в один клик и вести обсуждения со статусом проверенного автора.
        </p>
      </div>

      <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-6 sm:p-8">
        <a
          href="/api/auth/github"
          className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-[#161a23] hover:bg-[#1f2432] text-white border border-[#2e3444] hover:border-white/20 font-semibold text-xs transition-colors rounded-xl shadow-sm"
        >
          <GithubIcon className="w-4 h-4" />
          <span>Войти через GitHub</span>
        </a>
      </div>
    </div>
  );
}
