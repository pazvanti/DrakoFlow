import { describe, it, expect } from 'vitest';
import { parseDsl, collectReferencedIds } from '../../src/dsl/parser';
import { createComponentsFromDsl } from '../../src/engine/componentFactory';
import { VerticalContainerComponent } from '../../src/components/VerticalContainerComponent';
import { RectangleComponent } from '../../src/components/RectangleComponent';

describe('parseDsl', () => {
  it('parses a single Rectangle component', () => {
    const code = `MyRect: Rectangle {
  label: "Hello"
  rx: 4
}`;
    const nodes = parseDsl(code);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('MyRect');
    expect(nodes[0].type).toBe('Rectangle');
    expect(nodes[0].properties.label).toBe('Hello');
    expect(nodes[0].properties.rx).toBe(4);
  });

  it('parses boolean properties', () => {
    const code = `MyNode: Process {
  label: "Active"
  lifeline: true
  visible: false
}`;
    const nodes = parseDsl(code);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].properties.lifeline).toBe(true);
    expect(nodes[0].properties.visible).toBe(false);
  });

  it('parses themeOverride block', () => {
    const code = `R: Rectangle {
  label: "X"
  themeOverride: {
    backgroundColor: "#111111"
    borderColor: "#222222"
  }
}`;
    const nodes = parseDsl(code);
    expect(nodes[0].themeOverride.backgroundColor).toBe('#111111');
    expect(nodes[0].themeOverride.borderColor).toBe('#222222');
  });

  it('parses VerticalContainer with nested children', () => {
    const code = `Flow: VerticalContainer {
  label: "Pipeline"
  gap: 10
  padding: 8

  P1: Process {
    label: "Start"
  }

  E1: Ellipse {
    label: "End"
    radius: 24
  }
}`;
    const nodes = parseDsl(code);
    expect(nodes[0].childEntries).toHaveLength(2);
    expect(nodes[0].childEntries[0].kind).toBe('inline');
    if (nodes[0].childEntries[0].kind === 'inline') {
      expect(nodes[0].childEntries[0].node.type).toBe('Process');
    }
    expect(nodes[0].properties.gap).toBe(10);
  });

  it('parses a reference to a previously defined component', () => {
    const code = `MyRectangle: Rectangle {
  label: "Interactive Rectangle Component"
  rx: 12
  ry: 12
}

MyContainer: VerticalContainer {
  label: "Container"
  gap: 12
  padding: 16

  Step1: Process {
    label: "Step 1"
  }

  MyRect: MyRectangle
}`;
    const nodes = parseDsl(code);
    expect(nodes).toHaveLength(2);

    const container = nodes[1];
    expect(container.childEntries).toHaveLength(2);
    expect(container.childEntries[0].kind).toBe('inline');
    expect(container.childEntries[1]).toEqual({
      kind: 'reference',
      slotId: 'MyRect',
      refId: 'MyRectangle'
    });

    const refs = collectReferencedIds(nodes);
    expect(refs.has('MyRectangle')).toBe(true);
  });

  it('throws when a component type is referenced without a body', () => {
    const code = `C: VerticalContainer {
  Step: Process
}`;
    expect(() => parseDsl(code)).toThrow(/requires a definition block/);
  });

  it('builds a VerticalContainer with inline and referenced children', () => {
    const code = `MyRectangle: Rectangle {
  label: "Rect"
  rx: 12
  ry: 12
}

MyContainer: VerticalContainer {
  label: "Container"
  gap: 12

  Step1: Process {
    label: "Step 1"
  }

  MyRect: MyRectangle
}`;
    const components = createComponentsFromDsl(parseDsl(code));
    expect(components).toHaveLength(1);
    expect(components[0].id).toBe('MyContainer');

    const container = components[0] as VerticalContainerComponent;
    expect(container.children).toHaveLength(2);
    expect(container.children[0].type).toBe('Process');
    expect(container.children[1]).toBeInstanceOf(RectangleComponent);
    expect(container.children[1].id).toBe('MyRect');
    expect((container.children[1] as RectangleComponent).props.label).toBe('Rect');
  });
  it('parses @tags directive and attaches tags to the following component', () => {
    const code = `
@tags: ["database", "auth"]
Database: Rectangle {
  label: "Database"
  rx: 6
  ry: 6
}`;
    const nodes = parseDsl(code);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('Database');
    expect(nodes[0].tags).toEqual(['database', 'auth']);
  });

  it('strips block comments and parses remaining components correctly', () => {
    const code = `
/**
 * This describes the node.
 **/
MyNode: Process {
  label: "Worker"
}`;
    const nodes = parseDsl(code);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('MyNode');
    expect(nodes[0].properties.label).toBe('Worker');
  });

  it('unescapes backslashes in double-quoted string values', () => {
    const code = `MyNode: Rectangle {
  label: "Hello \\"World\\""
  content: "<svg width=\\"10\\"></svg>"
}`;
    const nodes = parseDsl(code);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].properties.label).toBe('Hello "World"');
    expect(nodes[0].properties.content).toBe('<svg width="10"></svg>');
  });

  it('parses a component with url property', () => {
    const code = `MyNode: Process {
  label: "LinkNode"
  url: "https://example.com"
}`;
    const nodes = parseDsl(code);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].properties.url).toBe('https://example.com');

    const components = createComponentsFromDsl(nodes);
    expect(components).toHaveLength(1);
    expect(components[0].url).toBe('https://example.com');
  });
});

