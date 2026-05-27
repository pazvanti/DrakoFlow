import { BaseComponent, ComponentMetadata, ThemeVariables, Dimension } from './BaseComponent';

export interface TextProps {
  label?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Renders a simple single-line text label without any box or border.
 */
export class TextComponent extends BaseComponent<TextProps> {
  validateProps(): void {
    if (this.props.label !== undefined && typeof this.props.label !== 'string') {
      throw new Error(`Component [${this.id}]: 'label' must be a string.`);
    }
    if (this.props.align !== undefined && !['left', 'center', 'right'].includes(this.props.align)) {
      throw new Error(`Component [${this.id}]: 'align' must be 'left', 'center', or 'right'.`);
    }
  }

  calculateMinDimensions(_theme: ThemeVariables): Dimension {
    const labelLength = this.props.label ? this.props.label.length : 0;
    const calculatedWidth = Math.max(40, labelLength * 8);
    const calculatedHeight = 24;
    return { width: calculatedWidth, height: calculatedHeight };
  }

  render(theme: ThemeVariables): SVGElement {
    const text = this.resolveColor(this.themeOverride.textColor, theme, theme.textColor);
    const font = theme.fontFamily;
    const W = this.bounds.width;
    const H = this.bounds.height;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", this.id);
    g.setAttribute("transform", `translate(${this.bounds.x}, ${this.bounds.y})`);

    if (this.props.label) {
      const textElem = document.createElementNS("http://www.w3.org/2000/svg", "text");
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

      textElem.setAttribute("x", xStr);
      textElem.setAttribute("y", (H / 2).toString());
      textElem.setAttribute("fill", text);
      textElem.setAttribute("font-family", font);
      textElem.setAttribute("font-size", "13");
      textElem.setAttribute("text-anchor", anchor);
      textElem.setAttribute("dominant-baseline", "central");
      textElem.textContent = this.props.label;
      g.appendChild(textElem);
    }

    return g;
  }
}
