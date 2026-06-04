import { BaseComponent, ThemeVariables, Dimension } from './BaseComponent';

export interface ProcessProps {
  label?: string;
  /** Width of each side tab as a fraction of total width (0–0.3). */
  tabWidthRatio?: number;
}

/**
 * Flowchart process step — full-height left/right tabs with a wide center panel.
 *
 * ```text
 * |---|----------------------|---|
 * |   |      MyComponent     |   |
 * |---|----------------------|---|
 * ```
 */
export class ProcessComponent extends BaseComponent<ProcessProps> {
  validateProps(): void {
    if (this.props.label !== undefined && typeof this.props.label !== 'string') {
      throw new Error(`Component [${this.id}]: 'label' must be a string.`);
    }
    if (this.props.tabWidthRatio !== undefined) {
      const ratio = this.props.tabWidthRatio;
      if (typeof ratio !== 'number' || ratio <= 0 || ratio > 0.3) {
        throw new Error(`Component [${this.id}]: 'tabWidthRatio' must be a number between 0 and 0.3.`);
      }
    }
  }

  getTabWidth(totalWidth: number): number {
    const ratio = this.props.tabWidthRatio ?? 0.12;
    return Math.min(24, Math.max(12, totalWidth * ratio));
  }

  calculateMinDimensions(_theme: ThemeVariables): Dimension {
    const labelLength = this.props.label ? this.props.label.length : 0;
    return {
      width: Math.max(160, labelLength * 8 + 80),
      height: 56
    };
  }

  /** Outer rectangle outline. */
  buildProcessOutline(width: number, height: number): string {
    return `M 0 0 H ${width} V ${height} H 0 Z`;
  }

  render(theme: ThemeVariables): SVGElement {
    // Resolve styling hierarchy: Global Theme -> Component Local Override -> Default Fallback
    const background = this.resolveColor(this.themeOverride.backgroundColor, theme, theme.backgroundColor);
    const text = this.resolveColor(this.themeOverride.textColor, theme, theme.textColor);
    const border = this.resolveColor(this.themeOverride.borderColor, theme, theme.borderColor);
    const font = theme.fontFamily;
    const strokeWidth = this.lineWidth !== undefined ? this.lineWidth.toString() : '2';

    const { width, height } = this.bounds;
    const tabW = this.getTabWidth(width);
    const centerLeft = tabW;
    const centerRight = width - tabW;
    const centerMidX = centerLeft + (centerRight - centerLeft) / 2;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', this.id);
    g.setAttribute('transform', `translate(${this.bounds.x}, ${this.bounds.y})`);

    const outline = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    outline.setAttribute('d', this.buildProcessOutline(width, height));
    outline.setAttribute('fill', background);
    outline.setAttribute('stroke', border);
    outline.setAttribute('stroke-width', strokeWidth);
    outline.setAttribute('stroke-linejoin', 'miter');
    g.appendChild(outline);

    const addDivider = (x: number): void => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x.toString());
      line.setAttribute('y1', '0');
      line.setAttribute('x2', x.toString());
      line.setAttribute('y2', height.toString());
      line.setAttribute('stroke', border);
      line.setAttribute('stroke-width', strokeWidth);
      g.appendChild(line);
    };

    addDivider(centerLeft);
    addDivider(centerRight);

    if (this.props.label) {
      const textElem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textElem.setAttribute('x', centerMidX.toString());
      textElem.setAttribute('y', (height / 2).toString());
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
