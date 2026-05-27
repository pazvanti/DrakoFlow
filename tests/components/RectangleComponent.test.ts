// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { RectangleComponent, RectangleProps } from '../../src/components/RectangleComponent';
import { ComponentMetadata, ThemeVariables } from '../../src/components/BaseComponent';

describe('RectangleComponent', () => {
  const metadata: ComponentMetadata = {
    id: 'rect1',
    type: 'Rectangle',
    tags: ['ui', 'shape']
  };

  const defaultTheme: ThemeVariables = {
    primaryColor: '#0d6efd',
    secondaryColor: '#6c757d',
    backgroundColor: '#ffffff',
    textColor: '#212529',
    borderColor: '#dee2e6',
    fontFamily: 'sans-serif'
  };

  it('should instantiate successfully with valid parameters', () => {
    const props: RectangleProps = { label: 'My Rectangle' };
    const override = { backgroundColor: '#ff0000' };
    const rect = new RectangleComponent(metadata, props, override);
    
    expect(rect.id).toBe('rect1');
    expect(rect.type).toBe('Rectangle');
    expect(rect.tags).toEqual(['ui', 'shape']);
    expect(rect.props.label).toBe('My Rectangle');
    expect(rect.themeOverride.backgroundColor).toBe('#ff0000');
  });

  it('should validate props correctly', () => {
    // Valid props should not throw
    const rect1 = new RectangleComponent(metadata, { label: 'Valid' }, {});
    expect(() => rect1.validateProps()).not.toThrow();

    const rect2 = new RectangleComponent(metadata, {}, {});
    expect(() => rect2.validateProps()).not.toThrow();

    // Invalid label type should throw
    const rectInvalidLabel = new RectangleComponent(metadata, { label: 123 as any }, {});
    expect(() => rectInvalidLabel.validateProps()).toThrow("must be a string");

    // Invalid rx type should throw
    const rectInvalidRx = new RectangleComponent(metadata, { rx: 'ten' as any }, {});
    expect(() => rectInvalidRx.validateProps()).toThrow("must be a number");

    // Invalid ry type should throw
    const rectInvalidRy = new RectangleComponent(metadata, { ry: 'ten' as any }, {});
    expect(() => rectInvalidRy.validateProps()).toThrow("must be a number");
  });

  it('should calculate minimum dimensions based on label length', () => {
    // Without label
    const rectNoLabel = new RectangleComponent(metadata, {}, {});
    const dimsNoLabel = rectNoLabel.calculateMinDimensions(defaultTheme);
    expect(dimsNoLabel.width).toBe(100);
    expect(dimsNoLabel.height).toBe(60);

    // With short label
    const rectShortLabel = new RectangleComponent(metadata, { label: 'Short' }, {});
    const dimsShortLabel = rectShortLabel.calculateMinDimensions(defaultTheme);
    expect(dimsShortLabel.width).toBe(100); // 5 * 8 + 30 = 70, so max(100, 70) = 100
    expect(dimsShortLabel.height).toBe(60);

    // With long label
    const rectLongLabel = new RectangleComponent(metadata, { label: 'This is a very long label inside the rectangle' }, {});
    const dimsLongLabel = rectLongLabel.calculateMinDimensions(defaultTheme);
    // 46 chars * 8 + 30 = 368 + 30 = 398
    expect(dimsLongLabel.width).toBe(398);
    expect(dimsLongLabel.height).toBe(60);
  });

  it('should render SVG element correctly', () => {
    const props: RectangleProps = { label: 'Hello SVG', rx: 5, ry: 5 };
    const override = { backgroundColor: '#f0f0f0', borderColor: '#ff0000', textColor: '#0000ff' };
    const rect = new RectangleComponent(metadata, props, override);
    
    rect.bounds = { x: 50, y: 100, width: 250, height: 120 };
    
    const svgElement = rect.render(defaultTheme);
    
    expect(svgElement.tagName.toLowerCase()).toBe('g');
    expect(svgElement.getAttribute('id')).toBe('rect1');
    expect(svgElement.getAttribute('transform')).toBe('translate(50, 100)');
    
    // Check rect element
    const rectChild = svgElement.querySelector('rect');
    expect(rectChild).not.toBeNull();
    expect(rectChild?.getAttribute('width')).toBe('250');
    expect(rectChild?.getAttribute('height')).toBe('120');
    expect(rectChild?.getAttribute('fill')).toBe('#f0f0f0'); // from override
    expect(rectChild?.getAttribute('stroke')).toBe('#ff0000'); // from override
    expect(rectChild?.getAttribute('stroke-width')).toBe('2'); // default override
    expect(rectChild?.getAttribute('rx')).toBe('5');
    expect(rectChild?.getAttribute('ry')).toBe('5');
    
    // Check text element
    const textChild = svgElement.querySelector('text');
    expect(textChild).not.toBeNull();
    expect(textChild?.getAttribute('x')).toBe('125'); // 250 / 2
    expect(textChild?.getAttribute('y')).toBe('60'); // 120 / 2
    expect(textChild?.getAttribute('fill')).toBe('#0000ff'); // from override
    expect(textChild?.getAttribute('font-family')).toBe('sans-serif'); // from theme
    expect(textChild?.getAttribute('text-anchor')).toBe('middle');
    expect(textChild?.getAttribute('dominant-baseline')).toBe('central');
    expect(textChild?.textContent).toBe('Hello SVG');
  });

  it('should fall back to theme defaults when overrides are missing', () => {
    const props: RectangleProps = { label: 'Fallback Test' };
    const rect = new RectangleComponent(metadata, props, {});
    
    rect.bounds = { x: 0, y: 0, width: 200, height: 100 };
    const svgElement = rect.render(defaultTheme);
    
    const rectChild = svgElement.querySelector('rect');
    expect(rectChild?.getAttribute('fill')).toBe(defaultTheme.backgroundColor);
    expect(rectChild?.getAttribute('stroke')).toBe(defaultTheme.borderColor);
    
    const textChild = svgElement.querySelector('text');
    expect(textChild?.getAttribute('fill')).toBe(defaultTheme.textColor);
    expect(textChild?.getAttribute('font-family')).toBe(defaultTheme.fontFamily);
  });
});
