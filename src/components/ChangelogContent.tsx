"use client";

import { useState } from "react";
import {
  History,
  Tag,
  CheckCircle2,
  Sparkles,
  Shield,
  Wrench,
  GitCommit,
  ExternalLink,
  ChevronRight,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { CHANGELOG_DATA } from "@/lib/changelog-data";

export function ChangelogContent() {
  const [filterType, setFilterType] = useState<"all" | "feat" | "fix" | "security">("all");

  const badgeTypeConfig = {
    feat: {
      label: "Новое",
      color: "bg-[#e5484d]/10 text-[#e5484d] border-[#e5484d]/30",
      icon: Sparkles,
    },
    fix: {
      label: "Исправлено",
      color: "bg-[#3fb950]/10 text-[#3fb950] border-[#3fb950]/30",
      icon: CheckCircle2,
    },
    security: {
      label: "Безопасность",
      color: "bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/30",
      icon: Shield,
    },
    refactor: {
      label: "Улучшено",
      color: "bg-[#d29922]/10 text-[#d29922] border-[#d29922]/30",
      icon: Wrench,
    },
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Hero */}
      <section className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#e5484d]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#e5484d]/10 text-[#e5484d] text-xs font-semibold border border-[#e5484d]/20">
            <History className="w-3.5 h-3.5" />
            <span>История обновлений платформы</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Changelog OSS Hub
          </h1>

          <p className="text-sm text-[#8a92a3] leading-relaxed">
            Хронология релизов, новых модулей, архитектурных доработок и исправлений безопасности. Мы развиваем платформу открыто и регулярно публикуем отчёты о каждом изменении.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <a
              href="https://github.com/lonestill/oss-hub/commits/main"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151821] hover:bg-[#1f2432] text-white border border-[#1d212b] hover:border-[#2e3444] font-medium transition-colors"
            >
              <GitCommit className="w-3.5 h-3.5 text-[#e5484d]" />
              <span>Коммиты на GitHub ↗</span>
            </a>

            <a
              href="https://github.com/lonestill/oss-hub/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151821] hover:bg-[#1f2432] text-white border border-[#1d212b] hover:border-[#2e3444] font-medium transition-colors"
            >
              <Tag className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Релизы GitHub ↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* 2. Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1d212b] pb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#8a92a3]" />
          <span className="text-xs text-[#8a92a3]">Категория изменений:</span>
          <div className="flex items-center bg-[#151821] p-0.5 rounded-lg border border-[#1d212b] text-xs">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === "all"
                  ? "bg-white/10 text-white font-medium"
                  : "text-[#8a92a3] hover:text-white"
              }`}
            >
              Все
            </button>
            <button
              type="button"
              onClick={() => setFilterType("feat")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === "feat"
                  ? "bg-[#e5484d]/20 text-[#e5484d] font-medium"
                  : "text-[#8a92a3] hover:text-white"
              }`}
            >
              Новые фичи
            </button>
            <button
              type="button"
              onClick={() => setFilterType("fix")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === "fix"
                  ? "bg-[#3fb950]/20 text-[#3fb950] font-medium"
                  : "text-[#8a92a3] hover:text-white"
              }`}
            >
              Фиксы
            </button>
            <button
              type="button"
              onClick={() => setFilterType("security")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === "security"
                  ? "bg-[#38bdf8]/20 text-[#38bdf8] font-medium"
                  : "text-[#8a92a3] hover:text-white"
              }`}
            >
              Безопасность
            </button>
          </div>
        </div>

        <div className="text-xs font-mono text-[#8a92a3]">
          Текущая версия: <span className="text-[#3fb950] font-bold">v1.2.0</span>
        </div>
      </div>

      {/* 3. Changelog Timeline */}
      <div className="space-y-8 relative before:absolute before:inset-0 before:left-4 sm:before:left-6 before:w-0.5 before:bg-[#1d212b] before:pointer-events-none">
        {CHANGELOG_DATA.map((release, releaseIdx) => {
          const visibleSections = release.sections.filter((s) => {
            if (filterType === "all") return true;
            return s.type === filterType;
          });

          if (filterType !== "all" && visibleSections.length === 0) {
            return null;
          }

          return (
            <article
              key={release.version}
              className="relative pl-10 sm:pl-16 space-y-4"
            >
              {/* Timeline Bullet Node */}
              <div className="absolute left-2.5 sm:left-4.5 top-1 -translate-x-1/2 w-4 h-4 rounded-full bg-[#090a0f] border-2 border-[#e5484d] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#e5484d]" />
              </div>

              {/* Version Header Card */}
              <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-5 sm:p-6 space-y-5 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1d212b] pb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xl sm:text-2xl font-extrabold text-white">
                      v{release.version}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold border ${
                        releaseIdx === 0
                          ? "bg-[#3fb950]/10 text-[#3fb950] border-[#3fb950]/30"
                          : "bg-white/5 text-[#8a92a3] border-white/10"
                      }`}
                    >
                      {release.tag}
                    </span>
                    <span className="text-xs text-[#8a92a3]">·</span>
                    <time className="text-xs text-[#8a92a3] font-mono">
                      {release.date}
                    </time>
                  </div>

                  <a
                    href={`https://github.com/lonestill/oss-hub/tree/v${release.version}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#8a92a3] hover:text-white transition-colors self-start sm:self-auto"
                  >
                    <span>Тег на GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="space-y-1">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {release.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#8a92a3] leading-relaxed">
                    {release.summary}
                  </p>
                </div>

                {/* Subsections */}
                <div className="space-y-4 pt-1">
                  {visibleSections.map((sec, secIdx) => {
                    const cfg = badgeTypeConfig[sec.type];
                    const Icon = cfg.icon;

                    return (
                      <div
                        key={secIdx}
                        className="rounded-xl border border-[#1d212b] bg-[#12151d] p-4 space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border flex items-center gap-1 ${cfg.color}`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>{cfg.label}</span>
                          </span>
                          <h3 className="text-xs sm:text-sm font-bold text-white">
                            {sec.title}
                          </h3>
                        </div>

                        <ul className="space-y-2 text-xs text-[#c9d1d9] pl-1">
                          {sec.items.map((item, itemIdx) => (
                            <li key={itemIdx} className="flex items-start gap-2 leading-relaxed">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#8a92a3]/60 mt-1.5 shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* 4. Bottom Footer CTA */}
      <section className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <div className="font-semibold text-white">
            Хотите предложить улучшение или сообщить о баге?
          </div>
          <p className="text-[#8a92a3]">
            Открывайте тикеты и отправляйте Pull Request в официальный репозиторий проекта на GitHub.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/guide"
            className="px-3.5 py-2 rounded-lg border border-[#1d212b] bg-[#151821] hover:border-[#2e3444] text-white font-medium transition-colors"
          >
            Руководство
          </Link>
          <a
            href="https://github.com/lonestill/oss-hub/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-[#e5484d] hover:bg-[#cc3e43] text-white font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>Создать Issue ↗</span>
          </a>
        </div>
      </section>
    </div>
  );
}
