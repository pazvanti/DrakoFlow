// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { ClassComponent } from '../../src/components/ClassComponent';
import { ComponentMetadata, ThemeVariables } from '../../src/components/BaseComponent';
import { parseDsl } from '../../src/dsl/parser';
import { createComponentsFromDsl } from '../../src/engine/componentFactory';

const metadata: ComponentMetadata = { id: 'c1', type: 'Class', tags: [] };
const theme: ThemeVariables = {
  primaryColor: '#0d6efd',
  secondaryColor: '#6c757d',
  backgroundColor: '#1e1e2e',
  textColor: '#cdd6f4',
  borderColor: '#45475a',
  fontFamily: 'Outfit, sans-serif'
};

// ─────────────────────────────────────────────────────────
// Parser integration: block form DSL → ParsedNode.subBlocks
// ─────────────────────────────────────────────────────────
describe('ClassComponent – DSL block parsing', () => {
  it('parses attributes block into subBlocks.attributes', () => {
    const code = `MyClass: Class {
  label: "Foo"
  attributes: {
    +id: string
    -secret: string
  }
}`;
    const nodes = parseDsl(code);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].subBlocks).toBeDefined();
    expect(nodes[0].subBlocks!['attributes']).toEqual(['+id: string', '-secret: string']);
  });

  it('parses methods block into subBlocks.methods', () => {
    const code = `MyClass: Class {
  label: "Foo"
  methods: {
    +getX(): int
    ~reset(): void
  }
}`;
    const nodes = parseDsl(code);
    expect(nodes[0].subBlocks!['methods']).toEqual(['+getX(): int', '~reset(): void']);
  });

  it('parses items block into subBlocks.items', () => {
    const code = `MyList: Class {
  label: "Requirements"
  items: {
    Auth via OAuth 2.0
    Rate limiting
  }
}`;
    const nodes = parseDsl(code);
    expect(nodes[0].subBlocks!['items']).toEqual(['Auth via OAuth 2.0', 'Rate limiting']);
  });

  it('parses all three blocks simultaneously', () => {
    const code = `Full: Class {
  label: "Full"
  attributes: {
    +a: int
  }
  methods: {
    +b(): void
  }
  items: {
    item one
  }
}`;
    const nodes = parseDsl(code);
    expect(nodes[0].subBlocks!['attributes']).toHaveLength(1);
    expect(nodes[0].subBlocks!['methods']).toHaveLength(1);
    expect(nodes[0].subBlocks!['items']).toHaveLength(1);
  });

  it('does not set subBlocks when no block properties are present', () => {
    const code = `Simple: Class { label: "Simple" }`;
    const nodes = parseDsl(code);
    expect(nodes[0].subBlocks).toBeUndefined();
  });

  it('builds a ClassComponent via factory with block-form lines', () => {
    const code = `UserService: Class {
  label: "UserService"
  attributes: {
    +id: string
    -secret: string
  }
  methods: {
    +getUser(): User
  }
}`;
    const components = createComponentsFromDsl(parseDsl(code));
    expect(components).toHaveLength(1);
    expect(components[0].id).toBe('UserService');
    // Cast to access props
    const cls = components[0] as ClassComponent;
    expect(cls.props.attributeLines).toEqual(['+id: string', '-secret: string']);
    expect(cls.props.methodLines).toEqual(['+getUser(): User']);
  });
});

// ─────────────────────────────────────────────────────────
// validateProps
// ─────────────────────────────────────────────────────────
describe('ClassComponent – validateProps', () => {
  it('accepts all undefined props without throwing', () => {
    const comp = new ClassComponent(metadata, {}, {});
    expect(() => comp.validateProps()).not.toThrow();
  });

  it('throws when legacy label is not a string', () => {
    const comp = new ClassComponent(metadata, { label: 42 as any }, {});
    expect(() => comp.validateProps()).toThrow(/label.*must be a string/i);
  });

  it('throws when legacy items is not a string', () => {
    const comp = new ClassComponent(metadata, { items: true as any }, {});
    expect(() => comp.validateProps()).toThrow(/items.*must be a string/i);
  });

  it('throws when legacy attributes is not a string', () => {
    const comp = new ClassComponent(metadata, { attributes: 99 as any }, {});
    expect(() => comp.validateProps()).toThrow(/attributes.*must be a string/i);
  });

  it('throws when legacy methods is not a string', () => {
    const comp = new ClassComponent(metadata, { methods: {} as any }, {});
    expect(() => comp.validateProps()).toThrow(/methods.*must be a string/i);
  });
});

