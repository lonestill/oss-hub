import { getSession } from "@/lib/auth";
import { fetchUserRepos } from "@/lib/user-repos";
import { SubmitForm } from "@/components/SubmitForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getServerTranslations } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const [{ t }, session] = await Promise.all([
    getServerTranslations(),
    getSession(),
  ]);
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
          <span>{t.submit.backToCatalog}</span>
        </Link>
      </div>

      <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
          {t.submit.title}
        </h1>
        <p className="text-xs text-[#8a92a3] leading-relaxed mt-2">
          {session
            ? t.submit.authDesc.replace("{login}", session.login)
            : t.submit.guestDesc}
        </p>
        <div className="mt-3 pt-3 border-t border-[#1d212b] text-[11px] text-[#8a92a3]">
          {t.submit.firstTimeNotice}{" "}
          <Link
            href="/guide?tab=maintainers"
            className="text-[#e5484d] hover:underline font-semibold"
          >
            {t.submit.maintainerGuideLink}
          </Link>
        </div>
      </div>

      <SubmitForm session={session} userRepos={userRepos} />
    </div>
  );
}
