import { BaseComponent, ThemeVariables } from '../../components/BaseComponent';
import { MindmapLayoutResult, MindmapTreeNode } from './MindmapLayout';
import { ParsedRelationship } from '../Relationship';

export interface MindmapRenderOptions {
  theme: ThemeVariables;
  themeName?: string;
  isDiagramLocked?: boolean;
  onComponentHover?: (componentId: string | null) => void;
  showDocumentationModal?: (component: BaseComponent) => void;
  svgElement?: SVGSVGElement;
}

export class MindmapRenderer {
  public static render(
    layoutResult: MindmapLayoutResult,
    viewportG: SVGGElement,
    options: MindmapRenderOptions
  ): void {
    const { theme, isDiagramLocked = false, onComponentHover, showDocumentationModal, svgElement } = options;

    if (svgElement) {
      if (!svgElement.getAttribute('id')) {
        svgElement.setAttribute('id', 'diagram-svg');
      }
      if (!svgElement.getAttribute('class')?.includes('diagram-svg')) {
        svgElement.setAttribute('class', (svgElement.getAttribute('class') || '') + ' diagram-svg');
      }
    }
    if (viewportG && !viewportG.getAttribute('id')) {
      viewportG.setAttribute('id', 'viewport-g');
    }

    viewportG.innerHTML = '';

    const rootG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    rootG.setAttribute('class', 'mindmap-diagram');

    // Layer 1: Connecting Branches (Paths)
    const pathsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    pathsLayer.setAttribute('class', 'mindmap-paths-layer');
    rootG.appendChild(pathsLayer);

    // Layer 2: Component Nodes
    const nodesLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nodesLayer.setAttribute('class', 'mindmap-nodes-layer');
    rootG.appendChild(nodesLayer);

    // Render tree branch connection curves
    layoutResult.treeEdges.forEach(edge => {
      const parentComp = edge.parent.component;
      const childComp = edge.child.component;

      const p1 = this.getNodeBorderPoint(parentComp, childComp);
      const p2 = this.getNodeBorderPoint(childComp, parentComp);

      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const d = this.calculateSmoothBezierCurve(p1, p2, edge.parent, edge.child);
      pathEl.setAttribute('d', d);

      const strokeColor = edge.branchColor || theme.primaryColor;
      pathEl.setAttribute('stroke', strokeColor);

      // Branch stroke thickness
      const strokeWidth = edge.parent.depth === 0 ? '5' : edge.parent.depth === 1 ? '3.5' : '2.5';
      pathEl.setAttribute('stroke-width', strokeWidth);
      pathEl.setAttribute('stroke-linecap', 'round');
      pathEl.setAttribute('stroke-linejoin', 'round');
      pathEl.setAttribute('fill', 'none');
      pathEl.setAttribute('class', 'mindmap-branch-path');

      if (edge.relationship?.style) {
        if (edge.relationship.style.lineStyle === 'dashed') {
          pathEl.setAttribute('stroke-dasharray', '5,5');
        } else if (edge.relationship.style.lineStyle === 'dotted') {
          pathEl.setAttribute('stroke-dasharray', '2,3');
        }

        if (edge.relationship.style.animated) {
          pathEl.classList.add('animated-flow');
        }
      }

      pathsLayer.appendChild(pathEl);

      // Render relationship label if present
      if (edge.relationship && edge.relationship.label) {
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const labelG = this.createRelationshipLabel(edge.relationship.label, midX, midY, theme);
        pathsLayer.appendChild(labelG);
      }
    });

    // Render cross-links (non-tree relationships)
    layoutResult.crossLinks.forEach(link => {
      const p1 = this.getNodeBorderPoint(link.source, link.target);
      const p2 = this.getNodeBorderPoint(link.target, link.source);

      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2 - 20; // curve arc
      const d = `M ${p1.x},${p1.y} Q ${midX},${midY} ${p2.x},${p2.y}`;

      pathEl.setAttribute('d', d);
      pathEl.setAttribute('stroke', theme.borderColor || '#71717a');
      pathEl.setAttribute('stroke-width', '2');
      pathEl.setAttribute('stroke-dasharray', '4,4');
      pathEl.setAttribute('fill', 'none');
      pathEl.setAttribute('class', 'mindmap-crosslink-path');

      pathsLayer.appendChild(pathEl);

      if (link.relationship.label) {
        const labelG = this.createRelationshipLabel(link.relationship.label, midX, midY, theme);
        pathsLayer.appendChild(labelG);
      }
    });

    // Render nodes with styling & interactivity
    layoutResult.allNodes.forEach(node => {
      const comp = node.component;

      // Apply branch theme color if no explicit override exists
      const effectiveTheme: ThemeVariables = { ...theme };

      if (!comp.themeOverride || Object.keys(comp.themeOverride).length === 0) {
        if (node.depth === 0) {
          // Central root node style: slate / neutral pill
          effectiveTheme.backgroundColor = theme.backgroundColor === '#ffffff' ? '#e2e8f0' : '#334155';
          effectiveTheme.borderColor = node.branchColor || theme.primaryColor;
          effectiveTheme.textColor = theme.backgroundColor === '#ffffff' ? '#0f172a' : '#f8fafc';
        } else {
          // Branch node style: branch-colored border & tinted background
          effectiveTheme.borderColor = node.branchColor;
          effectiveTheme.backgroundColor = node.branchColor;
          effectiveTheme.textColor = '#ffffff';
        }
      }

      const nodeG = comp.render(effectiveTheme);
      nodeG.classList.add('diagram-component');
      nodeG.style.cursor = isDiagramLocked ? 'default' : 'grab';
      nodeG.setAttribute('data-id', comp.id);

      if (comp.tags && comp.tags.length > 0) {
        nodeG.setAttribute('data-tags', comp.tags.join(','));
      }
      if (comp.doc) {
        nodeG.setAttribute('data-doc', comp.doc);
      }
      if (comp.url) {
        nodeG.setAttribute('data-url', comp.url);
      }
      if (comp.shadow) {
        nodeG.classList.add('has-shadow');
      }

      // Bi-directional hover highlighting
      nodeG.addEventListener('mouseenter', (e: MouseEvent) => {
        e.stopPropagation();
        nodeG.classList.add('hovered');
        if (onComponentHover) onComponentHover(comp.id);
      });

      nodeG.addEventListener('mouseleave', (e: MouseEvent) => {
        e.stopPropagation();
        nodeG.classList.remove('hovered');
        if (onComponentHover) onComponentHover(null);
      });

      // Documentation badge
      if (comp.doc && showDocumentationModal) {
        const badgeOffset = 24;
        const docBadgeG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        docBadgeG.setAttribute('class', 'element-doc-badge');
        const badgeX = comp.bounds.width - badgeOffset;
        const badgeY = 6;
        docBadgeG.setAttribute('transform', `translate(${badgeX}, ${badgeY})`);
        docBadgeG.setAttribute('style', 'cursor: pointer;');

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', '9');
        circle.setAttribute('cy', '9');
        circle.setAttribute('r', '9');
        circle.setAttribute('class', 'doc-badge-bg');
        docBadgeG.appendChild(circle);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M6.5 4.5a1 1 0 0 1 1-1h3l2 2v6a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-7z M10.5 3.5v2h2 L10.5 3.5z');
        path.setAttribute('class', 'doc-badge-icon');
        docBadgeG.appendChild(path);

        docBadgeG.addEventListener('mousedown', (e: MouseEvent) => e.stopPropagation());
        docBadgeG.addEventListener('click', (e: MouseEvent) => {
          e.stopPropagation();
          showDocumentationModal(comp);
        });

        nodeG.appendChild(docBadgeG);
      }

      // Link badge
      if (comp.url) {
        const urlBadgeG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        urlBadgeG.setAttribute('class', 'element-url-badge');
        const badgeX = comp.bounds.width - 44;
        const badgeY = 6;
        urlBadgeG.setAttribute('transform', `translate(${badgeX}, ${badgeY})`);
        urlBadgeG.setAttribute('style', 'cursor: pointer;');

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', '9');
        circle.setAttribute('cy', '9');
        circle.setAttribute('r', '9');
        circle.setAttribute('class', 'url-badge-bg');
        urlBadgeG.appendChild(circle);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71');
        path.setAttribute('transform', 'scale(0.75)');
        path.setAttribute('class', 'url-badge-icon');
        urlBadgeG.appendChild(path);

        urlBadgeG.addEventListener('mousedown', (e: MouseEvent) => e.stopPropagation());
        urlBadgeG.addEventListener('click', (e: MouseEvent) => {
          e.stopPropagation();
          window.open(comp.url, '_blank');
        });

        nodeG.appendChild(urlBadgeG);
      }

      nodesLayer.appendChild(nodeG);
    });

    viewportG.appendChild(rootG);
  }

