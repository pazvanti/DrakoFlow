import { BaseComponent, ThemeVariables, Dimension } from './BaseComponent';

export interface StorageProps {
  label?: string;
}

export class StorageComponent extends BaseComponent<StorageProps> {
  validateProps(): void {
    if (this.props.label !== undefined && typeof this.props.label !== 'string') {
      throw new Error(`Component [${this.id}]: 'label' must be a string.`);
    }
  }

  calculateMinDimensions(theme: ThemeVariables): Dimension {
    const labelLength = this.props.label ? this.props.label.length : 0;
    const calculatedWidth = Math.max(120, labelLength * 8 + 40);
    const calculatedHeight = 65;
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
    const d = 15; // curvature depth radius for the caps

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", this.id);
    g.setAttribute("transform", `translate(${this.bounds.x}, ${this.bounds.y})`);

    // Storage is a horizontal cylinder/drum
    // Main body path (curved left cap and closed right cap)
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

    // Endcap overlay curves for horizontal cylinder depth/shading look
    const capLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const capD = `M ${W - d} 0 ` +
                 `A ${d} ${H/2} 0 0 1 ${W - d} ${H} ` +
                 `M ${d} 0 ` +
                 `A ${d} ${H/2} 0 0 0 ${d} ${H}`;
    capLine.setAttribute('d', capD);
    capLine.setAttribute('fill', 'none');
    capLine.setAttribute('stroke', border);
    capLine.setAttribute('stroke-width', strokeWidth);
    g.appendChild(capLine);

    // Label text centered inside the horizontal cylinder
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