// ─────────────────────────────────────────────────────────
// calculateMinDimensions
// ─────────────────────────────────────────────────────────
describe('ClassComponent – calculateMinDimensions', () => {
  it('returns at least 160px width and 36px height when no props given', () => {
    const comp = new ClassComponent(metadata, {}, {});
    const dim = comp.calculateMinDimensions(theme);
    expect(dim.width).toBeGreaterThanOrEqual(160);
    expect(dim.height).toBeGreaterThanOrEqual(36);
  });

  it('scales width to the longest text line', () => {
    const longLabel = 'A'.repeat(40);
    const comp = new ClassComponent(metadata, { label: longLabel }, {});
    const dim = comp.calculateMinDimensions(theme);
    expect(dim.width).toBeGreaterThanOrEqual(40 * 7.5 + 36);
  });

  it('adds compartment height for attributeLines (block form)', () => {
    const base = new ClassComponent(metadata, {}, {});
    const baseDim = base.calculateMinDimensions(theme);
    // Two lines → 12 (padding) + 2×20 (lines) = 52
    const withAttrs = new ClassComponent(metadata, { attributeLines: ['+id: string', '-name: string'] }, {});
    const attrDim = withAttrs.calculateMinDimensions(theme);
    expect(attrDim.height).toBe(baseDim.height + 12 + 2 * 20);
  });

  it('adds compartment height for legacy semicolon attributes', () => {
    const base = new ClassComponent(metadata, {}, {});
    const baseDim = base.calculateMinDimensions(theme);
    const withAttrs = new ClassComponent(metadata, { attributes: 'id: string; name: string' }, {});
    const attrDim = withAttrs.calculateMinDimensions(theme);
    expect(attrDim.height).toBe(baseDim.height + 12 + 2 * 20);
  });

  it('block form takes priority over legacy semicolon form', () => {
    // 1 block line vs 3 semicolon items → block form (1 line) wins
    const comp = new ClassComponent(metadata, {
      attributes: 'a; b; c',       // 3 legacy items
      attributeLines: ['+x: int']  // 1 block item
    }, {});
    const base = new ClassComponent(metadata, {}, {});
    const dim = comp.calculateMinDimensions(theme);
    expect(dim.height).toBe(base.calculateMinDimensions(theme).height + 12 + 1 * 20);
  });
});

