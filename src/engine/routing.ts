import { Point } from '../components/BaseComponent';

const AXIS_EPSILON = 3;

function isHorizontalSegment(a: Point, b: Point): boolean {
  return Math.abs(a.y - b.y) <= AXIS_EPSILON;
}

function isVerticalSegment(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) <= AXIS_EPSILON;
}

export function routeOrthogonal(
  start: Point,
  end: Point,
  startSide: 'left' | 'right' | 'top' | 'bottom' = 'right',
  endSide: 'left' | 'right' | 'top' | 'bottom' = 'left',
  offsetX: number = 0
): Point[] {
  const isStartHorizontal = startSide === 'left' || startSide === 'right';
  const isEndHorizontal = endSide === 'left' || endSide === 'right';

  if (isStartHorizontal && isEndHorizontal) {
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const gap = maxX - minX;

    let midX = start.x + (end.x - start.x) / 2;

    if (gap > 20) {
      const limit = gap * 0.3;
      const clampedOffset = Math.max(-limit, Math.min(limit, offsetX));
      midX += clampedOffset;
    }

    if (Math.abs(start.x - end.x) < 4) {
      return [start, end];
    }

    if (Math.abs(start.y - end.y) <= AXIS_EPSILON) {
      return [start, end];
    }

    return [
      start,
      { x: midX, y: start.y },
      { x: midX, y: end.y },
      end
    ];
  } else if (!isStartHorizontal && !isEndHorizontal) {
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    const gap = maxY - minY;

    let midY = start.y + (end.y - start.y) / 2;

    if (gap > 20) {
      const limit = gap * 0.3;
      const clampedOffset = Math.max(-limit, Math.min(limit, offsetX));
      midY += clampedOffset;
    }

    if (Math.abs(start.y - end.y) < 4) {
      return [start, end];
    }

    if (Math.abs(start.x - end.x) <= AXIS_EPSILON) {
      return [start, end];
    }

    return [
      start,
      { x: start.x, y: midY },
      { x: end.x, y: midY },
      end
    ];
  } else if (isStartHorizontal && !isEndHorizontal) {
    return [
      start,
      { x: end.x, y: start.y },
      end
    ];
  } else {
    return [
      start,
      { x: start.x, y: end.y },
      end
    ];
  }
}

export function pointsToSvgPath(points: Point[]): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  const segments = rest.map(p => `L ${p.x} ${p.y}`).join(' ');
  return `M ${first.x} ${first.y} ${segments}`;
}

/**
 * Midpoint of the longest segment — best for orthogonal link labels.
 */
export function getPathLabelPosition(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 2) {
    return {
      x: (points[0].x + points[1].x) / 2,
      y: (points[0].y + points[1].y) / 2
    };
  }

  let longest = 0;
  let position = {
    x: (points[0].x + points[1].x) / 2,
    y: (points[0].y + points[1].y) / 2
  };

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const length = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    const isVertical = a.x === b.x;
    const isBetter = length > longest || (length === longest && isVertical);

    if (isBetter) {
      longest = length;
      position = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }
  }

  return position;
}

export interface PathLabelPlacement {
  /** Midpoint on the link segment where the label applies. */
  anchor: Point;
  segmentLength: number;
  /** True when the labeled segment runs horizontally. */
  isHorizontal: boolean;
}

/**
 * Placement anchor and segment metrics for positioning a label beside/above the line.
 */
function clampAnchor(anchor: Point, a: Point, b: Point, isHorizontal: boolean): Point {
  if (isHorizontal) {
    const length = Math.abs(a.x - b.x);
    if (length >= 48) {
      const minX = Math.min(a.x, b.x) + 24;
      const maxX = Math.max(a.x, b.x) - 24;
      return { x: Math.max(minX, Math.min(maxX, anchor.x)), y: anchor.y };
    }
  } else {
    const length = Math.abs(a.y - b.y);
    if (length >= 48) {
      const minY = Math.min(a.y, b.y) + 24;
      const maxY = Math.max(a.y, b.y) - 24;
      return { x: anchor.x, y: Math.max(minY, Math.min(maxY, anchor.y)) };
    }
  }
  return anchor;
}