  /**
   * Re-render mindmap branch paths dynamically during drag interactions.
   */
  public static updatePaths(
    layoutResult: MindmapLayoutResult,
    viewportG: SVGGElement,
    theme: ThemeVariables
  ): void {
    const pathsLayer = viewportG.querySelector('.mindmap-paths-layer');
    if (!pathsLayer) return;
    pathsLayer.innerHTML = '';

    // Re-render tree branches
    layoutResult.treeEdges.forEach(edge => {
      const parentComp = edge.parent.component;
      const childComp = edge.child.component;

      const p1 = this.getNodeBorderPoint(parentComp, childComp);
      const p2 = this.getNodeBorderPoint(childComp, parentComp);

      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const d = this.calculateSmoothBezierCurve(p1, p2, edge.parent, edge.child);
      pathEl.setAttribute('d', d);

      const strokeColor = edge.branchColor || theme.primaryColor;
      pathEl.setAttribute('stroke', strokeColor);

      const strokeWidth = edge.parent.depth === 0 ? '5' : edge.parent.depth === 1 ? '3.5' : '2.5';
      pathEl.setAttribute('stroke-width', strokeWidth);
      pathEl.setAttribute('stroke-linecap', 'round');
      pathEl.setAttribute('stroke-linejoin', 'round');
      pathEl.setAttribute('fill', 'none');
      pathEl.setAttribute('class', 'mindmap-branch-path');

      if (edge.relationship?.style) {
        if (edge.relationship.style.lineStyle === 'dashed') {
          pathEl.setAttribute('stroke-dasharray', '5,5');
        } else if (edge.relationship.style.lineStyle === 'dotted') {
          pathEl.setAttribute('stroke-dasharray', '2,3');
        }
        if (edge.relationship.style.animated) {
          pathEl.classList.add('animated-flow');
        }
      }

      pathsLayer.appendChild(pathEl);

      if (edge.relationship && edge.relationship.label) {
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const labelG = this.createRelationshipLabel(edge.relationship.label, midX, midY, theme);
        pathsLayer.appendChild(labelG);
      }
    });

    // Re-render cross-links
    layoutResult.crossLinks.forEach(link => {
      const p1 = this.getNodeBorderPoint(link.source, link.target);
      const p2 = this.getNodeBorderPoint(link.target, link.source);

      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2 - 20;
      const d = `M ${p1.x},${p1.y} Q ${midX},${midY} ${p2.x},${p2.y}`;

      pathEl.setAttribute('d', d);
      pathEl.setAttribute('stroke', theme.borderColor || '#71717a');
      pathEl.setAttribute('stroke-width', '2');
      pathEl.setAttribute('stroke-dasharray', '4,4');
      pathEl.setAttribute('fill', 'none');
      pathEl.setAttribute('class', 'mindmap-crosslink-path');

      pathsLayer.appendChild(pathEl);

      if (link.relationship.label) {
        const labelG = this.createRelationshipLabel(link.relationship.label, midX, midY, theme);
        pathsLayer.appendChild(labelG);
      }
    });
  }

