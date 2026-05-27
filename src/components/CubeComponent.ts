import { BaseComponent, ComponentMetadata, ThemeVariables, Dimension } from './BaseComponent';

export interface CubeProps {
  label?: string;
}

export class CubeComponent extends BaseComponent<CubeProps> {
  validateProps(): void {
    if (this.props.label !== undefined && typeof this.props.label !== 'string') {
      throw new Error(`Component [${this.id}]: 'label' must be a string.`);
    }
  }

  calculateMinDimensions(theme: ThemeVariables): Dimension {
    const labelLength = this.props.label ? this.props.label.length : 0;
    const calculatedWidth = Math.max(110, labelLength * 8 + 40);
    const calculatedHeight = 70;
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
    const d = 12; // 3D depth offset in pixels

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", this.id);
    g.setAttribute("transform", `translate(${this.bounds.x}, ${this.bounds.y})`);

    // 1. Top face (parallelogram)
    const topFace = document.createElementNS("http://www.w3.org/2000/svg", "path");
    topFace.setAttribute("d", `M 0 ${d} L ${d} 0 L ${W} 0 L ${W - d} ${d} Z`);
    topFace.setAttribute("fill", background);
    topFace.setAttribute("stroke", border);
    topFace.setAttribute("stroke-width", strokeWidth);
    g.appendChild(topFace);

    // Top face shading overlay (slightly lighter/darker)
    const topShade = document.createElementNS("http://www.w3.org/2000/svg", "path");
    topShade.setAttribute("d", `M 0 ${d} L ${d} 0 L ${W} 0 L ${W - d} ${d} Z`);
    topShade.setAttribute("fill", "black");
    topShade.setAttribute("fill-opacity", "0.05");
    topShade.setAttribute("pointer-events", "none");
    g.appendChild(topShade);

    // 2. Right face (parallelogram)
    const rightFace = document.createElementNS("http://www.w3.org/2000/svg", "path");
    rightFace.setAttribute("d", `M ${W - d} ${d} L ${W} 0 L ${W} ${H - d} L ${W - d} ${H} Z`);
    rightFace.setAttribute("fill", background);
    rightFace.setAttribute("stroke", border);
    rightFace.setAttribute("stroke-width", strokeWidth);
    g.appendChild(rightFace);

    // Right face shading overlay (deeper shadow)
    const rightShade = document.createElementNS("http://www.w3.org/2000/svg", "path");
    rightShade.setAttribute("d", `M ${W - d} ${d} L ${W} 0 L ${W} ${H - d} L ${W - d} ${H} Z`);
    rightShade.setAttribute("fill", "black");
    rightShade.setAttribute("fill-opacity", "0.15");
    rightShade.setAttribute("pointer-events", "none");
    g.appendChild(rightShade);

    // 3. Front face (rectangle)
    const frontFace = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    frontFace.setAttribute("x", "0");
    frontFace.setAttribute("y", d.toString());
    frontFace.setAttribute("width", (W - d).toString());
    frontFace.setAttribute("height", (H - d).toString());
    frontFace.setAttribute("fill", background);
    frontFace.setAttribute("stroke", border);
    frontFace.setAttribute("stroke-width", strokeWidth);
    g.appendChild(frontFace);

    // Draw centered label on the front face
    if (this.props.label) {
      const textElem = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textElem.setAttribute("x", ((W - d) / 2).toString());
      textElem.setAttribute("y", (d + (H - d) / 2).toString());
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
