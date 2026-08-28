import { BaseComponent, ThemeVariables } from '../../components/BaseComponent';
import { BranchComponent } from '../../components/BranchComponent';
import { CommitComponent, CommitType } from '../../components/CommitComponent';
import { ParsedRelationship } from '../Relationship';
import { isContainer, layoutRootComponents } from '../layout';

export interface GitBranchLayout {
  id: string;
  name: string;
  order: number;
  color: string;
  y: number;
  badgeX: number;
  badgeY: number;
  badgeWidth: number;
  badgeHeight: number;
  component?: BranchComponent;
  commits: GitCommitLayout[];
}

export interface GitCommitLayout {
  id: string;
  hash: string;
  branchId: string;
  branchName: string;
  type: CommitType;
  tag?: string;
  message?: string;
  step: number;
  x: number;
  y: number;
  radius: number;
  component: CommitComponent;
  parentIds: string[];
  childIds: string[];
  color: string;
  line?: number;
}

export interface GitPathLayout {
  sourceId: string;
  targetId: string;
  pathType: 'in-branch' | 'fork' | 'merge';
  color: string;
  d: string;
  sourceCommit: GitCommitLayout;
  targetCommit: GitCommitLayout;
}

export interface GitFlowLayoutResult {
  branches: GitBranchLayout[];
  commits: GitCommitLayout[];
  paths: GitPathLayout[];
  nonGitComponents: BaseComponent[];
  nonGitRelationships: ParsedRelationship[];
  bbox: { x: number; y: number; width: number; height: number };
  trackEndX: number;
}

const THEME_BRANCH_PALETTES: Record<string, string[]> = {
  'drako-dark': [
    '#71717a', // main: Slate/Zinc
    '#db2777', // develop: Magenta/Pink
    '#0891b2', // feature: Cyan/Teal
    '#a855f7', // Purple
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#6366f1'  // Indigo
  ],
  'drako-light': [
    '#475569', // main: Slate
    '#be185d', // develop: Deep Pink
    '#0284c7', // feature: Blue
    '#7c3aed', // Violet
    '#d97706', // Amber
    '#059669', // Emerald
    '#4f46e5'  // Indigo
  ],
  'obsidian-dark': [
    '#52525b', // main: Zinc
    '#d946ef', // develop: Fuchsia
    '#38bdf8', // feature: Sky Blue
    '#c084fc', // Purple
    '#fbbf24', // Amber
    '#34d399', // Emerald
    '#818cf8'  // Indigo
  ],
  'serene-light': [
    '#334155', // main: Slate
    '#be185d', // develop: Pink
    '#0891b2', // feature: Cyan
    '#6d28d9', // Purple
    '#b45309', // Amber
    '#047857', // Emerald
    '#4338ca'  // Indigo
  ],
  'rust-dark': [
    '#78716c', // main: Warm Stone
    '#ea580c', // develop: Rust Orange
    '#eab308', // feature: Amber / Gold
    '#dc2626', // Red / Crimson
    '#14b8a6', // Teal
    '#8b5cf6', // Violet
    '#f97316'  // Bright Orange
  ],
  'cyber-neon': [
    '#64748b', // main: Slate
    '#06b6d4', // develop: Electric Cyan
    '#f43f5e', // feature: Neon Rose
    '#a855f7', // Purple
    '#fbbf24', // Amber
    '#10b981', // Emerald
    '#38bdf8'  // Sky Blue
  ]
};

const DEFAULT_PALETTE = [
  '#64748b', // Slate
  '#db2777', // Magenta/Pink
  '#0891b2', // Cyan
  '#a855f7', // Purple
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#6366f1'  // Indigo
];

export function getBranchColor(
  branchIndex: number,
  themeName?: string,
  explicitColor?: string
): string {
  if (explicitColor) return explicitColor;
  const palette = (themeName && THEME_BRANCH_PALETTES[themeName]) || DEFAULT_PALETTE;
  return palette[branchIndex % palette.length];
}

/**
 * Recursively lays out child components inside containers.
 */
function layoutContainerDeep(comp: BaseComponent, theme: ThemeVariables): void {
  if (isContainer(comp)) {
    comp.layoutChildren(theme);
    for (const child of comp.children) {
      layoutContainerDeep(child, theme);
    }
  }
}

