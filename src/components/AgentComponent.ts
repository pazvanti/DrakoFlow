import { BaseComponent, ThemeVariables, Dimension } from './BaseComponent';
import { VerticalContainerComponent, VerticalContainerProps } from './VerticalContainerComponent';

export interface AgentProps extends VerticalContainerProps {}

export class AgentComponent extends VerticalContainerComponent {
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
    const font = theme.fontFamily;
    const strokeWidth = this.lineWidth !== undefined ? this.lineWidth.toString() : '1.5';

    const W = this.bounds.width;
    const H = this.bounds.height;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', this.id);
    g.setAttribute('transform', `translate(${this.bounds.x}, ${this.bounds.y})`);

    // Draw outer card body (rounded rect)
    const outerRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    outerRect.setAttribute("width", W.toString());
    outerRect.setAttribute("height", H.toString());
    outerRect.setAttribute("fill", background);
    outerRect.setAttribute("stroke", border);
    outerRect.setAttribute("stroke-width", strokeWidth);
    outerRect.setAttribute("rx", "8");
    outerRect.setAttribute("ry", "8");
    g.appendChild(outerRect);

    // Draw inner card body (inset double-outline, rx adapted to 4)
    const innerRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    innerRect.setAttribute("x", "4");
    innerRect.setAttribute("y", "4");
    innerRect.setAttribute("width", (W - 8).toString());
    innerRect.setAttribute("height", (H - 8).toString());
    innerRect.setAttribute("fill", "none");
    innerRect.setAttribute("stroke", border);
    innerRect.setAttribute("stroke-width", strokeWidth);
    innerRect.setAttribute("rx", "4");
    innerRect.setAttribute("ry", "4");
    g.appendChild(innerRect);

    // Title label
    if (this.props.label) {
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      title.setAttribute('x', (W / 2).toString());
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
