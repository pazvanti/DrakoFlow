import { BaseComponent, ThemeVariables, Dimension } from './BaseComponent';
import { VerticalContainerComponent, VerticalContainerProps } from './VerticalContainerComponent';
import { getIconSpacing } from '../utils/IconRegistry';

export interface NodeProps extends VerticalContainerProps {
  icon?: string;
}

export class NodeComponent extends VerticalContainerComponent {
  private readonly depthOffset = 12;

  calculateMinDimensions(theme: ThemeVariables): Dimension {
    const labelLength = this.props.label ? this.props.label.length : 0;
    const iconSpacing = getIconSpacing(this.icon || (this.props as any).icon);
    const labelWidth = Math.max(80, labelLength * 8 + iconSpacing + 30);
    const labelHeight = (this.props.label || this.icon || (this.props as any).icon) ? 28 : 0;

    if (this.children.length === 0) {
      return { width: Math.max(labelWidth, 140) + this.depthOffset, height: 80 + this.depthOffset };
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
      width: Math.max(innerWidth + padding * 2, labelWidth) + this.depthOffset,
      height: innerHeight + padding * 2 + this.depthOffset
    };
  }

  layoutChildren(theme: ThemeVariables): void {
    const padding = this.props.padding ?? 16;
    const gap = this.props.gap ?? 12;
    const labelHeight = (this.props.label || this.icon || (this.props as any).icon) ? 28 : 0;

    if (this.isHorizontalLayout()) {
      let x = padding;
      this.children.forEach((child, index) => {
        const childDim = child.calculateMinDimensions(theme);
        const childWidth = childDim.width;
        const childHeight = Math.max(childDim.height, this.bounds.height - this.depthOffset - padding * 2 - labelHeight);

        child.bounds = {
          x,
          y: this.depthOffset + padding + labelHeight,
          width: childWidth,
          height: childHeight
        };

        x += childWidth + (index < this.children.length - 1 ? gap : 0);
      });
    } else {
      let y = this.depthOffset + padding + labelHeight;
      this.children.forEach((child, index) => {
        const childDim = child.calculateMinDimensions(theme);
        const childWidth = Math.max(childDim.width, this.bounds.width - this.depthOffset - padding * 2);
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
    const strokeWidth = this.lineWidth !== undefined ? this.lineWidth.toString() : '2';

    const W = this.bounds.width;
    const H = this.bounds.height;
    const d = this.depthOffset;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", this.id);
    g.setAttribute("transform", `translate(${this.bounds.x}, ${this.bounds.y})`);

    // 1. Top face (parallelogram)
    const topFace = document.createElementNS("http://www.w3.org/2000/svg", "path");
    topFace.setAttribute("d", `M 0 ${d} L ${d} 0 L ${W} 0 L ${W - d} ${d} Z`);
    topFace.setAttribute("fill", background);
    topFace.setAttribute("stroke", border);
    topFace.setAttribute("stroke-width", strokeWidth);
    g.appendChild(topFace);

    // Top face shading overlay (slightly lighter/darker)
    const topShade = document.createElementNS("http://www.w3.org/2000/svg", "path");
    topShade.setAttribute("d", `M 0 ${d} L ${d} 0 L ${W} 0 L ${W - d} ${d} Z`);
    topShade.setAttribute("fill", "black");
    topShade.setAttribute("fill-opacity", "0.05");
    topShade.setAttribute("pointer-events", "none");
    g.appendChild(topShade);

    // 2. Right face (parallelogram)
    const rightFace = document.createElementNS("http://www.w3.org/2000/svg", "path");
    rightFace.setAttribute("d", `M ${W - d} ${d} L ${W} 0 L ${W} ${H - d} L ${W - d} ${H} Z`);
    rightFace.setAttribute("fill", background);
    rightFace.setAttribute("stroke", border);
    rightFace.setAttribute("stroke-width", strokeWidth);
    g.appendChild(rightFace);

    // Right face shading overlay (deeper shadow)
    const rightShade = document.createElementNS("http://www.w3.org/2000/svg", "path");
    rightShade.setAttribute("d", `M ${W - d} ${d} L ${W} 0 L ${W} ${H - d} L ${W - d} ${H} Z`);
    rightShade.setAttribute("fill", "black");
    rightShade.setAttribute("fill-opacity", "0.15");
    rightShade.setAttribute("pointer-events", "none");
    g.appendChild(rightShade);

    // 3. Front face (rectangle)
    const frontFace = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    frontFace.setAttribute("x", "0");
    frontFace.setAttribute("y", d.toString());
    frontFace.setAttribute("width", (W - d).toString());
    frontFace.setAttribute("height", (H - d).toString());
    frontFace.setAttribute("fill", background);
    frontFace.setAttribute("stroke", border);
    frontFace.setAttribute("stroke-width", strokeWidth);
    g.appendChild(frontFace);

    // Draw title label & icon on the front face
    if (this.props.label || this.icon || (this.props as any).icon) {
      const labelY = this.children.length === 0 ? (d + (H - d) / 2) : (d + 20);
      this.renderLabelWithIcon(
        g,
        this.props.label,
        (W - d) / 2,
        labelY,
        text,
        font,
        this.icon || (this.props as any).icon,
        { fontPx: 13 }
      );
    }

    // Render nested children
    this.children.forEach(child => {
      g.appendChild(child.render(theme));
    });

    return g;
  }
}
