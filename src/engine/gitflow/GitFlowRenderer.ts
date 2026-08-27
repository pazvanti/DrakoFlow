import { BaseComponent, ThemeVariables } from '../../components/BaseComponent';
import { BranchComponent } from '../../components/BranchComponent';
import { renderRelationships } from '../relationshipRenderer';
import { GitFlowLayoutResult } from './GitFlowLayout';

export interface GitFlowRenderOptions {
  theme: ThemeVariables;
  themeName?: string;
  isDiagramLocked: boolean;
  onComponentHover?: (componentId: string | null) => void;
  showDocumentationModal?: (component: BaseComponent) => void;
  svgElement?: SVGSVGElement;
}

export class GitFlowRenderer {
  /**
   * Render the computed Git Flow layout into SVG groups and append to viewport.
   * Renders Git tracks/commits as well as any standard non-Git components and relationships.
   */
  public static render(
    layout: GitFlowLayoutResult,
    viewportG: SVGGElement,
    options: GitFlowRenderOptions
  ): void {
    const { theme, onComponentHover, isDiagramLocked, showDocumentationModal } = options;

    if (!viewportG.getAttribute('id')) {
      viewportG.setAttribute('id', 'viewport-g');
    }
    if (options.svgElement) {
      if (!options.svgElement.getAttribute('id')) {
        options.svgElement.setAttribute('id', 'diagram-svg');
      }
      if (!options.svgElement.getAttribute('class')) {
        options.svgElement.setAttribute('class', 'diagram-svg');
      }
    }

    viewportG.innerHTML = '';

    const rootG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    rootG.setAttribute('class', 'git-flow-diagram');

    // 0. Non-Git Relationships Layer (rendered underneath components)
    let relLayers: { pathsLayer: SVGGElement; labelsLayer: SVGGElement; lifelinesLayer: SVGGElement } | null = null;
    if (layout.nonGitRelationships && layout.nonGitRelationships.length > 0) {
      const rootComponents: BaseComponent[] = [
        ...layout.branches.map(b => b.component).filter((b): b is BranchComponent => Boolean(b)),
        ...layout.commits.filter(c => !layout.branches.some(b => b.component?.children.includes(c.component))).map(c => c.component),
        ...layout.nonGitComponents
      ];
      const svgEl = options.svgElement || (document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement);
      relLayers = renderRelationships(
        layout.nonGitRelationships,
        rootComponents,
        theme,
        svgEl,
        undefined,
        isDiagramLocked
      );

      if (relLayers && relLayers.lifelinesLayer) {
        rootG.appendChild(relLayers.lifelinesLayer);
      }
    }

    // 1. Layer: Background Guide Lines (for Git branches)
    if (layout.branches.length > 0) {
      const guidesG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      guidesG.setAttribute('class', 'git-guides-layer');
      const borderColor = theme.borderColor || '#52525b';

      layout.branches.forEach(branch => {
        const guideLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        const startX = branch.badgeX + branch.badgeWidth + 14;
        guideLine.setAttribute('x1', startX.toString());
        guideLine.setAttribute('y1', branch.y.toString());
        guideLine.setAttribute('x2', layout.trackEndX.toString());
        guideLine.setAttribute('y2', branch.y.toString());
        guideLine.setAttribute('stroke', borderColor);
        guideLine.setAttribute('stroke-dasharray', '4,4');
        guideLine.setAttribute('stroke-opacity', '0.35');
        guideLine.setAttribute('stroke-width', '1.5');
        guideLine.setAttribute('class', 'git-guide-line');
        guidesG.appendChild(guideLine);
      });
      rootG.appendChild(guidesG);
    }

    // 2. Layer: Branch Paths (Curves & Linear Links)
    if (layout.paths.length > 0) {
      const pathsG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      pathsG.setAttribute('class', 'git-paths-layer');

      layout.paths.forEach(pathLayout => {
        const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathEl.setAttribute('d', pathLayout.d);
        pathEl.setAttribute('stroke', pathLayout.color);
        pathEl.setAttribute('stroke-width', '5');
        pathEl.setAttribute('stroke-linecap', 'round');
        pathEl.setAttribute('stroke-linejoin', 'round');
        pathEl.setAttribute('fill', 'none');
        pathEl.setAttribute('class', `git-branch-path git-path-${pathLayout.pathType}`);
        pathsG.appendChild(pathEl);
      });
      rootG.appendChild(pathsG);
    }

    // 3. Layer: Branch Badges (Labels on the left)
    if (layout.branches.length > 0) {
      const branchesG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      branchesG.setAttribute('class', 'git-branch-labels-layer');
      const font = theme.fontFamily || 'Outfit, sans-serif';

      layout.branches.forEach(branch => {
        const branchG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        branchG.setAttribute('class', 'git-branch-badge-group');
        branchG.setAttribute('data-id', branch.id);
        branchG.setAttribute('style', 'cursor: pointer;');

        // Badge background pill
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', branch.badgeX.toString());
        rect.setAttribute('y', branch.badgeY.toString());
        rect.setAttribute('width', branch.badgeWidth.toString());
        rect.setAttribute('height', branch.badgeHeight.toString());
        rect.setAttribute('rx', '6');
        rect.setAttribute('ry', '6');
        rect.setAttribute('fill', branch.color);
        rect.setAttribute('class', 'git-branch-badge');
        branchG.appendChild(rect);

        // Branch name text
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', (branch.badgeX + branch.badgeWidth / 2).toString());
        text.setAttribute('y', (branch.badgeY + branch.badgeHeight / 2 + 4.5).toString());
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#ffffff');
        text.setAttribute('font-family', font);
        text.setAttribute('font-size', '13px');
        text.setAttribute('font-weight', '600');
        text.textContent = branch.name;
        branchG.appendChild(text);

        // Hover on branch badge
        branchG.addEventListener('mouseenter', () => {
          branchG.classList.add('hovered');
          if (onComponentHover) onComponentHover(branch.id);
        });
        branchG.addEventListener('mouseleave', () => {
          branchG.classList.remove('hovered');
          if (onComponentHover) onComponentHover(null);
        });

        branchesG.appendChild(branchG);
      });
      rootG.appendChild(branchesG);
    }

    // 4. Layer: Commit Nodes, Slanted Hash Badges & Tags
    if (layout.commits.length > 0) {
      const commitsG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      commitsG.setAttribute('class', 'git-commits-layer');
      const font = theme.fontFamily || 'Outfit, sans-serif';

      layout.commits.forEach(commit => {
        const commitG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        commitG.setAttribute('class', `git-commit-node git-commit-type-${commit.type}`);
        commitG.setAttribute('data-id', commit.id);
        commitG.setAttribute('style', 'cursor: pointer;');

        // Tooltip title
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `Commit: ${commit.hash}\nBranch: ${commit.branchName}${commit.message ? `\nMessage: ${commit.message}` : ''}${commit.tag ? `\nTag: ${commit.tag}` : ''}`;
        commitG.appendChild(title);

        if (commit.type === 'merge') {
          // Double-ring merge node
          const outerRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          outerRing.setAttribute('cx', commit.x.toString());
          outerRing.setAttribute('cy', commit.y.toString());
          outerRing.setAttribute('r', '11');
          outerRing.setAttribute('fill', theme.backgroundColor || '#18181b');
          outerRing.setAttribute('stroke', commit.color);
          outerRing.setAttribute('stroke-width', '4');
          outerRing.setAttribute('class', 'git-commit-outer-ring');
          commitG.appendChild(outerRing);

          const innerDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          innerDot.setAttribute('cx', commit.x.toString());
          innerDot.setAttribute('cy', commit.y.toString());
          innerDot.setAttribute('r', '4');
          innerDot.setAttribute('fill', commit.color);
          innerDot.setAttribute('class', 'git-commit-inner-dot');
          commitG.appendChild(innerDot);
        } else if (commit.type === 'highlight') {
          // Highlighted commit node with glow ring
          const glowRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          glowRing.setAttribute('cx', commit.x.toString());
          glowRing.setAttribute('cy', commit.y.toString());
          glowRing.setAttribute('r', '14');
          glowRing.setAttribute('fill', 'none');
          glowRing.setAttribute('stroke', commit.color);
          glowRing.setAttribute('stroke-width', '2');
          glowRing.setAttribute('stroke-dasharray', '3,3');
          glowRing.setAttribute('opacity', '0.7');
          commitG.appendChild(glowRing);

          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', commit.x.toString());
          circle.setAttribute('cy', commit.y.toString());
          circle.setAttribute('r', '10');
          circle.setAttribute('fill', commit.color);
          circle.setAttribute('stroke', '#ffffff');
          circle.setAttribute('stroke-width', '2');
          commitG.appendChild(circle);
        } else if (commit.type === 'reverse') {
          // Reverted commit with an X inside
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', commit.x.toString());
          circle.setAttribute('cy', commit.y.toString());
          circle.setAttribute('r', '10');
          circle.setAttribute('fill', commit.color);
          commitG.appendChild(circle);

          const x1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          x1.setAttribute('x1', (commit.x - 4).toString());
          x1.setAttribute('y1', (commit.y - 4).toString());
          x1.setAttribute('x2', (commit.x + 4).toString());
          x1.setAttribute('y2', (commit.y + 4).toString());
          x1.setAttribute('stroke', theme.backgroundColor || '#18181b');
          x1.setAttribute('stroke-width', '2');
          commitG.appendChild(x1);

          const x2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          x2.setAttribute('x1', (commit.x + 4).toString());
          x2.setAttribute('y1', (commit.y - 4).toString());
          x2.setAttribute('x2', (commit.x - 4).toString());
          x2.setAttribute('y2', (commit.y + 4).toString());
          x2.setAttribute('stroke', theme.backgroundColor || '#18181b');
          x2.setAttribute('stroke-width', '2');
          commitG.appendChild(x2);
        } else {
          // Standard commit node
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', commit.x.toString());
          circle.setAttribute('cy', commit.y.toString());
          circle.setAttribute('r', '10');
          circle.setAttribute('fill', commit.color);
          commitG.appendChild(circle);
        }

        // Slanted -45° commit hash badge
        if (commit.type !== 'merge' || commit.component.props.hash || commit.component.props.id) {
          const badgeG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          badgeG.setAttribute('class', 'git-commit-hash-badge');
          badgeG.setAttribute('transform', `translate(${commit.x - 8}, ${commit.y + 16}) rotate(-45)`);

          const textLen = commit.hash.length;
          const bWidth = Math.max(56, textLen * 7.5 + 12);
          const bHeight = 18;

          const badgeBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          badgeBg.setAttribute('x', (-bWidth / 2).toString());
          badgeBg.setAttribute('y', '0');
          badgeBg.setAttribute('width', bWidth.toString());
          badgeBg.setAttribute('height', bHeight.toString());
          badgeBg.setAttribute('rx', '3');
          badgeBg.setAttribute('ry', '3');
          badgeBg.setAttribute('fill', '#27272a');
          badgeBg.setAttribute('stroke', '#3f3f46');
          badgeBg.setAttribute('stroke-width', '1');
          badgeBg.setAttribute('opacity', '0.92');
          badgeG.appendChild(badgeBg);

          const hashText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          hashText.setAttribute('x', '0');
          hashText.setAttribute('y', '12.5');
          hashText.setAttribute('text-anchor', 'middle');
          hashText.setAttribute('fill', '#f4f4f5');
          hashText.setAttribute('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace');
          hashText.setAttribute('font-size', '10.5px');
          hashText.setAttribute('font-weight', '600');
          hashText.textContent = commit.hash;
          badgeG.appendChild(hashText);

          commitG.appendChild(badgeG);
        }

        // Tag badge above commit
        if (commit.tag) {
          const tagG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          tagG.setAttribute('class', 'git-tag-pill');
          tagG.setAttribute('transform', `translate(${commit.x}, ${commit.y - 20})`);

          const tWidth = Math.max(48, commit.tag.length * 7.5 + 16);
          const tHeight = 18;

          const tagBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          tagBg.setAttribute('x', (-tWidth / 2).toString());
          tagBg.setAttribute('y', (-tHeight).toString());
          tagBg.setAttribute('width', tWidth.toString());
          tagBg.setAttribute('height', tHeight.toString());
          tagBg.setAttribute('rx', '4');
          tagBg.setAttribute('ry', '4');
          tagBg.setAttribute('fill', commit.color);
          tagG.appendChild(tagBg);

          const tagText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          tagText.setAttribute('x', '0');
          tagText.setAttribute('y', (-5).toString());
          tagText.setAttribute('text-anchor', 'middle');
          tagText.setAttribute('fill', '#ffffff');
          tagText.setAttribute('font-family', font);
          tagText.setAttribute('font-size', '10px');
          tagText.setAttribute('font-weight', 'bold');
          tagText.textContent = commit.tag;
          tagG.appendChild(tagText);

          commitG.appendChild(tagG);
        }

        // Hover on commit node
        commitG.addEventListener('mouseenter', () => {
          commitG.classList.add('hovered');
          if (onComponentHover) onComponentHover(commit.id);
        });
        commitG.addEventListener('mouseleave', () => {
          commitG.classList.remove('hovered');
          if (onComponentHover) onComponentHover(null);
        });

        commitsG.appendChild(commitG);
      });
      rootG.appendChild(commitsG);
    }

    // 5. Layer: Non-Git Components (Text, Containers, Cards, Rectangles, Shapes)
    if (layout.nonGitComponents && layout.nonGitComponents.length > 0) {
      const componentsG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      componentsG.setAttribute('class', 'git-non-git-components-layer');

      const attachComponentInteractivity = (comp: BaseComponent, el: SVGElement) => {
        el.classList.add('diagram-component');
        el.style.cursor = isDiagramLocked ? 'default' : 'grab';
        el.setAttribute('data-id', comp.id);
        if (comp.tags && comp.tags.length > 0) {
          el.setAttribute('data-tags', comp.tags.join(','));
        }
        if (comp.doc) {
          el.setAttribute('data-doc', comp.doc);
        }
        if (comp.url) {
          el.setAttribute('data-url', comp.url);
        }
        if (comp.shadow) {
          el.classList.add('has-shadow');
        }

        el.addEventListener('mouseenter', (e: MouseEvent) => {
          e.stopPropagation();
          el.classList.add('hovered');
          if (onComponentHover) onComponentHover(comp.id);
        });

        el.addEventListener('mouseleave', (e: MouseEvent) => {
          e.stopPropagation();
          el.classList.remove('hovered');
          if (onComponentHover) onComponentHover(null);
        });

        if (comp.children && comp.children.length > 0) {
          comp.children.forEach(child => {
            const childEl = el.querySelector(`[id="${child.id}"]`) as SVGElement;
            if (childEl) {
              attachComponentInteractivity(child, childEl);
            }
          });
        }
      };

      layout.nonGitComponents.forEach((component: BaseComponent) => {
        const g = component.render(theme);
        attachComponentInteractivity(component, g);

        let badgeOffset = 24;

        if (component.doc && showDocumentationModal) {
          const docBadgeG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          docBadgeG.setAttribute('class', 'element-doc-badge');
          const badgeX = component.bounds.width - badgeOffset;
          const badgeY = 6;
          docBadgeG.setAttribute('transform', `translate(${badgeX}, ${badgeY})`);
          docBadgeG.setAttribute('style', 'cursor: pointer;');

          const badgeBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          badgeBg.setAttribute('cx', '9');
          badgeBg.setAttribute('cy', '9');
          badgeBg.setAttribute('r', '8');
          badgeBg.setAttribute('class', 'doc-badge-bg');
          docBadgeG.appendChild(badgeBg);

          const docIcon = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          docIcon.setAttribute('d', 'M6 4h4l3 3v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z M10 4v3h3');
          docIcon.setAttribute('class', 'doc-badge-icon');
          docBadgeG.appendChild(docIcon);

          docBadgeG.addEventListener('click', (e) => {
            e.stopPropagation();
            showDocumentationModal(component);
          });

          g.appendChild(docBadgeG);
          badgeOffset += 22;
        }

        if (component.url) {
          const urlBadgeG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          urlBadgeG.setAttribute('class', 'element-url-badge');
          const badgeX = component.bounds.width - badgeOffset;
          const badgeY = 6;
          urlBadgeG.setAttribute('transform', `translate(${badgeX}, ${badgeY})`);
          urlBadgeG.setAttribute('style', 'cursor: pointer;');

          const badgeBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          badgeBg.setAttribute('cx', '9');
          badgeBg.setAttribute('cy', '9');
          badgeBg.setAttribute('r', '8');
          badgeBg.setAttribute('class', 'url-badge-bg');
          urlBadgeG.appendChild(badgeBg);

          const urlIcon = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          urlIcon.setAttribute('d', 'M7 11l4-4m0 0H8m3 0v3');
          urlIcon.setAttribute('class', 'url-badge-icon');
          urlBadgeG.appendChild(urlIcon);

          urlBadgeG.addEventListener('click', (e) => {
            e.stopPropagation();
            window.open(component.url, '_blank');
          });

          g.appendChild(urlBadgeG);
        }

        componentsG.appendChild(g);
      });
      rootG.appendChild(componentsG);
    }

    // 6. Layer: Non-Git Relationship Paths and Labels (rendered above non-git components)
    if (relLayers) {
      if (relLayers.pathsLayer) {
        rootG.appendChild(relLayers.pathsLayer);
      }
      if (relLayers.labelsLayer) {
        rootG.appendChild(relLayers.labelsLayer);
      }
    }

    viewportG.appendChild(rootG);
  }
}
