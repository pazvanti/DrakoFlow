// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { parseDslDocument } from '../../src/dsl/parser';
import { createComponentsFromDsl } from '../../src/engine/componentFactory';
import { EngineRegistry } from '../../src/engine/EngineRegistry';
import { MindmapEngine } from '../../src/engine/mindmap/MindmapEngine';
import { MindmapRenderer } from '../../src/engine/mindmap/MindmapRenderer';
import { determineRootComponent, computeMindmapLayout } from '../../src/engine/mindmap/MindmapLayout';
import { ThemeVariables } from '../../src/components/BaseComponent';

const mockTheme: ThemeVariables = {
  primaryColor: '#60a5fa',
  secondaryColor: '#a1a1aa',
  backgroundColor: '#18181b',
  textColor: '#f4f4f5',
  borderColor: '#52525b',
  fontFamily: 'Outfit, sans-serif'
};

describe('MindmapEngine', () => {
  it('detects mindmap layout directive with and without parameters', () => {
    const engine = new MindmapEngine();

    const doc1 = parseDslDocument('@layout: mindmap\nRoot: Ellipse { label: "Root" }');
    expect(engine.canHandle(doc1, doc1.layout)).toBe(true);

    const doc2 = parseDslDocument('@layout: mindmap(SpecialServer)\nSpecialServer: Cube { label: "Special" }\nChild: Rectangle { label: "Child" }\nSpecialServer -> Child');
    expect(engine.canHandle(doc2, doc2.layout)).toBe(true);

    const doc3 = parseDslDocument('@layout: left-to-right\nA: Rectangle { label: "A" }');
    expect(engine.canHandle(doc3, doc3.layout)).toBe(false);
  });

  it('EngineRegistry resolves MindmapEngine for mindmap layouts', () => {
    const doc = parseDslDocument('@layout: mindmap\nCentral: Ellipse { label: "Center" }');
    const engine = EngineRegistry.getInstance().getEngine(doc, doc.layout);
    expect(engine.id).toBe('mindmap');
  });

  it('determines root component explicitly from @layout: mindmap(RootId)', () => {
    const dsl = `
@layout: mindmap(TargetRoot)

NodeA: Rectangle { label: "Node A" }
TargetRoot: Ellipse { label: "Target Root" }
NodeB: Rectangle { label: "Node B" }
NodeC: Rectangle { label: "Node C" }

NodeA -> NodeB
NodeA -> NodeC
TargetRoot -> NodeA
`;
    const doc = parseDslDocument(dsl);
    const components = createComponentsFromDsl(doc.components);

    const root = determineRootComponent(components, doc.relationships, doc.layout);
    expect(root.id).toBe('TargetRoot');
  });

  it('automatically detects the node with the highest degree as the root when no parameter is given', () => {
    const dsl = `
@layout: mindmap

SubTopicA: Rectangle { label: "Sub A" }
CenterHub: Ellipse { label: "Central Hub" }
SubTopicB: Rectangle { label: "Sub B" }
SubTopicC: Rectangle { label: "Sub C" }

CenterHub -> SubTopicA
CenterHub -> SubTopicB
CenterHub -> SubTopicC
SubTopicA -> SubTopicB
`;
    const doc = parseDslDocument(dsl);
    const components = createComponentsFromDsl(doc.components);

    const root = determineRootComponent(components, doc.relationships, doc.layout);
    expect(root.id).toBe('CenterHub');
  });

  it('computes radial layout, branch colors, and bounding box for a multi-branch tree', () => {
    const dsl = `
@layout: mindmap

mindmap: Ellipse { label: "mindmap" }
Research: Rectangle { label: "Research" }
Tools: Rectangle { label: "Tools" }
Origins: Rectangle { label: "Origins" }
Uses: Rectangle { label: "Uses" }
PenPaper: Rectangle { label: "Pen and paper" }
History: Rectangle { label: "Long history" }

mindmap -> Research
Research -> Uses
mindmap -> Tools
Tools -> PenPaper
mindmap -> Origins
Origins -> History
`;
    const doc = parseDslDocument(dsl);
    const components = createComponentsFromDsl(doc.components);

    const layout = computeMindmapLayout(components, doc.relationships, mockTheme, doc.layout);

    expect(layout.rootNode.component.id).toBe('mindmap');
    expect(layout.allNodes.length).toBe(7);
    expect(layout.treeEdges.length).toBe(6);
    expect(layout.bbox.width).toBeGreaterThan(300);
    expect(layout.bbox.height).toBeGreaterThan(300);

    // Verify main branches received distinct branch colors
    const researchNode = layout.allNodes.find(n => n.component.id === 'Research');
    const toolsNode = layout.allNodes.find(n => n.component.id === 'Tools');
    const originsNode = layout.allNodes.find(n => n.component.id === 'Origins');

    expect(researchNode).toBeDefined();
    expect(toolsNode).toBeDefined();
    expect(originsNode).toBeDefined();
    expect(researchNode?.branchColor).not.toBe(toolsNode?.branchColor);
  });

  it('renders SVG mindmap layers, curved paths, and handles bi-directional hover', () => {
    const dsl = `
@layout: mindmap

CentralIdea: Ellipse { label: "Central Idea" }
Topic1: Process { label: "Topic 1" }
Topic2: Cube { label: "Topic 2" }
Topic3: Cylinder { label: "Topic 3" }

CentralIdea -> Topic1 : "Branch A"
CentralIdea -> Topic2 : "Branch B"
Topic2 -> Topic3
Topic1 -> Topic3 // Cross-link
`;
    const doc = parseDslDocument(dsl);
    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const viewportG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svgElement.appendChild(viewportG);

    const hoveredNodes: Array<string | null> = [];
    const engine = new MindmapEngine();

    const result = engine.render({
      document: doc,
      displayComponents: doc.components,
      displayRelationships: doc.relationships,
      theme: mockTheme,
      themeName: 'drako-dark',
      isDiagramLocked: false,
      viewportG,
      svgElement,
      onComponentHover: (id) => hoveredNodes.push(id)
    });

    expect(result.engineId).toBe('mindmap');
    expect(result.componentsCount).toBe(4);
    expect(result.relationshipsCount).toBe(4);

    const mindmapDiagramG = viewportG.querySelector('.mindmap-diagram');
    expect(mindmapDiagramG).not.toBeNull();

    const branchPaths = viewportG.querySelectorAll('.mindmap-branch-path');
    expect(branchPaths.length).toBe(3);

    const crossLinks = viewportG.querySelectorAll('.mindmap-crosslink-path');
    expect(crossLinks.length).toBe(1);

    const renderedNodes = viewportG.querySelectorAll('.diagram-component');
    expect(renderedNodes.length).toBe(4);

    // Test hover event
    const firstNode = renderedNodes[0] as SVGElement;
    firstNode.dispatchEvent(new MouseEvent('mouseenter'));
    expect(hoveredNodes.length).toBeGreaterThan(0);
  });

  it('supports manual position overrides x and y in mindmap layout without shifting', () => {
    const dsl = `
@layout: mindmap

Root: Ellipse {
  label: "Root"
  x: 250
  y: 180
}
ChildA: Rectangle {
  label: "Child A"
  x: 20
  y: 35
}
ChildB: Rectangle {
  label: "Child B"
  x: 500
  y: 400
}

Root -> ChildA
Root -> ChildB
`;
    const doc = parseDslDocument(dsl);
    const components = createComponentsFromDsl(doc.components);
    const layout = computeMindmapLayout(components, doc.relationships, mockTheme, doc.layout);

    const root = layout.components.find(c => c.id === 'Root');
    const childA = layout.components.find(c => c.id === 'ChildA');
    const childB = layout.components.find(c => c.id === 'ChildB');

    // Exact preservation of coordinates where user dropped them
    expect(root?.bounds.x).toBe(250);
    expect(root?.bounds.y).toBe(180);
    expect(childA?.bounds.x).toBe(20);
    expect(childA?.bounds.y).toBe(35);
    expect(childB?.bounds.x).toBe(500);
    expect(childB?.bounds.y).toBe(400);
  });

  it('updates branch paths in real-time via MindmapRenderer.updatePaths', () => {
    const dsl = `@layout: mindmap\nRoot: Ellipse { label: "Root" }\nChild: Rectangle { label: "Child" }\nRoot -> Child`;
    const doc = parseDslDocument(dsl);
    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const viewportG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svgElement.appendChild(viewportG);

    const engine = new MindmapEngine();
    const result = engine.render({
      document: doc,
      displayComponents: doc.components,
      displayRelationships: doc.relationships,
      theme: mockTheme,
      themeName: 'drako-dark',
      isDiagramLocked: false,
      viewportG,
      svgElement
    });

    const initialPath = viewportG.querySelector('.mindmap-branch-path')?.getAttribute('d');
    expect(initialPath).toBeDefined();

    // Simulate drag movement
    const child = result.components.find(c => c.id === 'Child');
    child!.bounds.x += 100;
    child!.bounds.y += 50;

    MindmapRenderer.updatePaths(result.layoutResult, viewportG, mockTheme);

    const updatedPath = viewportG.querySelector('.mindmap-branch-path')?.getAttribute('d');
    expect(updatedPath).toBeDefined();
    expect(updatedPath).not.toBe(initialPath);
  });
});
