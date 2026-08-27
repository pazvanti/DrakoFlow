import { BaseComponent, ThemeVariables } from '../components/BaseComponent';
import { DslDocument, ParsedNode } from '../dsl/parser';
import { ParsedRelationship } from './Relationship';

export interface EngineRenderContext {
  document: DslDocument;
  displayComponents: ParsedNode[];
  displayRelationships: ParsedRelationship[];
  theme: ThemeVariables;
  themeName?: string;
  svgElement?: SVGSVGElement;
  viewportG: SVGGElement;
  isDiagramLocked: boolean;
  rawCode?: string;
  onComponentHover?: (componentId: string | null) => void;
  showDocumentationModal?: (component: BaseComponent) => void;
}

export interface EngineRenderResult {
  engineId: string;
  components: BaseComponent[];
  relationships: ParsedRelationship[];
  bbox: { x: number; y: number; width: number; height: number };
  componentsCount: number;
  relationshipsCount: number;
  layers?: {
    pathsLayer?: SVGGElement;
    labelsLayer?: SVGGElement;
    lifelinesLayer?: SVGGElement;
  };
}

export interface RenderingEngine {
  readonly id: string;
  readonly name: string;
  readonly supportedLayouts: string[];

  /**
   * Determine whether this engine should handle the given document and layout directive.
   */
  canHandle(document: DslDocument, layoutDirective?: string): boolean;

  /**
   * Layout and render the diagram into the viewport.
   */
  render(context: EngineRenderContext): EngineRenderResult;
}
