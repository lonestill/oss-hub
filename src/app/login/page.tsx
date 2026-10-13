import { getSession } from "@/lib/auth";
import { GithubIcon } from "@/components/GithubIcon";
import { ArrowLeft, Zap, User } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ returnUrl?: string }>;
}) {
  const session = await getSession();
  const params = searchParams ? await searchParams : {};
  const returnUrl = params.returnUrl || "/submit";

  if (session) {
    redirect(returnUrl);
  }
  const { t } = await getServerTranslations();
  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div className="max-w-md mx-auto space-y-6 text-xs">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#8a92a3] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t.login.back}</span>
        </Link>
      </div>

      <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-6 sm:p-8 space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">
          {t.login.title}
        </h1>
        <p className="text-xs text-[#8a92a3] leading-relaxed">
          {t.login.desc}
        </p>
      </div>

      <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-6 sm:p-8 space-y-4">
        <a
          href="/api/auth/github"
          className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-[#161a23] hover:bg-[#1f2432] text-white border border-[#2e3444] hover:border-white/20 font-semibold text-xs transition-colors rounded-xl shadow-sm"
        >
          <GithubIcon className="w-4 h-4" />
          <span>{t.login.signInGithub}</span>
        </a>

        {isDev && (
          <div className="pt-4 border-t border-[#1d212b] space-y-3">
            <div className="flex items-center gap-1.5 text-[#f5a623] font-semibold text-[11px] uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              <span>{t.login.localDevTitle}</span>
            </div>
            <p className="text-[11px] text-[#8a92a3] leading-relaxed">
              {t.login.localDevDesc}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`/api/auth/dev?login=lonestill&returnUrl=${encodeURIComponent(returnUrl)}`}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#1e2330] hover:bg-[#282f42] text-white border border-[#2e3444] rounded-lg font-medium text-[11px] transition-colors"
              >
                <User className="w-3 h-3 text-[#388bfd]" />
                <span>{t.login.asLonestill}</span>
              </a>
              <a
                href={`/api/auth/dev?login=contributor&returnUrl=${encodeURIComponent(returnUrl)}`}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#1e2330] hover:bg-[#282f42] text-white border border-[#2e3444] rounded-lg font-medium text-[11px] transition-colors"
              >
                <User className="w-3 h-3 text-[#3fb950]" />
                <span>{t.login.asContributor}</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
