import { BaseComponent, ThemeVariables, Dimension, Point, BoundingBox } from '../components/BaseComponent';
import { VerticalContainerComponent } from '../components/VerticalContainerComponent';
import { ParsedRelationship } from './Relationship';
import { estimateTextWidth } from './routing';

const ROOT_GAP = 40;
const ROOT_START_X = 80;
const ROOT_START_Y = 80;
const LAYER_GAP = 100;
const NODE_GAP = 36;

export interface ContainerComponent extends BaseComponent {
  children: BaseComponent[];
  layoutChildren(theme: ThemeVariables): void;
}

export function isContainer(comp: BaseComponent): comp is ContainerComponent {
  return 'children' in comp && Array.isArray((comp as any).children) && typeof (comp as any).layoutChildren === 'function';
}

export function getRootParent(id: string, rootComponents: BaseComponent[]): BaseComponent | null {
  const search = (comp: BaseComponent): boolean => {
    if (comp.id === id) return true;
    if (isContainer(comp)) {
      for (const child of comp.children) {
        if (search(child)) return true;
      }
    }
    return false;
  };

  for (const root of rootComponents) {
    if (search(root)) return root;
  }
  return null;
}

export function getGlobalBounds(
  id: string,
  rootComponents: BaseComponent[]
): { x: number; y: number; width: number; height: number } | null {
  const search = (
    comp: BaseComponent,
    parentX: number,
    parentY: number
  ): { x: number; y: number; width: number; height: number } | null => {
    const currentX = parentX + comp.bounds.x;
    const currentY = parentY + comp.bounds.y;
    
    if (comp.id === id) {
      return {
        x: currentX,
        y: currentY,
        width: comp.bounds.width,
        height: comp.bounds.height
      };
    }
    
    if (isContainer(comp)) {
      for (const child of comp.children) {
        const found = search(child, currentX, currentY);
        if (found) return found;
      }
    }
    
    return null;
  };

  for (const root of rootComponents) {
    const found = search(root, 0, 0);
    if (found) return found;
  }
  
  return null;
}

export function isLifelineComponent(id: string, rootComponents: BaseComponent[]): boolean {
  const search = (comp: BaseComponent): BaseComponent | null => {
    if (comp.id === id) return comp;
    if (isContainer(comp)) {
      for (const child of comp.children) {
        const found = search(child);
        if (found) return found;
      }
    }
    return null;
  };

  for (const root of rootComponents) {
    const comp = search(root);
    if (comp) return comp.lifeline;
  }
  return false;
}

/**
 * Assign layer indices from relationship direction (source left of target).
 */
export function assignLayers(
  components: BaseComponent[],
  relationships: ParsedRelationship[]
): Map<string, number> {
  const layers = new Map<string, number>();
  components.forEach(c => layers.set(c.id, 0));

  const getRootId = (id: string): string => {
    const parent = getRootParent(id, components);
    return parent ? parent.id : id;
  };

  const seenPairs = new Set<string>();

  // Filter out bidirectional and backward/cyclic relationship edges based on defined order
  const forwardRelations = relationships.filter(rel => {
    if (rel.bidirectional) return false;
    const sourceRootId = getRootId(rel.sourceId);
    const targetRootId = getRootId(rel.targetId);
    if (sourceRootId === targetRootId) return false;

    const pairKey = [sourceRootId, targetRootId].sort().join('|');
    if (seenPairs.has(pairKey)) {
      return false;
    }
    seenPairs.add(pairKey);
    return true;
  });

  let changed = true;
  let iterations = 0;
  const maxIterations = components.length;

  while (changed && iterations < maxIterations) {
    changed = false;
    for (const rel of forwardRelations) {
      const sourceRootId = getRootId(rel.sourceId);
      const targetRootId = getRootId(rel.targetId);

      const sourceLayer = layers.get(sourceRootId) ?? 0;
      const targetLayer = layers.get(targetRootId) ?? 0;
      const nextTarget = sourceLayer + 1;
      if (nextTarget > targetLayer) {
        layers.set(targetRootId, nextTarget);
        changed = true;
      }
    }
    iterations++;
  }

  // Post-processing to resolve layer collisions when lifeline components are present.
  // Enforce that every lifeline component occupies its layer exclusively.
  const hasLifelines = components.some(c => c.lifeline);
  if (hasLifelines) {
    const sorted = [...components].sort((a, b) => {
      const la = layers.get(a.id) ?? 0;
      const lb = layers.get(b.id) ?? 0;
      return la - lb;
    });

    let nextAvailableLayer = 0;
    let lastNonLifelineOrigLayer = -1;
    let lastNonLifelineAssignedLayer = -1;

    sorted.forEach(c => {
      const origLayer = layers.get(c.id) ?? 0;
      if (c.lifeline) {
        const assignedLayer = Math.max(origLayer, nextAvailableLayer);
        layers.set(c.id, assignedLayer);
        nextAvailableLayer = assignedLayer + 1;
      } else {
        let assignedLayer: number;
        if (lastNonLifelineOrigLayer === origLayer && lastNonLifelineOrigLayer !== -1) {
          assignedLayer = lastNonLifelineAssignedLayer;
        } else {
          assignedLayer = Math.max(origLayer, nextAvailableLayer);
          lastNonLifelineOrigLayer = origLayer;
          lastNonLifelineAssignedLayer = assignedLayer;
          nextAvailableLayer = assignedLayer + 1;
        }
        layers.set(c.id, assignedLayer);
      }
    });
  }

  return layers;
}

