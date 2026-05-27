// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { InterfaceComponent } from '../../src/components/InterfaceComponent';
import { UMLComponentComponent } from '../../src/components/UMLComponentComponent';
import { ModuleComponent } from '../../src/components/ModuleComponent';
import { PackageComponent } from '../../src/components/PackageComponent';
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

// ──────────────────────────────────────────────
// InterfaceComponent
// ──────────────────────────────────────────────
describe('InterfaceComponent', () => {
  it('validateProps throws when label is not a string', () => {
    const c = new InterfaceComponent(META('i1', 'Interface'), { label: 42 as any }, {});
    expect(() => c.validateProps()).toThrow(/label.*must be a string/i);
  });

  it('calculateMinDimensions returns at least 150×80', () => {
    const c = new InterfaceComponent(META('i1', 'Interface'), {}, {});
    const d = c.calculateMinDimensions(THEME);
    expect(d.width).toBeGreaterThanOrEqual(150);
    expect(d.height).toBe(80);
  });

  it('render produces a <g> with the component id', () => {
    const c = new InterfaceComponent(META('i1', 'Interface'), { label: 'Serializable' }, {});
    c.bounds = BOUNDS(200, 80);
    const g = c.render(THEME);
    expect(g.tagName).toBe('g');
    expect(g.getAttribute('id')).toBe('i1');
  });

  it('render includes «interface» stereotype text', () => {
    const c = new InterfaceComponent(META('i1', 'Interface'), { label: 'IFoo' }, {});
    c.bounds = BOUNDS(200, 80);
    const g = c.render(THEME);
    const texts = Array.from(g.querySelectorAll('text'));
    const stereo = texts.find(t => t.textContent === '«interface»');
    expect(stereo).toBeDefined();
    expect(stereo!.getAttribute('font-style')).toBe('italic');
  });

  it('render includes bold label text', () => {
    const c = new InterfaceComponent(META('i1', 'Interface'), { label: 'IFoo' }, {});
    c.bounds = BOUNDS(200, 80);
    const g = c.render(THEME);
    const texts = Array.from(g.querySelectorAll('text'));
    const label = texts.find(t => t.textContent === 'IFoo');
    expect(label).toBeDefined();
    expect(label!.getAttribute('font-weight')).toBe('bold');
  });

  it('render includes one separator line', () => {
    const c = new InterfaceComponent(META('i1', 'Interface'), { label: 'IFoo' }, {});
    c.bounds = BOUNDS(200, 80);
    const g = c.render(THEME);
    const lines = g.querySelectorAll('line');
    expect(lines.length).toBe(1);
  });

  it('is parseable from DSL via factory', () => {
    const nodes = parseDsl('MyInterface: Interface { label: "Serializable" }');
    const comps = createComponentsFromDsl(nodes);
    expect(comps[0].id).toBe('MyInterface');
    expect(comps[0].type).toBe('Interface');
  });
});

// ──────────────────────────────────────────────
// UMLComponentComponent
// ──────────────────────────────────────────────
describe('UMLComponentComponent', () => {
  it('validateProps throws when label is not a string', () => {
    const c = new UMLComponentComponent(META('c1', 'UMLComponent'), { label: true as any }, {});
    expect(() => c.validateProps()).toThrow(/label.*must be a string/i);
  });

  it('calculateMinDimensions returns at least 150×70', () => {
    const c = new UMLComponentComponent(META('c1', 'UMLComponent'), {}, {});
    const d = c.calculateMinDimensions(THEME);
    expect(d.width).toBeGreaterThanOrEqual(150);
    expect(d.height).toBe(70);
  });

  it('render produces <g> and outer <rect>', () => {
    const c = new UMLComponentComponent(META('c1', 'UMLComponent'), { label: 'Auth' }, {});
    c.bounds = BOUNDS(200, 70);
    const g = c.render(THEME);
    expect(g.tagName).toBe('g');
    expect(g.querySelector('rect')).not.toBeNull();
  });

  it('render includes 3 notch rectangles (bar + top notch + bottom notch)', () => {
    const c = new UMLComponentComponent(META('c1', 'UMLComponent'), { label: 'Svc' }, {});
    c.bounds = BOUNDS(200, 70);
    const g = c.render(THEME);
    // outer rect + iconBar + topNotch + botNotch = 4 rects
    const rects = g.querySelectorAll('rect');
    expect(rects.length).toBe(4);
  });

  it('render includes label text element', () => {
    const c = new UMLComponentComponent(META('c1', 'UMLComponent'), { label: 'PaymentService' }, {});
    c.bounds = BOUNDS(220, 70);
    const g = c.render(THEME);
    const texts = Array.from(g.querySelectorAll('text'));
    expect(texts.some(t => t.textContent === 'PaymentService')).toBe(true);
  });

  it('is parseable from DSL via factory', () => {
    const nodes = parseDsl('MySvc: UMLComponent { label: "PaymentService" }');
    const comps = createComponentsFromDsl(nodes);
    expect(comps[0].id).toBe('MySvc');
    expect(comps[0].type).toBe('UMLComponent');
  });
});

