import { BaseComponent, ThemeVariables, Dimension } from './BaseComponent';
import { VerticalContainerComponent, VerticalContainerProps } from './VerticalContainerComponent';
import { getIconSpacing } from '../utils/IconRegistry';

export interface CardProps extends VerticalContainerProps {
  icon?: string;
}

export class CardComponent extends VerticalContainerComponent {
  calculateMinDimensions(theme: ThemeVariables): Dimension {
    const labelLength = this.props.label ? this.props.label.length : 0;
    const iconSpacing = getIconSpacing(this.icon || (this.props as any).icon);
    const labelWidth = Math.max(80, labelLength * 8 + iconSpacing + 30);
    const labelHeight = (this.props.label || this.icon || (this.props as any).icon) ? 28 : 0;

    if (this.children.length === 0) {
      return { width: Math.max(labelWidth, 140), height: 80 };
    }

    const padding = this.props.padding ?? 16;
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
      width: Math.max(innerWidth + padding * 2, labelWidth, 140),
      height: innerHeight + padding * 2
    };
  }

  render(theme: ThemeVariables): SVGElement {
    const background = this.resolveColor(this.themeOverride.backgroundColor, theme, theme.backgroundColor);
    const text = this.resolveColor(this.themeOverride.textColor, theme, theme.textColor);
    const border = this.resolveColor(this.themeOverride.borderColor, theme, theme.borderColor);
    const primary = this.resolveColor(this.themeOverride.primaryColor, theme, theme.primaryColor);
    const font = theme.fontFamily;
    const strokeWidth = this.lineWidth !== undefined ? this.lineWidth.toString() : '1.5';

    const W = this.bounds.width;
    const H = this.bounds.height;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', this.id);
    g.setAttribute('transform', `translate(${this.bounds.x}, ${this.bounds.y})`);

    // Draw main card body
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", W.toString());
    rect.setAttribute("height", H.toString());
    rect.setAttribute("fill", background);
    rect.setAttribute("stroke", border);
    rect.setAttribute("stroke-width", strokeWidth);
    rect.setAttribute("rx", "4");
    rect.setAttribute("ry", "4");
    g.appendChild(rect);

    // Draw left-accent colored stripe (5px wide)
    const stripe = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    stripe.setAttribute("width", "5");
    stripe.setAttribute("height", (H - 2 * Number(strokeWidth)).toString());
    stripe.setAttribute("x", strokeWidth);
    stripe.setAttribute("y", strokeWidth);
    stripe.setAttribute("fill", primary);
    stripe.setAttribute("rx", "2");
    stripe.setAttribute("ry", "2");
    g.appendChild(stripe);

    // Title label & icon
    if (this.props.label || this.icon || (this.props as any).icon) {
      const labelY = this.children.length === 0 ? (H / 2) : 20;
      this.renderLabelWithIcon(
        g,
        this.props.label,
        (W + 5) / 2,
        labelY,
        text,
        font,
        this.icon || (this.props as any).icon,
        { fontPx: 13 }
      );
    }

    // Children
    this.children.forEach(child => {
      g.appendChild(child.render(theme));
    });

    return g;
  }
}
