// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { EnumComponent } from '../../src/components/EnumComponent';
import { AbstractComponent } from '../../src/components/AbstractComponent';
import { AnnotationComponent } from '../../src/components/AnnotationComponent';
import { StructComponent } from '../../src/components/StructComponent';
import { ObjectComponent } from '../../src/components/ObjectComponent';
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
// EnumComponent
// ──────────────────────────────────────────────
describe('EnumComponent', () => {
  it('validateProps throws when props are invalid', () => {
    expect(() => new EnumComponent(META('e1', 'Enum'), { label: 123 as any }, {}).validateProps()).toThrow();
    expect(() => new EnumComponent(META('e1', 'Enum'), { items: true as any }, {}).validateProps()).toThrow();
    expect(() => new EnumComponent(META('e1', 'Enum'), { attributes: [] as any }, {}).validateProps()).toThrow();
  });

  it('calculates min dimensions properly', () => {
    const c = new EnumComponent(META('e1', 'Enum'), { label: 'UserStatus', items: 'ACTIVE; INACTIVE' }, {});
    const d = c.calculateMinDimensions(THEME);
    expect(d.width).toBeGreaterThanOrEqual(160);
    // height: 46 base + 12 + 2 * 20 = 98
    expect(d.height).toBe(98);
  });

  it('renders correctly with stereotype and bold label', () => {
    const c = new EnumComponent(META('e1', 'Enum'), { label: 'UserStatus', items: 'ACTIVE; INACTIVE' }, {});
    c.bounds = BOUNDS(180, 98);
    const g = c.render(THEME);
    expect(g.tagName).toBe('g');
    expect(g.getAttribute('id')).toBe('e1');

    const rect = g.querySelector('rect');
    expect(rect).not.toBeNull();

    const texts = Array.from(g.querySelectorAll('text'));
    const stereo = texts.find(t => t.textContent === '«enumeration»');
    expect(stereo).toBeDefined();
    expect(stereo!.getAttribute('font-style')).toBe('italic');

    const label = texts.find(t => t.textContent === 'UserStatus');
    expect(label).toBeDefined();
    expect(label!.getAttribute('font-weight')).toBe('bold');

    const activeItem = texts.find(t => t.textContent === 'ACTIVE');
    expect(activeItem).toBeDefined();
  });

  it('is parseable from DSL via factory', () => {
    const nodes = parseDsl('MyEnum: Enum { label: "UserStatus" }');
    const comps = createComponentsFromDsl(nodes);
    expect(comps[0].id).toBe('MyEnum');
    expect(comps[0].type).toBe('Enum');
  });
});

// ──────────────────────────────────────────────
// AbstractComponent
// ──────────────────────────────────────────────
describe('AbstractComponent', () => {
  it('validateProps throws when props are invalid', () => {
    expect(() => new AbstractComponent(META('a1', 'Abstract'), { label: 123 as any }, {}).validateProps()).toThrow();
    expect(() => new AbstractComponent(META('a1', 'Abstract'), { methods: true as any }, {}).validateProps()).toThrow();
  });

  it('calculates min dimensions properly', () => {
    const c = new AbstractComponent(META('a1', 'Abstract'), { label: 'BaseService', attributes: 'id: string', methods: 'execute()' }, {});
    const d = c.calculateMinDimensions(THEME);
    expect(d.width).toBeGreaterThanOrEqual(160);
    // height: 46 base + (12 + 1*20) + (12 + 1*20) = 110
    expect(d.height).toBe(110);
  });

  it('renders correctly with stereotype and bold italic label', () => {
    const c = new AbstractComponent(META('a1', 'Abstract'), { label: 'BaseService' }, {});
    c.bounds = BOUNDS(180, 46);
    const g = c.render(THEME);

    const texts = Array.from(g.querySelectorAll('text'));
    const stereo = texts.find(t => t.textContent === '«abstract»');
    expect(stereo).toBeDefined();
    expect(stereo!.getAttribute('font-style')).toBe('italic');

    const label = texts.find(t => t.textContent === 'BaseService');
    expect(label).toBeDefined();
    expect(label!.getAttribute('font-weight')).toBe('bold');
    expect(label!.getAttribute('font-style')).toBe('italic');
  });

  it('renders accessor symbols with colors', () => {
    const c = new AbstractComponent(META('a1', 'Abstract'), {
      label: 'BaseService',
      attributes: '+id: string; -secret: string; #family: string; ~package: string'
    }, {});
    c.bounds = BOUNDS(200, 150);
    const g = c.render(THEME);

    const texts = Array.from(g.querySelectorAll('text'));
    // Accessor symbols
    const plus = texts.find(t => t.textContent === '+');
    expect(plus).toBeDefined();
    expect(plus!.getAttribute('fill')).toBe('#4ade80');

    const minus = texts.find(t => t.textContent === '-');
    expect(minus).toBeDefined();
    expect(minus!.getAttribute('fill')).toBe('#f87171');

    const hash = texts.find(t => t.textContent === '#');
    expect(hash).toBeDefined();
    expect(hash!.getAttribute('fill')).toBe('#fb923c');

    const tilde = texts.find(t => t.textContent === '~');
    expect(tilde).toBeDefined();
    expect(tilde!.getAttribute('fill')).toBe('#a78bfa');
  });

  it('is parseable from DSL via factory', () => {
    const nodes = parseDsl('MyAbstract: Abstract { label: "BaseService" }');
    const comps = createComponentsFromDsl(nodes);
    expect(comps[0].id).toBe('MyAbstract');
    expect(comps[0].type).toBe('Abstract');
  });
});

