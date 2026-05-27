import { BaseComponent, ThemeVariables, Dimension } from './BaseComponent';

export interface EllipseProps {
  label?: string;
  /** Equal horizontal and vertical radius (circle). */
  radius?: number;
  rx?: number;
  ry?: number;
}

/**
 * Circle or ellipse shape with optional centered label.
 */
export class EllipseComponent extends BaseComponent<EllipseProps> {
  validateProps(): void {
    if (this.props.label !== undefined && typeof this.props.label !== 'string') {
      throw new Error(`Component [${this.id}]: 'label' must be a string.`);
    }
    for (const key of ['radius', 'rx', 'ry'] as const) {
      const value = this.props[key];
      if (value !== undefined && typeof value !== 'number') {
        throw new Error(`Component [${this.id}]: '${key}' must be a number.`);
      }
    }
  }

  calculateMinDimensions(_theme: ThemeVariables): Dimension {
    const labelLength = this.props.label ? this.props.label.length : 0;
    const textPadding = Math.max(0, labelLength * 4);
    const diameter = (this.props.radius ?? Math.max(this.props.rx ?? 40, this.props.ry ?? 40)) * 2;
    const size = Math.max(80, diameter + textPadding);
    return { width: size, height: size };
  }

  private resolveRadii(): { rx: number; ry: number } {
    if (this.props.radius !== undefined) {
      return { rx: this.props.radius, ry: this.props.radius };
    }
    const rx = this.props.rx ?? this.bounds.width / 2;
    const ry = this.props.ry ?? this.bounds.height / 2;
    return { rx, ry };
  }

  render(theme: ThemeVariables): SVGElement {
    // Resolve styling hierarchy: Global Theme -> Component Local Override -> Default Fallback
    const background = this.resolveColor(this.themeOverride.backgroundColor, theme, theme.backgroundColor);
    const text = this.resolveColor(this.themeOverride.textColor, theme, theme.textColor);
    const border = this.resolveColor(this.themeOverride.borderColor, theme, theme.borderColor);
    const font = theme.fontFamily;
    const strokeWidth = this.themeOverride.strokeWidth || '2';

    const { rx, ry } = this.resolveRadii();
    const cx = this.bounds.width / 2;
    const cy = this.bounds.height / 2;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', this.id);
    g.setAttribute('transform', `translate(${this.bounds.x}, ${this.bounds.y})`);

    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('cx', cx.toString());
    ellipse.setAttribute('cy', cy.toString());
    ellipse.setAttribute('rx', rx.toString());
    ellipse.setAttribute('ry', ry.toString());
    ellipse.setAttribute('fill', background);
    ellipse.setAttribute('stroke', border);
    ellipse.setAttribute('stroke-width', strokeWidth);
    g.appendChild(ellipse);

    if (this.props.label) {
      const textElem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textElem.setAttribute('x', cx.toString());
      textElem.setAttribute('y', cy.toString());
      textElem.setAttribute('fill', text);
      textElem.setAttribute('font-family', font);
      textElem.setAttribute('text-anchor', 'middle');
      textElem.setAttribute('dominant-baseline', 'central');
      textElem.textContent = this.props.label;
      g.appendChild(textElem);
    }

    return g;
  }
}
