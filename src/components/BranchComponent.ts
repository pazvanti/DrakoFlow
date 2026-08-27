import { BaseComponent, ComponentMetadata, ThemeVariables, Dimension } from './BaseComponent';
import { VerticalContainerComponent, VerticalContainerProps } from './VerticalContainerComponent';

export interface BranchProps extends VerticalContainerProps {
  label?: string;
  order?: number;
  color?: string;
}

/**
 * Represents a Git Branch lane in a Git Flow diagram.
 * Can hold nested Commit components or be referenced by commits.
 */
export class BranchComponent extends BaseComponent<BranchProps> {
  public order?: number;
  public color?: string;

  constructor(
    metadata: ComponentMetadata,
    props: BranchProps,
    themeOverride: Partial<ThemeVariables>
  ) {
    super(metadata, props, themeOverride);
    this.order = props.order;
    this.color = props.color;
  }

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
    if (this.props.order !== undefined && typeof this.props.order !== 'number') {
      throw new Error(`Component [${this.id}]: 'order' must be a number.`);
    }
    if (this.props.color !== undefined && typeof this.props.color !== 'string') {
      throw new Error(`Component [${this.id}]: 'color' must be a string.`);
    }
  }

  calculateMinDimensions(theme: ThemeVariables): Dimension {
    const labelText = this.props.label || this.id;
    const badgeWidth = Math.max(70, labelText.length * 8 + 24);
    
    if (this.children.length === 0) {
      return { width: Math.max(badgeWidth + 100, 200), height: 60 };
    }

    const padding = this.props.padding ?? 16;
    const gap = this.props.gap ?? 24;

    let innerWidth = 0;
    let innerHeight = 0;

    // Horizontal layout for commits inside a branch
    this.children.forEach((child, index) => {
      const childDim = child.calculateMinDimensions(theme);
      innerWidth += childDim.width;
      if (index > 0) innerWidth += gap;
      innerHeight = Math.max(innerHeight, childDim.height);
    });

    return {
      width: Math.max(badgeWidth + 40 + innerWidth + padding * 2, 220),
      height: Math.max(innerHeight + padding * 2, 60)
    };
  }

  layoutChildren(theme: ThemeVariables): void {
    const labelText = this.props.label || this.id;
    const badgeWidth = Math.max(70, labelText.length * 8 + 24);
    const startX = badgeWidth + 30;
    const padding = this.props.padding ?? 16;
    const gap = this.props.gap ?? 24;

    let x = startX;
    this.children.forEach((child, index) => {
      const childDim = child.calculateMinDimensions(theme);
      child.bounds = {
        x,
        y: (this.bounds.height - childDim.height) / 2,
        width: childDim.width,
        height: childDim.height
      };
      x += childDim.width + (index < this.children.length - 1 ? gap : 0);
    });
  }

  render(theme: ThemeVariables): SVGElement {
    const branchColor = this.color || this.resolveColor(this.themeOverride.primaryColor, theme, theme.primaryColor);
    const textColor = this.resolveColor(this.themeOverride.textColor, theme, '#ffffff');
    const borderColor = this.resolveColor(this.themeOverride.borderColor, theme, theme.borderColor);
    const font = theme.fontFamily;
    const labelText = this.props.label || this.id;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', this.id);
    g.setAttribute('class', 'git-branch-container');
    g.setAttribute('transform', `translate(${this.bounds.x}, ${this.bounds.y})`);

    // Track guide line
    const centerY = this.bounds.height / 2;
    const guideLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    guideLine.setAttribute('x1', '0');
    guideLine.setAttribute('y1', centerY.toString());
    guideLine.setAttribute('x2', this.bounds.width.toString());
    guideLine.setAttribute('y2', centerY.toString());
    guideLine.setAttribute('stroke', borderColor);
    guideLine.setAttribute('stroke-dasharray', '4,4');
    guideLine.setAttribute('stroke-opacity', '0.4');
    guideLine.setAttribute('stroke-width', '1.5');
    g.appendChild(guideLine);

    // Branch badge
    const badgeHeight = 26;
    const badgeWidth = Math.max(65, labelText.length * 8 + 20);
    const badgeY = centerY - badgeHeight / 2;

    const badgeRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    badgeRect.setAttribute('x', '0');
    badgeRect.setAttribute('y', badgeY.toString());
    badgeRect.setAttribute('width', badgeWidth.toString());
    badgeRect.setAttribute('height', badgeHeight.toString());
    badgeRect.setAttribute('rx', '6');
    badgeRect.setAttribute('ry', '6');
    badgeRect.setAttribute('fill', branchColor);
    badgeRect.setAttribute('class', 'git-branch-badge');
    g.appendChild(badgeRect);

    // Badge text
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', (badgeWidth / 2).toString());
    text.setAttribute('y', (centerY + 4.5).toString());
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', textColor);
    text.setAttribute('font-family', font);
    text.setAttribute('font-size', '12px');
    text.setAttribute('font-weight', '600');
    text.textContent = labelText;
    g.appendChild(text);

    // Render children
    this.renderChildren(g, theme);

    return g;
  }
}
