import { cookies } from "next/headers";
import { type Locale, defaultLocale, locales } from "./types";
import { getDictionary } from "./index";

export async function getLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get("NEXT_LOCALE")?.value as Locale | undefined;
    if (raw && locales.includes(raw)) {
      return raw;
    }
  } catch {
    // cookies() might fail in certain prerender contexts
  }
  return defaultLocale;
}

export async function getServerTranslations() {
  const locale = await getLocale();
  return {
    locale,
    t: getDictionary(locale),
  };
}
