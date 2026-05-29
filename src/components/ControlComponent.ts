import { BaseComponent, ThemeVariables, Dimension } from './BaseComponent';

export interface ControlProps {
  label?: string;
}

export class ControlComponent extends BaseComponent<ControlProps> {
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
    const strokeWidth = this.themeOverride.strokeWidth || '1.5';

    const W = this.bounds.width;
    const H = this.bounds.height;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", this.id);
    g.setAttribute("transform", `translate(${this.bounds.x}, ${this.bounds.y})`);

    // Draw the control icon at the top center
    const cx = W / 2;
    const cy = 28;
    const r = 10;

    // Main Circle
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", cx.toString());
    circle.setAttribute("cy", cy.toString());
    circle.setAttribute("r", r.toString());
    circle.setAttribute("fill", background);
    circle.setAttribute("stroke", border);
    circle.setAttribute("stroke-width", strokeWidth);
    g.appendChild(circle);

    // Clockwise arrow arc over the top of the circle
    const arrowArc = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const arcD = `M ${cx - 5} ${cy - 12} ` +
                 `A 12 12 0 0 1 ${cx + 10} ${cy - 6}`;
    arrowArc.setAttribute("d", arcD);
    arrowArc.setAttribute("fill", "none");
    arrowArc.setAttribute("stroke", border);
    arrowArc.setAttribute("stroke-width", strokeWidth);
    g.appendChild(arrowArc);

    // Arrowhead at the end of the arc (cx+10, cy-6)
    const arrowhead = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const headD = `M ${cx + 5} ${cy - 5} L ${cx + 11} ${cy - 5} L ${cx + 10} ${cy - 11} Z`;
    arrowhead.setAttribute("d", headD);
    arrowhead.setAttribute("fill", border);
    arrowhead.setAttribute("stroke", border);
    g.appendChild(arrowhead);

    // Centered label text below the icon
    if (this.props.label) {
      const textElem = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textElem.setAttribute("x", (W / 2).toString());
      textElem.setAttribute("y", (cy + 22).toString());
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
