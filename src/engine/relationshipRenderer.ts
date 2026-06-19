import { Point, ThemeVariables, BoundingBox } from '../components/BaseComponent';
import { ParsedRelationship } from './Relationship';
import { indexComponentsById, IndexedComponent } from './componentIndex';
import { getCenter, getBorderPort } from './ports';
import {
  estimateTextWidth,
  pointsToSvgPath,
  routeOrthogonal,
  getPathLabelPlacement,
  placeLabelNearSegment,
  placeCardinalityNearPort
} from './routing';
import { BaseComponent } from '../components/BaseComponent';

const RELATIONSHIP_LABEL_FONT_SIZE = 12;
const CARDINALITY_FONT_SIZE = 11;

function getBorderFace(bounds: BoundingBox, pt: Point): 'top' | 'bottom' | 'left' | 'right' {
  const leftDist = Math.abs(pt.x - bounds.x);
  const rightDist = Math.abs(pt.x - (bounds.x + bounds.width));
  const topDist = Math.abs(pt.y - bounds.y);
  const bottomDist = Math.abs(pt.y - (bounds.y + bounds.height));

  const minDist = Math.min(leftDist, rightDist, topDist, bottomDist);
  if (minDist === leftDist) return 'left';
  if (minDist === rightDist) return 'right';
  if (minDist === topDist) return 'top';
  return 'bottom';
}

function getCurveControlPoint(pt: Point, face: 'top' | 'bottom' | 'left' | 'right', distance: number): Point {
  switch (face) {
    case 'left':
      return { x: pt.x - distance, y: pt.y };
    case 'right':
      return { x: pt.x + distance, y: pt.y };
    case 'top':
      return { x: pt.x, y: pt.y - distance };
    case 'bottom':
      return { x: pt.x, y: pt.y + distance };
  }
}

export interface RelationshipLayers {
  pathsLayer: SVGGElement;
  labelsLayer: SVGGElement;
}

function ensureArrowMarkerDef(svgRoot: SVGSVGElement, markerId: string, color: string, thickness: number): void {
  let defs = svgRoot.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svgRoot.insertBefore(defs, svgRoot.firstChild);
  }

  const markerSize = 12 + thickness * 2;

  let marker = defs.querySelector(`#${markerId}`) as SVGMarkerElement | null;
  if (!marker) {
    marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', markerId);
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '5');
    marker.setAttribute('orient', 'auto-start-reverse');
    marker.setAttribute('markerUnits', 'userSpaceOnUse');

    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrow.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    marker.appendChild(arrow);
    defs.appendChild(marker);
  }

  marker.setAttribute('markerWidth', markerSize.toString());
  marker.setAttribute('markerHeight', markerSize.toString());
  const arrow = marker.querySelector('path');
  if (arrow) arrow.setAttribute('fill', color);
}

/** Ensure an open-circle SVG marker is defined in the SVG <defs>. */
function ensureCircleMarkerDef(svgRoot: SVGSVGElement, markerId: string, color: string, thickness: number): void {
  let defs = svgRoot.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svgRoot.insertBefore(defs, svgRoot.firstChild);
  }

  const markerSize = 14 + thickness * 3;

  let marker = defs.querySelector(`#${markerId}`) as SVGMarkerElement | null;
  if (!marker) {
    marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', markerId);
    marker.setAttribute('viewBox', '0 0 12 12');
    marker.setAttribute('refX', '6');
    marker.setAttribute('refY', '6');
    marker.setAttribute('orient', 'auto-start-reverse');
    marker.setAttribute('markerUnits', 'userSpaceOnUse');

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '6');
    circle.setAttribute('cy', '6');
    circle.setAttribute('r', '4');
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke-width', '1.5');
    marker.appendChild(circle);
    defs.appendChild(marker);
  }

  marker.setAttribute('markerWidth', markerSize.toString());
  marker.setAttribute('markerHeight', markerSize.toString());
  const circle = marker.querySelector('circle');
  if (circle) circle.setAttribute('stroke', color);
}

