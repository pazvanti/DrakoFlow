import { describe, it, expect } from 'vitest';
import { highlightDSL } from '../../src/utils/highlighter';

describe('highlightDSL', () => {
  it('highlights comments and strings', () => {
    const code = '// This is a comment\n"Hello World"';
    const result = highlightDSL(code);
    expect(result.html).toContain('class="hl-comment"');
    expect(result.html).toContain('class="hl-string"');
  });

  it('escapes special characters', () => {
    const code = 'C <-> A';
    const result = highlightDSL(code);
    expect(result.html).toContain('&lt;-&gt;');
  });

  it('identifies components, keywords, and properties', () => {
    const code = 'Client: Process {\n  label: "Client App"\n}';
    const result = highlightDSL(code);
    expect(result.html).toContain('class="hl-id"');
    expect(result.html).toContain('class="hl-keyword"');
    expect(result.html).toContain('class="hl-property"');
  });

  it('identifies and extracts color picker triggers', () => {
    const code = 'color: "#60a5fa"';
    const result = highlightDSL(code);
    expect(result.html).toContain('class="hl-color"');
    expect(result.html).toContain('class="color-picker-trigger"');
    expect(result.colorTriggers.length).toBe(1);
    expect(result.colorTriggers[0].color).toBe('#60a5fa');
  });

  it('identifies and extracts icon picker triggers', () => {
    const code = 'icon: "docker"';
    const result = highlightDSL(code);
    expect(result.html).toContain('class="icon-picker-trigger"');
    expect(result.iconTriggers.length).toBe(1);
    expect(result.iconTriggers[0].icon).toBe('docker');
  });
  it('identifies @decorator tokens and bracket operators', () => {
    const code = '@tags: ["database", "auth"]';
    const result = highlightDSL(code);
    expect(result.html).toContain('class="hl-decorator"');
    expect(result.html).toContain('class="hl-operator"');
    expect(result.html).toContain('class="hl-string"');
  });

  it('highlights block comments /** ... **/ as hl-comment', () => {
    const code = '/**\n * This is a multiline comment\n **/\nA: Rectangle {}';
    const result = highlightDSL(code);
    // The whole block comment is wrapped in a single hl-comment span
    expect(result.html).toContain('class="hl-comment"');
    // No color triggers should be extracted from inside the comment
    expect(result.colorTriggers).toHaveLength(0);
    // The comment span should contain the opening delimiter
    expect(result.html).toContain('/**');
  });

  it('applies hl-active-token class to tokens within activeRange', () => {
    const code = 'Client: Process {\n  label: "Client App"\n}';
    const result = highlightDSL(code, { start: 0, end: 15 });
    expect(result.html).toContain('class="hl-active-token"');
  });

  it('highlights exterior direction keywords (LEFT, RIGHT, TOP, BOTTOM)', () => {
    const code = 'LEFT -> Client : "External call"';
    const result = highlightDSL(code);
    expect(result.html).toContain('<span class="hl-keyword">LEFT</span>');
  });

  it('highlights animated, startX, and startY as properties', () => {
    const code = 'A -> B : "Call" {\n  animated: true\n  startX: 10\n  startY: 20\n}';
    const result = highlightDSL(code);
    expect(result.html).toContain('<span class="hl-property">animated</span>');
    expect(result.html).toContain('<span class="hl-property">startX</span>');
    expect(result.html).toContain('<span class="hl-property">startY</span>');
    expect(result.html).toContain('<span class="hl-boolean">true</span>');
  });
});
