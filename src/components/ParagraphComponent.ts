import { BaseComponent, ComponentMetadata, ThemeVariables, Dimension } from './BaseComponent';

export interface ParagraphProps {
  label?: string; // fallback to text
  text?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Renders a block of multi-line paragraph text.
 * Splitting on newline (\n) characters enables explicit line breaking.
 * Converts literal '\n' escape sequences in DSL properties to real newlines.
 */
export class ParagraphComponent extends BaseComponent<ParagraphProps> {
  validateProps(): void {
    if (this.props.label !== undefined && typeof this.props.label !== 'string') {
      throw new Error(`Component [${this.id}]: 'label' must be a string.`);
    }
    if (this.props.text !== undefined && typeof this.props.text !== 'string') {
      throw new Error(`Component [${this.id}]: 'text' must be a string.`);
    }
    if (this.props.align !== undefined && !['left', 'center', 'right'].includes(this.props.align)) {
      throw new Error(`Component [${this.id}]: 'align' must be 'left', 'center', or 'right'.`);
    }
  }

  private getNormalizedLines(): string[] {
    const rawContent = this.props.text || this.props.label || '';
    const content = rawContent.replace(/\\n/g, '\n');
    return content.split('\n');
  }

  calculateMinDimensions(_theme: ThemeVariables): Dimension {
    const lines = this.getNormalizedLines();
    const lineHeight = 18;
    const height = Math.max(24, lines.length * lineHeight);
    let maxW = 80;
    lines.forEach(line => {
      maxW = Math.max(maxW, line.length * 7.5);
    });
    return { width: maxW, height };
  }

  render(theme: ThemeVariables): SVGElement {
    const text = this.resolveColor(this.themeOverride.textColor, theme, theme.textColor);
    const font = theme.fontFamily;
    const lines = this.getNormalizedLines();
    const lineHeight = 18;
    const W = this.bounds.width;
    const H = this.bounds.height;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", this.id);
    g.setAttribute("transform", `translate(${this.bounds.x}, ${this.bounds.y})`);

    const textElem = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textElem.setAttribute("font-family", font);
    textElem.setAttribute("fill", text);
    textElem.setAttribute("font-size", "13");

    const align = this.props.align || 'center';
    let xStr = (W / 2).toString();
    let anchor = 'middle';
    if (align === 'left') {
      xStr = '0';
      anchor = 'start';
    } else if (align === 'right') {
      xStr = W.toString();
      anchor = 'end';
    }
    textElem.setAttribute("text-anchor", anchor);

    // Render each line using tspan vertical offset positioning
    lines.forEach((line, index) => {
      const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
      tspan.setAttribute("x", xStr);
      const startY = (H - (lines.length - 1) * lineHeight) / 2;
      tspan.setAttribute("y", (startY + index * lineHeight).toString());
      tspan.setAttribute("dominant-baseline", "central");
      tspan.textContent = line;
      textElem.appendChild(tspan);
    });

    g.appendChild(textElem);
    return g;
  }
}
