import { BaseComponent, ThemeVariables } from '../../components/BaseComponent';
import { ParsedRelationship } from '../Relationship';

export interface MindmapTreeNode {
  component: BaseComponent;
  depth: number;
  branchIndex: number;
  branchColor: string;
  parent: MindmapTreeNode | null;
  children: MindmapTreeNode[];
  weight: number;
  angleSector: { start: number; end: number };
  centerAngle: number;
  relationship?: ParsedRelationship;
}

export interface MindmapCrossLink {
  relationship: ParsedRelationship;
  source: BaseComponent;
  target: BaseComponent;
  sourceNode?: MindmapTreeNode;
  targetNode?: MindmapTreeNode;
}

export interface MindmapLayoutResult {
  rootNode: MindmapTreeNode;
  allNodes: MindmapTreeNode[];
  components: BaseComponent[];
  treeEdges: Array<{
    parent: MindmapTreeNode;
    child: MindmapTreeNode;
    relationship?: ParsedRelationship;
    branchColor: string;
  }>;
  crossLinks: MindmapCrossLink[];
  bbox: { x: number; y: number; width: number; height: number };
}

// Curated harmonious branch colors matching modern visual design
export const MINDMAP_BRANCH_COLORS = [
  '#86198f', // Purple / Magenta (top-left branch in reference)
  '#0e7490', // Cyan / Teal (right branch in reference)
  '#9a3412', // Amber / Rust / Brown (bottom branch in reference)
  '#4338ca', // Indigo
  '#047857', // Emerald
  '#b91c1c', // Ruby Red
  '#c2410c', // Dark Orange
  '#6d28d9', // Violet
  '#be185d', // Rose Pink
  '#0284c7', // Sky Blue
];

/**
 * Determine the root component for the mindmap:
 * 1. Explicit parameter in layout directive, e.g. @layout: mindmap(RootNode)
 * 2. Component with the highest degree (most relationships)
 * 3. First component in list as fallback
 */
export function determineRootComponent(
  components: BaseComponent[],
  relationships: ParsedRelationship[],
  layoutDirective?: string
): BaseComponent {
  if (components.length === 0) {
    throw new Error('Cannot compute mindmap layout without components.');
  }

  // 1. Check for explicit parameter in layout directive: mindmap(RootId)
  if (layoutDirective) {
    const match = layoutDirective.match(/mindmap\s*\(\s*([a-zA-Z0-9_-]+)\s*\)/i);
    if (match) {
      const explicitId = match[1];
      const found = components.find(c => c.id.toLowerCase() === explicitId.toLowerCase());
      if (found) {
        return found;
      }
    }
  }

  // 2. Count total degrees (in + out) for each component
  const degreeMap = new Map<string, number>();
  const outDegreeMap = new Map<string, number>();

  components.forEach(c => {
    degreeMap.set(c.id, 0);
    outDegreeMap.set(c.id, 0);
  });

  relationships.forEach(rel => {
    if (degreeMap.has(rel.sourceId)) {
      degreeMap.set(rel.sourceId, (degreeMap.get(rel.sourceId) || 0) + 1);
      outDegreeMap.set(rel.sourceId, (outDegreeMap.get(rel.sourceId) || 0) + 1);
    }
    if (degreeMap.has(rel.targetId)) {
      degreeMap.set(rel.targetId, (degreeMap.get(rel.targetId) || 0) + 1);
    }
  });

  // Sort components: highest total degree, then highest out-degree, then initial order
  const sorted = [...components].sort((a, b) => {
    const degA = degreeMap.get(a.id) || 0;
    const degB = degreeMap.get(b.id) || 0;
    if (degB !== degA) return degB - degA;

    const outA = outDegreeMap.get(a.id) || 0;
    const outB = outDegreeMap.get(b.id) || 0;
    if (outB !== outA) return outB - outA;

    return 0;
  });

  return sorted[0];
}

/**
 * Build a BFS spanning tree from the relationship graph starting at rootComponent.
 */
