import { BaseComponent, ThemeVariables, Dimension } from './BaseComponent';

export interface BoundaryProps {
  label?: string;
}

export class BoundaryComponent extends BaseComponent<BoundaryProps> {
  validateProps(): void {
    if (this.props.label !== undefined && typeof this.props.label !== 'string') {
      throw new Error(`Component [${this.id}]: 'label' must be a string.`);
    }
  }

  calculateMinDimensions(theme: ThemeVariables): Dimension {
    const labelLength = this.props.label ? this.props.label.length : 0;
    const calculatedWidth = Math.max(90, labelLength * 8 + 20);
    const calculatedHeight = 80;
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

    // Draw the boundary icon at the top center
    const cx = W / 2 - 8;
    const cy = 25;
    const r = 10;

    // Circle
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", cx.toString());
    circle.setAttribute("cy", cy.toString());
    circle.setAttribute("r", r.toString());
    circle.setAttribute("fill", background);
    circle.setAttribute("stroke", border);
    circle.setAttribute("stroke-width", strokeWidth);
    g.appendChild(circle);

    // Horizontal connector line
    const horizLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    horizLine.setAttribute("x1", (cx + r).toString());
    horizLine.setAttribute("y1", cy.toString());
    horizLine.setAttribute("x2", (cx + r + 10).toString());
    horizLine.setAttribute("y2", cy.toString());
    horizLine.setAttribute("stroke", border);
    horizLine.setAttribute("stroke-width", strokeWidth);
    g.appendChild(horizLine);

    // Vertical line
    const vertLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    vertLine.setAttribute("x1", (cx + r + 10).toString());
    vertLine.setAttribute("y1", (cy - 12).toString());
    vertLine.setAttribute("x2", (cx + r + 10).toString());
    vertLine.setAttribute("y2", (cy + 12).toString());
    vertLine.setAttribute("stroke", border);
    vertLine.setAttribute("stroke-width", strokeWidth);
    g.appendChild(vertLine);

    // Centered label text below the icon
    if (this.props.label) {
      const textElem = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textElem.setAttribute("x", (W / 2).toString());
      textElem.setAttribute("y", (cy + 25).toString());
      textElem.setAttribute("fill", text);
      textElem.setAttribute("font-family", font);
      textElem.setAttribute("font-size", "12");
      textElem.setAttribute("text-anchor", "middle");
      textElem.setAttribute("dominant-baseline", "central");
      textElem.textContent = this.props.label;
      g.appendChild(textElem);
    }

    return g;
  }
}
