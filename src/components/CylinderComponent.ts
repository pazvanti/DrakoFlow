import { BaseComponent, ComponentMetadata, ThemeVariables, Dimension } from './BaseComponent';
import { getIconSpacing } from '../utils/IconRegistry';

export interface CylinderProps {
  label?: string;
  icon?: string;
}

export class CylinderComponent extends BaseComponent<CylinderProps> {
  validateProps(): void {
    if (this.props.label !== undefined && typeof this.props.label !== 'string') {
      throw new Error(`Component [${this.id}]: 'label' must be a string.`);
    }
    if (this.props.icon !== undefined && typeof this.props.icon !== 'string') {
      throw new Error(`Component [${this.id}]: 'icon' must be a string.`);
    }
  }

  calculateMinDimensions(theme: ThemeVariables): Dimension {
    const labelLength = this.props.label ? this.props.label.length : 0;
    const iconSpacing = getIconSpacing(this.icon || this.props.icon);
    const calculatedWidth = Math.max(100, labelLength * 8 + iconSpacing + 30);
    const calculatedHeight = 70;
    return { width: calculatedWidth, height: calculatedHeight };
  }

  render(theme: ThemeVariables): SVGElement {
    const background = this.resolveColor(this.themeOverride.backgroundColor, theme, theme.backgroundColor);
    const text = this.resolveColor(this.themeOverride.textColor, theme, theme.textColor);
    const border = this.resolveColor(this.themeOverride.borderColor, theme, theme.borderColor);
    const font = theme.fontFamily;
    const strokeWidth = this.lineWidth !== undefined ? this.lineWidth.toString() : '2';

    const W = this.bounds.width;
    const H = this.bounds.height;
    const ry = 15; // Vertical radius of top/bottom ellipse caps

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", this.id);
    g.setAttribute("transform", `translate(${this.bounds.x}, ${this.bounds.y})`);

    // Cylinder body path
    const body = document.createElementNS("http://www.w3.org/2000/svg", "path");
    body.setAttribute("d", `M 0 ${ry} L 0 ${H - ry} A ${W / 2} ${ry} 0 0 0 ${W} ${H - ry} L ${W} ${ry} A ${W / 2} ${ry} 0 0 0 0 ${ry} Z`);
    body.setAttribute("fill", background);
    body.setAttribute("stroke", border);
    body.setAttribute("stroke-width", strokeWidth);
    g.appendChild(body);

    // Cylinder top cap
    const topCap = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    topCap.setAttribute("cx", (W / 2).toString());
    topCap.setAttribute("cy", ry.toString());
    topCap.setAttribute("rx", (W / 2).toString());
    topCap.setAttribute("ry", ry.toString());
    topCap.setAttribute("fill", background);
    topCap.setAttribute("stroke", border);
    topCap.setAttribute("stroke-width", strokeWidth);
    g.appendChild(topCap);

    // Draw centered label & icon (offset slightly down due to top cap)
    this.renderLabelWithIcon(
      g,
      this.props.label,
      W / 2,
      H / 2 + ry / 2,
      text,
      font,
      this.icon || this.props.icon
    );

    return g;
  }
}
