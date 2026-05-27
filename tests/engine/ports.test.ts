import { describe, it, expect } from 'vitest';
import { getBorderPort } from '../../src/engine/ports';

describe('ports', () => {
  it('returns a point on the east border when target is to the right', () => {
    const bounds = { x: 0, y: 0, width: 100, height: 60 };
    const port = getBorderPort(bounds, { x: 300, y: 30 });
    expect(port.x).toBe(106);
    expect(port.y).toBe(30);
  });

  it('returns a point on the west border when target is to the left', () => {
    const bounds = { x: 200, y: 0, width: 100, height: 60 };
    const port = getBorderPort(bounds, { x: 0, y: 30 });
    expect(port.x).toBe(194);
  });
});
