import { getSession, isAdminAuthenticated } from "@/lib/auth";
import { adminLoginAction } from "@/app/actions";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  const { error } = await searchParams;

  if (!session) {
    redirect("/login");
  }

  if (session.login.toLowerCase() !== "lonestill") {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#e5484d]/10 border border-[#e5484d]/20 flex items-center justify-center text-[#e5484d] mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-white">403 — Доступ запрещён</h1>
        <p className="text-xs text-[#8a92a3]">
          Панель управления доступна исключительно супер-администратору @lonestill.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>На главную</span>
        </Link>
      </div>
    );
  }

  const isAuth = await isAdminAuthenticated();
  if (isAuth) {
    redirect("/admin");
  }

  return (
    <div className="max-w-sm mx-auto py-12 space-y-6">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#8a92a3] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>На главную</span>
        </Link>
      </div>

      <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-6 sm:p-8 space-y-3">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
          <Lock className="w-5 h-5 text-[#e5484d]" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Пароль администратора
        </h1>
        <p className="text-xs text-[#8a92a3] leading-relaxed">
          Вы вошли как <span className="text-white font-medium">@{session.login}</span>. Для доступа к модерации и управлению введите дополнительный мастер-пароль.
        </p>
      </div>

      <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-6 sm:p-8">
        <form action={adminLoginAction} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[#8a92a3] block">
              Мастер-пароль:
            </label>
            <input
              type="password"
              name="password"
              required
              autoFocus
              placeholder="••••••••••••"
              className="w-full rounded-lg bg-[#151821] border border-[#1d212b] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#e5484d] transition-colors"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg border border-[#e5484d]/30 bg-[#e5484d]/10 text-[#e5484d] text-xs font-medium">
              {error === "rate_limited"
                ? "Слишком много попыток ввода пароля. IP временно заблокирован."
                : "Неверный мастер-пароль. Доступ заблокирован."}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-[#e5484d] hover:bg-[#d03d42] text-white font-semibold text-xs transition-colors shadow-sm"
          >
            Подтвердить и войти
          </button>
        </form>
      </div>
    </div>
  );
}
