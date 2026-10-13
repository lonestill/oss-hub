"use client";

import { useLanguage } from "@/lib/i18n/context";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-lg bg-[#151821] border border-[#1d212b] p-0.5 text-xs font-mono select-none ${className}`}
      role="group"
      aria-label={t.language.selectLanguage}
    >
      <button
        type="button"
        onClick={() => setLocale("ru")}
        className={`px-2 py-1 rounded-md transition-all font-semibold text-[11px] leading-none ${
          locale === "ru"
            ? "bg-[#e5484d] text-white shadow-sm"
            : "text-[#8a92a3] hover:text-white hover:bg-white/5"
        }`}
        title={t.language.ru}
        aria-pressed={locale === "ru"}
      >
        RU
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`px-2 py-1 rounded-md transition-all font-semibold text-[11px] leading-none ${
          locale === "en"
            ? "bg-[#e5484d] text-white shadow-sm"
            : "text-[#8a92a3] hover:text-white hover:bg-white/5"
        }`}
        title={t.language.en}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
    </div>
  );
}