export function buildMindmapTree(
  rootComponent: BaseComponent,
  allComponents: BaseComponent[],
  relationships: ParsedRelationship[]
): {
  rootNode: MindmapTreeNode;
  allNodes: MindmapTreeNode[];
  treeEdges: Array<{
    parent: MindmapTreeNode;
    child: MindmapTreeNode;
    relationship?: ParsedRelationship;
    branchColor: string;
  }>;
  crossLinks: MindmapCrossLink[];
} {
  const compMap = new Map<string, BaseComponent>();
  allComponents.forEach(c => compMap.set(c.id, c));

  // Build undirected adjacency list with relationship metadata
  const adj = new Map<string, Array<{ neighborId: string; rel: ParsedRelationship; isOut: boolean }>>();
  allComponents.forEach(c => adj.set(c.id, []));

  relationships.forEach(rel => {
    if (adj.has(rel.sourceId) && adj.has(rel.targetId)) {
      adj.get(rel.sourceId)!.push({ neighborId: rel.targetId, rel, isOut: true });
      adj.get(rel.targetId)!.push({ neighborId: rel.sourceId, rel, isOut: false });
    }
  });

  const rootNode: MindmapTreeNode = {
    component: rootComponent,
    depth: 0,
    branchIndex: -1,
    branchColor: '#475569',
    parent: null,
    children: [],
    weight: 1,
    angleSector: { start: 0, end: 2 * Math.PI },
    centerAngle: 0
  };

  const nodeMap = new Map<string, MindmapTreeNode>();
  nodeMap.set(rootComponent.id, rootNode);

  const allNodes: MindmapTreeNode[] = [rootNode];
  const treeEdges: Array<{
    parent: MindmapTreeNode;
    child: MindmapTreeNode;
    relationship?: ParsedRelationship;
    branchColor: string;
  }> = [];
  const crossLinks: MindmapCrossLink[] = [];

  const visitedRelSet = new Set<ParsedRelationship>();
  const queue: MindmapTreeNode[] = [rootNode];

  // BFS spanning tree
  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = adj.get(current.component.id) || [];

    // Prioritize outgoing relationships first, then incoming
    neighbors.sort((a, b) => (a.isOut === b.isOut ? 0 : a.isOut ? -1 : 1));

    neighbors.forEach(({ neighborId, rel }) => {
      if (visitedRelSet.has(rel)) return;

      const neighborComp = compMap.get(neighborId);
      if (!neighborComp) return;

      if (!nodeMap.has(neighborId)) {
        visitedRelSet.add(rel);

        let branchIndex = current.branchIndex;
        let branchColor = current.branchColor;

        if (current.depth === 0) {
          // This is a top-level main branch
          branchIndex = current.children.length;
          branchColor = MINDMAP_BRANCH_COLORS[branchIndex % MINDMAP_BRANCH_COLORS.length];
        }

        const childNode: MindmapTreeNode = {
          component: neighborComp,
          depth: current.depth + 1,
          branchIndex,
          branchColor,
          parent: current,
          children: [],
          weight: 1,
          angleSector: { start: 0, end: 0 },
          centerAngle: 0,
          relationship: rel
        };

        current.children.push(childNode);
        nodeMap.set(neighborId, childNode);
        allNodes.push(childNode);
        treeEdges.push({
          parent: current,
          child: childNode,
          relationship: rel,
          branchColor
        });

        queue.push(childNode);
      } else {
        // Neighbor already visited: record as cross-link
        const targetNode = nodeMap.get(neighborId);
        if (targetNode && targetNode !== current.parent) {
          visitedRelSet.add(rel);
          crossLinks.push({
            relationship: rel,
            source: current.component,
            target: targetNode.component,
            sourceNode: current,
            targetNode
          });
        }
      }
    });
  }

  // Handle any disconnected components (add as secondary branches to root)
  allComponents.forEach(comp => {
    if (!nodeMap.has(comp.id)) {
      const branchIndex = rootNode.children.length;
      const branchColor = MINDMAP_BRANCH_COLORS[branchIndex % MINDMAP_BRANCH_COLORS.length];

      const orphanNode: MindmapTreeNode = {
        component: comp,
        depth: 1,
        branchIndex,
        branchColor,
        parent: rootNode,
        children: [],
        weight: 1,
        angleSector: { start: 0, end: 0 },
        centerAngle: 0
      };

      rootNode.children.push(orphanNode);
      nodeMap.set(comp.id, orphanNode);
      allNodes.push(orphanNode);
      treeEdges.push({
        parent: rootNode,
        child: orphanNode,
        branchColor
      });
    }
  });

  return { rootNode, allNodes, treeEdges, crossLinks };
}

