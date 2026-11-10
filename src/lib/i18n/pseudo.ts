// Dev-only test language: every catalog string accented, stretched and bracketed,
// so untranslated text and layouts that break on longer languages stand out.

const ACCENTS: Record<string, string> = {
  a: 'á', b: 'ƀ', c: 'ç', d: 'ð', e: 'é', f: 'ƒ', g: 'ĝ', h: 'ĥ', i: 'í', j: 'ĵ', k: 'ķ', l: 'ļ', m: 'ɱ',
  n: 'ñ', o: 'ö', p: 'þ', q: 'ǫ', r: 'ŕ', s: 'š', t: 'ţ', u: 'ü', v: 'ṽ', w: 'ŵ', x: 'ẋ', y: 'ý', z: 'ž',
  A: 'Å', B: 'Ɓ', C: 'Ç', D: 'Ð', E: 'É', F: 'Ƒ', G: 'Ĝ', H: 'Ĥ', I: 'Í', J: 'Ĵ', K: 'Ķ', L: 'Ļ', M: 'Ṁ',
  N: 'Ñ', O: 'Ö', P: 'Þ', Q: 'Ǫ', R: 'Ŕ', S: 'Š', T: 'Ţ', U: 'Ü', V: 'Ṽ', W: 'Ŵ', X: 'Ẋ', Y: 'Ý', Z: 'Ž',
};

/** Keys whose values are data (links, numbers, formulas), not copy. */
const KEEP = new Set(['href', 'photo', 'linkedin', 'code', 'n', 'year', 'refs', 'name', 'BIBLIOGRAPHY', 'TAB_ORDER']);

export function pseudoText(text: string): string {
  if (!text.trim()) return text;
  // Doubling vowels stretches text by roughly a third, about what German and Russian need.
  const body = text.replace(/[A-Za-z]/g, (ch) => (/[aeiouAEIOU]/.test(ch) ? ACCENTS[ch].repeat(2) : ACCENTS[ch]));
  return `⟦${body}⟧`;
}

export function pseudo<T>(value: T, key = ''): T {
  if (KEEP.has(key)) return value;
  if (typeof value === 'string') return pseudoText(value) as T;
  if (typeof value === 'function') return ((...args: unknown[]) => pseudoText(String(value(...args)))) as T;
  if (Array.isArray(value)) return value.map((v) => pseudo(v)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, pseudo(v, k)])) as T;
  }
  return value;
}
