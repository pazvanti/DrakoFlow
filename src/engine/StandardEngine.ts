import { RenderingEngine, EngineRenderContext, EngineRenderResult } from './types';
import { BaseComponent } from '../components/BaseComponent';
import { createComponentsFromDsl } from './componentFactory';
import { layoutRootComponents } from './layout';
import { renderRelationships } from './relationshipRenderer';
import { DslDocument } from '../dsl/parser';

export class StandardEngine implements RenderingEngine {
  public readonly id = 'standard';
  public readonly name = 'Standard Engine';
  public readonly supportedLayouts = ['left-to-right', 'top-to-bottom'];

  canHandle(document: DslDocument, layoutDirective?: string): boolean {
    const layout = layoutDirective || document.layout;
    if (layout === 'git-flow' || layout === 'gitgraph') {
      return false;
    }
    // Check if document contains any Branch/Commit without explicit standard layout
    const hasGitComponents = document.components.some(c => c.type === 'Branch' || c.type === 'Commit');
    if (hasGitComponents && layout !== 'left-to-right' && layout !== 'top-to-bottom') {
      return false;
    }
    return true;
  }

  render(context: EngineRenderContext): EngineRenderResult {
    const {
      document: dslDoc,
      displayComponents,
      displayRelationships,
      theme,
      svgElement,
      viewportG,
      isDiagramLocked,
      onComponentHover,
      showDocumentationModal
    } = context;

    const parsedLayout = dslDoc.layout === 'top-to-bottom' ? 'top-to-bottom' : 'left-to-right';
    const components = createComponentsFromDsl(displayComponents);

    layoutRootComponents(components, theme, displayRelationships, parsedLayout);

    let relLayers: { pathsLayer: SVGGElement; labelsLayer: SVGGElement; lifelinesLayer: SVGGElement } | null = null;
    if (displayRelationships.length > 0) {
      relLayers = renderRelationships(
        displayRelationships,
        components,
        theme,
        svgElement || (document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement),
        undefined,
        isDiagramLocked
      );
    }

    viewportG.innerHTML = '';

    if (relLayers && relLayers.lifelinesLayer) {
      viewportG.appendChild(relLayers.lifelinesLayer);
    }

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

      // Hover listener for line highlighting
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

    components.forEach((component: BaseComponent) => {
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

        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = 'View Documentation';
        docBadgeG.appendChild(title);

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
          showDocumentationModal(component);
        });

        g.appendChild(docBadgeG);
        badgeOffset += 20;
      }

      if (component.url) {
        const urlBadgeG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        urlBadgeG.setAttribute('class', 'element-url-badge');
        const badgeX = component.bounds.width - badgeOffset;
        const badgeY = 6;
        urlBadgeG.setAttribute('transform', `translate(${badgeX}, ${badgeY})`);
        urlBadgeG.setAttribute('style', 'cursor: pointer;');

        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `Open Link: ${component.url}`;
        urlBadgeG.appendChild(title);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', '9');
        circle.setAttribute('cy', '9');
        circle.setAttribute('r', '9');
        circle.setAttribute('class', 'url-badge-bg');
        urlBadgeG.appendChild(circle);

        const iconG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        iconG.setAttribute('class', 'url-badge-icon');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71');
        path.setAttribute('transform', 'scale(0.75)');
        
        iconG.appendChild(path);
        urlBadgeG.appendChild(iconG);

        urlBadgeG.addEventListener('mousedown', (e: MouseEvent) => e.stopPropagation());
        urlBadgeG.addEventListener('click', (e: MouseEvent) => {
          e.stopPropagation();
          window.open(component.url, '_blank');
        });

        g.appendChild(urlBadgeG);
      }

      viewportG.appendChild(g);
    });

    if (relLayers) {
      viewportG.appendChild(relLayers.pathsLayer);
      viewportG.appendChild(relLayers.labelsLayer);
    }

    // Calculate bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    components.forEach(c => {
      minX = Math.min(minX, c.bounds.x);
      minY = Math.min(minY, c.bounds.y);
      maxX = Math.max(maxX, c.bounds.x + c.bounds.width);
      maxY = Math.max(maxY, c.bounds.y + c.bounds.height);
    });

    const bbox = (components.length > 0 && isFinite(minX))
      ? { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
      : { x: 0, y: 0, width: 800, height: 600 };

    return {
      engineId: this.id,
      components,
      relationships: displayRelationships,
      bbox,
      componentsCount: components.length,
      relationshipsCount: displayRelationships.length,
      layers: relLayers || undefined
    };
  }
}
