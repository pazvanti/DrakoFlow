// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { ComponentMetadata, ThemeVariables } from '../../src/components/BaseComponent';
import { CylinderComponent } from '../../src/components/CylinderComponent';
import { CubeComponent } from '../../src/components/CubeComponent';
import { DiamondComponent } from '../../src/components/DiamondComponent';
import { HexagonComponent } from '../../src/components/HexagonComponent';
import { ActorComponent } from '../../src/components/ActorComponent';
import { ParallelogramComponent } from '../../src/components/ParallelogramComponent';

describe('New Shape Components', () => {
  const theme: ThemeVariables = {
    primaryColor: '#60a5fa',
    secondaryColor: '#a1a1aa',
    backgroundColor: '#18181b',
    textColor: '#f4f4f5',
    borderColor: '#52525b',
    fontFamily: 'Outfit'
  };

  describe('CylinderComponent', () => {
    const meta: ComponentMetadata = { id: 'cyl1', type: 'Cylinder', tags: [] };

    it('should validate label property type', () => {
      const cyl1 = new CylinderComponent(meta, { label: 123 as any }, {});
      expect(() => cyl1.validateProps()).toThrow();
      const cyl2 = new CylinderComponent(meta, { label: 'Valid' }, {});
      expect(() => cyl2.validateProps()).not.toThrow();
    });

    it('should calculate min dimensions based on text length', () => {
      const cyl = new CylinderComponent(meta, { label: 'Database' }, {});
      const dim = cyl.calculateMinDimensions(theme);
      expect(dim.width).toBeGreaterThanOrEqual(100);
      expect(dim.height).toBe(70);
    });

    it('should render an SVG group containing a path and ellipse', () => {
      const cyl = new CylinderComponent(meta, { label: 'Database' }, {});
      cyl.bounds = { x: 10, y: 10, width: 120, height: 80 };
      const g = cyl.render(theme);
      expect(g.getAttribute('id')).toBe('cyl1');
      expect(g.querySelector('path')).not.toBeNull();
      expect(g.querySelector('ellipse')).not.toBeNull();
      expect(g.querySelector('text')?.textContent).toBe('Database');
    });
  });

  describe('CubeComponent', () => {
    const meta: ComponentMetadata = { id: 'cube1', type: 'Cube', tags: [] };

    it('should validate label property type', () => {
      const cube = new CubeComponent(meta, { label: true as any }, {});
      expect(() => cube.validateProps()).toThrow();
    });

    it('should calculate min dimensions', () => {
      const cube = new CubeComponent(meta, { label: 'AuthService' }, {});
      const dim = cube.calculateMinDimensions(theme);
      expect(dim.width).toBeGreaterThanOrEqual(110);
      expect(dim.height).toBe(70);
    });

    it('should render SVG faces and centered text', () => {
      const cube = new CubeComponent(meta, { label: 'Auth' }, {});
      cube.bounds = { x: 0, y: 0, width: 120, height: 90 };
      const g = cube.render(theme);
      expect(g.querySelector('rect')).not.toBeNull();
      // Three faces + two shading overlays = multiple paths
      expect(g.querySelectorAll('path').length).toBeGreaterThanOrEqual(3);
      expect(g.querySelector('text')?.textContent).toBe('Auth');
    });
  });

  describe('DiamondComponent', () => {
    const meta: ComponentMetadata = { id: 'diam1', type: 'Diamond', tags: [] };

    it('should validate label property type', () => {
      const diam = new DiamondComponent(meta, { label: {} as any }, {});
      expect(() => diam.validateProps()).toThrow();
    });

    it('should calculate extra min dimensions for spacing', () => {
      const diam = new DiamondComponent(meta, { label: 'Approved?' }, {});
      const dim = diam.calculateMinDimensions(theme);
      expect(dim.width).toBeGreaterThanOrEqual(120);
      expect(dim.height).toBeGreaterThanOrEqual(80);
    });

    it('should render a diamond path', () => {
      const diam = new DiamondComponent(meta, { label: 'Yes/No' }, {});
      diam.bounds = { x: 0, y: 0, width: 150, height: 100 };
      const g = diam.render(theme);
      const path = g.querySelector('path');
      expect(path).not.toBeNull();
      // Diamond coordinates: W/2, 0 -> W, H/2 -> W/2, H -> 0, H/2 -> Z
      expect(path?.getAttribute('d')).toBe('M 75 0 L 150 50 L 75 100 L 0 50 Z');
      expect(g.querySelector('text')?.textContent).toBe('Yes/No');
    });
  });

  describe('HexagonComponent', () => {
    const meta: ComponentMetadata = { id: 'hex1', type: 'Hexagon', tags: [] };

    it('should calculate min dimensions', () => {
      const hex = new HexagonComponent(meta, { label: 'Microservice' }, {});
      const dim = hex.calculateMinDimensions(theme);
      expect(dim.width).toBeGreaterThanOrEqual(120);
      expect(dim.height).toBe(70);
    });

    it('should render a hexagon path', () => {
      const hex = new HexagonComponent(meta, { label: 'Domain' }, {});
      hex.bounds = { x: 0, y: 0, width: 120, height: 80 };
      const g = hex.render(theme);
      expect(g.querySelector('path')).not.toBeNull();
      expect(g.querySelector('text')?.textContent).toBe('Domain');
    });
  });

  describe('ActorComponent', () => {
    const meta: ComponentMetadata = { id: 'act1', type: 'Actor', tags: [] };

    it('should have fixed min dimensions', () => {
      const actor = new ActorComponent(meta, { label: 'User' }, {});
      const dim = actor.calculateMinDimensions(theme);
      expect(dim.width).toBe(70);
      expect(dim.height).toBe(100);
    });

    it('should render a head circle, body lines, and text at the bottom', () => {
      const actor = new ActorComponent(meta, { label: 'Admin' }, {});
      actor.bounds = { x: 0, y: 0, width: 70, height: 100 };
      const g = actor.render(theme);
      expect(g.querySelector('circle')).not.toBeNull();
      expect(g.querySelectorAll('line').length).toBe(4); // Torso, arms, two legs
      const textElem = g.querySelector('text');
      expect(textElem).not.toBeNull();
      expect(textElem?.getAttribute('y')).toBe('92'); // H - 8
      expect(textElem?.textContent).toBe('Admin');
    });
  });

  describe('ParallelogramComponent', () => {
    const meta: ComponentMetadata = { id: 'para1', type: 'Parallelogram', tags: [] };

    it('should calculate min dimensions', () => {
      const para = new ParallelogramComponent(meta, { label: 'Input file' }, {});
      const dim = para.calculateMinDimensions(theme);
      expect(dim.width).toBeGreaterThanOrEqual(120);
      expect(dim.height).toBe(60);
    });

    it('should render a parallelogram path and text', () => {
      const para = new ParallelogramComponent(meta, { label: 'CSV' }, {});
      para.bounds = { x: 0, y: 0, width: 120, height: 60 };
      const g = para.render(theme);
      expect(g.querySelector('path')).not.toBeNull();
      expect(g.querySelector('text')?.textContent).toBe('CSV');
    });
  });
});