/**
 * Assign bounds for a component tree and return total size used.
 */
export function layoutComponent(
  component: BaseComponent,
  theme: ThemeVariables,
  x: number,
  y: number,
  maxConnections: number = 0
): Dimension {
  const minDim = component.calculateMinDimensions(theme);
  const connectionSpacing = 32; // Spacing needed per connection to avoid overlapping labels/lines
  const minHeightForPorts = (maxConnections + 1) * connectionSpacing;
  const height = Math.max(minDim.height, minHeightForPorts);

  if (isContainer(component)) {
    component.bounds = {
      x,
      y,
      width: minDim.width,
      height: height
    };
    component.layoutChildren(theme);
    return { width: minDim.width, height: height };
  }

  component.bounds = {
    x,
    y,
    width: minDim.width,
    height: height
  };
  return { width: minDim.width, height: height };
}

/**
 * Stack top-level components vertically (no relationships).
 */
function layoutVerticalStack(components: BaseComponent[], theme: ThemeVariables): void {
  let y = ROOT_START_Y;
  components.forEach(component => {
    const size = layoutComponent(component, theme, ROOT_START_X, y);
    y += size.height + ROOT_GAP;
  });
}

/**
 * Estimate the minimum horizontal gap needed between two adjacent layers,
 * based on the widths of relationship labels and cardinality text that will
 * be drawn on the connecting paths.
 */
function computeMinLayerGap(
  fromLayerIds: Set<string>,
  toLayerIds: Set<string>,
  relationships: ParsedRelationship[]
): number {
  const LABEL_FONT_SIZE = 12;
  const CARD_FONT_SIZE = 11;
  const CARD_SIDE_PADDING = 28; // space consumed by cardinality near each port
  const LABEL_PADDING = 24;     // extra breathing room around the label

  let maxNeeded = LAYER_GAP;

  for (const rel of relationships) {
    const crosses =
      (fromLayerIds.has(rel.sourceId) && toLayerIds.has(rel.targetId)) ||
      (fromLayerIds.has(rel.targetId) && toLayerIds.has(rel.sourceId));
    if (!crosses) continue;

    // Each cardinality eats CARD_SIDE_PADDING px near its port.
    // The label must fit in the remaining central space, or we widen the gap.
    const srcCard = rel.sourceCardinality
      ? estimateTextWidth(`[${rel.sourceCardinality}]`, CARD_FONT_SIZE) + CARD_SIDE_PADDING
      : 0;
    const tgtCard = rel.targetCardinality
      ? estimateTextWidth(`[${rel.targetCardinality}]`, CARD_FONT_SIZE) + CARD_SIDE_PADDING
      : 0;
    const labelW = rel.label
      ? estimateTextWidth(rel.label, LABEL_FONT_SIZE) + LABEL_PADDING
      : 0;

    const needed = Math.max(srcCard + labelW + tgtCard, LAYER_GAP);
    maxNeeded = Math.max(maxNeeded, needed);
  }

  return maxNeeded;
}

