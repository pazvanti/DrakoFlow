// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { ProcessComponent } from '../../src/components/ProcessComponent';
import { ComponentMetadata, ThemeVariables } from '../../src/components/BaseComponent';

describe('ProcessComponent', () => {
  const metadata: ComponentMetadata = { id: 'p1', type: 'Process', tags: [] };
  const theme: ThemeVariables = {
    primaryColor: '#0d6efd',
    secondaryColor: '#6c757d',
    backgroundColor: '#ffffff',
    textColor: '#212529',
    borderColor: '#dee2e6',
    fontFamily: 'sans-serif'
  };

  it('renders three-column process shape with vertical dividers', () => {
    const process = new ProcessComponent(metadata, { label: 'MyComponent' }, {});
    process.bounds = { x: 0, y: 0, width: 200, height: 56 };
    const g = process.render(theme);

    expect(g.querySelector('path')).not.toBeNull();
    expect(g.querySelectorAll('line')).toHaveLength(2);
    expect(g.querySelector('text')?.textContent).toBe('MyComponent');
  });

  it('centers label in the middle panel only', () => {
    const process = new ProcessComponent(metadata, { label: 'Center' }, {});
    process.bounds = { x: 0, y: 0, width: 200, height: 56 };
    const tabW = process.getTabWidth(200);
    const g = process.render(theme);
    const textX = Number(g.querySelector('text')?.getAttribute('x'));
    expect(textX).toBe(tabW + (200 - 2 * tabW) / 2);
  });

  it('uses a full-height rectangular outline', () => {
    const process = new ProcessComponent(metadata, {}, {});
    const d = process.buildProcessOutline(140, 56);
    expect(d).toBe('M 0 0 H 140 V 56 H 0 Z');
  });
});
