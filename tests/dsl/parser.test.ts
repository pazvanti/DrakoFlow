// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { parseDsl, collectReferencedIds, parseDslDocument } from '../../src/dsl/parser';
import { createComponentsFromDsl } from '../../src/engine/componentFactory';
import { renderRelationships } from '../../src/engine/relationshipRenderer';
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
      refId: 'MyRectangle',
      line: 16
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

  it('parses a component with lineWidth and shadow properties', () => {
    const code = `MyNode: Process {
  label: "StyledNode"
  lineWidth: 4
  shadow: true
}`;
    const nodes = parseDsl(code);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].properties.lineWidth).toBe(4);
    expect(nodes[0].properties.shadow).toBe(true);

    const components = createComponentsFromDsl(nodes);
    expect(components).toHaveLength(1);
    expect(components[0].lineWidth).toBe(4);
    expect(components[0].shadow).toBe(true);
  });

  it('parses arrays and maps Table component correctly', () => {
    const code = `MyTable: Table {
  header: { "H 1", "H 2" }
  rows: {
    { "R1C1", "R1C2" }
    { "R2C1", "R2C2" }
  }
  headerAtTop: true
  headerAtBottom: false
}`;
    const nodes = parseDsl(code);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].properties.header).toEqual(['H 1', 'H 2']);
    expect(nodes[0].properties.rows).toEqual([
      ['R1C1', 'R1C2'],
      ['R2C1', 'R2C2']
    ]);
    expect(nodes[0].properties.headerAtTop).toBe(true);
    expect(nodes[0].properties.headerAtBottom).toBe(false);

    const components = createComponentsFromDsl(nodes);
    expect(components).toHaveLength(1);
    expect(components[0].type).toBe('Table');
  });

  it('parses relationship arrows with rhombus heads -<> and <>-', () => {
    const code = `
A: Rectangle {}
B: Rectangle {}
A -<> B
B <>- A
A <>-<> B
A <>-> B
A <-<> B
A <>-o B
`;
    const doc = parseDslDocument(code);
    expect(doc.relationships).toHaveLength(6);
    
    // 1. A -<> B
    expect(doc.relationships[0].sourceId).toBe('A');
    expect(doc.relationships[0].targetId).toBe('B');
    expect(doc.relationships[0].sourceRhombus).toBe(false);
    expect(doc.relationships[0].targetRhombus).toBe(true);
    expect(doc.relationships[0].simple).toBe(true);

    // 2. B <>- A
    expect(doc.relationships[1].sourceId).toBe('B');
    expect(doc.relationships[1].targetId).toBe('A');
    expect(doc.relationships[1].sourceRhombus).toBe(true);
    expect(doc.relationships[1].targetRhombus).toBe(false);
    expect(doc.relationships[1].simple).toBe(true);

    // 3. A <>-<> B
    expect(doc.relationships[2].sourceId).toBe('A');
    expect(doc.relationships[2].targetId).toBe('B');
    expect(doc.relationships[2].sourceRhombus).toBe(true);
    expect(doc.relationships[2].targetRhombus).toBe(true);
    expect(doc.relationships[2].simple).toBe(true);

    // 4. A <>-> B
    expect(doc.relationships[3].sourceId).toBe('A');
    expect(doc.relationships[3].targetId).toBe('B');
    expect(doc.relationships[3].sourceRhombus).toBe(true);
    expect(doc.relationships[3].targetRhombus).toBe(false);
    expect(doc.relationships[3].simple).toBe(false); // since it has a target arrow head '>'

    // 5. A <-<> B (reverse arrow '<' and rhombus '<>')
    expect(doc.relationships[4].sourceId).toBe('B'); // B is source because reverse is true
    expect(doc.relationships[4].targetId).toBe('A'); // A is target because reverse is true
    expect(doc.relationships[4].sourceRhombus).toBe(true); // rhombus at B (rightPart)
    expect(doc.relationships[4].targetRhombus).toBe(false); // arrow at A (leftPart)
    expect(doc.relationships[4].simple).toBe(false);

    // 6. A <>-o B (rhombus '<>' and circle 'o')
    expect(doc.relationships[5].sourceId).toBe('A');
    expect(doc.relationships[5].targetId).toBe('B');
    expect(doc.relationships[5].sourceRhombus).toBe(true);
    expect(doc.relationships[5].targetCircle).toBe(true);
    expect(doc.relationships[5].simple).toBe(true);
  });

  it('parses relationship style block with thickness and routeType', () => {
    const code = `
A: Rectangle {}
B: Rectangle {}
A -> B {
  thickness: 4
  routeType: curved
}
B -> A {
  thickness: "5"
  routeType: "orthogonal"
}
`;
    const doc = parseDslDocument(code);
    expect(doc.relationships).toHaveLength(2);

    expect(doc.relationships[0].style?.thickness).toBe(4);
    expect(doc.relationships[0].style?.routeType).toBe('curved');

    expect(doc.relationships[1].style?.thickness).toBe(5);
    expect(doc.relationships[1].style?.routeType).toBe('orthogonal');
  });

  describe('error line numbers', () => {
    it('sets the line number for unexpected syntax errors at the top level', () => {
      const code = `A: Rectangle {}
B: Rectangle {}
Invalid Syntax Line Here
C: Rectangle {}`;
      let error: any = null;
      try {
        parseDslDocument(code);
      } catch (err) {
        error = err;
      }
      expect(error).not.toBeNull();
      expect(error.line).toBe(3);
    });

    it('sets the line number for component errors inside bodies', () => {
      const code = `A: Rectangle {}
B: Rectangle {
  nested: InvalidType {
    label: "Error"
  }
}`;
      let error: any = null;
      try {
        parseDslDocument(code);
      } catch (err) {
        error = err;
      }
      expect(error).not.toBeNull();
      expect(error.line).toBe(3);
    });

    it('sets the line number for unclosed block errors', () => {
      const code = `A: Rectangle {}
B: Rectangle {
  label: "Unclosed"
  // missing closing brace`;
      let error: any = null;
      try {
        parseDslDocument(code);
      } catch (err) {
        error = err;
      }
      expect(error).not.toBeNull();
      expect(error.line).toBe(2); // open brace is on line 2
    });

    it('sets the line number for unknown component type errors inside body during instantiation', () => {
      const code = `A: Rectangle {}
B: UnknownType {
  label: "Test"
}`;
      let error: any = null;
      try {
        const doc = parseDslDocument(code);
        createComponentsFromDsl(doc.components);
      } catch (err) {
        error = err;
      }
      expect(error).not.toBeNull();
      expect(error.line).toBe(2);
    });

    it('sets the line number for missing component references inside vertical containers', () => {
      const code = `A: Rectangle {}
B: VerticalContainer {
  child: MissingComponent
}`;
      let error: any = null;
      try {
        const doc = parseDslDocument(code);
        createComponentsFromDsl(doc.components);
      } catch (err) {
        error = err;
      }
      expect(error).not.toBeNull();
      expect(error.line).toBe(3);
    });

    it('sets the line number for relationship references to unknown components', () => {
      const code = `A: Rectangle {}
B: Rectangle {}
A -> MissingComp : "Sends message"`;
      let error: any = null;
      try {
        const doc = parseDslDocument(code);
        const components = createComponentsFromDsl(doc.components);
        const svgRoot = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
        renderRelationships(doc.relationships, components, {
          primaryColor: '#0d6efd',
          secondaryColor: '#6c757d',
          backgroundColor: '#ffffff',
          textColor: '#212529',
          borderColor: '#dee2e6',
          fontFamily: 'sans-serif'
        }, svgRoot);
      } catch (err) {
        error = err;
      }
      expect(error).not.toBeNull();
      expect(error.line).toBe(3);
    });
  });
});

