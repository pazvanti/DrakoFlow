import { BaseComponent, ThemeVariables, Dimension } from './BaseComponent';

export interface VerticalContainerProps {
  label?: string;
  gap?: number;
  padding?: number;
}

const DEFAULT_GAP = 12;
const DEFAULT_PADDING = 16;

/**
 * Stacks child components vertically with configurable spacing.
 */
export class VerticalContainerComponent extends BaseComponent<VerticalContainerProps> {
  public children: BaseComponent[] = [];

  validateProps(): void {
    if (this.props.label !== undefined && typeof this.props.label !== 'string') {
      throw new Error(`Component [${this.id}]: 'label' must be a string.`);
    }
    if (this.props.gap !== undefined && typeof this.props.gap !== 'number') {
      throw new Error(`Component [${this.id}]: 'gap' must be a number.`);
    }
    if (this.props.padding !== undefined && typeof this.props.padding !== 'number') {
      throw new Error(`Component [${this.id}]: 'padding' must be a number.`);
    }
  }

  calculateMinDimensions(theme: ThemeVariables): Dimension {
    const padding = this.props.padding ?? DEFAULT_PADDING;
    const gap = this.props.gap ?? DEFAULT_GAP;
    const labelHeight = this.props.label ? 28 : 0;

    let innerWidth = 0;
    let innerHeight = labelHeight;

    this.children.forEach((child, index) => {
      const childDim = child.calculateMinDimensions(theme);
      innerWidth = Math.max(innerWidth, childDim.width);
      innerHeight += childDim.height;
      if (index > 0) innerHeight += gap;
    });

    return {
      width: innerWidth + padding * 2,
      height: innerHeight + padding * 2
    };
  }

  layoutChildren(theme: ThemeVariables): void {
    const padding = this.props.padding ?? DEFAULT_PADDING;
    const gap = this.props.gap ?? DEFAULT_GAP;
    const labelHeight = this.props.label ? 28 : 0;

    let y = padding + labelHeight;

    this.children.forEach((child, index) => {
      const childDim = child.calculateMinDimensions(theme);
      const childWidth = Math.max(childDim.width, this.bounds.width - padding * 2);
      const childHeight = childDim.height;

      child.bounds = {
        x: padding,
        y,
        width: childWidth,
        height: childHeight
      };

      y += childHeight + (index < this.children.length - 1 ? gap : 0);
    });
  }

  render(theme: ThemeVariables): SVGElement {
    // Resolve styling hierarchy: Global Theme -> Component Local Override -> Default Fallback
    const background = this.resolveColor(this.themeOverride.backgroundColor, theme, theme.backgroundColor);
    const text = this.resolveColor(this.themeOverride.textColor, theme, theme.textColor);
    const border = this.resolveColor(this.themeOverride.borderColor, theme, theme.borderColor);
    const font = theme.fontFamily;
    const strokeWidth = this.themeOverride.strokeWidth || '1';

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', this.id);
    g.setAttribute('transform', `translate(${this.bounds.x}, ${this.bounds.y})`);

    const frame = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    frame.setAttribute('width', this.bounds.width.toString());
    frame.setAttribute('height', this.bounds.height.toString());
    frame.setAttribute('fill', background);
    frame.setAttribute('stroke', border);
    frame.setAttribute('stroke-width', strokeWidth);
    frame.setAttribute('rx', '8');
    frame.setAttribute('ry', '8');
    frame.setAttribute('stroke-dasharray', '4,4');
    g.appendChild(frame);

    if (this.props.label) {
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      title.setAttribute('x', (this.bounds.width / 2).toString());
      title.setAttribute('y', '20');
      title.setAttribute('fill', text);
      title.setAttribute('font-family', font);
      title.setAttribute('font-size', '13');
      title.setAttribute('font-weight', '600');
      title.setAttribute('text-anchor', 'middle');
      title.textContent = this.props.label;
      g.appendChild(title);
    }

    this.children.forEach(child => {
      g.appendChild(child.render(theme));
    });

    return g;
  }
}
