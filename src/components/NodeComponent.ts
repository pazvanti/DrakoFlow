import { BaseComponent, ThemeVariables, Dimension } from './BaseComponent';
import { VerticalContainerComponent, VerticalContainerProps } from './VerticalContainerComponent';

export interface NodeProps extends VerticalContainerProps {}

export class NodeComponent extends VerticalContainerComponent {
  private readonly depthOffset = 12;

  calculateMinDimensions(theme: ThemeVariables): Dimension {
    const labelLength = this.props.label ? this.props.label.length : 0;
    const labelWidth = Math.max(80, labelLength * 8 + 30);
    const labelHeight = this.props.label ? 28 : 0;

    if (this.children.length === 0) {
      return { width: Math.max(labelWidth, 140) + this.depthOffset, height: 80 + this.depthOffset };
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
      width: Math.max(innerWidth + padding * 2, labelWidth) + this.depthOffset,
      height: innerHeight + padding * 2 + this.depthOffset
    };
  }

  layoutChildren(theme: ThemeVariables): void {
    const padding = this.props.padding ?? 16;
    const gap = this.props.gap ?? 12;
    const labelHeight = this.props.label ? 28 : 0;

    // Children are offset inside the front face (which starts at y = depthOffset)
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

  render(theme: ThemeVariables): SVGElement {
    const background = this.resolveColor(this.themeOverride.backgroundColor, theme, theme.backgroundColor);
    const text = this.resolveColor(this.themeOverride.textColor, theme, theme.textColor);
    const border = this.resolveColor(this.themeOverride.borderColor, theme, theme.borderColor);
    const font = theme.fontFamily;
    const strokeWidth = this.themeOverride.strokeWidth || '1.5';

    const W = this.bounds.width;
    const H = this.bounds.height;
    const d = this.depthOffset;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', this.id);
    g.setAttribute('transform', `translate(${this.bounds.x}, ${this.bounds.y})`);

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

    // Draw title label on the front face (near the top)
    if (this.props.label) {
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      title.setAttribute('x', ((W - d) / 2).toString());
      title.setAttribute('y', (d + 20).toString());
      title.setAttribute('fill', text);
      title.setAttribute('font-family', font);
      title.setAttribute('font-size', '13');
      title.setAttribute('font-weight', '600');
      title.setAttribute('text-anchor', 'middle');
      title.textContent = this.props.label;
      g.appendChild(title);
    }

    // Render nested children
    this.children.forEach(child => {
      g.appendChild(child.render(theme));
    });

    return g;
  }
}
