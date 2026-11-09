import { describe, expect, it } from 'vitest';
import { paragraphs, segments } from './text';

describe('segments', () => {
  it('splits bold markers', () => {
    expect(segments('Grow **kale** and **peas** here')).toEqual([
      { text: 'Grow ', bold: false },
      { text: 'kale', bold: true },
      { text: ' and ', bold: false },
      { text: 'peas', bold: true },
      { text: ' here', bold: false },
    ]);
  });

  it('keeps HTML as literal text', () => {
    expect(segments('<img src=x onerror=alert(1)>')).toEqual([{ text: '<img src=x onerror=alert(1)>', bold: false }]);
  });
});

describe('paragraphs', () => {
  it('turns bullets and blank lines into paragraphs', () => {
    const text = 'Cool summers suit greens.\n\n- 🥬 **Kale** - 92%\n- 🥕 **Carrots** - 80%\n\n## Tip\nWater in July.';
    const result = paragraphs(text).map((p) => p.map((s) => s.text).join(''));
    expect(result).toEqual(['Cool summers suit greens.', '🥬 Kale - 92%', '🥕 Carrots - 80%', 'Tip Water in July.']);
  });

  it('joins wrapped lines of one paragraph', () => {
    expect(paragraphs('Line one\nline two').map((p) => p.map((s) => s.text).join(''))).toEqual(['Line one line two']);
  });

  it('handles empty text', () => {
    expect(paragraphs('  \n ')).toEqual([]);
  });
});
