"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useEffect, useRef, useState } from "react";
import { Search, X, SlidersHorizontal, Terminal } from "lucide-react";
import {
  parseSearchQuery,
  removeFilterToken,
  appendOrReplaceFilterToken,
  FilterChip,
} from "@/lib/search-query";

interface SearchFiltersProps {
  activeSearch?: string;
  activeLanguage?: string;
  activeSort?: string;
  lookingOnly?: boolean;
  availableLanguages?: string[];
}

export function SearchFilters({
  activeSearch = "",
  activeLanguage = "",
  activeSort = "stars",
  lookingOnly = false,
  availableLanguages = [],
}: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchValue, setSearchValue] = useState(activeSearch);

  useEffect(() => {
    setSearchValue(activeSearch);
  }, [activeSearch]);

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

  const parsed = parseSearchQuery(searchValue);
  const effectiveLanguage = activeLanguage || parsed.language || "";
  const effectiveLooking = lookingOnly || Boolean(parsed.isLooking);

  function executeQueryUpdate(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  }

  function handleSearchChange(val: string) {
    setSearchValue(val);
    executeQueryUpdate({ search: val.trim() || null });
  }

  function applyQuickToken(token: string) {
    const nextSearch = appendOrReplaceFilterToken(searchValue, token);
    setSearchValue(nextSearch);
    searchInputRef.current?.focus();
    executeQueryUpdate({ search: nextSearch || null });
  }

  function removeFilter(filter: FilterChip) {
    const nextSearch = removeFilterToken(searchValue, filter.key);
    setSearchValue(nextSearch);

    const updates: Record<string, string | null> = {
      search: nextSearch || null,
    };

    if (filter.key === "language") {
      updates.lang = null;
    }
    if (filter.key === "isLooking") {
      updates.looking = null;
    }

    executeQueryUpdate(updates);
  }

  function toggleLanguage(lang: string) {
    const isCurrent = effectiveLanguage.toLowerCase() === lang.toLowerCase();
    const cleanedSearch = removeFilterToken(searchValue, "language");
    setSearchValue(cleanedSearch);

    executeQueryUpdate({
      lang: isCurrent ? null : lang,
      search: cleanedSearch || null,
    });
  }

  function clearAllFilters() {
    setSearchValue("");
    executeQueryUpdate({
      search: null,
      lang: null,
      looking: null,
    });
  }

  // Combined list of active filter chips (from query parser + separate params)
  const activeChips: FilterChip[] = [...parsed.filters];
  if (activeLanguage && !parsed.language) {
    activeChips.unshift({
      key: "language",
      rawToken: activeLanguage,
      label: "Язык",
      value: activeLanguage,
    });
  }
  if (lookingOnly && !parsed.isLooking) {
    activeChips.push({
      key: "isLooking",
      rawToken: "is:looking",
      label: "Статус",
      value: "Ищут участников",
    });
  }

  return (
    <div className="space-y-3.5 mb-6 text-xs">
      {/* Search Input Bar */}
      <div className="relative rounded-xl border border-[#1d212b] bg-[#0f1117] flex items-center px-3.5 py-1.5 focus-within:border-[#2e3444] transition-colors shadow-sm">
        <Search className="w-4 h-4 text-[#8a92a3] shrink-0 mr-2.5" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchValue}
          placeholder="Поиск или фильтры: @language:rust, stars:>5, owner:lonestill, is:looking..."
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full bg-transparent py-1.5 text-xs text-white placeholder-[#586071] focus:outline-none"
        />

        <div className="flex items-center gap-2 shrink-0">
          {searchValue && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="p-1 rounded text-[#8a92a3] hover:text-white hover:bg-white/5 transition-colors"
              title="Очистить строку поиска"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="pointer-events-none">
            {isPending ? (
              <span className="text-[11px] text-[#8a92a3] font-mono">поиск...</span>
            ) : (
              <kbd className="px-1.5 py-0.5 text-[10px] text-[#8a92a3] bg-white/5 border border-white/10 rounded font-mono">
                /
              </kbd>
            )}
          </div>
        </div>
      </div>

      {/* Active Filter Badges */}
      {activeChips.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          <span className="text-[11px] text-[#8a92a3] flex items-center gap-1 font-mono">
            <SlidersHorizontal className="w-3 h-3 text-[#e5484d]" />
            <span>Активные фильтры:</span>
          </span>

          {activeChips.map((chip, idx) => (
            <span
              key={`${chip.key}-${idx}`}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] bg-[#161a23] border border-[#2e3444] text-white font-mono"
            >
              <span className="text-[#8a92a3]">{chip.label}:</span>
              <span className="font-semibold text-[#e5484d]">{chip.value}</span>
              <button
                type="button"
                onClick={() => removeFilter(chip)}
                className="text-[#8a92a3] hover:text-white hover:bg-white/10 rounded p-0.5 transition-colors"
                title={`Удалить фильтр ${chip.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={clearAllFilters}
            className="text-[11px] text-[#8a92a3] hover:text-[#e5484d] transition-colors underline underline-offset-2 ml-1"
          >
            Сбросить всё
          </button>
        </div>
      )}

      {/* Quick Filter Hints (GitHub Syntax Pills) */}
      <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-[#8a92a3]">
        <span className="flex items-center gap-1 text-[#586071] font-mono mr-0.5">
          <Terminal className="w-3 h-3 text-[#586071]" />
          <span>Быстрые фильтры:</span>
        </span>

        {availableLanguages.map((lang) => {
          const token = `@language:${lang.toLowerCase()}`;
          const isSelected = effectiveLanguage.toLowerCase() === lang.toLowerCase();
          return (
            <button
              key={`quick-${lang}`}
              type="button"
              onClick={() => applyQuickToken(token)}
              className={`px-2 py-0.5 rounded font-mono transition-colors border ${
                isSelected
                  ? "bg-[#1f2433] text-white border-[#3e475e]"
                  : "bg-[#11141c] text-[#8a92a3] hover:text-white border-[#1d212b] hover:border-[#2e3444]"
              }`}
            >
              {token}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => applyQuickToken("stars:>5")}
          className="px-2 py-0.5 rounded font-mono transition-colors border bg-[#11141c] text-[#8a92a3] hover:text-white border-[#1d212b] hover:border-[#2e3444]"
        >
          stars:&gt;5
        </button>

        <button
          type="button"
          onClick={() => applyQuickToken("stars:>10")}
          className="px-2 py-0.5 rounded font-mono transition-colors border bg-[#11141c] text-[#8a92a3] hover:text-white border-[#1d212b] hover:border-[#2e3444]"
        >
          stars:&gt;10
        </button>

        <button
          type="button"
          onClick={() => applyQuickToken("owner:lonestill")}
          className="px-2 py-0.5 rounded font-mono transition-colors border bg-[#11141c] text-[#8a92a3] hover:text-white border-[#1d212b] hover:border-[#2e3444]"
        >
          owner:lonestill
        </button>

        <button
          type="button"
          onClick={() => applyQuickToken("is:looking")}
          className="px-2 py-0.5 rounded font-mono transition-colors border bg-[#11141c] text-[#8a92a3] hover:text-white border-[#1d212b] hover:border-[#2e3444]"
        >
          is:looking
        </button>
      </div>

      {/* Filter and Language Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Sort and Sourcing Tabs */}
        <div className="inline-flex rounded-lg p-1 bg-[#0f1117] border border-[#1d212b] gap-1 self-start">
          <button
            type="button"
            onClick={() => {
              executeQueryUpdate({ sort: "stars", looking: null });
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeSort === "stars" && !effectiveLooking
                ? "bg-[#1f2433] text-white border border-[#2e3444] shadow-sm font-semibold"
                : "text-[#8a92a3] hover:text-white"
            }`}
          >
            По звёздам
          </button>

          <button
            type="button"
            onClick={() => {
              executeQueryUpdate({ sort: "newest", looking: null });
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeSort === "newest" && !effectiveLooking
                ? "bg-[#1f2433] text-white border border-[#2e3444] shadow-sm font-semibold"
                : "text-[#8a92a3] hover:text-white"
            }`}
          >
            Свежие
          </button>

          <button
            type="button"
            onClick={() => {
              const nextLooking = effectiveLooking ? null : "true";
              const cleanedSearch = removeFilterToken(searchValue, "isLooking");
              setSearchValue(cleanedSearch);
              executeQueryUpdate({
                looking: nextLooking,
                search: cleanedSearch || null,
              });
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              effectiveLooking
                ? "bg-[#e5484d] text-white shadow-sm font-semibold border border-[#e5484d]/50"
                : "text-[#8a92a3] hover:text-white"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                effectiveLooking ? "bg-white" : "bg-[#e5484d]"
              }`}
            />
            <span>Ищут участников</span>
          </button>
        </div>

        {/* Real Available Languages Filter Buttons */}
        {availableLanguages.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[11px] text-[#586071] mr-1 hidden sm:inline">Стек:</span>
            <button
              type="button"
              onClick={() => {
                const cleanedSearch = removeFilterToken(searchValue, "language");
                setSearchValue(cleanedSearch);
                executeQueryUpdate({ lang: null, search: cleanedSearch || null });
              }}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors shrink-0 ${
                !effectiveLanguage
                  ? "bg-[#1f2433] border border-[#3e475e] text-white font-semibold shadow-sm"
                  : "bg-[#0f1117] border border-[#1d212b] text-[#8a92a3] hover:border-[#2e3444] hover:text-white"
              }`}
            >
              Все ({availableLanguages.length})
            </button>
            {availableLanguages.map((lang) => {
              const isActive = effectiveLanguage.toLowerCase() === lang.toLowerCase();
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
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
        )}
      </div>
    </div>
  );
}
