import { BaseComponent, ComponentMetadata, ThemeVariables, Dimension } from './BaseComponent';

export interface InterfaceProps {
  label?: string;
}

export class InterfaceComponent extends BaseComponent<InterfaceProps> {
  validateProps(): void {
    if (this.props.label !== undefined && typeof this.props.label !== 'string') {
      throw new Error(`Component [${this.id}]: 'label' must be a string.`);
    }
  }

  calculateMinDimensions(_theme: ThemeVariables): Dimension {
    const labelLength = this.props.label ? this.props.label.length : 0;
    const width = Math.max(150, labelLength * 7.5 + 40);
    // Header (stereotype row 22px + name row 28px) + methods compartment placeholder (30px min)
    return { width, height: 80 };
  }

  render(theme: ThemeVariables): SVGElement {
    const background = this.resolveColor(this.themeOverride.backgroundColor, theme, theme.backgroundColor);
    const textColor  = this.resolveColor(this.themeOverride.textColor, theme, theme.textColor);
    const border     = this.resolveColor(this.themeOverride.borderColor, theme, theme.borderColor);
    const font       = theme.fontFamily;
    const strokeWidth = this.themeOverride.strokeWidth || '1.5';

    const { width, height } = this.bounds;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', this.id);
    g.setAttribute('transform', `translate(${this.bounds.x}, ${this.bounds.y})`);

    // Outer rect
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', width.toString());
    rect.setAttribute('height', height.toString());
    rect.setAttribute('fill', background);
    rect.setAttribute('stroke', border);
    rect.setAttribute('stroke-width', strokeWidth);
    g.appendChild(rect);

    // «interface» stereotype in smaller italic text
    const stereoElem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    stereoElem.setAttribute('x', (width / 2).toString());
    stereoElem.setAttribute('y', '14');
    stereoElem.setAttribute('fill', textColor);
    stereoElem.setAttribute('font-family', font);
    stereoElem.setAttribute('font-size', '10');
    stereoElem.setAttribute('font-style', 'italic');
    stereoElem.setAttribute('text-anchor', 'middle');
    stereoElem.setAttribute('dominant-baseline', 'central');
    stereoElem.setAttribute('opacity', '0.75');
    stereoElem.textContent = '«interface»';
    g.appendChild(stereoElem);

    // Label (class name)
    if (this.props.label) {
      const labelElem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      labelElem.setAttribute('x', (width / 2).toString());
      labelElem.setAttribute('y', '33');
      labelElem.setAttribute('fill', textColor);
      labelElem.setAttribute('font-family', font);
      labelElem.setAttribute('font-size', '13');
      labelElem.setAttribute('font-weight', 'bold');
      labelElem.setAttribute('text-anchor', 'middle');
      labelElem.setAttribute('dominant-baseline', 'central');
      labelElem.textContent = this.props.label;
      g.appendChild(labelElem);
    }

    // Separator line below header (at y=50)
    const sep = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    sep.setAttribute('x1', '0');
    sep.setAttribute('y1', '50');
    sep.setAttribute('x2', width.toString());
    sep.setAttribute('y2', '50');
    sep.setAttribute('stroke', border);
    sep.setAttribute('stroke-width', strokeWidth);
    g.appendChild(sep);

    return g;
  }
}
