import { BaseComponent, ComponentMetadata, ThemeVariables, Dimension } from './BaseComponent';

export interface DiamondProps {
  label?: string;
}

export class DiamondComponent extends BaseComponent<DiamondProps> {
  validateProps(): void {
    if (this.props.label !== undefined && typeof this.props.label !== 'string') {
      throw new Error(`Component [${this.id}]: 'label' must be a string.`);
    }
  }

  calculateMinDimensions(theme: ThemeVariables): Dimension {
    const labelLength = this.props.label ? this.props.label.length : 0;
    // Diamonds need extra width/height so that text doesn't hit the diagonal walls
    const calculatedWidth = Math.max(120, labelLength * 12 + 20);
    const calculatedHeight = Math.max(80, labelLength * 6 + 30);
    return { width: calculatedWidth, height: calculatedHeight };
  }

  render(theme: ThemeVariables): SVGElement {
    const background = this.resolveColor(this.themeOverride.backgroundColor, theme, theme.backgroundColor);
    const text = this.resolveColor(this.themeOverride.textColor, theme, theme.textColor);
    const border = this.resolveColor(this.themeOverride.borderColor, theme, theme.borderColor);
    const font = theme.fontFamily;
    const strokeWidth = this.themeOverride.strokeWidth || '2';

    const W = this.bounds.width;
    const H = this.bounds.height;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", this.id);
    g.setAttribute("transform", `translate(${this.bounds.x}, ${this.bounds.y})`);

    // Diamond shape path
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M ${W / 2} 0 L ${W} ${H / 2} L ${W / 2} ${H} L 0 ${H / 2} Z`);
    path.setAttribute("fill", background);
    path.setAttribute("stroke", border);
    path.setAttribute("stroke-width", strokeWidth);
    g.appendChild(path);

    // Centered label
    if (this.props.label) {
      const textElem = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textElem.setAttribute("x", (W / 2).toString());
      textElem.setAttribute("y", (H / 2).toString());
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
