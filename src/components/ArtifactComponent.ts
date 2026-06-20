import { BaseComponent, ThemeVariables, Dimension } from './BaseComponent';
import { VerticalContainerComponent, VerticalContainerProps } from './VerticalContainerComponent';

export interface ArtifactProps extends VerticalContainerProps {}

export class ArtifactComponent extends VerticalContainerComponent {
  calculateMinDimensions(theme: ThemeVariables): Dimension {
    const labelLength = this.props.label ? this.props.label.length : 0;
    const labelWidth = Math.max(80, labelLength * 8 + 40); // extra padding for top-right icon
    const labelHeight = this.props.label ? 28 : 0;

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
    const font = theme.fontFamily;
    const strokeWidth = this.lineWidth !== undefined ? this.lineWidth.toString() : '1.5';

    const W = this.bounds.width;
    const H = this.bounds.height;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', this.id);
    g.setAttribute('transform', `translate(${this.bounds.x}, ${this.bounds.y})`);

    // Draw main rectangle
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", W.toString());
    rect.setAttribute("height", H.toString());
    rect.setAttribute("fill", background);
    rect.setAttribute("stroke", border);
    rect.setAttribute("stroke-width", strokeWidth);
    g.appendChild(rect);

    // Draw document sheet icon in the top-right corner
    const iconW = 12;
    const iconH = 16;
    const iconX = W - iconW - 10;
    const iconY = 10;
    const foldSize = 4;

    const docIcon = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const pathD = `M ${iconX} ${iconY} ` +
                  `L ${iconX + iconW - foldSize} ${iconY} ` +
                  `L ${iconX + iconW} ${iconY + foldSize} ` +
                  `L ${iconX + iconW} ${iconY + iconH} ` +
                  `L ${iconX} ${iconY + iconH} Z`;
    docIcon.setAttribute('d', pathD);
    docIcon.setAttribute('fill', 'none');
    docIcon.setAttribute('stroke', border);
    docIcon.setAttribute('stroke-width', '1.2');
    g.appendChild(docIcon);

    const docFold = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const foldD = `M ${iconX + iconW - foldSize} ${iconY} ` +
                  `L ${iconX + iconW - foldSize} ${iconY + foldSize} ` +
                  `L ${iconX + iconW} ${iconY + foldSize}`;
    docFold.setAttribute('d', foldD);
    docFold.setAttribute('fill', 'none');
    docFold.setAttribute('stroke', border);
    docFold.setAttribute('stroke-width', '1.2');
    g.appendChild(docFold);

    // Title label
    if (this.props.label) {
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      title.setAttribute('x', (W / 2).toString());
      title.setAttribute('y', '20');
      title.setAttribute('fill', text);
      title.setAttribute('font-family', font);
      title.setAttribute('font-size', '13');
      title.setAttribute('font-weight', '600');
      title.setAttribute('text-anchor', 'middle');
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
