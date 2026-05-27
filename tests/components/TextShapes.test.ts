// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { TextComponent } from '../../src/components/TextComponent';
import { ParagraphComponent } from '../../src/components/ParagraphComponent';
import { ComponentMetadata, ThemeVariables } from '../../src/components/BaseComponent';
import { parseDsl } from '../../src/dsl/parser';
import { createComponentsFromDsl } from '../../src/engine/componentFactory';

const META = (id: string, type: string): ComponentMetadata => ({ id, type, tags: [] });
const THEME: ThemeVariables = {
  primaryColor: '#0d6efd',
  secondaryColor: '#6c757d',
  backgroundColor: '#1e1e2e',
  textColor: '#cdd6f4',
  borderColor: '#45475a',
  fontFamily: 'Outfit, sans-serif'
};
const BOUNDS = (w: number, h: number) => ({ x: 0, y: 0, width: w, height: h });

describe('TextComponent', () => {
  it('validateProps throws when label is not a string', () => {
    const c = new TextComponent(META('t1', 'Text'), { label: 123 as any }, {});
    expect(() => c.validateProps()).toThrow(/label.*must be a string/i);
  });

  it('validateProps throws when align is invalid', () => {
    const c = new TextComponent(META('t1', 'Text'), { align: 'invalid' as any }, {});
    expect(() => c.validateProps()).toThrow(/align.*must be/i);
  });

  it('calculateMinDimensions scales with text length', () => {
    const c = new TextComponent(META('t1', 'Text'), { label: 'Hello' }, {});
    const d = c.calculateMinDimensions(THEME);
    expect(d.width).toBe(40); // Math.max(40, 5 * 8)
    expect(d.height).toBe(24);
  });

  it('render outputs a <g> and <text> with alignment attributes', () => {
    const c = new TextComponent(META('t1', 'Text'), { label: 'Aligned Left', align: 'left' }, {});
    c.bounds = BOUNDS(100, 24);
    const g = c.render(THEME);
    expect(g.tagName).toBe('g');
    
    const text = g.querySelector('text');
    expect(text).not.toBeNull();
    expect(text!.getAttribute('text-anchor')).toBe('start');
    expect(text!.textContent).toBe('Aligned Left');
  });

  it('is parseable from DSL via factory', () => {
    const nodes = parseDsl('MyLabel: Text { label: "Annotation Header" align: "center" }');
    const comps = createComponentsFromDsl(nodes);
    expect(comps[0].type).toBe('Text');
    expect((comps[0] as TextComponent).props.align).toBe('center');
  });
});

describe('ParagraphComponent', () => {
  it('validateProps throws when text is not a string', () => {
    const c = new ParagraphComponent(META('p1', 'Paragraph'), { text: {} as any }, {});
    expect(() => c.validateProps()).toThrow(/text.*must be a string/i);
  });

  it('calculateMinDimensions calculates height based on line count', () => {
    const c = new ParagraphComponent(META('p1', 'Paragraph'), { text: 'Line 1\nLine 2\nLine 3' }, {});
    const d = c.calculateMinDimensions(THEME);
    expect(d.height).toBe(3 * 18); // 3 lines * 18px line height = 54
    expect(d.width).toBeGreaterThanOrEqual(45);
  });

  it('render outputs multiple <tspan> elements for multi-line text', () => {
    const c = new ParagraphComponent(META('p1', 'Paragraph'), { text: 'Line A\nLine B' }, {});
    c.bounds = BOUNDS(120, 36);
    const g = c.render(THEME);
    const tspans = g.querySelectorAll('tspan');
    expect(tspans.length).toBe(2);
    expect(tspans[0].textContent).toBe('Line A');
    expect(tspans[1].textContent).toBe('Line B');
  });

  it('is parseable from DSL via factory', () => {
    const nodes = parseDsl('MyParagraph: Paragraph { text: "Hello\\nWorld" align: "right" }');
    const comps = createComponentsFromDsl(nodes);
    expect(comps[0].type).toBe('Paragraph');
    const p = comps[0] as ParagraphComponent;
    expect(p.props.align).toBe('right');
    expect(p.props.text).toBe('Hello\\nWorld');
  });
});
