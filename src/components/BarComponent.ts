import { BaseComponent, ComponentMetadata, ThemeVariables, Dimension } from './BaseComponent';

export interface BarProps {
  values?: number[];
  color?: string;
  label?: string;
  rx?: number;
  ry?: number;
  is3D?: boolean;
  threeD?: boolean;
  depth?: number;
}

export class BarComponent extends BaseComponent<BarProps> {
  validateProps(): void {
    if (this.props.values !== undefined && !Array.isArray(this.props.values)) {
      throw new Error(`Component [${this.id}]: 'values' must be an array of numbers.`);
    }
  }

  calculateMinDimensions(_theme: ThemeVariables): Dimension {
    return {
      width: this.manualWidth || 80,
      height: this.manualHeight || 60
    };
  }

  render(theme: ThemeVariables): SVGElement {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "diagram-component chart-series-bar");
    g.setAttribute("id", this.id);
    g.setAttribute("data-id", this.id);

    const color = this.resolveColor(this.props.color, theme, theme.primaryColor || '#38bdf8');
    const width = this.bounds.width || 80;
    const height = this.bounds.height || 60;

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", width.toString());
    rect.setAttribute("height", height.toString());
    rect.setAttribute("fill", color);
    rect.setAttribute("rx", (this.props.rx ?? 4).toString());
    rect.setAttribute("ry", (this.props.ry ?? 4).toString());
    g.appendChild(rect);

    if (this.props.label) {
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", (width / 2).toString());
      text.setAttribute("y", (height / 2).toString());
      text.setAttribute("fill", theme.textColor || '#ffffff');
      text.setAttribute("font-family", theme.fontFamily || 'Outfit, sans-serif');
      text.setAttribute("font-size", "12");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "central");
      text.textContent = this.props.label;
      g.appendChild(text);
    }

    return g;
  }
}
