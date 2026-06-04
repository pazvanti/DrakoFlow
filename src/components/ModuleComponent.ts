import { BaseComponent, ComponentMetadata, ThemeVariables, Dimension } from './BaseComponent';

export interface ModuleProps {
  label?: string;
}

/**
 * Renders a UML Module shape: a rectangle with a small filled tab
 * on the top-left corner — similar to a file card.
 */
export class ModuleComponent extends BaseComponent<ModuleProps> {
  validateProps(): void {
    if (this.props.label !== undefined && typeof this.props.label !== 'string') {
      throw new Error(`Component [${this.id}]: 'label' must be a string.`);
    }
  }

  calculateMinDimensions(_theme: ThemeVariables): Dimension {
    const labelLength = this.props.label ? this.props.label.length : 0;
    const width = Math.max(140, labelLength * 7.5 + 36);
    return { width, height: 65 };
  }

  render(theme: ThemeVariables): SVGElement {
    const background = this.resolveColor(this.themeOverride.backgroundColor, theme, theme.backgroundColor);
    const textColor  = this.resolveColor(this.themeOverride.textColor, theme, theme.textColor);
    const border     = this.resolveColor(this.themeOverride.borderColor, theme, theme.borderColor);
    const font       = theme.fontFamily;
    const strokeWidth = this.lineWidth !== undefined ? this.lineWidth.toString() : '1.5';

    const { width, height } = this.bounds;
    const tabW = Math.min(50, width * 0.35);
    const tabH = 12;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', this.id);
    g.setAttribute('transform', `translate(${this.bounds.x}, ${this.bounds.y})`);

    // Tab on top-left (slightly elevated above the body)
    const tabPath = `M 0 ${tabH} L 0 0 L ${tabW} 0 L ${tabW} ${tabH}`;
    const tab = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    tab.setAttribute('d', tabPath);
    tab.setAttribute('fill', background);
    tab.setAttribute('stroke', border);
    tab.setAttribute('stroke-width', strokeWidth);
    tab.setAttribute('stroke-linejoin', 'round');
    g.appendChild(tab);

    // Main body rect (starts at tabH)
    const bodyH = height - tabH;
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', tabH.toString());
    rect.setAttribute('width', width.toString());
    rect.setAttribute('height', bodyH.toString());
    rect.setAttribute('fill', background);
    rect.setAttribute('stroke', border);
    rect.setAttribute('stroke-width', strokeWidth);
    g.appendChild(rect);

    // Label centred in body
    if (this.props.label) {
      const labelElem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      labelElem.setAttribute('x', (width / 2).toString());
      labelElem.setAttribute('y', (tabH + bodyH / 2).toString());
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