/**
 * Layer components left-to-right by relationship dependency.
 */
function layoutByLayers(
  components: BaseComponent[],
  relationships: ParsedRelationship[],
  theme: ThemeVariables
): void {
  const layers = assignLayers(
    components,
    relationships
  );

  const getRootId = (id: string): string => {
    const parent = getRootParent(id, components);
    return parent ? parent.id : id;
  };

  // Pre-process relationship sides based on layer comparison (excluding sequence flows)
  const relPreferred = relationships
    .map((rel, index) => {
      const srcRootId = getRootId(rel.sourceId);
      const tgtRootId = getRootId(rel.targetId);
      const srcLayer = layers.get(srcRootId) ?? 0;
      const tgtLayer = layers.get(tgtRootId) ?? 0;
      const isTargetToRight = tgtLayer >= srcLayer;
      return {
        index,
        sourceId: srcRootId,
        targetId: tgtRootId,
        sourceSide: (isTargetToRight ? 'right' : 'left') as 'left' | 'right' | 'top' | 'bottom',
        targetSide: (isTargetToRight ? 'left' : 'right') as 'left' | 'right' | 'top' | 'bottom',
        isSequence: isLifelineComponent(rel.sourceId, components) || isLifelineComponent(rel.targetId, components)
      };
    })
    .filter(r => !r.isSequence);

  const finalSourceSides = new Map<number, 'left' | 'right' | 'top' | 'bottom'>();
  const finalTargetSides = new Map<number, 'left' | 'right' | 'top' | 'bottom'>();

  relPreferred.forEach(({ index, sourceSide, targetSide }) => {
    finalSourceSides.set(index, sourceSide);
    finalTargetSides.set(index, targetSide);
  });

  const componentSideList = new Map<string, number[]>();
  relPreferred.forEach(({ index, sourceId, targetId, sourceSide, targetSide }) => {
    const srcKey = `${sourceId}-${sourceSide}`;
    if (!componentSideList.has(srcKey)) componentSideList.set(srcKey, []);
    componentSideList.get(srcKey)!.push(index);

    const tgtKey = `${targetId}-${targetSide}`;
    if (!componentSideList.has(tgtKey)) componentSideList.set(tgtKey, []);
    componentSideList.get(tgtKey)!.push(index);
  });

  componentSideList.forEach((list, key) => {
    if (list.length > 2) {
      const first = list[0];
      const last = list[list.length - 1];
      const compId = key.substring(0, key.lastIndexOf('-'));
      
      const firstRel = relPreferred[first];
      if (firstRel.sourceId === compId) {
        finalSourceSides.set(first, 'top');
      } else {
        finalTargetSides.set(first, 'top');
      }

      const lastRel = relPreferred[last];
      if (lastRel.sourceId === compId) {
        finalSourceSides.set(last, 'bottom');
      } else {
        finalTargetSides.set(last, 'bottom');
      }
    }
  });

  const finalCounts = new Map<string, number>();
  relPreferred.forEach(({ index, sourceId, targetId }) => {
    const sSide = finalSourceSides.get(index)!;
    const tSide = finalTargetSides.get(index)!;

    const srcKey = `${sourceId}-${sSide}`;
    finalCounts.set(srcKey, (finalCounts.get(srcKey) || 0) + 1);

    const tgtKey = `${targetId}-${tSide}`;
    finalCounts.set(tgtKey, (finalCounts.get(tgtKey) || 0) + 1);
  });

  const maxConnectionsMap = new Map<string, number>();
  components.forEach(component => {
    const left = finalCounts.get(`${component.id}-left`) || 0;
    const right = finalCounts.get(`${component.id}-right`) || 0;
    maxConnectionsMap.set(component.id, Math.max(left, right));
  });

  const byLayer = new Map<number, BaseComponent[]>();
  components.forEach(component => {
    const layer = layers.get(component.id) ?? 0;
    if (!byLayer.has(layer)) byLayer.set(layer, []);
    byLayer.get(layer)!.push(component);
  });

  const sortedLayers = Array.from(byLayer.keys()).sort((a, b) => a - b);
  let x = ROOT_START_X;
  const laidOut: BaseComponent[] = [];

  sortedLayers.forEach((layerNum, idx) => {
    const layerComponents = byLayer.get(layerNum)!;

    // Barycenter vertical sorting heuristic
    const getBarycenter = (comp: BaseComponent): number => {
      let sumY = 0;
      let count = 0;
      
      relationships.forEach(rel => {
        const srcRoot = getRootParent(rel.sourceId, components);
        const tgtRoot = getRootParent(rel.targetId, components);
        
        if (srcRoot === comp || tgtRoot === comp) {
          const otherRoot = srcRoot === comp ? tgtRoot : srcRoot;
          if (otherRoot && laidOut.includes(otherRoot)) {
            const centerY = otherRoot.bounds.y + otherRoot.bounds.height / 2;
            sumY += centerY;
            count++;
          }
        }
      });
      
      return count > 0 ? sumY / count : Infinity;
    };

    const compWithBary = layerComponents.map((comp, originalIndex) => ({
      comp,
      originalIndex,
      bary: getBarycenter(comp)
    }));

    compWithBary.sort((a, b) => {
      const aHasBary = a.bary !== Infinity;
      const bHasBary = b.bary !== Infinity;
      if (aHasBary && bHasBary) {
        return a.bary - b.bary;
      }
      if (aHasBary && !bHasBary) return -1;
      if (!aHasBary && bHasBary) return 1;
      return a.originalIndex - b.originalIndex;
    });

    const sortedLayerComponents = compWithBary.map(x => x.comp);

    let y = ROOT_START_Y;
    let maxWidth = 0;
    let prevComponent: BaseComponent | null = null;

    sortedLayerComponents.forEach(component => {
      const maxConnections = maxConnectionsMap.get(component.id) || 0;
      if (prevComponent) {
        const hasRel = relationships.some(rel => {
          const srcRoot = getRootParent(rel.sourceId, components);
          const tgtRoot = getRootParent(rel.targetId, components);
          return (
            (srcRoot === component && tgtRoot === prevComponent) ||
            (srcRoot === prevComponent && tgtRoot === component)
          );
        });
        if (hasRel) {
          y += 50;
        }
      }
      let size = layoutComponent(component, theme, x, y, maxConnections);
      
      let hasOverlap = true;
      let attempts = 0;
      while (hasOverlap && attempts < 20) {
        hasOverlap = false;
        
        // A: Check if this component intersects existing relationship lines
        for (const rel of relationships) {
          // Skip sequence diagram lifeline relationships as they run below the component headers
          if (isLifelineComponent(rel.sourceId, components) || isLifelineComponent(rel.targetId, components)) {
            continue;
          }
          const srcRoot = getRootParent(rel.sourceId, components);
          const tgtRoot = getRootParent(rel.targetId, components);
          
          if (srcRoot === component || tgtRoot === component) {
            // Necessary relationship line entering this component/container
            continue;
          }
          
          const srcIsLaidOut = srcRoot && laidOut.includes(srcRoot);
          const tgtIsLaidOut = tgtRoot && laidOut.includes(tgtRoot);
          
          if (srcIsLaidOut && tgtIsLaidOut) {
            const srcBounds = getGlobalBounds(rel.sourceId, components);
            const tgtBounds = getGlobalBounds(rel.targetId, components);
            if (srcBounds && tgtBounds) {
              const p1 = { x: srcBounds.x + srcBounds.width / 2, y: srcBounds.y + srcBounds.height / 2 };
              const p2 = { x: tgtBounds.x + tgtBounds.width / 2, y: tgtBounds.y + tgtBounds.height / 2 };
              if (segmentIntersectsRect(p1, p2, component.bounds)) {
                hasOverlap = true;
                break;
              }
            }
          }
        }
        
        if (hasOverlap) {
          y += 60; // Shift down
          size = layoutComponent(component, theme, x, y, maxConnections);
          attempts++;
          continue;
        }

        // B: Check if lines from this component (or its children) to existing components intersect other existing components
        for (const rel of relationships) {
          // Skip sequence diagram lifeline relationships as they run below the component headers
          if (isLifelineComponent(rel.sourceId, components) || isLifelineComponent(rel.targetId, components)) {
            continue;
          }
          const srcRoot = getRootParent(rel.sourceId, components);
          const tgtRoot = getRootParent(rel.targetId, components);
          
          if (srcRoot === component || tgtRoot === component) {
            const otherRoot = srcRoot === component ? tgtRoot : srcRoot;
            
            if (otherRoot && laidOut.includes(otherRoot)) {
              const srcBounds = getGlobalBounds(rel.sourceId, components);
              const tgtBounds = getGlobalBounds(rel.targetId, components);
              if (srcBounds && tgtBounds) {
                const p1 = { x: srcBounds.x + srcBounds.width / 2, y: srcBounds.y + srcBounds.height / 2 };
                const p2 = { x: tgtBounds.x + tgtBounds.width / 2, y: tgtBounds.y + tgtBounds.height / 2 };
                
                for (const c of laidOut) {
                  if (c !== component && c !== otherRoot) {
                    if (segmentIntersectsRect(p1, p2, c.bounds)) {
                      hasOverlap = true;
                      break;
                    }
                  }
                }
                if (hasOverlap) break;
              }
            }
          }
        }

        if (hasOverlap) {
          y += 60; // Shift down
          size = layoutComponent(component, theme, x, y, maxConnections);
          attempts++;
        }
      }

      maxWidth = Math.max(maxWidth, size.width);
      laidOut.push(component);
      y += size.height + NODE_GAP;
      prevComponent = component;
    });

    // Compute a dynamic gap toward the next layer that fits label/cardinality text.
    const nextLayerNum = sortedLayers[idx + 1];
    let gap = LAYER_GAP;
    if (nextLayerNum !== undefined) {
      const fromIds = new Set(layerComponents.map(c => c.id));
      const toIds = new Set((byLayer.get(nextLayerNum) ?? []).map(c => c.id));
      gap = computeMinLayerGap(fromIds, toIds, relationships);
    }

    x += maxWidth + gap;
  });
}

