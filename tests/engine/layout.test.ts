import { describe, it, expect } from 'vitest';
import { assignLayers, layoutRootComponents } from '../../src/engine/layout';
import { RectangleComponent } from '../../src/components/RectangleComponent';
import { VerticalContainerComponent } from '../../src/components/VerticalContainerComponent';
import { ThemeVariables } from '../../src/components/BaseComponent';

describe('assignLayers', () => {
  it('places targets in later layers than sources', () => {
    const a = new RectangleComponent({ id: 'A', type: 'Rectangle', tags: [] }, {}, {});
    const b = new RectangleComponent({ id: 'B', type: 'Rectangle', tags: [] }, {}, {});
    const c = new RectangleComponent({ id: 'C', type: 'Rectangle', tags: [] }, {}, {});

    const layers = assignLayers([a, b, c], [
      { sourceId: 'A', targetId: 'B' },
      { sourceId: 'B', targetId: 'C' }
    ]);
    expect(layers.get('A')).toBe(0);
    expect(layers.get('B')).toBe(1);
    expect(layers.get('C')).toBe(2);
  });

  it('terminates and handles cyclic references without infinite loops', () => {
    const a = new RectangleComponent({ id: 'A', type: 'Rectangle', tags: [] }, {}, {});
    const b = new RectangleComponent({ id: 'B', type: 'Rectangle', tags: [] }, {}, {});

    const layers = assignLayers([a, b], [
      { sourceId: 'A', targetId: 'B' },
      { sourceId: 'B', targetId: 'A' }
    ]);
    expect(layers.get('A')).toBeDefined();
    expect(layers.get('B')).toBeDefined();
  });
});