  /**
   * Find the intersection point on a component's outer boundary towards another component.
   */
  private static getNodeBorderPoint(
    fromComp: BaseComponent,
    towardsComp: BaseComponent
  ): { x: number; y: number } {
    const fromCenter = {
      x: fromComp.bounds.x + fromComp.bounds.width / 2,
      y: fromComp.bounds.y + fromComp.bounds.height / 2
    };
    const towardsCenter = {
      x: towardsComp.bounds.x + towardsComp.bounds.width / 2,
      y: towardsComp.bounds.y + towardsComp.bounds.height / 2
    };

    const dx = towardsCenter.x - fromCenter.x;
    const dy = towardsCenter.y - fromCenter.y;
    const dist = Math.hypot(dx, dy);

    if (dist === 0) return fromCenter;

    const hw = fromComp.bounds.width / 2;
    const hh = fromComp.bounds.height / 2;

    // Ray-box intersection
    const scaleX = Math.abs(dx) > 0 ? hw / Math.abs(dx) : Infinity;
    const scaleY = Math.abs(dy) > 0 ? hh / Math.abs(dy) : Infinity;
    const scale = Math.min(scaleX, scaleY);

    return {
      x: fromCenter.x + dx * scale,
      y: fromCenter.y + dy * scale
    };
  }

