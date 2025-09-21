import { clamp, safeParseJSON, escapeHTML } from '../utils.js';

describe('utils', () => {
  test('clamp bounds value', () => {
    expect(clamp(5, 1, 10)).toBe(5);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(100, 0, 50)).toBe(50);
  });

  test('safeParseJSON returns fallback on invalid', () => {
    expect(safeParseJSON('{bad json}', { ok: false })).toEqual({ ok: false });
    expect(safeParseJSON('null', 123)).toBe(null);
  });

  test('escapeHTML encodes characters', () => {
    expect(escapeHTML('<div>"&' + "'" + '</div>')).toBe('&lt;div&gt;&quot;&amp;&#39;&lt;/div&gt;');
  });
});
