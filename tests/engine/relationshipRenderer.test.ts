// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderRelationships } from '../../src/engine/relationshipRenderer';
import { ParsedRelationship } from '../../src/engine/Relationship';
import { RectangleComponent } from '../../src/components/RectangleComponent';
import { ThemeVariables } from '../../src/components/BaseComponent';

describe('relationshipRenderer overlap prevention', () => {
  const defaultTheme: ThemeVariables = {
    primaryColor: '#0d6efd',
    secondaryColor: '#6c757d',
    backgroundColor: '#ffffff',
    textColor: '#212529',
    borderColor: '#dee2e6',
    fontFamily: 'sans-serif'
  };

  it('should shift direct shape-to-shape relationships when they share the same anchor point', () => {
    // Two shape components: comp1 on left, comp2 on right
    const comp1 = new RectangleComponent({ id: 'comp1', type: 'Rectangle', tags: [] }, { label: 'Comp 1' }, {});
    comp1.bounds = { x: 0, y: 0, width: 100, height: 100 };

    const comp2 = new RectangleComponent({ id: 'comp2', type: 'Rectangle', tags: [] }, { label: 'Comp 2' }, {});
    comp2.bounds = { x: 300, y: 0, width: 100, height: 100 };

    // Two relationships between comp1 and comp2
    const relationships: ParsedRelationship[] = [
      {
        sourceId: 'comp1',
        targetId: 'comp2',
        label: 'Rel 1',
        simple: true
      },
      {
        sourceId: 'comp1',
        targetId: 'comp2',
        label: 'Rel 2',
        simple: true
      }
    ];

    const svgRoot = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
    const layers = renderRelationships(relationships, [comp1, comp2], defaultTheme, svgRoot);

    const paths = layers.pathsLayer.querySelectorAll('path');
    expect(paths.length).toBe(2);

    const d1 = paths[0].getAttribute('d');
    const d2 = paths[1].getAttribute('d');

    expect(d1).not.toBe(d2); // they should be shifted and therefore have different path definitions!

    // Verify coordinates are shifted vertically since connection is horizontal (West/East borders)
    // For horizontal connection:
    // Raw start on comp1: x: 106, y: 50
    // Raw end on comp2: x: 294, y: 50
    // Shift is vertical (y-coordinate)
    // Offset for Rel 1 (index 0, N=2): -6px -> start.y = 44, end.y = 44
    // Offset for Rel 2 (index 1, N=2): +6px -> start.y = 56, end.y = 56
    expect(d1).toContain('M 106 44 L 294 44');
    expect(d2).toContain('M 106 56 L 294 56');
  });

  it('should shift lifeline-to-shape relationships when they share the same anchor point on a shape', () => {
    // Lifeline component on left, shape component on right
    const lifelineComp = new RectangleComponent({ id: 'life1', type: 'Rectangle', tags: [] }, { label: 'Lifeline' }, {});
    lifelineComp.lifeline = true;
    lifelineComp.bounds = { x: 0, y: 0, width: 100, height: 100 };

    const shapeComp = new RectangleComponent({ id: 'shape1', type: 'Rectangle', tags: [] }, { label: 'Shape' }, {});
    shapeComp.bounds = { x: 300, y: 0, width: 100, height: 100 };

    // Two relationships: lifeline to shape, and shape to lifeline.
    // Both connect to shapeComp's bottom center anchor (x = 350, y = 100)
    const relationships: ParsedRelationship[] = [
      {
        sourceId: 'life1',
        targetId: 'shape1',
        label: 'Rel 1',
        simple: true
      },
      {
        sourceId: 'shape1',
        targetId: 'life1',
        label: 'Rel 2',
        simple: true
      }
    ];

    const svgRoot = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
    const layers = renderRelationships(relationships, [lifelineComp, shapeComp], defaultTheme, svgRoot);

    const paths = layers.pathsLayer.querySelectorAll('path');
    expect(paths.length).toBe(2);

    const d1 = paths[0].getAttribute('d');
    const d2 = paths[1].getAttribute('d');

    expect(d1).not.toBe(d2);

    // Rel 1: lifeline -> shape
    // Source: lifeline (life1), Target: shape (shape1)
    // rawEnd: targetCenter.x = 350, targetBottomY = 100
    // Shift is horizontal (x-coordinate)
    // Offset for Rel 1: -6px -> elbow.x = 344, end.x = 344
    // Rel 2: shape -> lifeline
    // Source: shape (shape1), Target: lifeline (life1)
    // rawStart: sourceCenter.x = 350, sourceBottomY = 100
    // Offset for Rel 2: +6px -> start.x = 356, elbow.x = 356
    
    // Rel 1 path: start on lifeline (50, y_first_relation) -> elbow (344, y_first_relation) -> end (344, 100)
    // y_first_relation = 100 + 60 = 160
    // elbow of Rel 1 should be at x = 344, end at x = 344
    expect(d1).toContain('M 50 160 L 344 160 L 344 100');

    // Rel 2 path: start on shape (356, 100) -> elbow (356, y_first_relation + REL_GAP = 220) -> end (50, 220)
    expect(d2).toContain('M 356 100 L 356 220 L 50 220');
  });
});
