import { Point, ThemeVariables, BoundingBox } from '../components/BaseComponent';
import { ParsedRelationship } from './Relationship';
import { indexComponentsById, IndexedComponent } from './componentIndex';
import { getCenter, getBorderPort } from './ports';
import {
  estimateTextWidth,
  pointsToSvgPath
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

export interface RelationshipLayers {
  pathsLayer: SVGGElement;
  labelsLayer: SVGGElement;
}

function ensureArrowMarkerDef(svgRoot: SVGSVGElement, markerId: string, color: string): void {
  let defs = svgRoot.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svgRoot.insertBefore(defs, svgRoot.firstChild);
  }

  const existingMarker = defs.querySelector(`#${markerId}`);
  if (existingMarker) {
    const arrow = existingMarker.querySelector('path');
    if (arrow) arrow.setAttribute('fill', color);
    return;
  }

  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  marker.setAttribute('id', markerId);
  marker.setAttribute('viewBox', '0 0 10 10');
  marker.setAttribute('refX', '9');
  marker.setAttribute('refY', '5');
  marker.setAttribute('markerWidth', '8');
  marker.setAttribute('markerHeight', '8');
  marker.setAttribute('orient', 'auto-start-reverse');

  const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrow.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
  arrow.setAttribute('fill', color);
  marker.appendChild(arrow);
  defs.appendChild(marker);
}

/** Ensure an open-circle SVG marker is defined in the SVG <defs>. */
function ensureCircleMarkerDef(svgRoot: SVGSVGElement, markerId: string, color: string): void {
  let defs = svgRoot.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svgRoot.insertBefore(defs, svgRoot.firstChild);
  }

  if (defs.querySelector(`#${markerId}`)) return;

  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  marker.setAttribute('id', markerId);
  marker.setAttribute('viewBox', '0 0 12 12');
  marker.setAttribute('refX', '6');
  marker.setAttribute('refY', '6');
  marker.setAttribute('markerWidth', '10');
  marker.setAttribute('markerHeight', '10');
  marker.setAttribute('orient', 'auto-start-reverse');

  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '6');
  circle.setAttribute('cy', '6');
  circle.setAttribute('r', '4');
  circle.setAttribute('fill', 'none');
  circle.setAttribute('stroke', color);
  circle.setAttribute('stroke-width', '1.5');
  marker.appendChild(circle);
  defs.appendChild(marker);
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
): void {
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
}

