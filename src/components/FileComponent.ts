import { BaseComponent, ThemeVariables, Dimension } from './BaseComponent';

export interface FileProps {
  label?: string;
}

export class FileComponent extends BaseComponent<FileProps> {
  validateProps(): void {
    if (this.props.label !== undefined && typeof this.props.label !== 'string') {
      throw new Error(`Component [${this.id}]: 'label' must be a string.`);
    }
  }

  calculateMinDimensions(theme: ThemeVariables): Dimension {
    const labelLength = this.props.label ? this.props.label.length : 0;
    const calculatedWidth = Math.max(100, labelLength * 8 + 30);
    const calculatedHeight = 60;
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
    const d = 12; // Fold offset

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", this.id);
    g.setAttribute("transform", `translate(${this.bounds.x}, ${this.bounds.y})`);

    // File outline path with folded top-right corner
    const body = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const pathD = `M 0 0 ` +
                  `L ${W - d} 0 ` +
                  `L ${W} ${d} ` +
                  `L ${W} ${H} ` +
                  `L 0 ${H} Z`;
    body.setAttribute('d', pathD);
    body.setAttribute('fill', background);
    body.setAttribute('stroke', border);
    body.setAttribute('stroke-width', strokeWidth);
    g.appendChild(body);

    // Fold line path
    const fold = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const foldD = `M ${W - d} 0 ` +
                  `L ${W - d} ${d} ` +
                  `L ${W} ${d}`;
    fold.setAttribute('d', foldD);
    fold.setAttribute('fill', 'none');
    fold.setAttribute('stroke', border);
    fold.setAttribute('stroke-width', strokeWidth);
    g.appendChild(fold);

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
