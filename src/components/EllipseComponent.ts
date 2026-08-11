import { BaseComponent, ThemeVariables, Dimension } from './BaseComponent';
import { getIconSpacing } from '../utils/IconRegistry';

export interface EllipseProps {
  label?: string;
  icon?: string;
  /** Equal horizontal and vertical radius (circle). */
  radius?: number;
  rx?: number;
  ry?: number;
}

/**
 * Circle or ellipse shape with optional centered label and vector icon.
 */
export class EllipseComponent extends BaseComponent<EllipseProps> {
  validateProps(): void {
    if (this.props.label !== undefined && typeof this.props.label !== 'string') {
      throw new Error(`Component [${this.id}]: 'label' must be a string.`);
    }
    if (this.props.icon !== undefined && typeof this.props.icon !== 'string') {
      throw new Error(`Component [${this.id}]: 'icon' must be a string.`);
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
    const iconSpacing = getIconSpacing(this.icon || this.props.icon);
    const textPadding = Math.max(0, labelLength * 4 + iconSpacing);
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
    const background = this.resolveColor(this.themeOverride.backgroundColor, theme, theme.backgroundColor);
    const text = this.resolveColor(this.themeOverride.textColor, theme, theme.textColor);
    const border = this.resolveColor(this.themeOverride.borderColor, theme, theme.borderColor);
    const font = theme.fontFamily;
    const strokeWidth = this.lineWidth !== undefined ? this.lineWidth.toString() : '2';

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

    this.renderLabelWithIcon(
      g,
      this.props.label,
      cx,
      cy,
      text,
      font,
      this.icon || this.props.icon
    );

    return g;
  }
}