export function getPathLabelPlacement(points: Point[]): PathLabelPlacement {
  if (points.length < 2) {
    const p = points[0] ?? { x: 0, y: 0 };
    return { anchor: p, segmentLength: 0, isHorizontal: true };
  }

  if (points.length === 2) {
    const a = points[0];
    const b = points[1];
    const horizontal = isHorizontalSegment(a, b);
    const rawAnchor = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    return {
      anchor: clampAnchor(rawAnchor, a, b, horizontal),
      segmentLength: Math.abs(a.x - b.x) + Math.abs(a.y - b.y),
      isHorizontal: horizontal
    };
  }

  // Orthogonal elbow (4 points): label on the vertical trunk between components
  if (points.length >= 4 && isVerticalSegment(points[1], points[2])) {
    const a = points[1];
    const b = points[2];
    const rawAnchor = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    return {
      anchor: clampAnchor(rawAnchor, a, b, false),
      segmentLength: Math.abs(a.y - b.y),
      isHorizontal: false
    };
  }

  // Fallback: longest segment, skip very short connector stubs
  let longest = 0;
  let chosenA = points[0];
  let chosenB = points[1];
  let anchor = {
    x: (points[0].x + points[1].x) / 2,
    y: (points[0].y + points[1].y) / 2
  };
  let isHorizontal = isHorizontalSegment(points[0], points[1]);

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const length = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    if (length < 20) continue;

    const segmentHorizontal = isHorizontalSegment(a, b);
    const isBetter = length > longest;

    if (isBetter) {
      longest = length;
      chosenA = a;
      chosenB = b;
      anchor = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      isHorizontal = segmentHorizontal;
    }
  }

  return {
    anchor: clampAnchor(anchor, chosenA, chosenB, isHorizontal),
    segmentLength: longest,
    isHorizontal
  };
}

/** Estimate text width for layout (px). */
export function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.55;
}

/**
 * Vertical distance from a horizontal line to the text baseline (text sits above).
 */
export function clearanceAboveHorizontalLine(
  text: string,
  fontSize: number,
  segmentLength = 0
): number {
  const textWidth = estimateTextWidth(text, fontSize);
  let gap = 3;

  if (segmentLength > 0 && textWidth > segmentLength * 0.7) {
    gap += (textWidth - segmentLength * 0.7) * 0.4 + 6;
  }

  return Math.round(fontSize * 0.75 + gap);
}

/**
 * Horizontal distance from a vertical line to centered text.
 */
export function clearanceBesideVerticalLine(text: string, fontSize: number): number {
  return Math.round(estimateTextWidth(text, fontSize) * 0.5 + 6);
}

export interface LabelDrawPosition {
  x: number;
  y: number;
  /** SVG dominant-baseline for clear placement above or beside the line */
  baseline: 'alphabetic' | 'central';
}

/** Position label above (horizontal segment) or beside (vertical segment) the line. */
export function placeLabelNearSegment(
  placement: PathLabelPlacement,
  text: string,
  fontSize: number
): LabelDrawPosition {
  if (placement.isHorizontal) {
    const above = clearanceAboveHorizontalLine(
      text,
      fontSize,
      placement.segmentLength
    );
    return {
      x: placement.anchor.x,
      y: placement.anchor.y - above,
      baseline: 'alphabetic'
    };
  }

  const beside = clearanceBesideVerticalLine(text, fontSize);
  return {
    x: placement.anchor.x - beside,
    y: placement.anchor.y,
    baseline: 'central'
  };
}

/** Place cardinality near a port, above the line when the link exits horizontally. */
export function placeCardinalityNearPort(
  port: Point,
  toward: Point,
  cardinality: string,
  fontSize: number,
  alongLineOffset = 14
): LabelDrawPosition {
  const onLine = offsetAlongDirection(port, toward, alongLineOffset);
  const bracketed = `[${cardinality}]`;

  if (isHorizontalSegment(port, toward) || isHorizontalSegment(onLine, toward)) {
    const above = clearanceAboveHorizontalLine(bracketed, fontSize);
    return {
      x: onLine.x,
      y: onLine.y - above,
      baseline: 'alphabetic'
    };
  }

  const beside = clearanceBesideVerticalLine(bracketed, fontSize);
  return {
    x: onLine.x - beside,
    y: onLine.y,
    baseline: 'central'
  };
}

/** Move a point outward along the direction toward another point. */
export function offsetAlongDirection(
  from: Point,
  toward: Point,
  distance: number
): Point {
  const dx = toward.x - from.x;
  const dy = toward.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) return { x: from.x, y: from.y - distance };

  return {
    x: from.x + (dx / length) * distance,
    y: from.y + (dy / length) * distance
  };
}
