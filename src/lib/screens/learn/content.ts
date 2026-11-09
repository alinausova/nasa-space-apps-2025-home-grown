import * as en from './content/en';
import { i18n, type Locale } from '../../i18n/locale.svelte';

// Learn pages: one content module per language (content/en.ts is the source).
export type LearnContent = typeof en;

/** Untranslated locales point at English; AVAILABLE in the locale store keeps them from being selected. */
const CONTENT: Record<Locale, LearnContent> = { en, de: en, es: en, fr: en, tr: en, ru: en };

/** Learn content in the active language. Call inside $derived (or a template) so it follows language changes. */
export function learn(): LearnContent {
  return CONTENT[i18n.locale];
}

export const TAB_ORDER = en.TAB_ORDER;
