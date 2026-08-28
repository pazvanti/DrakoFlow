import { createIconSvgElement, hasIcon } from '../utils/IconRegistry';

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
  
  // Optional embedded markdown documentation
  public doc?: string;
  
  // Optional embedded URL link
  public url?: string;

  // Optional border line width override
  public lineWidth?: number;

  // Optional drop shadow toggle
  public shadow?: boolean;

  // Optional vector icon name (e.g. "docker", "aws", "postgres", "gear", "database", "web-service")
  public icon?: string;
  
  // Properties unique to the component type (e.g., rows, content)
  public props: TProps;
  
  // Local style overrides
  public themeOverride: TStyle;
  
  // Resolved bounds calculated by the Layout Engine
  public bounds: BoundingBox = { x: 0, y: 0, width: 200, height: 150 };

  // Manual position and dimension overrides from the DSL
  public manualX?: number;
  public manualY?: number;
  public manualWidth?: number;
  public manualHeight?: number;

  // Set to true if this component represents a sequence lifeline
  public lifeline: boolean = false;

  // Nested child components if any
  public children: BaseComponent[] = [];

  constructor(metadata: ComponentMetadata, props: TProps, themeOverride: TStyle) {
    this.id = metadata.id;
    this.type = metadata.type;
    this.tags = metadata.tags;
    this.props = props;
    this.themeOverride = themeOverride;
    if (props && typeof (props as any).icon === 'string') {
      this.icon = (props as any).icon;
    }
  }

  /**
   * Appends rendered nested child components to the parent SVG group element.
   */
  protected renderChildren(g: SVGElement, theme: ThemeVariables): void {
    if (this.children && this.children.length > 0) {
      this.children.forEach(child => {
        g.appendChild(child.render(theme));
      });
    }
  }

  /**
   * Helper method to render a centered or aligned label text with an optional vector icon.
   */
  protected renderLabelWithIcon(
    g: SVGElement,
    label: string | undefined,
    centerX: number,
    centerY: number,
    textColor: string,
    fontFamily: string,
    iconName?: string,
    options: { iconSize?: number; gap?: number; fontPx?: number } = {}
  ): void {
    const activeIcon = iconName || this.icon || (this.props && (this.props as any).icon);
    const hasText = Boolean(label && label.length > 0);
    const hasIconSvg = hasIcon(activeIcon);

    if (!hasText && !hasIconSvg) return;

    const iconSize = options.iconSize ?? 16;
    const gap = options.gap ?? 6;
    const fontPx = options.fontPx ?? 14;

    const textWidth = hasText ? label!.length * (fontPx * 0.55) : 0;
    const iconWidth = hasIconSvg ? iconSize + gap : 0;
    const totalWidth = iconWidth + textWidth;

    const startX = centerX - totalWidth / 2;

    if (hasIconSvg) {
      const iconX = startX;
      const iconY = centerY - iconSize / 2;
      const iconElem = createIconSvgElement(activeIcon, { size: iconSize, color: textColor });
      if (iconElem) {
        const iconG = document.createElementNS("http://www.w3.org/2000/svg", "g");
        iconG.setAttribute("transform", `translate(${iconX}, ${iconY})`);
        iconG.appendChild(iconElem);
        g.appendChild(iconG);
      }
    }

    if (hasText) {
      const textX = hasIconSvg ? startX + iconWidth : centerX;
      const textElem = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textElem.setAttribute("x", textX.toString());
      textElem.setAttribute("y", centerY.toString());
      textElem.setAttribute("fill", textColor);
      textElem.setAttribute("font-family", fontFamily);
      textElem.setAttribute("text-anchor", hasIconSvg ? "start" : "middle");
      textElem.setAttribute("dominant-baseline", "central");
      textElem.textContent = label!;
      g.appendChild(textElem);
    }
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

  public static currentLayoutAlgorithm: 'left-to-right' | 'top-to-bottom' = 'left-to-right';
}

export function setCurrentLayoutAlgorithm(alg: 'left-to-right' | 'top-to-bottom'): void {
  BaseComponent.currentLayoutAlgorithm = alg;
}
