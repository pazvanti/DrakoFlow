import { BaseComponent, ThemeVariables, Dimension } from './BaseComponent';
import { VerticalContainerComponent, VerticalContainerProps } from './VerticalContainerComponent';

export interface FolderProps extends VerticalContainerProps {}

export class FolderComponent extends VerticalContainerComponent {
  calculateMinDimensions(theme: ThemeVariables): Dimension {
    const labelLength = this.props.label ? this.props.label.length : 0;
    const tabMinWidth = Math.max(60, labelLength * 7 + 20);
    const tabH = 20;

    if (this.children.length === 0) {
      const bodyWidth = Math.max(tabMinWidth + 30, 160);
      return { width: bodyWidth, height: 80 };
    }

    const padding = this.props.padding ?? 16;
    const gap = this.props.gap ?? 12;

    let innerWidth = 0;
    let innerHeight = 0;

    this.children.forEach((child, index) => {
      const childDim = child.calculateMinDimensions(theme);
      innerWidth = Math.max(innerWidth, childDim.width);
      innerHeight += childDim.height;
      if (index > 0) innerHeight += gap;
    });

    const bodyWidth = Math.max(tabMinWidth + 30, innerWidth + padding * 2, 160);
    const bodyHeight = innerHeight + padding * 2;
    return {
      width: bodyWidth,
      height: tabH + bodyHeight
    };
  }

  layoutChildren(theme: ThemeVariables): void {
    const padding = this.props.padding ?? 16;
    const gap = this.props.gap ?? 12;
    const tabH = 20;

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
    const strokeWidth = this.themeOverride.strokeWidth || '1.5';

    const { width, height } = this.bounds;
    const labelLength = this.props.label ? this.props.label.length : 0;
    const tabW = Math.max(60, labelLength * 7 + 20);
    const tabH = 20;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', this.id);
    g.setAttribute('transform', `translate(${this.bounds.x}, ${this.bounds.y})`);

    // Folder tab (top-left) with angled slope (folder tab look)
    const tab = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    tab.setAttribute('d', `M 0 ${tabH} L 0 0 L ${tabW} 0 L ${tabW + 8} ${tabH} Z`);
    tab.setAttribute('fill', background);
    tab.setAttribute('stroke', border);
    tab.setAttribute('stroke-width', strokeWidth);
    tab.setAttribute('stroke-linejoin', 'round');
    g.appendChild(tab);

    // Tab label
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

    // Render nested children
    this.children.forEach(child => {
      g.appendChild(child.render(theme));
    });

    return g;
  }
}
