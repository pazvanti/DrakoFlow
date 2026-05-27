import { BoundingBox, Point } from '../components/BaseComponent';

/** Pixels of clear space between the arrowhead tip and the shape border. */
const ARROW_GAP = 6;

/**
 * Nearest point on the rectangle border toward another point (for link attachment),
 * offset outward by ARROW_GAP so the arrowhead doesn't butt against the shape.
 */
export function getBorderPort(bounds: BoundingBox, toward: Point): Point {
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  const dx = toward.x - cx;
  const dy = toward.y - cy;

  if (dx === 0 && dy === 0) {
    return { x: cx, y: bounds.y - ARROW_GAP };
  }

  const halfW = bounds.width / 2;
  const halfH = bounds.height / 2;
  const scale = Math.max(Math.abs(dx) / halfW, Math.abs(dy) / halfH);

  // Border intersection point
  const bx = cx + dx / scale;
  const by = cy + dy / scale;

  // Push outward (away from the shape center) by ARROW_GAP
  const len = Math.sqrt(dx * dx + dy * dy);
  return {
    x: bx + (dx / len) * ARROW_GAP,
    y: by + (dy / len) * ARROW_GAP
  };
}

export function getCenter(bounds: BoundingBox): Point {
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2
  };
}
