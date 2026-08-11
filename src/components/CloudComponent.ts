import { BaseComponent, ThemeVariables, Dimension } from './BaseComponent';
import { VerticalContainerComponent, VerticalContainerProps } from './VerticalContainerComponent';
import { getIconSpacing } from '../utils/IconRegistry';

export interface CloudProps extends VerticalContainerProps {
  icon?: string;
}

export class CloudComponent extends VerticalContainerComponent {
  calculateMinDimensions(theme: ThemeVariables): Dimension {
    const labelLength = this.props.label ? this.props.label.length : 0;
    const iconSpacing = getIconSpacing(this.icon || (this.props as any).icon);
    const labelWidth = Math.max(80, labelLength * 8 + iconSpacing + 30);
    const labelHeight = (this.props.label || this.icon || (this.props as any).icon) ? 28 : 0;

    if (this.children.length === 0) {
      return { width: Math.max(labelWidth, 160), height: 100 };
    }

    const padding = this.props.padding ?? 24; // Extra padding for curves
    const gap = this.props.gap ?? 12;

    let innerWidth = 0;
    let innerHeight = 0;

    if (this.isHorizontalLayout()) {
      this.children.forEach((child, index) => {
        const childDim = child.calculateMinDimensions(theme);
        innerWidth += childDim.width;
        if (index > 0) innerWidth += gap;
        innerHeight = Math.max(innerHeight, childDim.height);
      });
      innerHeight += labelHeight;
    } else {
      innerHeight = labelHeight;
      this.children.forEach((child, index) => {
        const childDim = child.calculateMinDimensions(theme);
        innerWidth = Math.max(innerWidth, childDim.width);
        innerHeight += childDim.height;
        if (index > 0) innerHeight += gap;
      });
    }

    return {
      width: Math.max(innerWidth + padding * 2, labelWidth, 160),
      height: innerHeight + padding * 2
    };
  }

  layoutChildren(theme: ThemeVariables): void {
    const padding = this.props.padding ?? 24;
    const gap = this.props.gap ?? 12;
    const labelHeight = (this.props.label || this.icon || (this.props as any).icon) ? 28 : 0;

    if (this.isHorizontalLayout()) {
      let x = padding;
      this.children.forEach((child, index) => {
        const childDim = child.calculateMinDimensions(theme);
        const childWidth = childDim.width;
        const childHeight = Math.max(childDim.height, this.bounds.height - padding * 2 - labelHeight);

        child.bounds = {
          x,
          y: padding + labelHeight,
          width: childWidth,
          height: childHeight
        };

        x += childWidth + (index < this.children.length - 1 ? gap : 0);
      });
    } else {
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

    if (this.props.label || this.icon || (this.props as any).icon) {
      const labelY = this.children.length === 0 ? (H / 2) : 32;
      this.renderLabelWithIcon(
        g,
        this.props.label,
        W / 2,
        labelY,
        text,
        font,
        this.icon || (this.props as any).icon,
        { fontPx: 12 }
      );
    }

    this.children.forEach(child => {
      g.appendChild(child.render(theme));
    });

    return g;
  }
}
