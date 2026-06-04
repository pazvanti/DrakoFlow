import { BaseComponent, ThemeVariables, Dimension } from './BaseComponent';

export interface UsecaseProps {
  label?: string;
}

export class UsecaseComponent extends BaseComponent<UsecaseProps> {
  validateProps(): void {
    if (this.props.label !== undefined && typeof this.props.label !== 'string') {
      throw new Error(`Component [${this.id}]: 'label' must be a string.`);
    }
  }

  calculateMinDimensions(theme: ThemeVariables): Dimension {
    const labelLength = this.props.label ? this.props.label.length : 0;
    // Flat horizontal ellipse: wide dimensions
    const calculatedWidth = Math.max(140, labelLength * 8 + 40);
    const calculatedHeight = 60;
    return { width: calculatedWidth, height: calculatedHeight };
  }

  render(theme: ThemeVariables): SVGElement {
    const background = this.resolveColor(this.themeOverride.backgroundColor, theme, theme.backgroundColor);
    const text = this.resolveColor(this.themeOverride.textColor, theme, theme.textColor);
    const border = this.resolveColor(this.themeOverride.borderColor, theme, theme.borderColor);
    const font = theme.fontFamily;
    const strokeWidth = this.lineWidth !== undefined ? this.lineWidth.toString() : '1.5';

    const W = this.bounds.width;
    const H = this.bounds.height;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", this.id);
    g.setAttribute("transform", `translate(${this.bounds.x}, ${this.bounds.y})`);

    // Draw horizontal ellipse
    const ellipse = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    ellipse.setAttribute("cx", (W / 2).toString());
    ellipse.setAttribute("cy", (H / 2).toString());
    ellipse.setAttribute("rx", (W / 2).toString());
    ellipse.setAttribute("ry", (H / 2).toString());
    ellipse.setAttribute("fill", background);
    ellipse.setAttribute("stroke", border);
    ellipse.setAttribute("stroke-width", strokeWidth);
    g.appendChild(ellipse);

    // Centered label text
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