/**
 * Recursively compute subtree weights (number of leaves in each subtree).
 */
function calculateSubtreeWeights(node: MindmapTreeNode): number {
  if (node.children.length === 0) {
    node.weight = 1;
    return 1;
  }

  let totalWeight = 0;
  node.children.forEach(child => {
    totalWeight += calculateSubtreeWeights(child);
  });

  node.weight = totalWeight;
  return totalWeight;
}

/**
 * Compute radial tree layout coordinates for all mindmap nodes.
 */
export function computeMindmapLayout(
  components: BaseComponent[],
  relationships: ParsedRelationship[],
  theme: ThemeVariables,
  layoutDirective?: string
): MindmapLayoutResult {
  if (components.length === 0) {
    return {
      rootNode: null as any,
      allNodes: [],
      components: [],
      treeEdges: [],
      crossLinks: [],
      bbox: { x: 0, y: 0, width: 800, height: 600 }
    };
  }

  // Measure all component dimensions
  components.forEach(c => {
    const minDim = c.calculateMinDimensions(theme);
    const width = c.manualWidth !== undefined ? c.manualWidth : Math.max(minDim.width, 100);
    const height = c.manualHeight !== undefined ? c.manualHeight : Math.max(minDim.height, 44);
    c.bounds = { x: 0, y: 0, width, height };
  });

  // Determine root component
  const rootComponent = determineRootComponent(components, relationships, layoutDirective);

  // Build spanning tree
  const { rootNode, allNodes, treeEdges, crossLinks } = buildMindmapTree(
    rootComponent,
    components,
    relationships
  );

  // Calculate weights for angular sector allocation
  calculateSubtreeWeights(rootNode);

  // Center coordinate for radial layout (or user's manual root position)
  const rootW = rootNode.component.bounds.width;
  const rootH = rootNode.component.bounds.height;

  if (rootNode.component.manualX !== undefined && rootNode.component.manualY !== undefined) {
    rootNode.component.bounds.x = rootNode.component.manualX;
    rootNode.component.bounds.y = rootNode.component.manualY;
  } else if (rootNode.component.manualX !== undefined) {
    rootNode.component.bounds.x = rootNode.component.manualX;
    rootNode.component.bounds.y = 600 - rootH / 2;
  } else if (rootNode.component.manualY !== undefined) {
    rootNode.component.bounds.x = 800 - rootW / 2;
    rootNode.component.bounds.y = rootNode.component.manualY;
  } else {
    rootNode.component.bounds.x = 800 - rootW / 2;
    rootNode.component.bounds.y = 600 - rootH / 2;
  }

  const rootCenterX = rootNode.component.bounds.x + rootW / 2;
  const rootCenterY = rootNode.component.bounds.y + rootH / 2;

  // Assign angular sectors to main branches
  const numBranches = rootNode.children.length;
  if (numBranches > 0) {
    const totalRootWeight = rootNode.weight;
    let currentAngle = -Math.PI / 4; // Start top-right / top-left for balanced aesthetic

    // Custom initial angles for 1, 2, 3 branches for optimal beauty:
    let branchAngles: Array<{ start: number; end: number }> = [];

    if (numBranches === 1) {
      branchAngles = [{ start: -Math.PI / 4, end: Math.PI / 4 }];
    } else if (numBranches === 2) {
      // Left and Right
      branchAngles = [
        { start: -Math.PI / 3, end: Math.PI / 3 },
        { start: (2 * Math.PI) / 3, end: (4 * Math.PI) / 3 }
      ];
    } else if (numBranches === 3) {
      // Top-Left (140°), Right (0°), Bottom-South (270°)
      branchAngles = [
        { start: (3 * Math.PI) / 4, end: (5 * Math.PI) / 4 }, // Top-Left / West
        { start: -Math.PI / 4, end: Math.PI / 4 },             // East / Right
        { start: Math.PI / 3, end: (2 * Math.PI) / 3 }         // South / Bottom
      ];
    } else {
      // General N-branch distribution proportional to weight
      const totalSpan = 2 * Math.PI;
      const angleGap = (totalSpan * 0.05) / numBranches;
      const usableSpan = totalSpan - angleGap * numBranches;

      rootNode.children.forEach(child => {
        const span = (child.weight / totalRootWeight) * usableSpan;
        branchAngles.push({
          start: currentAngle,
          end: currentAngle + span
        });
        currentAngle += span + angleGap;
      });
    }

    // Lay out subtrees radially
    rootNode.children.forEach((child, idx) => {
      const sector = branchAngles[idx] || {
        start: (idx * 2 * Math.PI) / numBranches,
        end: ((idx + 1) * 2 * Math.PI) / numBranches
      };
      child.angleSector = sector;
      child.centerAngle = (sector.start + sector.end) / 2;

      layoutSubtree(child, 1, rootCenterX, rootCenterY, theme);
    });
  }

  // Calculate overall bounding box without mutating component bounds
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  components.forEach(c => {
    minX = Math.min(minX, c.bounds.x);
    minY = Math.min(minY, c.bounds.y);
    maxX = Math.max(maxX, c.bounds.x + c.bounds.width);
    maxY = Math.max(maxY, c.bounds.y + c.bounds.height);
  });

  const PADDING = 60;
  const bbox = {
    x: minX === Infinity ? 0 : minX - PADDING,
    y: minY === Infinity ? 0 : minY - PADDING,
    width: maxX === -Infinity ? 800 : maxX - minX + PADDING * 2,
    height: maxY === -Infinity ? 600 : maxY - minY + PADDING * 2
  };

  return {
    rootNode,
    allNodes,
    components,
    treeEdges,
    crossLinks,
    bbox
  };
}

