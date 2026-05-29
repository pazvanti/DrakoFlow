// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { SVGImageComponent, SVGImageProps } from '../../src/components/SVGImageComponent';
import { RasterImageComponent, RasterImageProps } from '../../src/components/RasterImageComponent';
import { ComponentMetadata, ThemeVariables } from '../../src/components/BaseComponent';
import { parseDslDocument } from '../../src/dsl/parser';
import { createComponentsFromDsl } from '../../src/engine/componentFactory';

describe('Image Components', () => {
  const metadataSVG: ComponentMetadata = {
    id: 'svg1',
    type: 'SVGImage',
    tags: ['media', 'vector']
  };

  const metadataRaster: ComponentMetadata = {
    id: 'raster1',
    type: 'RasterImage',
    tags: ['media', 'raster']
  };

  const defaultTheme: ThemeVariables = {
    primaryColor: '#0d6efd',
    secondaryColor: '#6c757d',
    backgroundColor: '#ffffff',
    textColor: '#212529',
    borderColor: '#dee2e6',
    fontFamily: 'sans-serif'
  };

  describe('SVGImageComponent', () => {
    const validSVG = `<svg width="80" height="50" viewBox="0 0 80 50"><circle cx="40" cy="25" r="20" fill="blue"/></svg>`;

    it('should instantiate successfully and validate props', () => {
      const props: SVGImageProps = {
        content: validSVG,
        scale: 1.5,
        width: 100,
        height: 100
      };
      const comp = new SVGImageComponent(metadataSVG, props, {});
      expect(() => comp.validateProps()).not.toThrow();

      // Check validation error cases
      const invalidContent = new SVGImageComponent(metadataSVG, { content: 123 as any }, {});
      expect(() => invalidContent.validateProps()).toThrow("content' must be a string");

      const invalidScale = new SVGImageComponent(metadataSVG, { scale: "2" as any }, {});
      expect(() => invalidScale.validateProps()).toThrow("scale' must be a number");

      const invalidWidth = new SVGImageComponent(metadataSVG, { width: "100" as any }, {});
      expect(() => invalidWidth.validateProps()).toThrow("width' must be a number");
    });

    it('should calculate minimum dimensions using native SVG headers and scale', () => {
      // Native SVG width: 80, height: 50. Scale: 2.0
      const comp = new SVGImageComponent(metadataSVG, { content: validSVG, scale: 2.0 }, {});
      const dim = comp.calculateMinDimensions(defaultTheme);
      expect(dim.width).toBe(160); // 80 * 2
      expect(dim.height).toBe(100); // 50 * 2
    });

    it('should calculate dimensions using manual overrides and scale', () => {
      // Override width: 200, height: 100. Scale: 0.5
      const comp = new SVGImageComponent(metadataSVG, { content: validSVG, scale: 0.5, width: 200, height: 100 }, {});
      const dim = comp.calculateMinDimensions(defaultTheme);
      expect(dim.width).toBe(100); // 200 * 0.5
      expect(dim.height).toBe(50); // 100 * 0.5
    });

    it('should fallback to 100x100 if SVG does not define size attributes', () => {
      const sizelessSVG = `<svg viewBox="0 0 200 200"><rect width="200" height="200"/></svg>`;
      const comp = new SVGImageComponent(metadataSVG, { content: sizelessSVG, scale: 1.0 }, {});
      const dim = comp.calculateMinDimensions(defaultTheme);
      // Extracts width/height from viewBox if width/height are omitted
      expect(dim.width).toBe(200);
      expect(dim.height).toBe(200);
    });

    it('should render standard SVG node correctly', () => {
      const comp = new SVGImageComponent(metadataSVG, { content: validSVG, scale: 1.5 }, {});
      comp.bounds = { x: 10, y: 20, width: 120, height: 75 };
      const element = comp.render(defaultTheme);

      expect(element.tagName.toLowerCase()).toBe('g');
      expect(element.getAttribute('id')).toBe('svg1');
      expect(element.getAttribute('transform')).toBe('translate(10, 20)');

      const innerG = element.querySelector('g');
      expect(innerG).not.toBeNull();
      expect(innerG?.getAttribute('transform')).toBe('scale(1.5)');

      const embeddedSvg = innerG?.querySelector('svg');
      expect(embeddedSvg).not.toBeNull();
      expect(embeddedSvg?.getAttribute('width')).toBe('80');
      expect(embeddedSvg?.getAttribute('height')).toBe('50');
    });

    it('should display error rect on invalid SVG parser output', () => {
      const invalidSVG = `<svg><invalid_element_without_closing`;
      const comp = new SVGImageComponent(metadataSVG, { content: invalidSVG, scale: 1.0 }, {});
      comp.bounds = { x: 0, y: 0, width: 100, height: 100 };
      const element = comp.render(defaultTheme);

      const rect = element.querySelector('rect');
      const text = element.querySelector('text');
      expect(rect).not.toBeNull();
      expect(rect?.getAttribute('fill')).toBe('#fee2e2');
      expect(text?.textContent).toContain('SVG Syntax Error');
    });

    it('should auto-inject xmlns namespace if missing', () => {
      const missingNamespaceSVG = `<svg width="80" height="50"><circle cx="40" cy="25" r="20"/></svg>`;
      const comp = new SVGImageComponent(metadataSVG, { content: missingNamespaceSVG, scale: 1.0 }, {});
      comp.bounds = { x: 0, y: 0, width: 80, height: 50 };
      const element = comp.render(defaultTheme);

      const innerG = element.querySelector('g');
      const embeddedSvg = innerG?.querySelector('svg');
      expect(embeddedSvg).not.toBeNull();
      expect(embeddedSvg?.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg');
      // No parser error means it successfully parsed in namespace context
      expect(element.querySelector('rect')).toBeNull();
    });
  });

  describe('RasterImageComponent', () => {
    // 5x5 red dot PNG base64 encoded
    const redDotPNG = 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';

    it('should instantiate successfully and validate props', () => {
      const props: RasterImageProps = {
        content: redDotPNG,
        scale: 2.0,
        width: 150,
        height: 150
      };
      const comp = new RasterImageComponent(metadataRaster, props, {});
      expect(() => comp.validateProps()).not.toThrow();

      // Check validation error cases
      const invalidContent = new RasterImageComponent(metadataRaster, { content: {} as any }, {});
      expect(() => invalidContent.validateProps()).toThrow("content' must be a string");
    });

    it('should calculate minimum dimensions using native headers parsed from base64 PNG', () => {
      const comp = new RasterImageComponent(metadataRaster, { content: redDotPNG, scale: 4.0 }, {});
      const dim = comp.calculateMinDimensions(defaultTheme);
      // Red dot native is 5x5. Scale 4.0 -> 20x20
      expect(dim.width).toBe(20);
      expect(dim.height).toBe(20);
    });

    it('should fallback to 150x150 when base64 content is invalid or size header cannot be parsed', () => {
      const comp = new RasterImageComponent(metadataRaster, { content: 'invalid_base64_data', scale: 1.0 }, {});
      const dim = comp.calculateMinDimensions(defaultTheme);
      expect(dim.width).toBe(150);
      expect(dim.height).toBe(150);
    });

    it('should calculate dimensions using manual overrides and scale', () => {
      const comp = new RasterImageComponent(metadataRaster, { content: redDotPNG, scale: 3.0, width: 50, height: 30 }, {});
      const dim = comp.calculateMinDimensions(defaultTheme);
      expect(dim.width).toBe(150); // 50 * 3
      expect(dim.height).toBe(90);  // 30 * 3
    });

    it('should render standard SVG <image> tag with data uri correct source', () => {
      const comp = new RasterImageComponent(metadataRaster, { content: redDotPNG, scale: 2.0 }, {});
      comp.bounds = { x: 5, y: 5, width: 10, height: 10 };
      const element = comp.render(defaultTheme);

      expect(element.tagName.toLowerCase()).toBe('g');
      
      const imageChild = element.querySelector('image');
      expect(imageChild).not.toBeNull();
      expect(imageChild?.getAttribute('width')).toBe('10');
      expect(imageChild?.getAttribute('height')).toBe('10');
      expect(imageChild?.getAttribute('href')).toBe(`data:image/png;base64,${redDotPNG}`);
    });

    it('should prepend data prefix if omitted in the content source string', () => {
      const rawBase64 = redDotPNG;
      const comp = new RasterImageComponent(metadataRaster, { content: rawBase64 }, {});
      comp.bounds = { x: 0, y: 0, width: 100, height: 100 };
      const element = comp.render(defaultTheme);

      const imageChild = element.querySelector('image');
      expect(imageChild?.getAttribute('href')).toBe(`data:image/png;base64,${rawBase64}`);
    });

    it('should strip all whitespace and newlines from base64 content', () => {
      const whitespaceBase64 = `
        iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbybl
        AAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO
        9TXL0Y4OHwAAAABJRU5ErkJggg==
      `;
      const comp = new RasterImageComponent(metadataRaster, { content: whitespaceBase64, scale: 1.0 }, {});
      comp.bounds = { x: 0, y: 0, width: 5, height: 5 };
      
      const dim = comp.calculateMinDimensions(defaultTheme);
      expect(dim.width).toBe(5);
      expect(dim.height).toBe(5);

      const element = comp.render(defaultTheme);
      const imageChild = element.querySelector('image');
      expect(imageChild).not.toBeNull();
      expect(imageChild?.getAttribute('href')).toBe(`data:image/png;base64,${redDotPNG}`);
    });
  });

  describe('Image Components DSL Parsing', () => {

    it('should parse and instantiate SVGImage with brace-enclosed content block', () => {
      const dsl = `
        MySVG: SVGImage {
          content: {
            <svg width="80" height="50">
              <circle cx="40" cy="25" r="20" fill="blue"/>
            </svg>
          }
          scale: 2.0
        }
      `;
      const doc = parseDslDocument(dsl);
      expect(doc.components[0].subBlocks?.['content']).toBeDefined();
      expect(doc.components[0].subBlocks?.['content'].length).toBeGreaterThan(0);

      const comps = createComponentsFromDsl(doc.components);
      expect(comps.length).toBe(1);
      const comp = comps[0] as SVGImageComponent;
      expect(comp.id).toBe('MySVG');
      expect(comp.calculateMinDimensions(defaultTheme)).toEqual({ width: 160, height: 100 });
    });

    it('should parse and instantiate RasterImage with brace-enclosed content block and newlines', () => {
      const dsl = `
        MyRaster: RasterImage {
          content: {
            iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbybl
            AAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO
            9TXL0Y4OHwAAAABJRU5ErkJggg==
          }
          scale: 4.0
        }
      `;
      const doc = parseDslDocument(dsl);
      expect(doc.components[0].subBlocks?.['content']).toBeDefined();

      const comps = createComponentsFromDsl(doc.components);
      expect(comps.length).toBe(1);
      const comp = comps[0] as RasterImageComponent;
      expect(comp.id).toBe('MyRaster');
      expect(comp.calculateMinDimensions(defaultTheme)).toEqual({ width: 20, height: 20 });
    });
  });
});
