export interface Point {
  x: number;
  y: number;
}

export interface Dimension {
  width: number;
  height: number;
}

export interface BoundingBox extends Point, Dimension {}

export interface ThemeVariables {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  fontFamily: string;
  [key: string]: string; // Support for component-specific style properties
}

export interface ComponentMetadata {
  id: string;
  type: string;
  tags: string[];
}

export abstract class BaseComponent<TProps = any, TStyle = Partial<ThemeVariables>> {
  public readonly id: string;
  public readonly type: string;
  public readonly tags: string[];
  
  // Properties unique to the component type (e.g., rows, content)
  public props: TProps;
  
  // Local style overrides
  public themeOverride: TStyle;
  
  // Resolved bounds calculated by the Layout Engine
  public bounds: BoundingBox = { x: 0, y: 0, width: 200, height: 150 };

  // Manual position overrides from the DSL
  public manualX?: number;
  public manualY?: number;

  // Set to true if this component represents a sequence lifeline
  public lifeline: boolean = false;

  constructor(metadata: ComponentMetadata, props: TProps, themeOverride: TStyle) {
    this.id = metadata.id;
    this.type = metadata.type;
    this.tags = metadata.tags;
    this.props = props;
    this.themeOverride = themeOverride;
  }

  /**
   * Validates that the input properties match the component's requirements.
   * Throws an error with a clear message if invalid.
   */
  abstract validateProps(): void;

  /**
   * Calculates the minimum dimensions required to display this component's content
   * based on the resolved font sizes, text lengths, and padding.
   */
  abstract calculateMinDimensions(theme: ThemeVariables): Dimension;

  /**
   * Generates the SVG element hierarchy representing the component.
   */
  abstract render(theme: ThemeVariables): SVGElement;

  /**
   * Resolves a color string. If it matches a theme variable key, returns the theme color.
   */
  protected resolveColor(colorStr: string | undefined, theme: ThemeVariables, fallback: string): string {
    if (!colorStr) return fallback;
    const trimmed = colorStr.trim();
    if (trimmed in theme) {
      return theme[trimmed];
    }
    return trimmed;
  }
}
