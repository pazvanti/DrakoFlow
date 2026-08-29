import { BaseComponent, ComponentMetadata, ThemeVariables, Dimension } from './BaseComponent';

export interface LineProps {
  values?: number[];
  color?: string;
  label?: string;
  strokeWidth?: number;
  showPoints?: boolean;
  filled?: boolean;
  fill?: boolean;
  fillOpacity?: number;
}

export class LineComponent extends BaseComponent<LineProps> {
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
    g.setAttribute("class", "diagram-component chart-series-line");
    g.setAttribute("id", this.id);
    g.setAttribute("data-id", this.id);

    const color = this.resolveColor(this.props.color, theme, theme.secondaryColor || '#4ade80');
    const width = this.bounds.width || 80;
    const height = this.bounds.height || 60;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", "0");
    line.setAttribute("y1", height.toString());
    line.setAttribute("x2", width.toString());
    line.setAttribute("y2", "0");
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", (this.props.strokeWidth ?? 3).toString());
    line.setAttribute("stroke-linecap", "round");
    g.appendChild(line);

    return g;
  }
}
