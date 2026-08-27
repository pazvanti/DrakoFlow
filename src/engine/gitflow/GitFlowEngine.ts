import { RenderingEngine, EngineRenderContext, EngineRenderResult } from '../types';
import { createComponentsFromDsl } from '../componentFactory';
import { computeGitFlowLayout } from './GitFlowLayout';
import { GitFlowRenderer } from './GitFlowRenderer';
import { DslDocument } from '../../dsl/parser';

export class GitFlowEngine implements RenderingEngine {
  public readonly id = 'git-flow';
  public readonly name = 'Git Flow Engine';
  public readonly supportedLayouts = ['git-flow', 'gitgraph'];

  canHandle(document: DslDocument, layoutDirective?: string): boolean {
    const layout = (layoutDirective || document.layout || '').toLowerCase();
    if (layout === 'git-flow' || layout === 'gitflow' || layout === 'gitgraph') {
      return true;
    }
    // Auto-detect if document has Branch or Commit components and no conflicting layout
    const hasGitComponents = document.components.some(
      c => c.type === 'Branch' || c.type === 'Commit'
    );
    if (hasGitComponents && layout !== 'left-to-right' && layout !== 'top-to-bottom') {
      return true;
    }
    return false;
  }

  render(context: EngineRenderContext): EngineRenderResult {
    const {
      displayComponents,
      displayRelationships,
      theme,
      themeName = 'drako-dark',
      viewportG,
      isDiagramLocked = false,
      onComponentHover,
      showDocumentationModal,
      svgElement
    } = context;

    const components = createComponentsFromDsl(displayComponents);
    const layoutResult = computeGitFlowLayout(components, displayRelationships, theme, themeName);

    GitFlowRenderer.render(layoutResult, viewportG, {
      theme,
      themeName,
      isDiagramLocked,
      onComponentHover,
      showDocumentationModal,
      svgElement
    });

    return {
      engineId: this.id,
      components,
      relationships: displayRelationships,
      bbox: layoutResult.bbox,
      componentsCount: layoutResult.commits.length + layoutResult.nonGitComponents.length,
      relationshipsCount: layoutResult.paths.length + layoutResult.nonGitRelationships.length
    };
  }
}
