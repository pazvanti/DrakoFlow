import { BaseComponent, ThemeVariables, Dimension } from './BaseComponent';

export interface QueueProps {
  label?: string;
}

export class QueueComponent extends BaseComponent<QueueProps> {
  validateProps(): void {
    if (this.props.label !== undefined && typeof this.props.label !== 'string') {
      throw new Error(`Component [${this.id}]: 'label' must be a string.`);
    }
  }

  calculateMinDimensions(theme: ThemeVariables): Dimension {
    const labelLength = this.props.label ? this.props.label.length : 0;
    const calculatedWidth = Math.max(120, labelLength * 8 + 40);
    const calculatedHeight = 50;
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
    const d = 12; // Cylinder curve offset

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", this.id);
    g.setAttribute("transform", `translate(${this.bounds.x}, ${this.bounds.y})`);

    // Main tube body (flat top/bottom, rounded ends)
    const body = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const pathD = `M ${d} 0 ` +
                  `L ${W - d} 0 ` +
                  `A ${d} ${H/2} 0 0 1 ${W - d} ${H} ` +
                  `L ${d} ${H} ` +
                  `A ${d} ${H/2} 0 0 1 ${d} 0 Z`;
    body.setAttribute('d', pathD);
    body.setAttribute('fill', background);
    body.setAttribute('stroke', border);
    body.setAttribute('stroke-width', strokeWidth);
    g.appendChild(body);

    // Left ellipse (fully drawn open mouth of queue)
    const mouth = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    mouth.setAttribute('cx', d.toString());
    mouth.setAttribute('cy', (H / 2).toString());
    mouth.setAttribute('rx', d.toString());
    mouth.setAttribute('ry', (H / 2).toString());
    mouth.setAttribute('fill', background);
    mouth.setAttribute('stroke', border);
    mouth.setAttribute('stroke-width', strokeWidth);
    g.appendChild(mouth);

    // Right end cap arc (only front curve)
    const endCap = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const endD = `M ${W - d} 0 A ${d} ${H/2} 0 0 1 ${W - d} ${H}`;
    endCap.setAttribute('d', endD);
    endCap.setAttribute('fill', 'none');
    endCap.setAttribute('stroke', border);
    endCap.setAttribute('stroke-width', strokeWidth);
    g.appendChild(endCap);

    // Centered label text (indented slightly right of the left cap)
    if (this.props.label) {
      const textElem = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textElem.setAttribute("x", ((W + d) / 2).toString());
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
