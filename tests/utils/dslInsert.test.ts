import { describe, it, expect } from 'vitest';
import { getBraceDepthAt, findSafeInsertIndex } from '../../src/utils/dslInsert';

const SAMPLE = `// comment
MyRectangle: Rectangle {
  label: "test"
  themeOverride: {
    backgroundColor: "#fff"
  }
}`;

describe('dslInsert', () => {
  it('reports depth 0 outside blocks', () => {
    expect(getBraceDepthAt(SAMPLE, 0)).toBe(0);
    expect(getBraceDepthAt(SAMPLE, SAMPLE.indexOf('MyRectangle'))).toBe(0);
  });

  it('reports depth inside nested and top-level blocks', () => {
    const insideLabel = SAMPLE.indexOf('label');
    const insideTheme = SAMPLE.indexOf('backgroundColor');
    expect(getBraceDepthAt(SAMPLE, insideLabel)).toBe(1);
    expect(getBraceDepthAt(SAMPLE, insideTheme)).toBe(2);
  });

  it('ignores braces inside strings and line comments', () => {
    const text = 'A: Rectangle { label: "{ not a block }" } // { comment';
    const inString = text.indexOf('not');
    expect(getBraceDepthAt(text, inString)).toBe(1);
  });

  it('returns cursor when at top level', () => {
    const cursor = SAMPLE.indexOf('MyRectangle');
    expect(findSafeInsertIndex(SAMPLE, cursor)).toBe(cursor);
  });

  it('returns position after enclosing block when cursor is inside', () => {
    const cursor = SAMPLE.indexOf('backgroundColor');
    const safe = findSafeInsertIndex(SAMPLE, cursor);
    expect(SAMPLE.slice(safe).trimStart()).toBe('');
    expect(SAMPLE[safe - 1]).toBe('}');
  });

  it('returns end of file when braces are unbalanced', () => {
    const text = 'Broken: Rectangle { label: "x"';
    expect(findSafeInsertIndex(text, text.indexOf('label'))).toBe(text.length);
  });
});