/**
 * Compute spatial layout for a Git Flow diagram.
 * Lays out both Git components (Branch, Commit) and any standard components (Text, Containers, Shapes).
 */
export function computeGitFlowLayout(
  components: BaseComponent[],
  relationships: ParsedRelationship[],
  theme: ThemeVariables,
  themeName: string = 'drako-dark'
): GitFlowLayoutResult {
  // 1. Separate Branch components, Commit components, and Non-Git components
  const branchComponents: BranchComponent[] = [];
  const commitComponents: CommitComponent[] = [];
  const nonGitComponents: BaseComponent[] = [];
  const commitToBranchMap = new Map<string, string>(); // commitId -> branchName or branchId

  components.forEach(comp => {
    if (comp instanceof BranchComponent) {
      branchComponents.push(comp);
      // Collect nested commits and preserve any other nested components
      comp.children.forEach(child => {
        if (child instanceof CommitComponent) {
          commitComponents.push(child);
          commitToBranchMap.set(child.id, comp.props.label || comp.id);
        } else {
          nonGitComponents.push(child);
        }
      });
    } else if (comp instanceof CommitComponent) {
      commitComponents.push(comp);
      if (comp.branchName) {
        commitToBranchMap.set(comp.id, comp.branchName);
      }
    } else {
      nonGitComponents.push(comp);
    }
  });

  const hasGitElements = branchComponents.length > 0 || commitComponents.length > 0;

  // 2. Discover all unique branches
  interface BranchInfo {
    id: string;
    name: string;
    order?: number;
    color?: string;
    component?: BranchComponent;
  }

  const branchMap = new Map<string, BranchInfo>();

  if (hasGitElements) {
    // From Branch components
    branchComponents.forEach(b => {
      const name = b.props.label || b.id;
      const branchInfo: BranchInfo = {
        id: b.id,
        name,
        order: b.order,
        color: b.color || b.props.color,
        component: b
      };
      branchMap.set(name.toLowerCase(), branchInfo);
      if (b.id.toLowerCase() !== name.toLowerCase()) {
        branchMap.set(b.id.toLowerCase(), branchInfo);
      }
    });

    // From top-level commits referencing a branch
    commitComponents.forEach(c => {
      if (c.branchName) {
        const key = c.branchName.toLowerCase();
        if (!branchMap.has(key)) {
          branchMap.set(key, {
            id: c.branchName,
            name: c.branchName
          });
        }
      }
    });

    // If commits exist but no branch was declared, create a default "main" branch
    if (branchMap.size === 0) {
      branchMap.set('main', {
        id: 'main',
        name: 'main'
      });
    }

    // Ensure default branch for any commit without an explicit branch
    commitComponents.forEach(c => {
      if (!commitToBranchMap.has(c.id)) {
        const firstBranchName = Array.from(branchMap.values())[0].name;
        commitToBranchMap.set(c.id, firstBranchName);
      }
    });
  }

  // 3. Sort branches into lanes (main / master always first unless explicit order says otherwise)
  const sortedBranchInfos = Array.from(branchMap.values()).sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;

    const aIsMain = a.name.toLowerCase() === 'main' || a.name.toLowerCase() === 'master';
    const bIsMain = b.name.toLowerCase() === 'main' || b.name.toLowerCase() === 'master';
    if (aIsMain && !bIsMain) return -1;
    if (!aIsMain && bIsMain) return 1;

    return 0;
  });

  const LANE_START_Y = 60;
  const LANE_HEIGHT = 90;
  const BADGE_X = 40;
  const BADGE_HEIGHT = 28;

  const branches: GitBranchLayout[] = sortedBranchInfos.map((info, idx) => {
    const y = LANE_START_Y + idx * LANE_HEIGHT;
    const badgeY = y - BADGE_HEIGHT / 2;
    const badgeWidth = Math.max(68, info.name.length * 8.5 + 24);
    const color = getBranchColor(idx, themeName, info.color);

    if (info.component) {
      info.component.bounds = {
        x: BADGE_X,
        y: badgeY,
        width: badgeWidth,
        height: BADGE_HEIGHT
      };
    }

    return {
      id: info.id,
      name: info.name,
      order: info.order ?? idx,
      color,
      y,
      badgeX: BADGE_X,
      badgeY,
      badgeWidth,
      badgeHeight: BADGE_HEIGHT,
      component: info.component,
      commits: []
    };
  });

  const branchLayoutByName = new Map<string, GitBranchLayout>();
  branches.forEach(b => {
    branchLayoutByName.set(b.name.toLowerCase(), b);
    branchLayoutByName.set(b.id.toLowerCase(), b);
  });

  // 4. Map relationships between commits
  const commitIdSet = new Set(commitComponents.map(c => c.id));
  const parentMap = new Map<string, string[]>(); // commitId -> parent commitIds
  const childMap = new Map<string, string[]>();  // commitId -> child commitIds

  commitComponents.forEach(c => {
    parentMap.set(c.id, []);
    childMap.set(c.id, []);
  });

  relationships.forEach(rel => {
    if (commitIdSet.has(rel.sourceId) && commitIdSet.has(rel.targetId)) {
      parentMap.get(rel.targetId)!.push(rel.sourceId);
      childMap.get(rel.sourceId)!.push(rel.targetId);
    }
  });

  // Auto-detect merge commits (commits with 2 or more incoming parents)
  commitComponents.forEach(c => {
    const parents = parentMap.get(c.id) || [];
    if (parents.length >= 2 && c.commitType === 'normal') {
      c.commitType = 'merge';
    }
  });

  // 5. Compute chronological / topological step for each commit
  const commitIndices = new Map<string, number>();
  commitComponents.forEach((c, i) => commitIndices.set(c.id, i));

  // Compute in-degree for topological order
  const inDegree = new Map<string, number>();
  commitComponents.forEach(c => {
    inDegree.set(c.id, (parentMap.get(c.id) || []).length);
  });

  const commitStepMap = new Map<string, number>();
  const readyQueue: string[] = [];

  commitComponents.forEach(c => {
    if (inDegree.get(c.id) === 0) {
      readyQueue.push(c.id);
    }
  });

  // Sort queue by document appearance
  readyQueue.sort((a, b) => (commitIndices.get(a) || 0) - (commitIndices.get(b) || 0));

  let currentStep = 0;
  const processed = new Set<string>();

  while (readyQueue.length > 0) {
    readyQueue.sort((a, b) => (commitIndices.get(a) || 0) - (commitIndices.get(b) || 0));
    const commitId = readyQueue.shift()!;
    processed.add(commitId);

    const parents = parentMap.get(commitId) || [];
    let minStep = currentStep;
    parents.forEach(pId => {
      const pStep = commitStepMap.get(pId);
      if (pStep !== undefined) {
        minStep = Math.max(minStep, pStep + 1);
      }
    });

    commitStepMap.set(commitId, minStep);
    currentStep = minStep + 1;

    const children = childMap.get(commitId) || [];
    children.forEach(childId => {
      const currentIn = inDegree.get(childId) || 0;
      const nextIn = currentIn - 1;
      inDegree.set(childId, nextIn);
      if (nextIn === 0 && !processed.has(childId)) {
        readyQueue.push(childId);
      }
    });
  }

  commitComponents.forEach((c) => {
    if (!commitStepMap.has(c.id)) {
      commitStepMap.set(c.id, currentStep++);
    }
  });

  // 6. Calculate coordinates for each commit
  const maxBadgeW = branches.length > 0 ? Math.max(...branches.map(b => b.badgeWidth), 68) : 68;
  const STEP_START_X = BADGE_X + maxBadgeW + 50;
  const STEP_WIDTH = 95;
  const COMMIT_RADIUS = 10;

  const commits: GitCommitLayout[] = commitComponents.map(c => {
    const rawBranchName = commitToBranchMap.get(c.id) || (branches.length > 0 ? branches[0].name : 'main');
    const branch = branchLayoutByName.get(rawBranchName.toLowerCase()) || (branches.length > 0 ? branches[0] : null);
    const step = commitStepMap.get(c.id) ?? 0;
    const x = STEP_START_X + step * STEP_WIDTH;
    const y = branch ? branch.y : LANE_START_Y;
    const color = c.color || (branch ? branch.color : getBranchColor(0, themeName));

    const isChildOfBranch = branch && branch.component && branch.component.children.includes(c);
    const offsetX = isChildOfBranch ? branch.badgeX : 0;
    const offsetY = isChildOfBranch ? branch.badgeY : 0;

    c.bounds = {
      x: (x - COMMIT_RADIUS - 10) - offsetX,
      y: (y - COMMIT_RADIUS - 10) - offsetY,
      width: (COMMIT_RADIUS + 10) * 2,
      height: (COMMIT_RADIUS + 10) * 2
    };

    const commitLayout: GitCommitLayout = {
      id: c.id,
      hash: c.commitHash,
      branchId: branch ? branch.id : 'main',
      branchName: branch ? branch.name : 'main',
      type: c.commitType,
      tag: c.tag,
      message: c.message,
      step,
      x,
      y,
      radius: COMMIT_RADIUS,
      component: c,
      parentIds: parentMap.get(c.id) || [],
      childIds: childMap.get(c.id) || [],
      color
    };

    if (branch) {
      branch.commits.push(commitLayout);
    }
    return commitLayout;
  });

  const commitLayoutMap = new Map<string, GitCommitLayout>();
  commits.forEach(c => commitLayoutMap.set(c.id, c));

  // 7. Calculate paths / connections
  const paths: GitPathLayout[] = [];
  const nonGitRelationships: ParsedRelationship[] = [];
  const R = 16; // Rounded corner radius

  relationships.forEach(rel => {
    const src = commitLayoutMap.get(rel.sourceId);
    const tgt = commitLayoutMap.get(rel.targetId);
    if (!src || !tgt) {
      nonGitRelationships.push(rel);
      return;
    }

    if (src.branchId === tgt.branchId && src.y === tgt.y) {
      // In-branch linear connection
      const d = `M ${src.x},${src.y} L ${tgt.x},${tgt.y}`;
      paths.push({
        sourceId: src.id,
        targetId: tgt.id,
        pathType: 'in-branch',
        color: src.color,
        d,
        sourceCommit: src,
        targetCommit: tgt
      });
    } else {
      // Cross-branch connection: check if fork or merge
      const isMerge = tgt.type === 'merge' || (tgt.parentIds.length >= 2 && tgt.parentIds.includes(src.id) && tgt.branchId !== src.branchId);

      if (isMerge) {
        // Branch merge into target: travels on source lane, then curves into target
        let d = '';
        if (tgt.y < src.y) {
          // Merge UP (e.g. develop -> main)
          const cornerStartX = tgt.x - R;
          const cornerStartY = src.y;
          d = `M ${src.x},${src.y} L ${cornerStartX},${cornerStartY} Q ${tgt.x},${cornerStartY} ${tgt.x},${cornerStartY - R} L ${tgt.x},${tgt.y}`;
        } else {
          // Merge DOWN
          const cornerStartX = tgt.x - R;
          const cornerStartY = src.y;
          d = `M ${src.x},${src.y} L ${cornerStartX},${cornerStartY} Q ${tgt.x},${cornerStartY} ${tgt.x},${cornerStartY + R} L ${tgt.x},${tgt.y}`;
        }

        paths.push({
          sourceId: src.id,
          targetId: tgt.id,
          pathType: 'merge',
          color: src.color,
          d,
          sourceCommit: src,
          targetCommit: tgt
        });
      } else {
        // Branch fork: branches off from parent commit at (src.x, src.y), curves into child lane
        let d = '';
        if (tgt.y > src.y) {
          // Fork DOWN (e.g. main -> develop)
          const cornerEndX = src.x + R;
          const cornerEndY = tgt.y;
          d = `M ${src.x},${src.y} L ${src.x},${tgt.y - R} Q ${src.x},${tgt.y} ${cornerEndX},${cornerEndY} L ${tgt.x},${tgt.y}`;
        } else {
          // Fork UP
          const cornerEndX = src.x + R;
          const cornerEndY = tgt.y;
          d = `M ${src.x},${src.y} L ${src.x},${tgt.y + R} Q ${src.x},${tgt.y} ${cornerEndX},${cornerEndY} L ${tgt.x},${tgt.y}`;
        }

        paths.push({
          sourceId: src.id,
          targetId: tgt.id,
          pathType: 'fork',
          color: tgt.color,
          d,
          sourceCommit: src,
          targetCommit: tgt
        });
      }
    }
  });

  // Calculate Git tracks dimensions
  const maxStepX = commits.length > 0 ? Math.max(...commits.map(c => c.x)) : (hasGitElements ? STEP_START_X + 200 : 300);
  const trackEndX = hasGitElements ? maxStepX + 60 : 300;
  const maxLaneY = branches.length > 0 ? Math.max(...branches.map(b => b.y)) : (hasGitElements ? LANE_START_Y : 0);
  const gitBottomY = branches.length > 0
    ? Math.max(
        maxLaneY + 70,
        commits.length > 0 ? Math.max(...commits.map(c => c.y + 65)) : maxLaneY + 70
      )
    : 0;

  // 8. Layout Non-Git Components (Text, Containers, Cards, Rectangles, Shapes, etc.)
  const manualComponents: BaseComponent[] = [];
  const autoComponents: BaseComponent[] = [];

  nonGitComponents.forEach(comp => {
    if (comp.manualX !== undefined || comp.manualY !== undefined) {
      manualComponents.push(comp);
    } else {
      autoComponents.push(comp);
    }
  });

  // Position manual/semi-manual components
  manualComponents.forEach(comp => {
    const minDim = comp.calculateMinDimensions(theme);
    const width = comp.manualWidth !== undefined ? comp.manualWidth : minDim.width;
    const height = comp.manualHeight !== undefined ? comp.manualHeight : minDim.height;
    const x = comp.manualX !== undefined ? comp.manualX : BADGE_X;
    const y = comp.manualY !== undefined ? comp.manualY : (hasGitElements ? gitBottomY + 30 : 60);

    comp.bounds = { x, y, width, height };
    layoutContainerDeep(comp, theme);
  });

  // Position auto components
  if (autoComponents.length > 0) {
    const autoStartY = hasGitElements ? gitBottomY + 40 : 60;
    
    // Check if relationships exist between autoComponents
    const autoIds = new Set(autoComponents.map(c => c.id));
    const autoRels = nonGitRelationships.filter(
      r => autoIds.has(r.sourceId) && autoIds.has(r.targetId)
    );

    if (autoRels.length > 0) {
      layoutRootComponents(autoComponents, theme, autoRels, 'left-to-right');
      const minAutoY = Math.min(...autoComponents.map(c => c.bounds.y));
      const deltaY = autoStartY - minAutoY;
      autoComponents.forEach(c => {
        c.bounds.y += deltaY;
        layoutContainerDeep(c, theme);
      });
    } else {
      let curX = BADGE_X;
      let curY = autoStartY;
      let rowMaxH = 0;
      const maxRowWidth = Math.max(trackEndX, 900);

      autoComponents.forEach(comp => {
        const minDim = comp.calculateMinDimensions(theme);
        const w = comp.manualWidth !== undefined ? comp.manualWidth : minDim.width;
        const h = comp.manualHeight !== undefined ? comp.manualHeight : minDim.height;

        if (curX + w > maxRowWidth && curX > BADGE_X) {
          curX = BADGE_X;
          curY += rowMaxH + 30;
          rowMaxH = 0;
        }

        comp.bounds = { x: curX, y: curY, width: w, height: h };
        layoutContainerDeep(comp, theme);

        curX += w + 30;
        rowMaxH = Math.max(rowMaxH, h);
      });
    }
  }

  // 9. Calculate complete diagram bounding box
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  if (branches.length > 0) {
    minX = Math.min(minX, BADGE_X - 10);
    maxX = Math.max(maxX, trackEndX + 20);
    minY = Math.min(minY, Math.max(10, LANE_START_Y - 40));
    maxY = Math.max(maxY, maxLaneY + 80);

    commits.forEach(c => {
      if (c.tag) minY = Math.min(minY, c.y - 45);
      minX = Math.min(minX, c.x - 30);
      maxX = Math.max(maxX, c.x + 50);
      maxY = Math.max(maxY, c.y + 65);
    });
  }

  nonGitComponents.forEach(comp => {
    minX = Math.min(minX, comp.bounds.x - 10);
    minY = Math.min(minY, comp.bounds.y - 10);
    maxX = Math.max(maxX, comp.bounds.x + comp.bounds.width + 10);
    maxY = Math.max(maxY, comp.bounds.y + comp.bounds.height + 10);
  });

  if (!isFinite(minX)) {
    minX = 0;
    minY = 0;
    maxX = 800;
    maxY = 600;
  }

  const bbox = {
    x: minX,
    y: minY,
    width: Math.max(100, maxX - minX),
    height: Math.max(100, maxY - minY)
  };

  return {
    branches,
    commits,
    paths,
    nonGitComponents,
    nonGitRelationships,
    bbox,
    trackEndX
  };
}
