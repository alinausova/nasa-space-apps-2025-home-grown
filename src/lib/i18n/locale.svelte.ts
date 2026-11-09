import { en, type Messages } from './messages/en';

/** Languages Home Grown is being translated into. English is the source. */
export const LOCALES = ['en', 'de', 'es', 'fr', 'tr', 'ru'] as const;
export type Locale = (typeof LOCALES)[number];

/** Languages with a finished catalog. Detection and `?lang=` only pick from these; grows as translations land. */
export const AVAILABLE: readonly Locale[] = ['en'];

const STORAGE_KEY = 'hg-locale';

/** Catalogs per locale. Untranslated locales point at English; AVAILABLE keeps them from being selected. */
const CATALOGS: Record<Locale, Messages> = { en, de: en, es: en, fr: en, tr: en, ru: en };

/**
 * Intl tags per locale and purpose. English mixes two on purpose, to keep today's copy exactly:
 * US month abbreviations ("Sep", not British "Sept") and British lists (no Oxford comma).
 */
const INTL: Record<Locale, { number: string; month: string; list: string; text: string }> = {
  en: { number: 'en-US', month: 'en-US', list: 'en-GB', text: 'en' },
  de: { number: 'de-DE', month: 'de-DE', list: 'de-DE', text: 'de' },
  es: { number: 'es', month: 'es', list: 'es', text: 'es' },
  fr: { number: 'fr-FR', month: 'fr-FR', list: 'fr-FR', text: 'fr' },
  tr: { number: 'tr-TR', month: 'tr-TR', list: 'tr-TR', text: 'tr' },
  ru: { number: 'ru-RU', month: 'ru-RU', list: 'ru-RU', text: 'ru' },
};

const isAvailable = (value: string | null | undefined, available: readonly Locale[]): value is Locale =>
  !!value && (available as readonly string[]).includes(value);

/** Language to use: `?lang=` first, then the stored choice, then the browser's languages, then English. */
export function detectLocale(
  { search, stored, languages }: { search: string; stored: string | null; languages: readonly string[] },
  available: readonly Locale[] = AVAILABLE,
): Locale {
  const fromUrl = new URLSearchParams(search).get('lang');
  if (isAvailable(fromUrl, available)) return fromUrl;
  if (isAvailable(stored, available)) return stored;
  for (const language of languages) {
    const base = language.toLowerCase().split('-')[0];
    if (isAvailable(base, available)) return base;
  }
  return 'en';
}

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

class I18n {
  locale = $state<Locale>('en');

  /** Messages for the active locale. Reading it in a template or $derived re-renders on a language change. */
  get m(): Messages {
    return CATALOGS[this.locale];
  }

  /** The Intl tag for a purpose, for the active locale. */
  intl(purpose: keyof (typeof INTL)['en']): string {
    return INTL[this.locale][purpose];
  }

  set(locale: Locale): void {
    this.locale = locale;
    if (typeof document !== 'undefined') document.documentElement.lang = locale;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Storage can be blocked (private mode); the choice then lasts for this visit.
    }
  }

  /** Picks the language on start-up. A `?lang=` link is remembered like a choice. */
  init(): void {
    const locale = detectLocale({ search: location.search, stored: readStored(), languages: navigator.languages ?? [navigator.language] });
    this.locale = locale;
    document.documentElement.lang = locale;
    if (new URLSearchParams(location.search).get('lang') === locale) this.set(locale);
  }
}

export const i18n = new I18n();
