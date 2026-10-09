import Link from "next/link";
import { FolderGit2, Shield } from "lucide-react";
import { getSession } from "@/lib/auth";

export async function Navbar() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-50 bg-[#090a0f]/85 backdrop-blur-md border-b border-[#1d212b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:border-white/20 transition-colors">
              <FolderGit2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-white tracking-tight leading-none">
                OSS Hub
              </span>
              <span className="text-[11px] text-[#8a92a3] leading-none mt-1">
                Open Source Platform
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden sm:flex items-center gap-1 text-sm">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg text-[#8a92a3] hover:text-white hover:bg-white/5 font-medium transition-colors"
            >
              Проекты
            </Link>
            <Link
              href="/contributors"
              className="px-3 py-1.5 rounded-lg text-[#8a92a3] hover:text-white hover:bg-white/5 font-medium transition-colors"
            >
              Ищут разработчиков
            </Link>
            <Link
              href="/guide"
              className="px-3 py-1.5 rounded-lg text-[#8a92a3] hover:text-white hover:bg-white/5 font-medium transition-colors"
            >
              Руководство
            </Link>
          </nav>
        </div>

        {/* Right: GitHub Repo Link & User Profile */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/lonestill/oss-hub"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#8a92a3] hover:text-white bg-[#151821] hover:bg-[#1f2432] border border-[#1d212b] hover:border-[#2e3444] transition-colors"
            title="Исходный код OSS Hub на GitHub"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-[#e5484d]" />
            <span>GitHub</span>
          </a>

          {session ? (
            <div className="flex items-center gap-3">
              <Link
                href={`/users/${session.login}`}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-[#1d212b] transition-colors"
                title="Перейти в свой профиль"
              >
                {session.avatar_url && (
                  <img
                    src={session.avatar_url}
                    alt={session.login}
                    className="w-6 h-6 rounded-full border border-white/10 object-cover"
                  />
                )}
                <span className="text-xs font-medium text-white">
                  @{session.login}
                </span>
              </Link>
              {session.login.toLowerCase() === "lonestill" && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#e5484d]/10 border border-[#e5484d]/30 text-[#e5484d] text-xs font-semibold hover:bg-[#e5484d]/20 transition-colors"
                >
                  <Shield className="w-3 h-3" />
                  <span>Админка</span>
                </Link>
              )}
              <a
                href="/api/auth/logout"
                className="text-xs text-[#8a92a3] hover:text-[#e5484d] transition-colors px-2 py-1.5"
                title="Выйти"
              >
                Выйти
              </a>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs font-medium text-[#8a92a3] hover:text-white px-3 py-1.5 rounded-lg border border-[#1d212b] bg-[#0f1117] hover:border-[#2e3444] transition-colors"
            >
              Войти через GitHub
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
