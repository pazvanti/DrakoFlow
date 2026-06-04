import { BaseComponent, ThemeVariables, Dimension } from './BaseComponent';
import { VerticalContainerComponent, VerticalContainerProps } from './VerticalContainerComponent';

export interface CloudProps extends VerticalContainerProps {}

export class CloudComponent extends VerticalContainerComponent {
  calculateMinDimensions(theme: ThemeVariables): Dimension {
    const labelLength = this.props.label ? this.props.label.length : 0;
    const labelWidth = Math.max(80, labelLength * 8 + 30);
    const labelHeight = this.props.label ? 28 : 0;

    if (this.children.length === 0) {
      return { width: Math.max(labelWidth, 160), height: 100 };
    }

    const padding = this.props.padding ?? 24; // Extra padding for curves
    const gap = this.props.gap ?? 12;

    let innerWidth = 0;
    let innerHeight = labelHeight;

    this.children.forEach((child, index) => {
      const childDim = child.calculateMinDimensions(theme);
      innerWidth = Math.max(innerWidth, childDim.width);
      innerHeight += childDim.height;
      if (index > 0) innerHeight += gap;
    });

    return {
      width: Math.max(innerWidth + padding * 2, labelWidth, 160),
      height: innerHeight + padding * 2
    };
  }

  layoutChildren(theme: ThemeVariables): void {
    const padding = this.props.padding ?? 24;
    const gap = this.props.gap ?? 12;
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
    const background = this.resolveColor(this.themeOverride.backgroundColor, theme, theme.backgroundColor);
    const text = this.resolveColor(this.themeOverride.textColor, theme, theme.textColor);
    const border = this.resolveColor(this.themeOverride.borderColor, theme, theme.borderColor);
    const font = theme.fontFamily;
    const strokeWidth = this.lineWidth !== undefined ? this.lineWidth.toString() : '1.5';

    const W = this.bounds.width;
    const H = this.bounds.height;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', this.id);
    g.setAttribute('transform', `translate(${this.bounds.x}, ${this.bounds.y})`);

    // Cloud path constructed with bezier curves scaling to W and H
    const cloud = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const pathD = `M ${W*0.15} ${H*0.75} ` +
                  `C ${W*0.02} ${H*0.75} ${W*0.02} ${H*0.45} ${W*0.15} ${H*0.45} ` +
                  `C ${W*0.15} ${H*0.22} ${W*0.32} ${H*0.15} ${W*0.50} ${H*0.25} ` +
                  `C ${W*0.68} ${H*0.15} ${W*0.85} ${H*0.22} ${W*0.85} ${H*0.45} ` +
                  `C ${W*0.98} ${H*0.45} ${W*0.98} ${H*0.75} ${W*0.85} ${H*0.75} ` +
                  `C ${W*0.85} ${H*0.90} ${W*0.68} ${H*0.95} ${W*0.50} ${H*0.85} ` +
                  `C ${W*0.32} ${H*0.85} ${W*0.15} ${H*0.90} ${W*0.15} ${H*0.75} Z`;
    cloud.setAttribute('d', pathD);
    cloud.setAttribute('fill', background);
    cloud.setAttribute('stroke', border);
    cloud.setAttribute('stroke-width', strokeWidth);
    g.appendChild(cloud);

    if (this.props.label) {
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      title.setAttribute('x', (W / 2).toString());
      const labelY = this.children.length === 0 ? (H / 2) : 32;
      title.setAttribute('y', labelY.toString());
      title.setAttribute('fill', text);
      title.setAttribute('font-family', font);
      title.setAttribute('font-size', '12');
      title.setAttribute('font-weight', 'bold');
      title.setAttribute('text-anchor', 'middle');
      title.setAttribute('dominant-baseline', 'central');
      title.textContent = this.props.label;
      g.appendChild(title);
    }

    this.children.forEach(child => {
      g.appendChild(child.render(theme));
    });

    return g;
  }
}