// ──────────────────────────────────────────────
// ModuleComponent
// ──────────────────────────────────────────────
describe('ModuleComponent', () => {
  it('validateProps throws when label is not a string', () => {
    const c = new ModuleComponent(META('m1', 'Module'), { label: 99 as any }, {});
    expect(() => c.validateProps()).toThrow(/label.*must be a string/i);
  });

  it('calculateMinDimensions returns at least 140×65', () => {
    const c = new ModuleComponent(META('m1', 'Module'), {}, {});
    const d = c.calculateMinDimensions(THEME);
    expect(d.width).toBeGreaterThanOrEqual(140);
    expect(d.height).toBe(65);
  });

  it('render produces <g>, a tab <path> and body <rect>', () => {
    const c = new ModuleComponent(META('m1', 'Module'), { label: 'auth.module' }, {});
    c.bounds = BOUNDS(180, 65);
    const g = c.render(THEME);
    expect(g.querySelector('path')).not.toBeNull();
    expect(g.querySelector('rect')).not.toBeNull();
  });

  it('render includes label text', () => {
    const c = new ModuleComponent(META('m1', 'Module'), { label: 'auth.module' }, {});
    c.bounds = BOUNDS(180, 65);
    const g = c.render(THEME);
    const texts = Array.from(g.querySelectorAll('text'));
    expect(texts.some(t => t.textContent === 'auth.module')).toBe(true);
  });

  it('is parseable from DSL via factory', () => {
    const nodes = parseDsl('M: Module { label: "auth.module" }');
    const comps = createComponentsFromDsl(nodes);
    expect(comps[0].type).toBe('Module');
  });
});

// ──────────────────────────────────────────────
// PackageComponent
// ──────────────────────────────────────────────
describe('PackageComponent', () => {
  it('validateProps throws when label is not a string', () => {
    const c = new PackageComponent(META('p1', 'Package'), { label: [] as any }, {});
    expect(() => c.validateProps()).toThrow(/label.*must be a string/i);
  });

  it('calculateMinDimensions returns at least 180×90', () => {
    const c = new PackageComponent(META('p1', 'Package'), {}, {});
    const d = c.calculateMinDimensions(THEME);
    expect(d.width).toBeGreaterThanOrEqual(180);
    expect(d.height).toBe(90);
  });

  it('render has an angled tab <path> and body <rect>', () => {
    const c = new PackageComponent(META('p1', 'Package'), { label: 'com.example' }, {});
    c.bounds = BOUNDS(200, 90);
    const g = c.render(THEME);
    expect(g.querySelector('path')).not.toBeNull();
    expect(g.querySelector('rect')).not.toBeNull();
  });

  it('label appears inside the tab as a text element', () => {
    const c = new PackageComponent(META('p1', 'Package'), { label: 'com.example' }, {});
    c.bounds = BOUNDS(200, 90);
    const g = c.render(THEME);
    const texts = Array.from(g.querySelectorAll('text'));
    expect(texts.some(t => t.textContent === 'com.example')).toBe(true);
  });

  it('is parseable from DSL via factory', () => {
    const nodes = parseDsl('Pkg: Package { label: "com.example" }');
    const comps = createComponentsFromDsl(nodes);
    expect(comps[0].type).toBe('Package');
  });
});