// ─────────────────────────────────────────────────────────
// render
// ─────────────────────────────────────────────────────────
describe('ClassComponent – render', () => {
  const makeBounds = (width: number, height: number) => ({ x: 10, y: 20, width, height });

  it('renders a <g> with the component id', () => {
    const comp = new ClassComponent(metadata, { label: 'MyClass' }, {});
    comp.bounds = makeBounds(200, 100);
    const g = comp.render(theme);
    expect(g.tagName).toBe('g');
    expect(g.getAttribute('id')).toBe('c1');
  });

  it('renders an outer rect with correct dimensions', () => {
    const comp = new ClassComponent(metadata, { label: 'Test' }, {});
    comp.bounds = makeBounds(150, 80);
    const g = comp.render(theme);
    const rect = g.querySelector('rect');
    expect(rect).not.toBeNull();
    expect(rect!.getAttribute('width')).toBe('150');
    expect(rect!.getAttribute('height')).toBe('80');
  });

  it('renders header text centered and bold', () => {
    const comp = new ClassComponent(metadata, { label: 'UserService' }, {});
    comp.bounds = makeBounds(200, 60);
    const g = comp.render(theme);
    const texts = g.querySelectorAll('text');
    expect(texts.length).toBeGreaterThanOrEqual(1);
    const header = texts[0];
    expect(header.textContent).toBe('UserService');
    expect(header.getAttribute('text-anchor')).toBe('middle');
    expect(header.getAttribute('font-weight')).toBe('bold');
  });

  it('renders no compartment dividers when no attributes/methods/items', () => {
    const comp = new ClassComponent(metadata, { label: 'Bare' }, {});
    comp.bounds = makeBounds(160, 50);
    const g = comp.render(theme);
    const lines = g.querySelectorAll('line');
    expect(lines.length).toBe(0);
  });

  it('renders one divider for attributeLines compartment', () => {
    const comp = new ClassComponent(metadata, { label: 'A', attributeLines: ['+x: int'] }, {});
    comp.bounds = makeBounds(160, 80);
    const g = comp.render(theme);
    const lines = g.querySelectorAll('line');
    expect(lines.length).toBe(1);
  });

  it('renders two dividers for attributeLines + methodLines compartments', () => {
    const comp = new ClassComponent(metadata, {
      label: 'A',
      attributeLines: ['+x: int'],
      methodLines: ['+getX(): int']
    }, {});
    comp.bounds = makeBounds(180, 120);
    const g = comp.render(theme);
    const lines = g.querySelectorAll('line');
    expect(lines.length).toBe(2);
  });

  it('renders accessor glyph and body text as separate <text> elements', () => {
    const comp = new ClassComponent(metadata, {
      label: 'T',
      attributeLines: ['+id: string']
    }, {});
    comp.bounds = makeBounds(200, 90);
    const g = comp.render(theme);
    // Header + accessor glyph + body text = 3 text elements
    const texts = Array.from(g.querySelectorAll('text'));
    const startAligned = texts.filter(t => t.getAttribute('text-anchor') === 'start');
    // accessor glyph + body = 2 start-aligned texts per line
    expect(startAligned.length).toBe(2);
    // First is the accessor glyph
    expect(startAligned[0].textContent).toBe('+');
    expect(startAligned[1].textContent).toBe('id: string');
  });

  it('renders line without accessor glyph when no prefix', () => {
    const comp = new ClassComponent(metadata, {
      label: 'T',
      attributeLines: ['noAccessor: int']
    }, {});
    comp.bounds = makeBounds(200, 90);
    const g = comp.render(theme);
    const texts = Array.from(g.querySelectorAll('text'));
    const startAligned = texts.filter(t => t.getAttribute('text-anchor') === 'start');
    // Only body text — no accessor glyph
    expect(startAligned.length).toBe(1);
    expect(startAligned[0].textContent).toBe('noAccessor: int');
  });

  it('colour-codes the + accessor as green', () => {
    const comp = new ClassComponent(metadata, {
      label: 'T',
      attributeLines: ['+pub: string']
    }, {});
    comp.bounds = makeBounds(200, 90);
    const g = comp.render(theme);
    const texts = Array.from(g.querySelectorAll('text'));
    const accessorGlyph = texts.find(t => t.textContent === '+');
    expect(accessorGlyph).toBeDefined();
    expect(accessorGlyph!.getAttribute('fill')).toBe('#4ade80');
  });

  it('colour-codes the - accessor as red', () => {
    const comp = new ClassComponent(metadata, {
      label: 'T',
      methodLines: ['-priv(): void']
    }, {});
    comp.bounds = makeBounds(200, 90);
    const g = comp.render(theme);
    const texts = Array.from(g.querySelectorAll('text'));
    const accessorGlyph = texts.find(t => t.textContent === '-');
    expect(accessorGlyph!.getAttribute('fill')).toBe('#f87171');
  });

  it('colour-codes the # accessor as amber', () => {
    const comp = new ClassComponent(metadata, {
      label: 'T',
      attributeLines: ['#prot: string']
    }, {});
    comp.bounds = makeBounds(200, 90);
    const g = comp.render(theme);
    const texts = Array.from(g.querySelectorAll('text'));
    const accessorGlyph = texts.find(t => t.textContent === '#');
    expect(accessorGlyph!.getAttribute('fill')).toBe('#fb923c');
  });

  it('colour-codes the ~ accessor as violet', () => {
    const comp = new ClassComponent(metadata, {
      label: 'T',
      methodLines: ['~pkg(): void']
    }, {});
    comp.bounds = makeBounds(200, 90);
    const g = comp.render(theme);
    const texts = Array.from(g.querySelectorAll('text'));
    const accessorGlyph = texts.find(t => t.textContent === '~');
    expect(accessorGlyph!.getAttribute('fill')).toBe('#a78bfa');
  });

  it('respects themeOverride backgroundColor on the outer rect', () => {
    const comp = new ClassComponent(metadata, { label: 'X' }, { backgroundColor: '#ff0000' });
    comp.bounds = makeBounds(160, 60);
    const g = comp.render(theme);
    const rect = g.querySelector('rect');
    expect(rect!.getAttribute('fill')).toBe('#ff0000');
  });

  it('handles legacy semicolon items in render', () => {
    const comp = new ClassComponent(metadata, { label: 'L', items: 'One; Two; Three' }, {});
    comp.bounds = makeBounds(200, 120);
    const g = comp.render(theme);
    const texts = Array.from(g.querySelectorAll('text'));
    const startAligned = texts.filter(t => t.getAttribute('text-anchor') === 'start');
    expect(startAligned).toHaveLength(3);
    expect(startAligned[0].textContent).toBe('One');
    expect(startAligned[2].textContent).toBe('Three');
  });

  it('handles headerBackgroundColor and headerTextColor overrides', () => {
    const comp = new ClassComponent(
      metadata,
      { label: 'MyClass' },
      { headerBackgroundColor: '#00ff00', headerTextColor: '#ff00ff' }
    );
    comp.bounds = makeBounds(200, 100);
    const g = comp.render(theme);
    
    // There should be three rect elements: background fill, header fill, and outer border stroke
    const rects = Array.from(g.querySelectorAll('rect'));
    expect(rects).toHaveLength(3);
    
    expect(rects[0].getAttribute('fill')).toBe('#1e1e2e'); // outer background fill
    expect(rects[1].getAttribute('fill')).toBe('#00ff00'); // header fill
    expect(rects[1].getAttribute('height')).toBe('36');
    expect(rects[2].getAttribute('fill')).toBe('none'); // border stroke
    expect(rects[2].getAttribute('stroke')).toBe('#45475a');

    // Header text should have the custom headerTextColor
    const texts = Array.from(g.querySelectorAll('text'));
    const titleText = texts.find(t => t.textContent === 'MyClass');
    expect(titleText).toBeDefined();
    expect(titleText!.getAttribute('fill')).toBe('#ff00ff');

    // A separator at y=36 should be present
    const lines = Array.from(g.querySelectorAll('line'));
    const separatorAt36 = lines.find(l => l.getAttribute('y1') === '36');
    expect(separatorAt36).toBeDefined();
  });

  it('renders a type circle marker when headerType is defined', () => {
    const comp = new ClassComponent(
      metadata,
      { label: 'MyAbstractClass', headerType: 'abstract' },
      {}
    );
    comp.bounds = makeBounds(200, 100);
    const g = comp.render(theme);
    
    // There should be a circle element for the header type marker
    const circles = Array.from(g.querySelectorAll('circle'));
    expect(circles).toHaveLength(1);
    const typeCircle = circles[0];
    expect(typeCircle.getAttribute('fill')).toBe('#a5f3fc'); // cyan color for abstract
    expect(typeCircle.getAttribute('r')).toBe('8');
    
    // There should be a text element inside the circle with "A"
    const texts = Array.from(g.querySelectorAll('text'));
    const letterText = texts.find(t => t.textContent === 'A');
    expect(letterText).toBeDefined();
    expect(letterText!.getAttribute('font-weight')).toBe('bold');

    // Title text center should be shifted to the right (+11px from width/2 = 100) -> 111
    const titleText = texts.find(t => t.textContent === 'MyAbstractClass');
    expect(titleText).toBeDefined();
    expect(titleText!.getAttribute('x')).toBe('111');
  });

  it('respects headerTypeColor and headerTypeTextColor overrides', () => {
    const comp = new ClassComponent(
      metadata,
      { label: 'Custom', headerType: 'record' },
      { headerTypeColor: '#ff0000', headerTypeTextColor: '#00ffff' }
    );
    comp.bounds = makeBounds(200, 100);
    const g = comp.render(theme);
    
    const typeCircle = g.querySelector('circle');
    expect(typeCircle!.getAttribute('fill')).toBe('#ff0000');

    const texts = Array.from(g.querySelectorAll('text'));
    const letterText = texts.find(t => t.textContent === 'R');
    expect(letterText).toBeDefined();
    expect(letterText!.getAttribute('fill')).toBe('#00ffff');
  });

  it('adds padding to minimum width calculation for headerType', () => {
    const longLabel = 'A_very_long_title_that_exceeds';
    const compNoType = new ClassComponent(metadata, { label: longLabel }, {});
    const compWithType = new ClassComponent(metadata, { label: longLabel, headerType: 'class' }, {});
    const dimNoType = compNoType.calculateMinDimensions(theme);
    const dimWithType = compWithType.calculateMinDimensions(theme);
    expect(dimWithType.width).toBe(dimNoType.width + 3 * 7.5);
  });
});