/** Ensure an aggregation/composition rhombus SVG marker is defined in the SVG <defs>. */
function ensureRhombusMarkerDef(svgRoot: SVGSVGElement, markerId: string, color: string, bgColor: string, thickness: number): void {
  let defs = svgRoot.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svgRoot.insertBefore(defs, svgRoot.firstChild);
  }

  const wSize = 16 + thickness * 4;
  const hSize = 10 + thickness * 3;

  let marker = defs.querySelector(`#${markerId}`) as SVGMarkerElement | null;
  if (!marker) {
    marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', markerId);
    marker.setAttribute('viewBox', '0 0 16 10');
    marker.setAttribute('refX', '16');
    marker.setAttribute('refY', '5');
    marker.setAttribute('orient', 'auto-start-reverse');
    marker.setAttribute('markerUnits', 'userSpaceOnUse');

    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '4,5 10,2 16,5 10,8');
    polygon.setAttribute('stroke-width', '1.5');
    marker.appendChild(polygon);
    defs.appendChild(marker);
  }

  marker.setAttribute('markerWidth', wSize.toString());
  marker.setAttribute('markerHeight', hSize.toString());
  const poly = marker.querySelector('polygon');
  if (poly) {
    poly.setAttribute('stroke', color);
    poly.setAttribute('fill', bgColor);
  }
}

function strokeDashArray(lineStyle?: string): string | null {
  switch (lineStyle) {
    case 'dashed':
      return '6,4';
    case 'dotted':
      return '2,4';
    default:
      return null;
  }
}

function renderPlainText(
  group: SVGGElement,
  text: string,
  position: Point,
  theme: ThemeVariables,
  fontSize: number,
  baseline: 'alphabetic' | 'central' = 'central'
): SVGTextElement {
  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', position.x.toString());
  label.setAttribute('y', position.y.toString());
  label.setAttribute('fill', theme.textColor);
  label.setAttribute('font-family', theme.fontFamily);
  label.setAttribute('font-size', fontSize.toString());
  label.setAttribute('text-anchor', 'middle');
  label.setAttribute('dominant-baseline', baseline);
  label.textContent = text;
  group.appendChild(label);
  return label;
}

function renderCardinalityLabel(
  group: SVGGElement,
  text: string,
  draw: { x: number; y: number; baseline: 'alphabetic' | 'central' },
  theme: ThemeVariables
): SVGTextElement {
  return renderPlainText(
    group,
    `[${text}]`,
    { x: draw.x, y: draw.y },
    theme,
    CARDINALITY_FONT_SIZE,
    draw.baseline
  );
}

