import { getSession, isAdminAuthenticated, isUserAdmin } from "@/lib/auth";
import { getProjects, getProjectComplaints, getAuditLogs } from "@/lib/projects";
import { AdminProjectRow } from "@/components/AdminProjectRow";
import { AdminComplaintsList } from "@/components/AdminComplaintsList";
import { redirect } from "next/navigation";
import {
  Shield,
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  AlertTriangle,
  History,
  FolderGit2,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface AdminPageProps {
  searchParams: Promise<{
    tab?: "projects" | "complaints" | "audit";
    status?: "all" | "pending" | "approved" | "rejected";
    q?: string;
  }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const isDbAdmin = await isUserAdmin(session.login);
  if (!isDbAdmin) {
    redirect("/admin/login");
  }

  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    redirect("/admin/login");
  }

  const { tab = "projects", status = "all", q = "" } = await searchParams;

  const [allProjects, complaints, auditLogs] = await Promise.all([
    getProjects({
      moderationStatus: "all",
      sort: "newest",
      search: q || undefined,
    }),
    getProjectComplaints(),
    getAuditLogs(60),
  ]);

  const pendingCount = allProjects.filter((p) => p.moderation_status === "pending").length;
  const approvedCount = allProjects.filter(
    (p) => p.moderation_status === "approved" || !p.moderation_status
  ).length;
  const rejectedCount = allProjects.filter((p) => p.moderation_status === "rejected").length;
  const pendingComplaintsCount = complaints.filter((c) => c.status === "pending").length;

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
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#e5484d]/20 text-[#e5484d] border border-[#e5484d]/30 font-bold">
                ROOT @{session.login}
              </span>
            </h1>
            <p className="text-xs text-[#8a92a3] mt-0.5">
              Модерация репозиториев, очередь жалоб, аудит безопасности каталога
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

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#1d212b] pb-3 text-xs font-semibold">
        <Link
          href={`/admin?tab=projects${status !== "all" ? `&status=${status}` : ""}`}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-colors ${
            tab === "projects"
              ? "bg-[#151821] text-white border border-[#2e3444]"
              : "text-[#8a92a3] hover:text-white hover:bg-white/5"
          }`}
        >
          <FolderGit2 className="w-4 h-4 text-[#38bdf8]" />
          <span>Каталог проектов ({allProjects.length})</span>
        </Link>

        <Link
          href="/admin?tab=complaints"
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-colors ${
            tab === "complaints"
              ? "bg-[#151821] text-white border border-[#2e3444]"
              : "text-[#8a92a3] hover:text-white hover:bg-white/5"
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-[#e5484d]" />
          <span>Жалобы ({complaints.length})</span>
          {pendingComplaintsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#e5484d] text-white text-[10px] font-mono font-bold">
              {pendingComplaintsCount}
            </span>
          )}
        </Link>

        <Link
          href="/admin?tab=audit"
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-colors ${
            tab === "audit"
              ? "bg-[#151821] text-white border border-[#2e3444]"
              : "text-[#8a92a3] hover:text-white hover:bg-white/5"
          }`}
        >
          <History className="w-4 h-4 text-[#3fb950]" />
          <span>Журнал аудита ({auditLogs.length})</span>
        </Link>
      </div>

      {/* Tab 1: Projects Catalog */}
      {tab === "projects" && (
        <div className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <Link
              href={`/admin?tab=projects&status=all${q ? `&q=${encodeURIComponent(q)}` : ""}`}
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
              href={`/admin?tab=projects&status=pending${q ? `&q=${encodeURIComponent(q)}` : ""}`}
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
              href={`/admin?tab=projects&status=approved${q ? `&q=${encodeURIComponent(q)}` : ""}`}
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
              href={`/admin?tab=projects&status=rejected${q ? `&q=${encodeURIComponent(q)}` : ""}`}
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

          {/* Search Form */}
          <form method="GET" action="/admin" className="flex items-center gap-2">
            <input type="hidden" name="tab" value="projects" />
            <input type="hidden" name="status" value={status} />
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8a92a3] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Поиск по названию или репозиторию..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#1d212b] bg-[#0f1117] text-white placeholder-[#8a92a3] focus:outline-none focus:border-[#e5484d]"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#151821] hover:bg-[#21262d] border border-[#1d212b] text-white text-xs font-semibold"
            >
              Найти
            </button>
            {q && (
              <Link
                href={`/admin?tab=projects&status=${status}`}
                className="px-3 py-2 text-xs text-[#8a92a3] hover:text-white"
              >
                Сбросить
              </Link>
            )}
          </form>

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
      )}

      {/* Tab 2: Complaints Queue */}
      {tab === "complaints" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Очередь жалоб пользователей</h2>
              <p className="text-xs text-[#8a92a3] mt-0.5">
                Сигналы о вредоносном коде, накрутке метрик, спаме и нарушении авторства
              </p>
            </div>
          </div>

          <AdminComplaintsList complaints={complaints} />
        </div>
      )}

      {/* Tab 3: Audit Log */}
      {tab === "audit" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white">Журнал административных действий</h2>
            <p className="text-xs text-[#8a92a3] mt-0.5">
              Неизменяемая история решений модерации, удалений и проверок
            </p>
          </div>

          {auditLogs.length === 0 ? (
            <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-12 text-center text-[#8a92a3] text-xs">
              Записей в журнале аудита пока нет.
            </div>
          ) : (
            <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] overflow-hidden text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#151821] border-b border-[#1d212b] text-[11px] font-mono uppercase text-[#8a92a3]">
                    <tr>
                      <th className="p-3">Время</th>
                      <th className="p-3">Администратор</th>
                      <th className="p-3">Действие</th>
                      <th className="p-3">Цель</th>
                      <th className="p-3">Детали</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1d212b]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02]">
                        <td className="p-3 font-mono text-[#8a92a3] whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString("ru-RU")}
                        </td>
                        <td className="p-3 font-bold text-white">
                          @{log.actor_login}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-white/5 border border-white/10 text-[#38bdf8]">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[#8a92a3]">
                          {log.target_type}: {log.target_id.slice(0, 16)}
                        </td>
                        <td className="p-3 text-white max-w-xs truncate" title={log.details || ""}>
                          {log.details || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
