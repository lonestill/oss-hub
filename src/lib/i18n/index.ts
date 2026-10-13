import { ru } from "./dictionaries/ru";
import { en } from "./dictionaries/en";
import { defaultLocale, type Locale, type Dictionary } from "./types";

const dictionaries: Record<Locale, Dictionary> = {
  ru,
  en,
};

export function getDictionary(locale?: Locale): Dictionary {
  if (locale && dictionaries[locale]) {
    return dictionaries[locale];
  }
  return dictionaries[defaultLocale];
}

export * from "./types";
