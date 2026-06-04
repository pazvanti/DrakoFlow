import { BaseComponent, ThemeVariables, Dimension } from './BaseComponent';

export interface CollectionsProps {
  label?: string;
}

export class CollectionsComponent extends BaseComponent<CollectionsProps> {
  validateProps(): void {
    if (this.props.label !== undefined && typeof this.props.label !== 'string') {
      throw new Error(`Component [${this.id}]: 'label' must be a string.`);
    }
  }

  calculateMinDimensions(theme: ThemeVariables): Dimension {
    const labelLength = this.props.label ? this.props.label.length : 0;
    // Two overlapping rectangles offset by 8px (total +8px width and height)
    const calculatedWidth = Math.max(100, labelLength * 8 + 30) + 8;
    const calculatedHeight = 60 + 8;
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
    const offset = 8;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", this.id);
    g.setAttribute("transform", `translate(${this.bounds.x}, ${this.bounds.y})`);

    // Back rectangle
    const rect2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect2.setAttribute("x", offset.toString());
    rect2.setAttribute("y", "0");
    rect2.setAttribute("width", (W - offset).toString());
    rect2.setAttribute("height", (H - offset).toString());
    rect2.setAttribute("fill", background);
    rect2.setAttribute("stroke", border);
    rect2.setAttribute("stroke-width", strokeWidth);
    g.appendChild(rect2);

    // Front rectangle
    const rect1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect1.setAttribute("x", "0");
    rect1.setAttribute("y", offset.toString());
    rect1.setAttribute("width", (W - offset).toString());
    rect1.setAttribute("height", (H - offset).toString());
    rect1.setAttribute("fill", background);
    rect1.setAttribute("stroke", border);
    rect1.setAttribute("stroke-width", strokeWidth);
    g.appendChild(rect1);

    // Centered label text on the front rectangle
    if (this.props.label) {
      const textElem = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textElem.setAttribute("x", ((W - offset) / 2).toString());
      textElem.setAttribute("y", (offset + (H - offset) / 2).toString());
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