/**
 * Recursively layout a node and its children in its assigned angular sector.
 */
function layoutSubtree(
  node: MindmapTreeNode,
  depth: number,
  parentCenterX: number,
  parentCenterY: number,
  theme: ThemeVariables
): void {
  // Base radial distance from parent center
  const baseRadius = 210;
  const radialStep = 180;
  const stepDist = depth === 1 ? baseRadius : radialStep;

  const angle = node.centerAngle;
  const w = node.component.bounds.width;
  const h = node.component.bounds.height;

  // Calculate algorithmic radial position
  const nodeCenterX = parentCenterX + stepDist * Math.cos(angle);
  const nodeCenterY = parentCenterY + stepDist * Math.sin(angle);

  // Position node: prioritize manual coordinates if specified
  if (node.component.manualX !== undefined) {
    node.component.bounds.x = node.component.manualX;
  } else {
    node.component.bounds.x = nodeCenterX - w / 2;
  }

  if (node.component.manualY !== undefined) {
    node.component.bounds.y = node.component.manualY;
  } else {
    node.component.bounds.y = nodeCenterY - h / 2;
  }

  const currentCenterX = node.component.bounds.x + w / 2;
  const currentCenterY = node.component.bounds.y + h / 2;

  const numChildren = node.children.length;
  if (numChildren === 0) return;

  const sectorStart = node.angleSector.start;
  const sectorEnd = node.angleSector.end;
  const sectorSpan = sectorEnd - sectorStart;

  const totalChildWeight = node.children.reduce((acc, c) => acc + c.weight, 0);
  let currentStart = sectorStart;

  node.children.forEach(child => {
    const fraction = child.weight / totalChildWeight;
    const childSpan = sectorSpan * fraction;
    const childSector = {
      start: currentStart,
      end: currentStart + childSpan
    };
    child.angleSector = childSector;
    child.centerAngle = (childSector.start + childSector.end) / 2;
    currentStart += childSpan;

    layoutSubtree(child, depth + 1, currentCenterX, currentCenterY, theme);
  });
}