export function renderRelationships(
  relationships: ParsedRelationship[],
  rootComponents: BaseComponent[],
  theme: ThemeVariables,
  svgRoot: SVGSVGElement
): RelationshipLayers {
  const componentIndex = indexComponentsById(rootComponents);

  // Pass 1: Group anchor points on shape borders
  const anchorGroups = new Map<string, { relIndex: number; role: 'source' | 'target'; rawPt: Point; bounds: BoundingBox }[]>();

  relationships.forEach((rel, index) => {
    if (rel.sourceId === rel.targetId) {
      return; // Skip self relationships
    }

    const source = componentIndex.get(rel.sourceId);
    const target = componentIndex.get(rel.targetId);
    if (!source || !target) return;

    const sourceIsLifeline = source.component.lifeline;
    const targetIsLifeline = target.component.lifeline;
    const eitherIsLifeline = sourceIsLifeline || targetIsLifeline;

    let rawStart: Point | undefined;
    let rawEnd: Point | undefined;

    if (eitherIsLifeline) {
      const sourceCenter = getCenter(source.globalBounds);
      const targetCenter = getCenter(target.globalBounds);
      const sourceBottomY = source.globalBounds.y + source.globalBounds.height;
      const targetBottomY = target.globalBounds.y + target.globalBounds.height;

      if (sourceIsLifeline && targetIsLifeline) {
        return; // Both are lifelines, connections are purely horizontal
      } else if (!sourceIsLifeline && targetIsLifeline) {
        rawStart = { x: sourceCenter.x, y: sourceBottomY };
      } else if (sourceIsLifeline && !targetIsLifeline) {
        rawEnd = { x: targetCenter.x, y: targetBottomY };
      } else {
        rawStart = { x: sourceCenter.x, y: sourceBottomY };
        rawEnd = { x: targetCenter.x, y: targetBottomY };
      }
    } else {
      const sourceCenter = getCenter(source.globalBounds);
      const targetCenter = getCenter(target.globalBounds);
      rawStart = getBorderPort(source.globalBounds, targetCenter);
      rawEnd = getBorderPort(target.globalBounds, sourceCenter);
    }

    if (rawStart) {
      const key = `${rel.sourceId}|${Math.round(rawStart.x)},${Math.round(rawStart.y)}`;
      if (!anchorGroups.has(key)) {
        anchorGroups.set(key, []);
      }
      anchorGroups.get(key)!.push({ relIndex: index, role: 'source', rawPt: rawStart, bounds: source.globalBounds });
    }

    if (rawEnd) {
      const key = `${rel.targetId}|${Math.round(rawEnd.x)},${Math.round(rawEnd.y)}`;
      if (!anchorGroups.has(key)) {
        anchorGroups.set(key, []);
      }
      anchorGroups.get(key)!.push({ relIndex: index, role: 'target', rawPt: rawEnd, bounds: target.globalBounds });
    }
  });

  const SPREAD_PX = 12;
  const offsetMap = new Map<string, number>();

  anchorGroups.forEach((group) => {
    if (group.length <= 1) return;

    group.sort((a, b) => a.relIndex - b.relIndex);
    const N = group.length;
    group.forEach((item, i) => {
      const offsetFactor = i - (N - 1) / 2;
      const offset = offsetFactor * SPREAD_PX;
      offsetMap.set(`${item.relIndex}|${item.role}`, offset);
    });
  });

  const pathsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  pathsLayer.setAttribute('class', 'relationship-paths');
  const labelsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  labelsLayer.setAttribute('class', 'relationship-labels');

  // Step 1: Calculate vertical positioning for flows
  const maxComponentBottom = rootComponents.length > 0
    ? Math.max(...rootComponents.map(c => c.bounds.y + c.bounds.height))
    : 100;
  const y_first_relation = maxComponentBottom + 60;
  const REL_GAP = 60;

  const y_max = y_first_relation + (relationships.length > 0 ? (relationships.length - 1) * REL_GAP : 0) + 40;

  // Step 2: Draw vertical lifelines selectively for components of type 'Lifeline'
  componentIndex.forEach(indexedComp => {
    const comp = indexedComp.component;
    if (comp.lifeline) {
      const bounds = indexedComp.globalBounds;
      const x_center = bounds.x + bounds.width / 2;
      const y_start = bounds.y + bounds.height;

      let max_idx = -1;
      relationships.forEach((rel, idx) => {
        if (rel.sourceId === comp.id || rel.targetId === comp.id) {
          max_idx = idx;
        }
      });

      const y_limit = max_idx >= 0
        ? y_first_relation + max_idx * REL_GAP + 40
        : y_start + 40;

      const lifeline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      lifeline.setAttribute('x1', x_center.toString());
      lifeline.setAttribute('y1', y_start.toString());
      lifeline.setAttribute('x2', x_center.toString());
      lifeline.setAttribute('y2', y_limit.toString());
      lifeline.setAttribute('stroke', theme.borderColor);
      lifeline.setAttribute('stroke-width', '1.5');
      lifeline.setAttribute('stroke-dasharray', '4,4');
      lifeline.setAttribute('data-lifeline-for', comp.id);
      pathsLayer.appendChild(lifeline);
    }
  });

  // Step 3: Draw each relationship sequentially or directly
  relationships.forEach((rel, index) => {
    const source = componentIndex.get(rel.sourceId);
    const target = componentIndex.get(rel.targetId);

    if (!source || !target) {
      const err = new Error(
        `Relationship references unknown component: ${!source ? rel.sourceId : rel.targetId}`
      ) as any;
      if (rel.line) {
        err.line = rel.line;
      }
      throw err;
    }

    const sourceIsLifeline = source.component.lifeline;
    const targetIsLifeline = target.component.lifeline;
    const eitherIsLifeline = sourceIsLifeline || targetIsLifeline;

    const rawColor = rel.style?.color || 'borderColor';
    const color = (rawColor in theme) ? theme[rawColor] : rawColor;

    let labelBaseline: 'alphabetic' | 'central' = 'central';
    let sourceCardBaseline: 'alphabetic' | 'central' = 'alphabetic';
    let targetCardBaseline: 'alphabetic' | 'central' = 'alphabetic';
    let pathD = '';

    const tagEl = <T extends SVGElement>(el: T): T => {
      el.setAttribute('data-source-id', rel.sourceId);
      el.setAttribute('data-target-id', rel.targetId);
      return el;
    };

    if (rel.sourceId === rel.targetId) {
      // Self relationship loop
      let points: Point[];
      let labelPos: Point;
      let sourceCardPos: Point;
      let targetCardPos: Point;

      if (sourceIsLifeline) {
        const start = getCenter(source.globalBounds);
        const y = y_first_relation + index * REL_GAP;
        points = [
          { x: start.x, y: y - 15 },
          { x: start.x + 40, y: y - 15 },
          { x: start.x + 40, y: y + 15 },
          { x: start.x, y: y + 15 }
        ];
        labelPos = { x: start.x + 45 + estimateTextWidth(rel.label || '', RELATIONSHIP_LABEL_FONT_SIZE) / 2, y };
        sourceCardPos = { x: start.x + 12, y: y - 22 };
        targetCardPos = { x: start.x + 12, y: y + 25 };
      } else {
        const bounds = source.globalBounds;
        const x_right = bounds.x + bounds.width;
        const y_top = bounds.y + bounds.height * 0.25;
        const y_bot = bounds.y + bounds.height * 0.75;
        points = [
          { x: x_right, y: y_top },
          { x: x_right + 30, y: y_top },
          { x: x_right + 30, y: y_bot },
          { x: x_right, y: y_bot }
        ];
        labelPos = { x: x_right + 35 + estimateTextWidth(rel.label || '', RELATIONSHIP_LABEL_FONT_SIZE) / 2, y: (y_top + y_bot) / 2 };
        sourceCardPos = { x: x_right + 10, y: y_top - 6 };
        targetCardPos = { x: x_right + 10, y: y_bot + 12 };
      }

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pointsToSvgPath(points));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', color);
      const thickness = rel.style?.thickness ?? 2;
      path.setAttribute('stroke-width', thickness.toString());
      tagEl(path);

      if (!rel.simple) {
        const markerId = `drako-arrowhead-${index}`;
        ensureArrowMarkerDef(svgRoot, markerId, color, thickness);
        path.setAttribute('marker-end', `url(#${markerId})`);
      }

      // Circle end markers (self-loop)
      if (rel.sourceCircle) {
        const circleId = `drako-circle-src-${index}`;
        ensureCircleMarkerDef(svgRoot, circleId, color, thickness);
        path.setAttribute('marker-start', `url(#${circleId})`);
      }
      if (rel.targetCircle) {
        const circleId = `drako-circle-tgt-${index}`;
        ensureCircleMarkerDef(svgRoot, circleId, color, thickness);
        path.setAttribute('marker-end', rel.simple ? `url(#${circleId})` : path.getAttribute('marker-end') || `url(#${circleId})`);
        if (!rel.simple) {
          const circleOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          const lastPt = points[points.length - 1];
          circleOverlay.setAttribute('cx', lastPt.x.toString());
          circleOverlay.setAttribute('cy', lastPt.y.toString());
          circleOverlay.setAttribute('r', '5');
          circleOverlay.setAttribute('fill', 'none');
          circleOverlay.setAttribute('stroke', color);
          circleOverlay.setAttribute('stroke-width', '1.5');
          tagEl(circleOverlay);
          pathsLayer.appendChild(circleOverlay);
        }
      }

      // Rhombus end markers (self-loop)
      if (rel.sourceRhombus) {
        const rhombusId = `drako-rhombus-src-${index}`;
        ensureRhombusMarkerDef(svgRoot, rhombusId, color, theme.backgroundColor, thickness);
        path.setAttribute('marker-start', `url(#${rhombusId})`);
      }
      if (rel.targetRhombus) {
        const rhombusId = `drako-rhombus-tgt-${index}`;
        ensureRhombusMarkerDef(svgRoot, rhombusId, color, theme.backgroundColor, thickness);
        path.setAttribute('marker-end', rel.simple ? `url(#${rhombusId})` : path.getAttribute('marker-end') || `url(#${rhombusId})`);
      }

      const dash = strokeDashArray(rel.style?.lineStyle);
      if (dash) path.setAttribute('stroke-dasharray', dash);
      pathsLayer.appendChild(path);

      if (rel.label) {
        tagEl(renderPlainText(labelsLayer, rel.label, labelPos, theme, RELATIONSHIP_LABEL_FONT_SIZE, 'central'));
      }

      if (rel.sourceCardinality) {
        tagEl(renderCardinalityLabel(labelsLayer, rel.sourceCardinality, { x: sourceCardPos.x, y: sourceCardPos.y, baseline: 'alphabetic' }, theme));
      }
      if (rel.targetCardinality) {
        tagEl(renderCardinalityLabel(labelsLayer, rel.targetCardinality, { x: targetCardPos.x, y: targetCardPos.y, baseline: 'alphabetic' }, theme));
      }
    } else {
      // Different components
      let start: Point;
      let end: Point;
      let labelPos: Point;
      let sourceCardPos: Point;
      let targetCardPos: Point;
      let points: Point[];

      if (eitherIsLifeline) {
        const y = y_first_relation + index * REL_GAP;
        const sourceCenter = getCenter(source.globalBounds);
        const targetCenter = getCenter(target.globalBounds);

        if (sourceIsLifeline && targetIsLifeline) {
          start = { x: sourceCenter.x, y };
          end = { x: targetCenter.x, y };
        } else if (!sourceIsLifeline && targetIsLifeline) {
          const sourceBottomY = source.globalBounds.y + source.globalBounds.height;
          const rawStart = { x: sourceCenter.x, y: sourceBottomY };
          const sourceOffset = offsetMap.get(`${index}|source`) || 0;
          start = { x: rawStart.x + sourceOffset, y: rawStart.y };
          end = { x: targetCenter.x, y };
        } else if (sourceIsLifeline && !targetIsLifeline) {
          const targetBottomY = target.globalBounds.y + target.globalBounds.height;
          const rawEnd = { x: targetCenter.x, y: targetBottomY };
          const targetOffset = offsetMap.get(`${index}|target`) || 0;
          start = { x: sourceCenter.x, y };
          end = { x: rawEnd.x + targetOffset, y: rawEnd.y };
        } else {
          const sourceBottomY = source.globalBounds.y + source.globalBounds.height;
          const targetBottomY = target.globalBounds.y + target.globalBounds.height;
          const sourceOffset = offsetMap.get(`${index}|source`) || 0;
          const targetOffset = offsetMap.get(`${index}|target`) || 0;
          start = { x: sourceCenter.x + sourceOffset, y: sourceBottomY };
          end = { x: targetCenter.x + targetOffset, y: targetBottomY };
        }

        const routeType = rel.style?.routeType || 'orthogonal';

        if (routeType === 'orthogonal') {
          if (sourceIsLifeline && targetIsLifeline) {
            points = [start, end];
            labelPos = { x: (start.x + end.x) / 2, y: y - 8 };
            const offsetDir = start.x < end.x ? 1 : -1;
            sourceCardPos = { x: start.x + 15 * offsetDir, y: y - 8 };
            targetCardPos = { x: end.x - 15 * offsetDir, y: y - 8 };
          } else if (!sourceIsLifeline && targetIsLifeline) {
            const elbow = { x: start.x, y };
            points = [start, elbow, end];
            labelPos = { x: (elbow.x + end.x) / 2, y: y - 8 };
            const offsetDir = elbow.x < end.x ? 1 : -1;
            sourceCardPos = { x: start.x - 12, y: start.y + 15 };
            targetCardPos = { x: end.x - 15 * offsetDir, y: y - 8 };
          } else if (sourceIsLifeline && !targetIsLifeline) {
            const elbow = { x: end.x, y };
            points = [start, elbow, end];
            labelPos = { x: start.x + (elbow.x - start.x) / 2, y: y - 8 };
            const offsetDir = start.x < elbow.x ? 1 : -1;
            sourceCardPos = { x: start.x + 15 * offsetDir, y: y - 8 };
            targetCardPos = { x: end.x - 12, y: end.y + 15 };
          } else {
            points = [start, end];
            labelPos = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 - 8 };
            sourceCardPos = { x: start.x, y: start.y + 15 };
            targetCardPos = { x: end.x, y: end.y + 15 };
          }
          pathD = pointsToSvgPath(points);
        } else if (routeType === 'curved') {
          let startSide: 'top' | 'bottom' | 'left' | 'right';
          let endSide: 'top' | 'bottom' | 'left' | 'right';

          if (sourceIsLifeline && targetIsLifeline) {
            startSide = sourceCenter.x < targetCenter.x ? 'right' : 'left';
            endSide = sourceCenter.x < targetCenter.x ? 'left' : 'right';
          } else if (!sourceIsLifeline && targetIsLifeline) {
            startSide = 'bottom';
            endSide = sourceCenter.x < targetCenter.x ? 'left' : 'right';
          } else if (sourceIsLifeline && !targetIsLifeline) {
            startSide = sourceCenter.x < targetCenter.x ? 'right' : 'left';
            endSide = 'bottom';
          } else {
            startSide = 'bottom';
            endSide = 'top';
          }

          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const controlOffset = Math.max(30, Math.min(100, dist * 0.4));

          const cp1 = getCurveControlPoint(start, startSide, controlOffset);
          const cp2 = getCurveControlPoint(end, endSide, controlOffset);

          pathD = `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
          points = [start, cp1, cp2, end];

          const midX = 0.125 * start.x + 0.375 * cp1.x + 0.375 * cp2.x + 0.125 * end.x;
          const midY = 0.125 * start.y + 0.375 * cp1.y + 0.375 * cp2.y + 0.125 * end.y;
          const tx = 0.75 * (cp1.x - start.x) + 1.5 * (cp2.x - cp1.x) + 0.75 * (end.x - cp2.x);
          const ty = 0.75 * (cp1.y - start.y) + 1.5 * (cp2.y - cp1.y) + 0.75 * (end.y - cp2.y);
          const isHorizontal = Math.abs(tx) > Math.abs(ty);

          const placement = { anchor: { x: midX, y: midY }, segmentLength: dist, isHorizontal };
          const labelDraw = placeLabelNearSegment(placement, rel.label || '', RELATIONSHIP_LABEL_FONT_SIZE);
          labelPos = { x: labelDraw.x, y: labelDraw.y };
          labelBaseline = labelDraw.baseline;

          const sourceCardDraw = placeCardinalityNearPort(start, cp1, rel.sourceCardinality || '', CARDINALITY_FONT_SIZE);
          sourceCardPos = { x: sourceCardDraw.x, y: sourceCardDraw.y };
          sourceCardBaseline = sourceCardDraw.baseline;

          const targetCardDraw = placeCardinalityNearPort(end, cp2, rel.targetCardinality || '', CARDINALITY_FONT_SIZE);
          targetCardPos = { x: targetCardDraw.x, y: targetCardDraw.y };
          targetCardBaseline = targetCardDraw.baseline;
        } else {
          // straight
          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const len = Math.sqrt(dx * dx + dy * dy);

          let nx = 0;
          let ny = -1;
          let ux = 1;
          let uy = 0;

          if (len > 0) {
            ux = dx / len;
            uy = dy / len;
            nx = -uy;
            ny = ux;
            if (ny > 0 || (ny === 0 && nx > 0)) {
              nx = -nx;
              ny = -ny;
            }
          }

          const textOffset = 10;
          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;

          labelPos = { x: midX + nx * textOffset, y: midY + ny * textOffset };
          labelBaseline = 'alphabetic';

          const ox = len > 0 ? ux * 15 : 15;
          const oy = len > 0 ? uy * 15 : 0;

          sourceCardPos = { x: start.x + ox + nx * textOffset, y: start.y + oy + ny * textOffset };
          sourceCardBaseline = 'alphabetic';
          targetCardPos = { x: end.x - ox + nx * textOffset, y: end.y - oy + ny * textOffset };
          targetCardBaseline = 'alphabetic';

          points = [start, end];
          pathD = pointsToSvgPath(points);
        }
      } else {
        // Both are shapes (direct connection)
        const sourceCenter = getCenter(source.globalBounds);
        const targetCenter = getCenter(target.globalBounds);

        const rawStart = getBorderPort(source.globalBounds, targetCenter);
        const rawEnd = getBorderPort(target.globalBounds, sourceCenter);

        const sourceOffset = offsetMap.get(`${index}|source`) || 0;
        const targetOffset = offsetMap.get(`${index}|target`) || 0;

        start = { ...rawStart };
        end = { ...rawEnd };

        if (sourceOffset !== 0) {
          const face = getBorderFace(source.globalBounds, rawStart);
          if (face === 'left' || face === 'right') {
            start.y += sourceOffset;
          } else {
            start.x += sourceOffset;
          }
        }

        if (targetOffset !== 0) {
          const face = getBorderFace(target.globalBounds, rawEnd);
          if (face === 'left' || face === 'right') {
            end.y += targetOffset;
          } else {
            end.x += targetOffset;
          }
        }

        const routeType = rel.style?.routeType || 'straight';

        if (routeType === 'orthogonal') {
          const startSide = getBorderFace(source.globalBounds, start);
          const endSide = getBorderFace(target.globalBounds, end);
          points = routeOrthogonal(start, end, startSide, endSide, 0);
          pathD = pointsToSvgPath(points);

          const placement = getPathLabelPlacement(points);
          const labelDraw = placeLabelNearSegment(placement, rel.label || '', RELATIONSHIP_LABEL_FONT_SIZE);
          labelPos = { x: labelDraw.x, y: labelDraw.y };
          labelBaseline = labelDraw.baseline;

          const sourceCardDraw = placeCardinalityNearPort(start, points[1], rel.sourceCardinality || '', CARDINALITY_FONT_SIZE);
          sourceCardPos = { x: sourceCardDraw.x, y: sourceCardDraw.y };
          sourceCardBaseline = sourceCardDraw.baseline;

          const targetCardDraw = placeCardinalityNearPort(end, points[points.length - 2], rel.targetCardinality || '', CARDINALITY_FONT_SIZE);
          targetCardPos = { x: targetCardDraw.x, y: targetCardDraw.y };
          targetCardBaseline = targetCardDraw.baseline;
        } else if (routeType === 'curved') {
          const startSide = getBorderFace(source.globalBounds, start);
          const endSide = getBorderFace(target.globalBounds, end);

          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const controlOffset = Math.max(30, Math.min(100, dist * 0.4));

          const cp1 = getCurveControlPoint(start, startSide, controlOffset);
          const cp2 = getCurveControlPoint(end, endSide, controlOffset);

          pathD = `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
          points = [start, cp1, cp2, end]; // for markers/etc

          const midX = 0.125 * start.x + 0.375 * cp1.x + 0.375 * cp2.x + 0.125 * end.x;
          const midY = 0.125 * start.y + 0.375 * cp1.y + 0.375 * cp2.y + 0.125 * end.y;
          const tx = 0.75 * (cp1.x - start.x) + 1.5 * (cp2.x - cp1.x) + 0.75 * (end.x - cp2.x);
          const ty = 0.75 * (cp1.y - start.y) + 1.5 * (cp2.y - cp1.y) + 0.75 * (end.y - cp2.y);
          const isHorizontal = Math.abs(tx) > Math.abs(ty);

          const placement = { anchor: { x: midX, y: midY }, segmentLength: dist, isHorizontal };
          const labelDraw = placeLabelNearSegment(placement, rel.label || '', RELATIONSHIP_LABEL_FONT_SIZE);
          labelPos = { x: labelDraw.x, y: labelDraw.y };
          labelBaseline = labelDraw.baseline;

          const sourceCardDraw = placeCardinalityNearPort(start, cp1, rel.sourceCardinality || '', CARDINALITY_FONT_SIZE);
          sourceCardPos = { x: sourceCardDraw.x, y: sourceCardDraw.y };
          sourceCardBaseline = sourceCardDraw.baseline;

          const targetCardDraw = placeCardinalityNearPort(end, cp2, rel.targetCardinality || '', CARDINALITY_FONT_SIZE);
          targetCardPos = { x: targetCardDraw.x, y: targetCardDraw.y };
          targetCardBaseline = targetCardDraw.baseline;
        } else {
          // straight
          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const len = Math.sqrt(dx * dx + dy * dy);

          let nx = 0;
          let ny = -1;
          let ux = 1;
          let uy = 0;

          if (len > 0) {
            ux = dx / len;
            uy = dy / len;
            nx = -uy;
            ny = ux;
            if (ny > 0 || (ny === 0 && nx > 0)) {
              nx = -nx;
              ny = -ny;
            }
          }

          const textOffset = 10;
          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;

          labelPos = { x: midX + nx * textOffset, y: midY + ny * textOffset };
          labelBaseline = 'alphabetic';

          const ox = len > 0 ? ux * 15 : 15;
          const oy = len > 0 ? uy * 15 : 0;

          sourceCardPos = { x: start.x + ox + nx * textOffset, y: start.y + oy + ny * textOffset };
          sourceCardBaseline = 'alphabetic';
          targetCardPos = { x: end.x - ox + nx * textOffset, y: end.y - oy + ny * textOffset };
          targetCardBaseline = 'alphabetic';
          
          points = [start, end];
          pathD = pointsToSvgPath(points);
        }
      }

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathD || pointsToSvgPath(points));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', color);
      const thickness = rel.style?.thickness ?? 2;
      path.setAttribute('stroke-width', thickness.toString());
      tagEl(path);

      if (!rel.simple) {
        const markerId = `drako-arrowhead-${index}`;
        ensureArrowMarkerDef(svgRoot, markerId, color, thickness);
        path.setAttribute('marker-end', `url(#${markerId})`);
        if (rel.bidirectional) {
          path.setAttribute('marker-start', `url(#${markerId})`);
        }
      }

      // Circle end markers on source
      if (rel.sourceCircle) {
        const circleId = `drako-circle-src-${index}`;
        ensureCircleMarkerDef(svgRoot, circleId, color, thickness);
        const circleElem = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circleElem.setAttribute('cx', start.x.toString());
        circleElem.setAttribute('cy', start.y.toString());
        circleElem.setAttribute('r', '5');
        circleElem.setAttribute('fill', 'none');
        circleElem.setAttribute('stroke', color);
        circleElem.setAttribute('stroke-width', '1.5');
        tagEl(circleElem);
        pathsLayer.appendChild(circleElem);
      }

      // Circle end markers on target
      if (rel.targetCircle) {
        const circleElem = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circleElem.setAttribute('cx', end.x.toString());
        circleElem.setAttribute('cy', end.y.toString());
        circleElem.setAttribute('r', '5');
        circleElem.setAttribute('fill', 'none');
        circleElem.setAttribute('stroke', color);
        circleElem.setAttribute('stroke-width', '1.5');
        tagEl(circleElem);
        pathsLayer.appendChild(circleElem);
      }

      // Rhombus end markers on source
      if (rel.sourceRhombus) {
        const rhombusId = `drako-rhombus-src-${index}`;
        ensureRhombusMarkerDef(svgRoot, rhombusId, color, theme.backgroundColor, thickness);
        path.setAttribute('marker-start', `url(#${rhombusId})`);
      }

      // Rhombus end markers on target
      if (rel.targetRhombus) {
        const rhombusId = `drako-rhombus-tgt-${index}`;
        ensureRhombusMarkerDef(svgRoot, rhombusId, color, theme.backgroundColor, thickness);
        path.setAttribute('marker-end', rel.simple ? `url(#${rhombusId})` : path.getAttribute('marker-end') || `url(#${rhombusId})`);
      }

      const dash = strokeDashArray(rel.style?.lineStyle);
      if (dash) path.setAttribute('stroke-dasharray', dash);
      pathsLayer.appendChild(path);

      if (rel.label) {
        tagEl(renderPlainText(labelsLayer, rel.label, labelPos, theme, RELATIONSHIP_LABEL_FONT_SIZE, labelBaseline));
      }

      if (rel.sourceCardinality) {
        tagEl(renderCardinalityLabel(labelsLayer, rel.sourceCardinality, { x: sourceCardPos.x, y: sourceCardPos.y, baseline: sourceCardBaseline }, theme));
      }
      if (rel.targetCardinality) {
        tagEl(renderCardinalityLabel(labelsLayer, rel.targetCardinality, { x: targetCardPos.x, y: targetCardPos.y, baseline: targetCardBaseline }, theme));
      }
    }
  });

  return { pathsLayer, labelsLayer };
}
