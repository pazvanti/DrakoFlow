// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { VerticalContainerComponent } from '../../src/components/VerticalContainerComponent';
import { ProcessComponent } from '../../src/components/ProcessComponent';
import { ComponentMetadata, ThemeVariables, setCurrentLayoutAlgorithm } from '../../src/components/BaseComponent';
import { parseDslDocument } from '../../src/dsl/parser';
import { createComponentsFromDsl } from '../../src/engine/componentFactory';
import { layoutRootComponents } from '../../src/engine/layout';

describe('VerticalContainerComponent', () => {
  const metadata: ComponentMetadata = { id: 'vc1', type: 'VerticalContainer', tags: [] };
  const theme: ThemeVariables = {
    primaryColor: '#0d6efd',
    secondaryColor: '#6c757d',
    backgroundColor: '#ffffff',
    textColor: '#212529',
    borderColor: '#dee2e6',
    fontFamily: 'sans-serif'
  };

  it('sizes itself to fit stacked children', () => {
    const childMeta: ComponentMetadata = { id: 'c1', type: 'Process', tags: [] };
    const child = new ProcessComponent(childMeta, { label: 'Step' }, {});
    const container = new VerticalContainerComponent(metadata, { gap: 10, padding: 8 }, {});
    container.children = [child];

    const dims = container.calculateMinDimensions(theme);
    expect(dims.height).toBeGreaterThan(56);
    expect(dims.width).toBeGreaterThan(100);
  });

  it('renders children inside the container group', () => {
    const childMeta: ComponentMetadata = { id: 'c1', type: 'Process', tags: [] };
    const child = new ProcessComponent(childMeta, { label: 'A' }, {});
    const container = new VerticalContainerComponent(metadata, {}, {});
    container.children = [child];
    container.bounds = { x: 10, y: 10, width: 200, height: 120 };
    container.layoutChildren(theme);

    const g = container.render(theme);
    expect(g.querySelector('rect')).not.toBeNull();
    expect(g.querySelector('#c1')).not.toBeNull();
    expect(g.querySelector('#c1 path')).not.toBeNull();
  });

  it('arranges children horizontally if left-to-right layout and any child has lifeline: true', () => {
    setCurrentLayoutAlgorithm('left-to-right');

    const childMeta1: ComponentMetadata = { id: 'c1', type: 'Process', tags: [] };
    const child1 = new ProcessComponent(childMeta1, { label: 'A' }, {});
    child1.lifeline = true;

    const childMeta2: ComponentMetadata = { id: 'c2', type: 'Process', tags: [] };
    const child2 = new ProcessComponent(childMeta2, { label: 'B' }, {});
    child2.lifeline = true;

    const container = new VerticalContainerComponent(metadata, { gap: 10, padding: 8 }, {});
    container.children = [child1, child2];

    const childDim1 = child1.calculateMinDimensions(theme);
    const childDim2 = child2.calculateMinDimensions(theme);

    const dims = container.calculateMinDimensions(theme);
    expect(dims.width).toBe(childDim1.width + childDim2.width + 10 + 8 * 2);
    expect(dims.height).toBe(Math.max(childDim1.height, childDim2.height) + 8 * 2);

    container.bounds = { x: 10, y: 10, width: dims.width, height: dims.height };
    container.layoutChildren(theme);

    expect(child1.bounds.x).toBe(8);
    expect(child2.bounds.x).toBe(8 + childDim1.width + 10);

    setCurrentLayoutAlgorithm('left-to-right');
  });

  it('arranges children horizontally if they have lifelines and layout algorithm is left-to-right', () => {
    const dsl = `
      serveur_play_2: Package {
        label: "Serveur Play"
        controler: Rectangle {
          label: "controler"
          lifeline: true
        }
        secure: Rectangle {
          label: "secure"
          lifeline: true
        }
        security: Rectangle {
          label: "security"
          lifeline: true
        }
      }
    `;

    const doc = parseDslDocument(dsl);
    const comps = createComponentsFromDsl(doc.components);
    layoutRootComponents(comps, theme, doc.relationships, 'left-to-right');

    const pkg = comps[0];
    const controler = pkg.children.find(c => c.id === 'controler');
    const secure = pkg.children.find(c => c.id === 'secure');
    const security = pkg.children.find(c => c.id === 'security');

    expect(controler).toBeDefined();
    expect(secure).toBeDefined();
    expect(security).toBeDefined();

    console.log("controler bounds:", controler.bounds);
    console.log("secure bounds:", secure.bounds);
    console.log("security bounds:", security.bounds);

    expect(controler.bounds.x).toBeLessThan(secure.bounds.x);
    expect(secure.bounds.x).toBeLessThan(security.bounds.x);
  });
});


