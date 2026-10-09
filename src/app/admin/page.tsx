import { getSession, isAdminAuthenticated } from "@/lib/auth";
import { getProjects } from "@/lib/projects";
import { AdminProjectRow } from "@/components/AdminProjectRow";
import { redirect } from "next/navigation";
import { Shield, ShieldAlert, ArrowLeft, LogOut, CheckCircle2, Clock, XCircle, Search } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface AdminPageProps {
  searchParams: Promise<{
    status?: "all" | "pending" | "approved" | "rejected";
    q?: string;
  }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.login.toLowerCase() !== "lonestill") {
    redirect("/admin/login");
  }

  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    redirect("/admin/login");
  }

  const { status = "all", q = "" } = await searchParams;

  const allProjects = await getProjects({
    moderationStatus: "all",
    sort: "newest",
    search: q || undefined,
  });

  const pendingCount = allProjects.filter((p) => p.moderation_status === "pending").length;
  const approvedCount = allProjects.filter((p) => p.moderation_status === "approved" || !p.moderation_status).length;
  const rejectedCount = allProjects.filter((p) => p.moderation_status === "rejected").length;

  const filteredProjects = allProjects.filter((p) => {
    if (status === "all") return true;
    if (status === "pending") return p.moderation_status === "pending";
    if (status === "approved") return p.moderation_status === "approved" || !p.moderation_status;
    if (status === "rejected") return p.moderation_status === "rejected";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1d212b] pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-lg bg-[#151821] border border-[#1d212b] hover:border-white/20 text-[#8a92a3] hover:text-white transition-colors"
            title="На главную"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-[#e5484d]/10 border border-[#e5484d]/20 flex items-center justify-center text-[#e5484d]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Панель супер-администратора</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#e5484d]/20 text-[#e5484d] border border-[#e5484d]/30">
                ROOT @lonestill
              </span>
            </h1>
            <p className="text-xs text-[#8a92a3] mt-0.5">
              Модерация репозиториев, аудит безопасности и управление каталогом
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/submit"
            className="px-3.5 py-1.5 rounded-lg border border-[#1d212b] bg-[#151821] hover:border-white/20 text-xs font-medium text-white transition-colors"
          >
            + Добавить репо
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <Link
          href="/admin?status=all"
          className={`rounded-xl border p-4 transition-colors ${
            status === "all"
              ? "border-white/40 bg-[#151821]"
              : "border-[#1d212b] bg-[#0f1117] hover:border-[#2e3444]"
          }`}
        >
          <div className="text-[11px] text-[#8a92a3]">Всего проектов</div>
          <div className="text-xl font-bold text-white mt-1 font-mono">
            {allProjects.length}
          </div>
        </Link>

        <Link
          href="/admin?status=pending"
          className={`rounded-xl border p-4 transition-colors ${
            status === "pending"
              ? "border-[#d29922]/50 bg-[#d29922]/10"
              : "border-[#1d212b] bg-[#0f1117] hover:border-[#2e3444]"
          }`}
        >
          <div className="text-[11px] text-[#d29922] flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>На модерации</span>
          </div>
          <div className="text-xl font-bold text-[#d29922] mt-1 font-mono">
            {pendingCount}
          </div>
        </Link>

        <Link
          href="/admin?status=approved"
          className={`rounded-xl border p-4 transition-colors ${
            status === "approved"
              ? "border-[#3fb950]/50 bg-[#3fb950]/10"
              : "border-[#1d212b] bg-[#0f1117] hover:border-[#2e3444]"
          }`}
        >
          <div className="text-[11px] text-[#3fb950] flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Одобрено</span>
          </div>
          <div className="text-xl font-bold text-[#3fb950] mt-1 font-mono">
            {approvedCount}
          </div>
        </Link>

        <Link
          href="/admin?status=rejected"
          className={`rounded-xl border p-4 transition-colors ${
            status === "rejected"
              ? "border-[#e5484d]/50 bg-[#e5484d]/10"
              : "border-[#1d212b] bg-[#0f1117] hover:border-[#2e3444]"
          }`}
        >
          <div className="text-[11px] text-[#e5484d] flex items-center gap-1.5 font-medium">
            <XCircle className="w-3.5 h-3.5" />
            <span>Отклонено</span>
          </div>
          <div className="text-xl font-bold text-[#e5484d] mt-1 font-mono">
            {rejectedCount}
          </div>
        </Link>
      </div>

      {/* Projects List Container */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white">Список репозиториев</span>
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-mono text-[#8a92a3]">
              {filteredProjects.length}
            </span>
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-12 text-center text-[#8a92a3] text-xs">
            Нет проектов в этой категории
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((project) => (
              <AdminProjectRow key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