/**
 * Position root components on the canvas.
 */
export function layoutRootComponents(
  components: BaseComponent[],
  theme: ThemeVariables,
  relationships: ParsedRelationship[] = []
): void {
  if (relationships.length > 0) {
    layoutByLayers(components, relationships, theme);
  } else {
    let x = ROOT_START_X;
    const y = ROOT_START_Y;
    const COLUMN_GAP = 140;

    components.forEach(component => {
      const size = layoutComponent(component, theme, x, y);
      x += size.width + COLUMN_GAP;
    });
  }
}

function segmentsIntersect(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
  d: { x: number; y: number }
): boolean {
  const det = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
  if (det === 0) return false; // Parallel

  const t = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / det;
  const u = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / det;

  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

function segmentIntersectsRect(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  const inside = (p: { x: number; y: number }) =>
    p.x >= rect.x && p.x <= rect.x + rect.width &&
    p.y >= rect.y && p.y <= rect.y + rect.height;
    
  if (inside(p1) || inside(p2)) return true;

  const left = { p1: { x: rect.x, y: rect.y }, p2: { x: rect.x, y: rect.y + rect.height } };
  const right = { p1: { x: rect.x + rect.width, y: rect.y }, p2: { x: rect.x + rect.width, y: rect.y + rect.height } };
  const top = { p1: { x: rect.x, y: rect.y }, p2: { x: rect.x + rect.width, y: rect.y } };
  const bottom = { p1: { x: rect.x, y: rect.y + rect.height }, p2: { x: rect.x + rect.width, y: rect.y + rect.height } };

  return (
    segmentsIntersect(p1, p2, left.p1, left.p2) ||
    segmentsIntersect(p1, p2, right.p1, right.p2) ||
    segmentsIntersect(p1, p2, top.p1, top.p2) ||
    segmentsIntersect(p1, p2, bottom.p1, bottom.p2)
  );
}
