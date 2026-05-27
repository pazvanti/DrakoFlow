import { BaseComponent, ComponentMetadata, ThemeVariables, Dimension } from './BaseComponent';

export interface ActorProps {
  label?: string;
}

export class ActorComponent extends BaseComponent<ActorProps> {
  validateProps(): void {
    if (this.props.label !== undefined && typeof this.props.label !== 'string') {
      throw new Error(`Component [${this.id}]: 'label' must be a string.`);
    }
  }

  calculateMinDimensions(theme: ThemeVariables): Dimension {
    // Actors are vertically oriented and have fixed minimum dimensions
    return { width: 70, height: 100 };
  }

  render(theme: ThemeVariables): SVGElement {
    const background = this.resolveColor(this.themeOverride.backgroundColor, theme, theme.backgroundColor);
    const text = this.resolveColor(this.themeOverride.textColor, theme, theme.textColor);
    const border = this.resolveColor(this.themeOverride.borderColor, theme, theme.borderColor);
    const font = theme.fontFamily;
    const strokeWidth = this.themeOverride.strokeWidth || '2';

    const W = this.bounds.width;
    const H = this.bounds.height;
    
    // Allocate bottom 20px for the text label
    const H_fig = H - 20; 
    const cx = W / 2;

    const r = H_fig * 0.12;      // Head radius
    const cy = H_fig * 0.20;     // Head center Y
    const torsoY = H_fig * 0.65; // Bottom of torso/hip Y
    const armY = H_fig * 0.40;   // Arm Y line

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", this.id);
    g.setAttribute("transform", `translate(${this.bounds.x}, ${this.bounds.y})`);

    // 1. Draw head (circle)
    const head = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    head.setAttribute("cx", cx.toString());
    head.setAttribute("cy", cy.toString());
    head.setAttribute("r", r.toString());
    head.setAttribute("fill", background);
    head.setAttribute("stroke", border);
    head.setAttribute("stroke-width", strokeWidth);
    g.appendChild(head);

    // 2. Draw torso (vertical line)
    const torso = document.createElementNS("http://www.w3.org/2000/svg", "line");
    torso.setAttribute("x1", cx.toString());
    torso.setAttribute("y1", (cy + r).toString());
    torso.setAttribute("x2", cx.toString());
    torso.setAttribute("y2", torsoY.toString());
    torso.setAttribute("stroke", border);
    torso.setAttribute("stroke-width", strokeWidth);
    g.appendChild(torso);

    // 3. Draw arms (horizontal line)
    const arms = document.createElementNS("http://www.w3.org/2000/svg", "line");
    arms.setAttribute("x1", (cx - W * 0.28).toString());
    arms.setAttribute("y1", armY.toString());
    arms.setAttribute("x2", (cx + W * 0.28).toString());
    arms.setAttribute("y2", armY.toString());
    arms.setAttribute("stroke", border);
    arms.setAttribute("stroke-width", strokeWidth);
    g.appendChild(arms);

    // 4. Draw legs (diagonal lines)
    const leftLeg = document.createElementNS("http://www.w3.org/2000/svg", "line");
    leftLeg.setAttribute("x1", cx.toString());
    leftLeg.setAttribute("y1", torsoY.toString());
    leftLeg.setAttribute("x2", (cx - W * 0.22).toString());
    leftLeg.setAttribute("y2", H_fig.toString());
    leftLeg.setAttribute("stroke", border);
    leftLeg.setAttribute("stroke-width", strokeWidth);
    g.appendChild(leftLeg);

    const rightLeg = document.createElementNS("http://www.w3.org/2000/svg", "line");
    rightLeg.setAttribute("x1", cx.toString());
    rightLeg.setAttribute("y1", torsoY.toString());
    rightLeg.setAttribute("x2", (cx + W * 0.22).toString());
    rightLeg.setAttribute("y2", H_fig.toString());
    rightLeg.setAttribute("stroke", border);
    rightLeg.setAttribute("stroke-width", strokeWidth);
    g.appendChild(rightLeg);

    // 5. Draw label centered at the bottom of the bounding box
    if (this.props.label) {
      const textElem = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textElem.setAttribute("x", cx.toString());
      textElem.setAttribute("y", (H - 8).toString());
      textElem.setAttribute("fill", text);
      textElem.setAttribute("font-family", font);
      textElem.setAttribute("font-size", "12");
      textElem.setAttribute("text-anchor", "middle");
      textElem.setAttribute("dominant-baseline", "central");
      textElem.textContent = this.props.label;
      g.appendChild(textElem);
    }

    return g;
  }
}
