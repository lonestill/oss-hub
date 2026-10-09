"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useEffect, useRef } from "react";
import { Search } from "lucide-react";

const languages = [
  "TypeScript",
  "Python",
  "Go",
  "Rust",
  "C++",
  "JavaScript",
  "Java",
  "Kotlin",
  "Swift",
  "C",
];

export function SearchFilters({
  activeSearch = "",
  activeLanguage = "",
  activeSort = "stars",
  lookingOnly = false,
}: {
  activeSearch?: string;
  activeLanguage?: string;
  activeSort?: string;
  lookingOnly?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function updateQuery(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-4 mb-6 text-xs">
      {/* Search Input Bar */}
      <div className="relative rounded-xl border border-[#1d212b] bg-[#0f1117] flex items-center px-3.5 py-1.5 focus-within:border-[#2e3444] transition-colors">
        <Search className="w-4 h-4 text-[#8a92a3] shrink-0 mr-2.5" />
        <input
          ref={searchInputRef}
          type="text"
          defaultValue={activeSearch}
          placeholder="Поиск по названию, описанию, автору или тегам..."
          onChange={(e) => {
            const val = e.target.value.trim();
            updateQuery("search", val || null);
          }}
          className="w-full bg-transparent py-1.5 text-xs text-white placeholder-[#586071] focus:outline-none"
        />
        <div className="flex items-center gap-1.5 shrink-0 pointer-events-none">
          {isPending ? (
            <span className="text-[11px] text-[#8a92a3]">Поиск...</span>
          ) : (
            <kbd className="px-1.5 py-0.5 text-[10px] text-[#8a92a3] bg-white/5 border border-white/10 rounded font-mono">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Filter and Language Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Sort and Sourcing Tabs */}
        <div className="inline-flex rounded-lg p-1 bg-[#0f1117] border border-[#1d212b] gap-1 self-start">
          <button
            onClick={() => {
              updateQuery("sort", "stars");
              updateQuery("looking", null);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeSort === "stars" && !lookingOnly
                ? "bg-[#1f2433] text-white border border-[#2e3444] shadow-sm font-semibold"
                : "text-[#8a92a3] hover:text-white"
            }`}
          >
            По звёздам
          </button>

          <button
            onClick={() => {
              updateQuery("sort", "newest");
              updateQuery("looking", null);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeSort === "newest" && !lookingOnly
                ? "bg-[#1f2433] text-white border border-[#2e3444] shadow-sm font-semibold"
                : "text-[#8a92a3] hover:text-white"
            }`}
          >
            Свежие
          </button>

          <button
            onClick={() => {
              updateQuery("looking", lookingOnly ? null : "true");
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              lookingOnly
                ? "bg-[#e5484d] text-white shadow-sm font-semibold border border-[#e5484d]/50"
                : "text-[#8a92a3] hover:text-white"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${lookingOnly ? "bg-white" : "bg-[#e5484d]"}`}></span>
            <span>Ищут участников</span>
          </button>
        </div>

        {/* Language Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => updateQuery("lang", null)}
            className={`px-2.5 py-1 rounded-md text-xs transition-colors shrink-0 ${
              !activeLanguage
                ? "bg-[#1f2433] border border-[#3e475e] text-white font-semibold shadow-sm"
                : "bg-[#0f1117] border border-[#1d212b] text-[#8a92a3] hover:border-[#2e3444] hover:text-white"
            }`}
          >
            Все
          </button>
          {languages.map((lang) => {
            const isActive = activeLanguage.toLowerCase() === lang.toLowerCase();
            return (
              <button
                key={lang}
                onClick={() => updateQuery("lang", isActive ? null : lang)}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors shrink-0 ${
                  isActive
                    ? "bg-[#1f2433] border border-[#3e475e] text-white font-semibold shadow-sm"
                    : "bg-[#0f1117] border border-[#1d212b] text-[#8a92a3] hover:border-[#2e3444] hover:text-white"
                }`}
              >
                {lang}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