  /**
   * Calculate a smooth cubic Bézier curve between parent border point and child border point.
   */
  private static calculateSmoothBezierCurve(
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    parent: MindmapTreeNode,
    child: MindmapTreeNode
  ): string {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    // Curvature factor based on radial angle
    const angle = child.centerAngle;
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);

    const dist = Math.hypot(dx, dy);
    const ctrlDist = dist * 0.45;

    const cpx1 = p1.x + dirX * ctrlDist;
    const cpy1 = p1.y + dirY * ctrlDist;
    const cpx2 = p2.x - dirX * (ctrlDist * 0.5);
    const cpy2 = p2.y - dirY * (ctrlDist * 0.5);

    return `M ${p1.x},${p1.y} C ${cpx1},${cpy1} ${cpx2},${cpy2} ${p2.x},${p2.y}`;
  }

  /**
   * Render an annotated badge label along a branch link.
   */
  private static createRelationshipLabel(
    text: string,
    x: number,
    y: number,
    theme: ThemeVariables
  ): SVGGElement {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'mindmap-branch-label');

    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textEl.setAttribute('x', x.toString());
    textEl.setAttribute('y', (y + 4).toString());
    textEl.setAttribute('text-anchor', 'middle');
    textEl.setAttribute('font-family', theme.fontFamily || 'Outfit, sans-serif');
    textEl.setAttribute('font-size', '11px');
    textEl.setAttribute('font-weight', '500');
    textEl.setAttribute('fill', theme.textColor || '#f4f4f5');
    textEl.textContent = text;

    const approxWidth = text.length * 7 + 12;
    const approxHeight = 18;

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', (x - approxWidth / 2).toString());
    rect.setAttribute('y', (y - approxHeight / 2).toString());
    rect.setAttribute('width', approxWidth.toString());
    rect.setAttribute('height', approxHeight.toString());
    rect.setAttribute('rx', '4');
    rect.setAttribute('ry', '4');
    rect.setAttribute('fill', theme.backgroundColor || '#18181b');
    rect.setAttribute('stroke', theme.borderColor || '#3f3f46');
    rect.setAttribute('stroke-width', '1');
    rect.setAttribute('opacity', '0.9');

    g.appendChild(rect);
    g.appendChild(textEl);

    return g;
  }
}
