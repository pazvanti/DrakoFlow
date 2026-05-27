import { BaseComponent, ComponentMetadata, ThemeVariables, Dimension } from './BaseComponent';

export interface UMLComponentProps {
  label?: string;
}

/**
 * Renders a UML Component shape: a rectangle with the standard UML
 * component icon (two small notched rectangles) on the top-right corner.
 */
export class UMLComponentComponent extends BaseComponent<UMLComponentProps> {
  validateProps(): void {
    if (this.props.label !== undefined && typeof this.props.label !== 'string') {
      throw new Error(`Component [${this.id}]: 'label' must be a string.`);
    }
  }

  calculateMinDimensions(_theme: ThemeVariables): Dimension {
    const labelLength = this.props.label ? this.props.label.length : 0;
    const width = Math.max(150, labelLength * 7.5 + 50);
    return { width, height: 70 };
  }

  render(theme: ThemeVariables): SVGElement {
    const background = this.resolveColor(this.themeOverride.backgroundColor, theme, theme.backgroundColor);
    const textColor  = this.resolveColor(this.themeOverride.textColor, theme, theme.textColor);
    const border     = this.resolveColor(this.themeOverride.borderColor, theme, theme.borderColor);
    const font       = theme.fontFamily;
    const strokeWidth = this.themeOverride.strokeWidth || '1.5';

    const { width, height } = this.bounds;
    const iconW = 24;
    const iconH = 18;
    const iconX = width - iconW - 8;
    const iconY = (height - iconH) / 2;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', this.id);
    g.setAttribute('transform', `translate(${this.bounds.x}, ${this.bounds.y})`);

    // Main body rect
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', width.toString());
    rect.setAttribute('height', height.toString());
    rect.setAttribute('fill', background);
    rect.setAttribute('stroke', border);
    rect.setAttribute('stroke-width', strokeWidth);
    g.appendChild(rect);

    // UML Component icon — vertical bar
    const iconBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    iconBar.setAttribute('x', (iconX + 6).toString());
    iconBar.setAttribute('y', iconY.toString());
    iconBar.setAttribute('width', (iconW - 6).toString());
    iconBar.setAttribute('height', iconH.toString());
    iconBar.setAttribute('fill', background);
    iconBar.setAttribute('stroke', border);
    iconBar.setAttribute('stroke-width', strokeWidth);
    g.appendChild(iconBar);

    // Top notch rectangle
    const topNotch = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    topNotch.setAttribute('x', iconX.toString());
    topNotch.setAttribute('y', (iconY + 2).toString());
    topNotch.setAttribute('width', '12');
    topNotch.setAttribute('height', '6');
    topNotch.setAttribute('fill', background);
    topNotch.setAttribute('stroke', border);
    topNotch.setAttribute('stroke-width', strokeWidth);
    g.appendChild(topNotch);

    // Bottom notch rectangle
    const botNotch = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    botNotch.setAttribute('x', iconX.toString());
    botNotch.setAttribute('y', (iconY + 10).toString());
    botNotch.setAttribute('width', '12');
    botNotch.setAttribute('height', '6');
    botNotch.setAttribute('fill', background);
    botNotch.setAttribute('stroke', border);
    botNotch.setAttribute('stroke-width', strokeWidth);
    g.appendChild(botNotch);

    // Label (centred, shifted left to avoid the icon)
    if (this.props.label) {
      const labelElem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      labelElem.setAttribute('x', ((width - iconW - 16) / 2).toString());
      labelElem.setAttribute('y', (height / 2).toString());
      labelElem.setAttribute('fill', textColor);
      labelElem.setAttribute('font-family', font);
      labelElem.setAttribute('font-size', '13');
      labelElem.setAttribute('font-weight', 'bold');
      labelElem.setAttribute('text-anchor', 'middle');
      labelElem.setAttribute('dominant-baseline', 'central');
      labelElem.textContent = this.props.label;
      g.appendChild(labelElem);
    }

    return g;
  }
}
