import { describe, it, expect } from 'vitest';
import {
  routeOrthogonal,
  pointsToSvgPath,
  getPathLabelPosition,
  getPathLabelPlacement,
  placeLabelNearSegment,
  placeCardinalityNearPort,
  clearanceAboveHorizontalLine,
  offsetAlongDirection
} from '../../src/engine/routing';

describe('routing', () => {
  it('creates an orthogonal path with a middle elbow', () => {
    const points = routeOrthogonal({ x: 100, y: 50 }, { x: 300, y: 150 });
    expect(points.length).toBe(4);
    expect(points[0]).toEqual({ x: 100, y: 50 });
    expect(points[3]).toEqual({ x: 300, y: 150 });
    expect(points[1].x).toBe(points[2].x);
  });

  it('converts points to SVG path data', () => {
    const d = pointsToSvgPath([{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 40 }]);
    expect(d).toBe('M 0 0 L 50 0 L 50 40');
  });

  it('places label at the midpoint of the longest segment', () => {
    const points = routeOrthogonal({ x: 100, y: 50 }, { x: 300, y: 150 });
    const label = getPathLabelPosition(points);
    expect(label.x).toBe(200);
    expect(label.y).toBe(100);
  });

  it('offsets cardinality text away from the port', () => {
    const offset = offsetAlongDirection({ x: 100, y: 50 }, { x: 200, y: 50 }, 18);
    expect(offset.x).toBe(118);
    expect(offset.y).toBe(50);
  });

  it('places horizontal segment labels above the line', () => {
    const points = routeOrthogonal({ x: 0, y: 100 }, { x: 200, y: 100 });
    const placement = getPathLabelPlacement(points);
    const pos = placeLabelNearSegment(placement, 'short', 12);
    expect(pos.y).toBeLessThan(placement.anchor.y);
    expect(pos.x).toBe(placement.anchor.x);
    expect(pos.baseline).toBe('alphabetic');
  });

  it('places elbow link labels on the vertical trunk between components', () => {
    const points = routeOrthogonal({ x: 100, y: 80 }, { x: 400, y: 120 });
    const placement = getPathLabelPlacement(points);
    expect(placement.isHorizontal).toBe(false);
    expect(placement.anchor.x).toBe((points[1].x + points[2].x) / 2);
    const pos = placeLabelNearSegment(placement, 'flows to', 12);
    expect(pos.x).toBeLessThan(placement.anchor.x);
  });

  it('increases clearance when label text is longer than the segment', () => {
    const shortOffset = clearanceAboveHorizontalLine('ok', 12, 80);
    const longOffset = clearanceAboveHorizontalLine('a very long relationship label', 12, 80);
    expect(longOffset).toBeGreaterThan(shortOffset);
  });

  it('places cardinality above a horizontal line', () => {
    const draw = placeCardinalityNearPort(
      { x: 50, y: 100 },
      { x: 150, y: 100 },
      '1',
      11
    );
    expect(draw.y).toBeLessThan(100);
    expect(draw.baseline).toBe('alphabetic');
  });
});
