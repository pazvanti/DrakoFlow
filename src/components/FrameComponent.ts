import { BaseComponent, ThemeVariables, Dimension } from './BaseComponent';
import { VerticalContainerComponent, VerticalContainerProps } from './VerticalContainerComponent';

export interface FrameProps extends VerticalContainerProps {}

export class FrameComponent extends VerticalContainerComponent {
  calculateMinDimensions(theme: ThemeVariables): Dimension {
    const labelLength = this.props.label ? this.props.label.length : 0;
    const tabMinWidth = Math.max(80, labelLength * 7 + 25);
    const tabH = 24;

    if (this.children.length === 0) {
      return { width: Math.max(tabMinWidth + 20, 160), height: 80 };
    }

    const padding = this.props.padding ?? 16;
    const gap = this.props.gap ?? 12;

    let innerWidth = 0;
    let innerHeight = tabH; // Header space

    this.children.forEach((child, index) => {
      const childDim = child.calculateMinDimensions(theme);
      innerWidth = Math.max(innerWidth, childDim.width);
      innerHeight += childDim.height;
      if (index > 0) innerHeight += gap;
    });

    const frameWidth = Math.max(innerWidth + padding * 2, tabMinWidth + 20, 160);
    const frameHeight = innerHeight + padding * 2;
    return {
      width: frameWidth,
      height: frameHeight
    };
  }

  layoutChildren(theme: ThemeVariables): void {
    const padding = this.props.padding ?? 16;
    const gap = this.props.gap ?? 12;
    const tabH = 24;

    let y = tabH + padding;

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
    const background = this.resolveColor(this.themeOverride.backgroundColor, theme, theme.backgroundColor);
    const textColor = this.resolveColor(this.themeOverride.textColor, theme, theme.textColor);
    const border = this.resolveColor(this.themeOverride.borderColor, theme, theme.borderColor);
    const font = theme.fontFamily;
    const strokeWidth = this.lineWidth !== undefined ? this.lineWidth.toString() : '1.5';

    const { width, height } = this.bounds;
    const labelLength = this.props.label ? this.props.label.length : 0;
    const tabW = Math.max(80, labelLength * 7 + 25);
    const tabH = 24;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', this.id);
    g.setAttribute('transform', `translate(${this.bounds.x}, ${this.bounds.y})`);

    // Draw main frame border rectangle
    const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    body.setAttribute('width', width.toString());
    body.setAttribute('height', height.toString());
    body.setAttribute('fill', background);
    body.setAttribute('stroke', border);
    body.setAttribute('stroke-width', strokeWidth);
    g.appendChild(body);

    // Draw header title tab inside top-left corner with diagonal cut
    if (this.props.label) {
      const headerTab = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      headerTab.setAttribute('d', `M 0 0 L ${tabW} 0 L ${tabW - 8} ${tabH} L 0 ${tabH} Z`);
      headerTab.setAttribute('fill', 'none');
      headerTab.setAttribute('stroke', border);
      headerTab.setAttribute('stroke-width', strokeWidth);
      g.appendChild(headerTab);

      const tabLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tabLabel.setAttribute('x', ((tabW - 8) / 2).toString());
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

    // Render nested children
    this.children.forEach(child => {
      g.appendChild(child.render(theme));
    });

    return g;
  }
}
