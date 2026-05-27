// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { VerticalContainerComponent } from '../../src/components/VerticalContainerComponent';
import { ProcessComponent } from '../../src/components/ProcessComponent';
import { ComponentMetadata, ThemeVariables } from '../../src/components/BaseComponent';

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
});
