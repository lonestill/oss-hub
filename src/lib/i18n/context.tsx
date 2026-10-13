"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { type Locale, defaultLocale, locales, type Dictionary } from "./types";
import { getDictionary } from "./index";

interface LanguageContextType {
  locale: Locale;
  setLocale: (nextLocale: Locale) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: defaultLocale,
  setLocale: () => {},
  t: getDictionary(defaultLocale),
});

export function LanguageProvider({
  children,
  initialLocale = defaultLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("oss_hub_locale") as Locale | null;
    if (saved && locales.includes(saved) && saved !== initialLocale) {
      queueMicrotask(() => {
        setLocaleState(saved);
        document.cookie = `NEXT_LOCALE=${saved}; path=/; max-age=31536000; SameSite=Lax`;
        document.documentElement.lang = saved;
      });
    }
  }, [initialLocale]);

  const setLocale = (nextLocale: Locale) => {
    if (!locales.includes(nextLocale) || nextLocale === locale) return;
    try {
      localStorage.setItem("oss_hub_locale", nextLocale);
      document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = nextLocale;
    } catch {
      // storage unavailable
    }
    setLocaleState(nextLocale);
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const dict = getDictionary(locale);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: dict }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
