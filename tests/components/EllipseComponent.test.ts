// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { EllipseComponent } from '../../src/components/EllipseComponent';
import { ComponentMetadata, ThemeVariables } from '../../src/components/BaseComponent';

describe('EllipseComponent', () => {
  const metadata: ComponentMetadata = { id: 'e1', type: 'Ellipse', tags: [] };
  const theme: ThemeVariables = {
    primaryColor: '#0d6efd',
    secondaryColor: '#6c757d',
    backgroundColor: '#ffffff',
    textColor: '#212529',
    borderColor: '#dee2e6',
    fontFamily: 'sans-serif'
  };

  it('renders a circle when radius is set', () => {
    const ellipse = new EllipseComponent(metadata, { label: 'Node', radius: 30 }, {});
    ellipse.bounds = { x: 0, y: 0, width: 100, height: 100 };
    const g = ellipse.render(theme);
    const el = g.querySelector('ellipse');
    expect(el?.getAttribute('rx')).toBe('30');
    expect(el?.getAttribute('ry')).toBe('30');
  });
});