function renderCardinalityLabel(
  group: SVGGElement,
  text: string,
  draw: { x: number; y: number; baseline: 'alphabetic' | 'central' },
  theme: ThemeVariables
): void {
  renderPlainText(
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
      pathsLayer.appendChild(lifeline);
    }
  });

  // Step 3: Draw each relationship sequentially or directly
  relationships.forEach((rel, index) => {
    const source = componentIndex.get(rel.sourceId);
    const target = componentIndex.get(rel.targetId);

    if (!source || !target) {
      throw new Error(
        `Relationship references unknown component: ${!source ? rel.sourceId : rel.targetId}`
      );
    }

    const sourceIsLifeline = source.component.lifeline;
    const targetIsLifeline = target.component.lifeline;
    const eitherIsLifeline = sourceIsLifeline || targetIsLifeline;

    const rawColor = rel.style?.color || 'borderColor';
    const color = (rawColor in theme) ? theme[rawColor] : rawColor;

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
      path.setAttribute('stroke-width', '2');

      if (!rel.simple) {
        const markerId = `drako-arrowhead-${index}`;
        ensureArrowMarkerDef(svgRoot, markerId, color);
        path.setAttribute('marker-end', `url(#${markerId})`);
      }

      // Circle end markers (self-loop)
      if (rel.sourceCircle) {
        const circleId = `drako-circle-src-${index}`;
        ensureCircleMarkerDef(svgRoot, circleId, color);
        path.setAttribute('marker-start', `url(#${circleId})`);
      }
      if (rel.targetCircle) {
        const circleId = `drako-circle-tgt-${index}`;
        ensureCircleMarkerDef(svgRoot, circleId, color);
        path.setAttribute('marker-end', rel.simple ? `url(#${circleId})` : path.getAttribute('marker-end') || `url(#${circleId})`);
        if (!rel.simple) {
          // Place circle before the arrowhead — use marker-start on a reversed path trick;
          // instead we just note both circle and arrowhead on the end:
          // For simplicity, set a combined marker: arrowhead takes marker-end, circle is
          // drawn inline near the endpoint. We simply add a separate circle overlay element.
          const circleOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          const lastPt = points[points.length - 1];
          circleOverlay.setAttribute('cx', lastPt.x.toString());
          circleOverlay.setAttribute('cy', lastPt.y.toString());
          circleOverlay.setAttribute('r', '5');
          circleOverlay.setAttribute('fill', 'none');
          circleOverlay.setAttribute('stroke', color);
          circleOverlay.setAttribute('stroke-width', '1.5');
          pathsLayer.appendChild(circleOverlay);
        }
      }

      const dash = strokeDashArray(rel.style?.lineStyle);
      if (dash) path.setAttribute('stroke-dasharray', dash);
      pathsLayer.appendChild(path);

      if (rel.label) {
        renderPlainText(labelsLayer, rel.label, labelPos, theme, RELATIONSHIP_LABEL_FONT_SIZE, 'central');
      }

      if (rel.sourceCardinality) {
        renderCardinalityLabel(labelsLayer, rel.sourceCardinality, { x: sourceCardPos.x, y: sourceCardPos.y, baseline: 'alphabetic' }, theme);
      }
      if (rel.targetCardinality) {
        renderCardinalityLabel(labelsLayer, rel.targetCardinality, { x: targetCardPos.x, y: targetCardPos.y, baseline: 'alphabetic' }, theme);
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
          points = [start, end];

          labelPos = { x: (start.x + end.x) / 2, y: y - 8 };
          const offsetDir = start.x < end.x ? 1 : -1;
          sourceCardPos = { x: start.x + 15 * offsetDir, y: y - 8 };
          targetCardPos = { x: end.x - 15 * offsetDir, y: y - 8 };
        } else if (!sourceIsLifeline && targetIsLifeline) {
          const sourceBottomY = source.globalBounds.y + source.globalBounds.height;
          const rawStart = { x: sourceCenter.x, y: sourceBottomY };
          const sourceOffset = offsetMap.get(`${index}|source`) || 0;

          start = { x: rawStart.x + sourceOffset, y: rawStart.y };
          const elbow = { x: start.x, y };
          end = { x: targetCenter.x, y };
          points = [start, elbow, end];

          labelPos = { x: (elbow.x + end.x) / 2, y: y - 8 };
          const offsetDir = elbow.x < end.x ? 1 : -1;
          sourceCardPos = { x: start.x - 12, y: start.y + 15 };
          targetCardPos = { x: end.x - 15 * offsetDir, y: y - 8 };
        } else if (sourceIsLifeline && !targetIsLifeline) {
          const targetBottomY = target.globalBounds.y + target.globalBounds.height;
          const rawEnd = { x: targetCenter.x, y: targetBottomY };
          const targetOffset = offsetMap.get(`${index}|target`) || 0;

          start = { x: sourceCenter.x, y };
          const elbow = { x: rawEnd.x + targetOffset, y };
          end = { x: rawEnd.x + targetOffset, y: rawEnd.y };
          points = [start, elbow, end];

          labelPos = { x: start.x + (elbow.x - start.x) / 2, y: y - 8 };
          const offsetDir = start.x < elbow.x ? 1 : -1;
          sourceCardPos = { x: start.x + 15 * offsetDir, y: y - 8 };
          targetCardPos = { x: end.x - 12, y: end.y + 15 };
        } else {
          // Fallback: both are shapes but eitherIsLifeline is true
          const sourceBottomY = source.globalBounds.y + source.globalBounds.height;
          const targetBottomY = target.globalBounds.y + target.globalBounds.height;
          const sourceOffset = offsetMap.get(`${index}|source`) || 0;
          const targetOffset = offsetMap.get(`${index}|target`) || 0;

          start = { x: sourceCenter.x + sourceOffset, y: sourceBottomY };
          end = { x: targetCenter.x + targetOffset, y: targetBottomY };
          points = [start, end];

          labelPos = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 - 8 };
          sourceCardPos = { x: start.x, y: start.y + 15 };
          targetCardPos = { x: end.x, y: end.y + 15 };
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
          // Ensure the normal vector consistently points to the "upper" half-plane
          // (or "left" if strictly vertical) so text is always on the same side.
          if (ny > 0 || (ny === 0 && nx > 0)) {
            nx = -nx;
            ny = -ny;
          }
        }

        const textOffset = 10; // offset distance perpendicular to the line
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        labelPos = { x: midX + nx * textOffset, y: midY + ny * textOffset };

        const ox = len > 0 ? ux * 15 : 15;
        const oy = len > 0 ? uy * 15 : 0;

        sourceCardPos = { x: start.x + ox + nx * textOffset, y: start.y + oy + ny * textOffset };
        targetCardPos = { x: end.x - ox + nx * textOffset, y: end.y - oy + ny * textOffset };
        
        points = [start, end];
      }

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pointsToSvgPath(points));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', '2');

      if (!rel.simple) {
        const markerId = `drako-arrowhead-${index}`;
        ensureArrowMarkerDef(svgRoot, markerId, color);
        path.setAttribute('marker-end', `url(#${markerId})`);
        if (rel.bidirectional) {
          path.setAttribute('marker-start', `url(#${markerId})`);
        }
      }

      // Circle end markers on source
      if (rel.sourceCircle) {
        const circleId = `drako-circle-src-${index}`;
        ensureCircleMarkerDef(svgRoot, circleId, color);
        // Draw inline circle at the start point
        const circleElem = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circleElem.setAttribute('cx', start.x.toString());
        circleElem.setAttribute('cy', start.y.toString());
        circleElem.setAttribute('r', '5');
        circleElem.setAttribute('fill', 'none');
        circleElem.setAttribute('stroke', color);
        circleElem.setAttribute('stroke-width', '1.5');
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
        pathsLayer.appendChild(circleElem);
      }

      const dash = strokeDashArray(rel.style?.lineStyle);
      if (dash) path.setAttribute('stroke-dasharray', dash);
      pathsLayer.appendChild(path);

      if (rel.label) {
        renderPlainText(labelsLayer, rel.label, labelPos, theme, RELATIONSHIP_LABEL_FONT_SIZE, 'alphabetic');
      }

      if (rel.sourceCardinality) {
        renderCardinalityLabel(labelsLayer, rel.sourceCardinality, { x: sourceCardPos.x, y: sourceCardPos.y, baseline: 'alphabetic' }, theme);
      }
      if (rel.targetCardinality) {
        renderCardinalityLabel(labelsLayer, rel.targetCardinality, { x: targetCardPos.x, y: targetCardPos.y, baseline: 'alphabetic' }, theme);
      }
    }
  });

  return { pathsLayer, labelsLayer };
}
