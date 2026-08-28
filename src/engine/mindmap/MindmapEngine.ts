import { RenderingEngine, EngineRenderContext, EngineRenderResult } from '../types';
import { createComponentsFromDsl } from '../componentFactory';
import { computeMindmapLayout } from './MindmapLayout';
import { MindmapRenderer } from './MindmapRenderer';
import { DslDocument } from '../../dsl/parser';

export class MindmapEngine implements RenderingEngine {
  public readonly id = 'mindmap';
  public readonly name = 'Mindmap Engine';
  public readonly supportedLayouts = ['mindmap'];

  canHandle(document: DslDocument, layoutDirective?: string): boolean {
    const layout = (layoutDirective || document.layout || '').trim().toLowerCase();
    if (layout.startsWith('mindmap')) {
      return true;
    }
    return false;
  }

  render(context: EngineRenderContext): EngineRenderResult {
    const {
      document: dslDoc,
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
    const layoutDirective = dslDoc.layout;

    const layoutResult = computeMindmapLayout(
      components,
      displayRelationships,
      theme,
      layoutDirective
    );

    MindmapRenderer.render(layoutResult, viewportG, {
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
      componentsCount: components.length,
      relationshipsCount: displayRelationships.length,
      layoutResult
    };
  }
}
