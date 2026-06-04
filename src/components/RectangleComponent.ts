import { BaseComponent, ComponentMetadata, ThemeVariables, Dimension } from './BaseComponent';

export interface RectangleProps {
  label?: string;
  rx?: number;
  ry?: number;
}

export class RectangleComponent extends BaseComponent<RectangleProps> {
  validateProps(): void {
    if (this.props.label !== undefined && typeof this.props.label !== 'string') {
      throw new Error(`Component [${this.id}]: 'label' must be a string.`);
    }
    if (this.props.rx !== undefined && typeof this.props.rx !== 'number') {
      throw new Error(`Component [${this.id}]: 'rx' must be a number.`);
    }
    if (this.props.ry !== undefined && typeof this.props.ry !== 'number') {
      throw new Error(`Component [${this.id}]: 'ry' must be a number.`);
    }
  }

  calculateMinDimensions(theme: ThemeVariables): Dimension {
    const labelLength = this.props.label ? this.props.label.length : 0;
    
    // Heuristic: ~8px per character + padding, minimum 100 width, 60 height
    const calculatedWidth = Math.max(100, labelLength * 8 + 30);
    const calculatedHeight = 60;
    
    return { width: calculatedWidth, height: calculatedHeight };
  }

  render(theme: ThemeVariables): SVGElement {
    // Resolve styling hierarchy: Global Theme -> Component Local Override -> Default Fallback
    const background = this.resolveColor(this.themeOverride.backgroundColor, theme, theme.backgroundColor);
    const text = this.resolveColor(this.themeOverride.textColor, theme, theme.textColor);
    const border = this.resolveColor(this.themeOverride.borderColor, theme, theme.borderColor);
    const font = theme.fontFamily;
    const strokeWidth = this.lineWidth !== undefined ? this.lineWidth.toString() : '2';
    
    const rx = this.props.rx !== undefined ? this.props.rx : (this.themeOverride.rx !== undefined ? Number(this.themeOverride.rx) : 0);
    const ry = this.props.ry !== undefined ? this.props.ry : (this.themeOverride.ry !== undefined ? Number(this.themeOverride.ry) : 0);

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", this.id);
    g.setAttribute("transform", `translate(${this.bounds.x}, ${this.bounds.y})`);

    // Draw rectangle
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", this.bounds.width.toString());
    rect.setAttribute("height", this.bounds.height.toString());
    rect.setAttribute("fill", background);
    rect.setAttribute("stroke", border);
    rect.setAttribute("stroke-width", strokeWidth);
    if (rx > 0) rect.setAttribute("rx", rx.toString());
    if (ry > 0) rect.setAttribute("ry", ry.toString());
    g.appendChild(rect);

    // Draw centered label
    if (this.props.label) {
      const textElem = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textElem.setAttribute("x", (this.bounds.width / 2).toString());
      textElem.setAttribute("y", (this.bounds.height / 2).toString());
      textElem.setAttribute("fill", text);
      textElem.setAttribute("font-family", font);
      textElem.setAttribute("text-anchor", "middle");
      textElem.setAttribute("dominant-baseline", "central");
      textElem.textContent = this.props.label;
      g.appendChild(textElem);
    }

    return g;
  }
}
