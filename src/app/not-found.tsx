import Link from "next/link";
import { FolderGit2, ArrowLeft } from "lucide-react";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getServerTranslations();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white mb-6">
        <FolderGit2 className="w-6 h-6 text-[#8a92a3]" />
      </div>

      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-mono text-[#8a92a3] mb-3">
        <span>ERROR 404</span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight mb-3">
        {t.notFound.title}
      </h1>

      <p className="text-sm text-[#8a92a3] max-w-md mx-auto mb-8 leading-relaxed">
        {t.notFound.desc}
      </p>

      <div className="flex items-center gap-3 flex-wrap justify-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#e5484d] hover:bg-[#cc3e43] text-white font-semibold text-xs transition-colors shadow-sm border border-[#e5484d]/40"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t.notFound.home}</span>
        </Link>
        <Link
          href="/?tab=looking"
          className="px-4 py-2 rounded-lg border border-[#1d212b] bg-[#0f1117] hover:border-[#2e3444] text-xs font-medium text-white transition-colors"
        >
          {t.notFound.lookingForDevs}
        </Link>
      </div>
    </div>
  );
}
