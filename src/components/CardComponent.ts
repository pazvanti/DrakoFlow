import { BaseComponent, ThemeVariables, Dimension } from './BaseComponent';
import { VerticalContainerComponent, VerticalContainerProps } from './VerticalContainerComponent';

export interface CardProps extends VerticalContainerProps {}

export class CardComponent extends VerticalContainerComponent {
  calculateMinDimensions(theme: ThemeVariables): Dimension {
    const labelLength = this.props.label ? this.props.label.length : 0;
    const labelWidth = Math.max(80, labelLength * 8 + 30);
    const labelHeight = this.props.label ? 28 : 0;

    if (this.children.length === 0) {
      return { width: Math.max(labelWidth, 140), height: 80 };
    }

    const padding = this.props.padding ?? 16;
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
    const strokeWidth = this.themeOverride.strokeWidth || '1.5';

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

    // Title label (indented slightly to clear the accent stripe)
    if (this.props.label) {
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      title.setAttribute('x', ((W + 5) / 2).toString()); // Shift center slightly right
      const labelY = this.children.length === 0 ? (H / 2) : 20;
      title.setAttribute('y', labelY.toString());
      title.setAttribute('fill', text);
      title.setAttribute('font-family', font);
      title.setAttribute('font-size', '13');
      title.setAttribute('font-weight', '600');
      title.setAttribute('text-anchor', 'middle');
      title.setAttribute('dominant-baseline', 'central');
      title.textContent = this.props.label;
      g.appendChild(title);
    }

    // Children
    this.children.forEach(child => {
      g.appendChild(child.render(theme));
    });

    return g;
  }
}