// ──────────────────────────────────────────────
// AnnotationComponent
// ──────────────────────────────────────────────
describe('AnnotationComponent', () => {
  it('validateProps throws when props are invalid', () => {
    expect(() => new AnnotationComponent(META('an1', 'Annotation'), { label: 123 as any }, {}).validateProps()).toThrow();
  });

  it('renders correctly with stereotype and bold label', () => {
    const c = new AnnotationComponent(META('an1', 'Annotation'), { label: 'Entity' }, {});
    c.bounds = BOUNDS(180, 46);
    const g = c.render(THEME);

    const texts = Array.from(g.querySelectorAll('text'));
    const stereo = texts.find(t => t.textContent === '«annotation»');
    expect(stereo).toBeDefined();
    expect(stereo!.getAttribute('font-style')).toBe('italic');

    const label = texts.find(t => t.textContent === 'Entity');
    expect(label).toBeDefined();
    expect(label!.getAttribute('font-weight')).toBe('bold');
  });

  it('is parseable from DSL via factory', () => {
    const nodes = parseDsl('MyAnnotation: Annotation { label: "Entity" }');
    const comps = createComponentsFromDsl(nodes);
    expect(comps[0].id).toBe('MyAnnotation');
    expect(comps[0].type).toBe('Annotation');
  });
});

// ──────────────────────────────────────────────
// StructComponent
// ──────────────────────────────────────────────
describe('StructComponent', () => {
  it('validateProps throws when props are invalid', () => {
    expect(() => new StructComponent(META('s1', 'Struct'), { label: 123 as any }, {}).validateProps()).toThrow();
  });

  it('renders correctly with stereotype and bold label', () => {
    const c = new StructComponent(META('s1', 'Struct'), { label: 'Point' }, {});
    c.bounds = BOUNDS(180, 46);
    const g = c.render(THEME);

    const texts = Array.from(g.querySelectorAll('text'));
    const stereo = texts.find(t => t.textContent === '«struct»');
    expect(stereo).toBeDefined();
    expect(stereo!.getAttribute('font-style')).toBe('italic');

    const label = texts.find(t => t.textContent === 'Point');
    expect(label).toBeDefined();
    expect(label!.getAttribute('font-weight')).toBe('bold');
  });

  it('is parseable from DSL via factory', () => {
    const nodes = parseDsl('MyStruct: Struct { label: "Point" }');
    const comps = createComponentsFromDsl(nodes);
    expect(comps[0].id).toBe('MyStruct');
    expect(comps[0].type).toBe('Struct');
  });
});

// ──────────────────────────────────────────────
// ObjectComponent
// ──────────────────────────────────────────────
describe('ObjectComponent', () => {
  it('validateProps throws when props are invalid', () => {
    expect(() => new ObjectComponent(META('o1', 'Object'), { label: 123 as any }, {}).validateProps()).toThrow();
  });

  it('calculates min dimensions properly', () => {
    const c = new ObjectComponent(META('o1', 'Object'), { label: 'user : User', attributes: 'name = "John"' }, {});
    const d = c.calculateMinDimensions(THEME);
    expect(d.width).toBeGreaterThanOrEqual(160);
    // height: 36 base + 12 + 1 * 20 = 68
    expect(d.height).toBe(68);
  });

  it('renders correctly with underlined title', () => {
    const c = new ObjectComponent(META('o1', 'Object'), { label: 'userConn : Connection' }, {});
    c.bounds = BOUNDS(180, 36);
    const g = c.render(THEME);

    const texts = Array.from(g.querySelectorAll('text'));
    const label = texts.find(t => t.textContent === 'userConn : Connection');
    expect(label).toBeDefined();
    expect(label!.getAttribute('font-weight')).toBe('bold');
    expect(label!.getAttribute('text-decoration')).toBe('underline');
  });

  it('is parseable from DSL via factory', () => {
    const nodes = parseDsl('MyObject: Object { label: "userConn : Connection" }');
    const comps = createComponentsFromDsl(nodes);
    expect(comps[0].id).toBe('MyObject');
    expect(comps[0].type).toBe('Object');
  });
});
