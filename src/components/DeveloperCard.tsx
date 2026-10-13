import Link from "next/link";
import {
  ExternalLink,
  Send,
  Clock,
  ArrowRight,
} from "lucide-react";
import { DeveloperProfile } from "@/lib/user-profile";
import { Locale } from "@/lib/i18n/types";

export function DeveloperCard({
  dev,
  locale = "ru",
}: {
  dev: DeveloperProfile;
  locale?: Locale;
}) {
  const isRu = locale !== "en";

  const statusConfig = {
    open: {
      label: isRu ? "Открыт к проектам" : "Open to projects",
      dot: "bg-[#3fb950]",
      badge: "bg-[#3fb950]/10 text-[#3fb950] border-[#3fb950]/30",
    },
    mentor: {
      label: isRu ? "Помогает новичкам" : "Mentoring newcomers",
      dot: "bg-[#38bdf8]",
      badge: "bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/30",
    },
    maintainer: {
      label: isRu ? "Мейнтейнер" : "Maintainer",
      dot: "bg-[#e5484d]",
      badge: "bg-[#e5484d]/10 text-[#e5484d] border-[#e5484d]/30",
    },
    busy: {
      label: isRu ? "Занят" : "Busy",
      dot: "bg-[#d29922]",
      badge: "bg-[#d29922]/10 text-[#d29922] border-[#d29922]/30",
    },
  };

  const status = statusConfig[dev.status] || statusConfig.open;

  return (
    <div className="rounded-xl border border-[#1d212b] bg-[#0f1117] hover:border-[#2e3444] p-5 flex flex-col justify-between transition-all space-y-4">
      <div className="space-y-3">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/users/${dev.login}`}
            className="flex items-center gap-3 group/dev hover:opacity-90 transition-opacity"
          >
            {dev.avatar ? (
              <img
                src={dev.avatar}
                alt={dev.name}
                className="w-10 h-10 rounded-xl border border-white/10 object-cover bg-[#161a23]"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#161a23] border border-white/10 flex items-center justify-center text-sm font-bold text-white">
                {dev.login.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="space-y-0.5 min-w-0">
              <div className="font-bold text-white text-sm group-hover/dev:text-[#e5484d] transition-colors truncate">
                {dev.name}
              </div>
              <div className="text-[11px] font-mono text-[#8a92a3] truncate">
                @{dev.login}
              </div>
            </div>
          </Link>

          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border flex items-center gap-1.5 shrink-0 ${status.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            <span>{status.label}</span>
          </span>
        </div>

        {/* Status text or bio */}
        {dev.status_text && (
          <p className="text-xs text-[#d1d5db] line-clamp-2 leading-relaxed bg-[#131620] p-2.5 rounded-lg border border-[#1d212b]">
            {dev.status_text}
          </p>
        )}

        {/* Commitment Hours */}
        {dev.hours_per_week && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#8a92a3]">
            <Clock className="w-3 h-3 text-[#586071]" />
            <span>
              {isRu ? "Готовность: " : "Availability: "}
              <span className="text-white font-mono">{dev.hours_per_week}</span>
            </span>
          </div>
        )}

        {/* Preferred Stack Chips */}
        {dev.preferred_stack.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] text-[#586071] font-mono uppercase tracking-wider block">
              {isRu ? "Стек технологий:" : "Tech stack:"}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {dev.preferred_stack.slice(0, 5).map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#161a23] text-[#c9d1d9] border border-[#1d212b]"
                >
                  {tech}
                </span>
              ))}
              {dev.preferred_stack.length > 5 && (
                <span className="text-[11px] text-[#586071] self-center">
                  +{dev.preferred_stack.length - 5}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Metrics & Actions */}
      <div className="space-y-3 pt-3 border-t border-[#1d212b]">
        {/* Quick Numbers */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-1.5 rounded-lg bg-[#141722] border border-[#1d212b]">
            <span className="text-[10px] text-[#8a92a3] block">
              {isRu ? "Проекты" : "Projects"}
            </span>
            <span className="font-bold text-white font-mono">{dev.projects_count}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-[#141722] border border-[#1d212b]">
            <span className="text-[10px] text-[#8a92a3] block">
              {isRu ? "Задачи" : "Tasks"}
            </span>
            <span className="font-bold text-[#e5484d] font-mono">{dev.claims_count}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-[#141722] border border-[#1d212b]">
            <span className="text-[10px] text-[#8a92a3] block">
              {isRu ? "Звёзды" : "Stars"}
            </span>
            <span className="font-bold text-white font-mono">{dev.stars_count}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <Link
            href={`/users/${dev.login}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#161a23] hover:bg-[#1f2432] text-white border border-[#2e3444] font-semibold transition-colors"
          >
            <span>{isRu ? "В профиль" : "View profile"}</span>
            <ArrowRight className="w-3 h-3 text-[#e5484d]" />
          </Link>

          {dev.telegram && (
            <a
              href={
                dev.telegram.startsWith("http")
                  ? dev.telegram
                  : `https://t.me/${dev.telegram.replace(/^@/, "")}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-[#161a23] hover:bg-[#1f2432] text-[#38bdf8] border border-[#2e3444] transition-colors"
              title={isRu ? "Написать в Telegram" : "Message on Telegram"}
            >
              <Send className="w-3.5 h-3.5" />
            </a>
          )}

          <a
            href={`https://github.com/${dev.login}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-[#161a23] hover:bg-[#1f2432] text-[#8a92a3] hover:text-white border border-[#1d212b] transition-colors"
            title={isRu ? "GitHub профиль" : "GitHub profile"}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