describe('layoutRootComponents', () => {
  const defaultTheme: ThemeVariables = {
    primaryColor: '#0d6efd',
    secondaryColor: '#6c757d',
    backgroundColor: '#ffffff',
    textColor: '#212529',
    borderColor: '#dee2e6',
    fontFamily: 'sans-serif'
  };

  it('arranges root components horizontally in their written order', () => {
    const a = new RectangleComponent({ id: 'A', type: 'Rectangle', tags: [] }, {}, {});
    const b = new RectangleComponent({ id: 'B', type: 'Rectangle', tags: [] }, {}, {});
    const c = new RectangleComponent({ id: 'C', type: 'Rectangle', tags: [] }, {}, {});

    layoutRootComponents([a, b, c], defaultTheme, []);

    expect(a.bounds.x).toBe(80);
    expect(a.bounds.y).toBe(80);

    expect(b.bounds.x).toBe(80 + 100 + 140); // 320
    expect(b.bounds.y).toBe(80);

    expect(c.bounds.x).toBe(320 + 100 + 140); // 560
    expect(c.bounds.y).toBe(80);
  });

  it('staggers node Y positions to resolve arrow intersections', () => {
    const a = new RectangleComponent({ id: 'A', type: 'Rectangle', tags: [] }, {}, {});
    const b = new RectangleComponent({ id: 'B', type: 'Rectangle', tags: [] }, {}, {});
    const c = new RectangleComponent({ id: 'C', type: 'Rectangle', tags: [] }, {}, {});

    const relationships = [
      { sourceId: 'A', targetId: 'B' },
      { sourceId: 'B', targetId: 'C' },
      { sourceId: 'C', targetId: 'A', bidirectional: true }
    ];

    layoutRootComponents([a, b, c], defaultTheme, relationships);

    // a and b can stay at y=80 since A->B does not cross anything else
    expect(a.bounds.y).toBe(80);
    expect(b.bounds.y).toBe(80);
    // c should be shifted down to avoid C<->A crossing through B
    expect(c.bounds.y).toBeGreaterThan(80);
  });

  it('increases vertical gap between adjacent components in the same layer when they have a relationship', () => {
    const a = new RectangleComponent({ id: 'A', type: 'Rectangle', tags: [] }, {}, {});
    const c = new RectangleComponent({ id: 'C', type: 'Rectangle', tags: [] }, {}, {});
    const b = new RectangleComponent({ id: 'B', type: 'Rectangle', tags: [] }, {}, {});

    // A -> B
    // C <-> A
    // This places A and C in Layer 0, B in Layer 1
    const relationships = [
      { sourceId: 'A', targetId: 'B' },
      { sourceId: 'C', targetId: 'A', bidirectional: true }
    ];

    layoutRootComponents([a, c, b], defaultTheme, relationships);

    const aHeight = a.bounds.height; // A's height is 64 due to connection ports spacing
    expect(a.bounds.y).toBe(80);
    // C is directly below A, so its y coordinate includes:
    // start (80) + A's height (64) + default gap (36) + extra gap (50) = 230
    expect(c.bounds.y).toBe(80 + aHeight + 36 + 50);
  });

  it('resolves nested child relationships to parent container and applies barycenter heuristic', () => {
    const parentContainer = new VerticalContainerComponent({ id: 'MyContainer', type: 'VerticalContainer', tags: [] }, {}, {});
    const child1 = new RectangleComponent({ id: 'Step1', type: 'Rectangle', tags: [] }, {}, {});
    parentContainer.children = [child1];

    const database = new RectangleComponent({ id: 'Database', type: 'Rectangle', tags: [] }, {}, {});

    const relationships = [
      { sourceId: 'Database', targetId: 'Step1' }
    ];

    layoutRootComponents([parentContainer, database], defaultTheme, relationships);

    expect(database.bounds.x).toBe(80);
    expect(parentContainer.bounds.x).toBeGreaterThan(80);
  });

  it('breaks cycles to keep components close to their forward layer positions', () => {
    const client = new RectangleComponent({ id: 'Client', type: 'Rectangle', tags: [] }, {}, {});
    const server = new RectangleComponent({ id: 'Server', type: 'Rectangle', tags: [] }, {}, {});
    const database = new RectangleComponent({ id: 'Database', type: 'Rectangle', tags: [] }, {}, {});
    const container2 = new RectangleComponent({ id: 'Container2', type: 'Rectangle', tags: [] }, {}, {});

    const relationships = [
      { sourceId: 'Client', targetId: 'Server' },
      { sourceId: 'Server', targetId: 'Database' },
      { sourceId: 'Database', targetId: 'Server' },
      { sourceId: 'Server', targetId: 'Client' },
      { sourceId: 'Container2', targetId: 'Client' }
    ];

    const layers = assignLayers([client, server, database, container2], relationships);

    expect(layers.get('Container2')).toBe(0);
    expect(layers.get('Client')).toBe(1);
    expect(layers.get('Server')).toBe(2);
    expect(layers.get('Database')).toBe(3);
  });

  it('places lifeline components in separate layers to avoid vertical stacking and overlaps', () => {
    const a = new RectangleComponent({ id: 'A', type: 'Rectangle', tags: [] }, {}, {});
    a.lifeline = true;
    const b = new RectangleComponent({ id: 'B', type: 'Rectangle', tags: [] }, {}, {});
    b.lifeline = true;
    const c = new RectangleComponent({ id: 'C', type: 'Rectangle', tags: [] }, {}, {});
    c.lifeline = true;

    const relationships = [
      { sourceId: 'A', targetId: 'B' },
      { sourceId: 'A', targetId: 'C' }
    ];

    const layers = assignLayers([a, b, c], relationships);
    
    // Each lifeline component should be in its own unique layer
    expect(layers.get('A')).not.toBe(layers.get('B'));
    expect(layers.get('B')).not.toBe(layers.get('C'));
    expect(layers.get('A')).not.toBe(layers.get('C'));

    // They should be laid out horizontally at the same vertical level
    layoutRootComponents([a, b, c], defaultTheme, relationships);
    expect(a.bounds.y).toBe(80);
    expect(b.bounds.y).toBe(80);
    expect(c.bounds.y).toBe(80);
  });

  it('respects manual position overrides on components', () => {
    const a = new RectangleComponent({ id: 'A', type: 'Rectangle', tags: [] }, {}, {});
    a.manualX = 150;
    a.manualY = 250;
    const b = new RectangleComponent({ id: 'B', type: 'Rectangle', tags: [] }, {}, {});

    layoutRootComponents([a, b], defaultTheme, []);

    expect(a.bounds.x).toBe(150);
    expect(a.bounds.y).toBe(250);
    expect(b.bounds.y).toBe(80);
  });

  it('arranges root components vertically when using top-to-bottom layout (no relationships)', () => {
    const a = new RectangleComponent({ id: 'A', type: 'Rectangle', tags: [] }, {}, {});
    const b = new RectangleComponent({ id: 'B', type: 'Rectangle', tags: [] }, {}, {});
    const c = new RectangleComponent({ id: 'C', type: 'Rectangle', tags: [] }, {}, {});

    layoutRootComponents([a, b, c], defaultTheme, [], 'top-to-bottom');

    expect(a.bounds.x).toBe(80);
    expect(a.bounds.y).toBe(80);

    expect(b.bounds.x).toBe(80);
    expect(b.bounds.y).toBe(80 + 60 + 140); // 280 (minHeight of Rectangle is 60, ROW_GAP is 140)

    expect(c.bounds.x).toBe(80);
    expect(c.bounds.y).toBe(280 + 60 + 140); // 480
  });

  it('arranges components vertically top-to-bottom with relationships', () => {
    const a = new RectangleComponent({ id: 'A', type: 'Rectangle', tags: [] }, {}, {});
    const b = new RectangleComponent({ id: 'B', type: 'Rectangle', tags: [] }, {}, {});

    const relationships = [
      { sourceId: 'A', targetId: 'B' }
    ];

    layoutRootComponents([a, b], defaultTheme, relationships, 'top-to-bottom');

    expect(a.bounds.y).toBe(80);
    expect(b.bounds.y).toBeGreaterThan(a.bounds.y + a.bounds.height);
    // They should align vertically (same X)
    expect(a.bounds.x).toBe(80);
    expect(b.bounds.x).toBe(80);
  });
});
