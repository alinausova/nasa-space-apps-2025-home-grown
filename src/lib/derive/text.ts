// LLM text is rendered as structured segments, never as HTML (no {@html} on model output).

export interface Segment {
  text: string;
  bold: boolean;
}

/** Splits plain text with **bold** markers into segments. Other markdown is shown as plain text. */
export function segments(line: string): Segment[] {
  const out: Segment[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  for (const match of line.matchAll(re)) {
    if (match.index! > last) out.push({ text: line.slice(last, match.index), bold: false });
    out.push({ text: match[1], bold: true });
    last = match.index! + match[0].length;
  }
  if (last < line.length) out.push({ text: line.slice(last), bold: false });
  return out.filter((s) => s.text.length > 0);
}

/** Paragraphs of segments. Bullet markers and headings are dropped; blank lines separate paragraphs. */
export function paragraphs(text: string): Segment[][] {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n|\n(?=\s*[-*•]\s)/)
    .map((p) =>
      p
        .split('\n')
        .map((line) => line.replace(/^\s*(#{1,6}\s+|[-*•]\s+)/, '').trim())
        .filter(Boolean)
        .join(' '),
    )
    .filter(Boolean)
    .map(segments);
}
