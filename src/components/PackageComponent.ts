import { BaseComponent, ComponentMetadata, ThemeVariables, Dimension } from './BaseComponent';

export interface PackageProps {
  label?: string;
}

/**
 * Renders a UML Package shape: a folder-style outline with a wider
 * tab on the top-left that shows the package name.
 */
export class PackageComponent extends BaseComponent<PackageProps> {
  validateProps(): void {
    if (this.props.label !== undefined && typeof this.props.label !== 'string') {
      throw new Error(`Component [${this.id}]: 'label' must be a string.`);
    }
  }

  calculateMinDimensions(_theme: ThemeVariables): Dimension {
    const labelLength = this.props.label ? this.props.label.length : 0;
    // Tab must fit the label text
    const tabMinWidth = Math.max(60, labelLength * 7 + 20);
    const bodyWidth   = Math.max(tabMinWidth + 30, 180);
    return { width: bodyWidth, height: 90 };
  }

  render(theme: ThemeVariables): SVGElement {
    const background = this.resolveColor(this.themeOverride.backgroundColor, theme, theme.backgroundColor);
    const textColor  = this.resolveColor(this.themeOverride.textColor, theme, theme.textColor);
    const border     = this.resolveColor(this.themeOverride.borderColor, theme, theme.borderColor);
    const font       = theme.fontFamily;
    const strokeWidth = this.themeOverride.strokeWidth || '1.5';

    const { width, height } = this.bounds;
    const labelLength = this.props.label ? this.props.label.length : 0;
    const tabW = Math.max(60, labelLength * 7 + 20);
    const tabH = 20;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', this.id);
    g.setAttribute('transform', `translate(${this.bounds.x}, ${this.bounds.y})`);

    // Folder tab (top-left) with slightly rounded top-right corner
    const tab = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    tab.setAttribute('d', `M 0 ${tabH} L 0 0 L ${tabW} 0 L ${tabW + 6} ${tabH} Z`);
    tab.setAttribute('fill', background);
    tab.setAttribute('stroke', border);
    tab.setAttribute('stroke-width', strokeWidth);
    tab.setAttribute('stroke-linejoin', 'round');
    g.appendChild(tab);

    // Package name in the tab
    if (this.props.label) {
      const tabLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tabLabel.setAttribute('x', (tabW / 2).toString());
      tabLabel.setAttribute('y', (tabH / 2).toString());
      tabLabel.setAttribute('fill', textColor);
      tabLabel.setAttribute('font-family', font);
      tabLabel.setAttribute('font-size', '11');
      tabLabel.setAttribute('font-weight', 'bold');
      tabLabel.setAttribute('text-anchor', 'middle');
      tabLabel.setAttribute('dominant-baseline', 'central');
      tabLabel.textContent = this.props.label;
      g.appendChild(tabLabel);
    }

    // Main body (starts at tabH, full width)
    const bodyH = height - tabH;
    const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    body.setAttribute('x', '0');
    body.setAttribute('y', tabH.toString());
    body.setAttribute('width', width.toString());
    body.setAttribute('height', bodyH.toString());
    body.setAttribute('fill', background);
    body.setAttribute('stroke', border);
    body.setAttribute('stroke-width', strokeWidth);
    g.appendChild(body);

    return g;
  }
}
