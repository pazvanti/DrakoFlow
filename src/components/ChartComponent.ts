import { BaseComponent, ComponentMetadata, ThemeVariables, Dimension } from './BaseComponent';
import { BarComponent } from './BarComponent';
import { LineComponent } from './LineComponent';
import { PieComponent } from './PieComponent';

export interface ChartProps {
  width?: number;
  height?: number;
  title?: string;
  xLabel?: string;
  yLabel?: string;
  x?: (string | number)[] | [number, number];
  y?: number[] | [number, number];
  grid?: boolean;
  legend?: boolean;
}

function adjustHexBrightness(hex: string, factor: number): string {
  if (/^#([0-9a-fA-F]{6})$/.test(hex)) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    let newR: number, newG: number, newB: number;
    if (factor > 1) {
      newR = Math.min(255, Math.round(r + (255 - r) * (factor - 1)));
      newG = Math.min(255, Math.round(g + (255 - g) * (factor - 1)));
      newB = Math.min(255, Math.round(b + (255 - b) * (factor - 1)));
    } else {
      newR = Math.max(0, Math.round(r * factor));
      newG = Math.max(0, Math.round(g * factor));
      newB = Math.max(0, Math.round(b * factor));
    }
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
  return hex;
}

function isDarkColor(hex: string): boolean {
  if (!hex || hex === 'transparent') return true;
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length !== 6 && cleanHex.length !== 8) return true;
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum < 140;
}

export class ChartComponent extends BaseComponent<ChartProps> {
  validateProps(): void {
    if (this.props.x !== undefined && !Array.isArray(this.props.x)) {
      throw new Error(`Component [${this.id}]: 'x' must be an array of category names or a range.`);
    }
    if (this.props.y !== undefined && !Array.isArray(this.props.y)) {
      throw new Error(`Component [${this.id}]: 'y' must be an array of numbers or a range.`);
    }
  }

  calculateMinDimensions(_theme: ThemeVariables): Dimension {
    const width = this.manualWidth || this.props.width || 800;
    const height = this.manualHeight || this.props.height || 600;
    return { width, height };
  }

  private resolveCategories(barSeries: BarComponent[], lineSeries: LineComponent[]): string[] {
    if (Array.isArray(this.props.x) && this.props.x.length > 0) {
      // If it's a 2-number range like [1, 10]
      if (this.props.x.length === 2 && typeof this.props.x[0] === 'number' && typeof this.props.x[1] === 'number' && this.props.x[0] < this.props.x[1]) {
        const from = this.props.x[0] as number;
        const to = this.props.x[1] as number;
        const result: string[] = [];
        for (let v = from; v <= to; v++) {
          result.push(v.toString());
        }
        return result;
      }
      return this.props.x.map(String);
    }

    // Default categories based on max series length
    let maxLen = 0;
    barSeries.forEach(b => {
      if (b.props.values && b.props.values.length > maxLen) {
        maxLen = b.props.values.length;
      }
    });
    lineSeries.forEach(l => {
      if (l.props.values && l.props.values.length > maxLen) {
        maxLen = l.props.values.length;
      }
    });

    if (maxLen === 0) maxLen = 1;
    const defaultCats: string[] = [];
    for (let i = 1; i <= maxLen; i++) {
      defaultCats.push(i.toString());
    }
    return defaultCats;
  }

  private calculateYScale(barSeries: BarComponent[], lineSeries: LineComponent[]): { yMin: number; yMax: number; ticks: number[] } {
    let yMin: number | undefined;
    let yMax: number | undefined;
    let explicitTicks: number[] | undefined;

    if (Array.isArray(this.props.y) && this.props.y.length > 0) {
      if (this.props.y.length === 2) {
        yMin = this.props.y[0];
        yMax = this.props.y[1];
      } else {
        explicitTicks = [...this.props.y].sort((a, b) => a - b);
        yMin = explicitTicks[0];
        yMax = explicitTicks[explicitTicks.length - 1];
      }
    }

    if (yMin === undefined || yMax === undefined) {
      const allValues: number[] = [];
      barSeries.forEach(b => {
        if (b.props.values) allValues.push(...b.props.values);
      });
      lineSeries.forEach(l => {
        if (l.props.values) allValues.push(...l.props.values);
      });

      if (allValues.length > 0) {
        const minVal = Math.min(...allValues);
        const maxVal = Math.max(...allValues);
        yMin = minVal < 0 ? minVal : 0;
        yMax = maxVal === 0 ? 100 : Math.ceil(maxVal * 1.1);
      } else {
        yMin = 0;
        yMax = 100;
      }
    }

    if (yMin >= yMax) {
      yMax = yMin + 10;
    }

    if (explicitTicks && explicitTicks.length > 1) {
      return { yMin, yMax, ticks: explicitTicks };
    }

    // Calculate clean tick intervals
    const delta = yMax - yMin;
    const rawStep = delta / 10;
    const power = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
    const fraction = rawStep / power;

    let step: number;
    if (fraction <= 1.5) {
      step = 1 * power;
    } else if (fraction <= 3.5) {
      step = 2 * power;
    } else if (fraction <= 7.5) {
      step = 5 * power;
    } else {
      step = 10 * power;
    }

    const ticks: number[] = [];
    const startTick = Math.ceil(yMin / step) * step;
    for (let t = startTick; t <= yMax; t += step) {
      // Avoid floating point precision issues
      const cleanT = Math.round(t * 100000) / 100000;
      ticks.push(cleanT);
    }

    if (!ticks.includes(yMin) && (startTick - yMin) > step * 0.3) {
      ticks.unshift(yMin);
    }
    if (!ticks.includes(yMax) && (yMax - ticks[ticks.length - 1]) > step * 0.3) {
      ticks.push(yMax);
    }

    return { yMin, yMax, ticks };
  }

  render(theme: ThemeVariables): SVGElement {
    const totalWidth = this.bounds.width || this.manualWidth || this.props.width || 800;
    const totalHeight = this.bounds.height || this.manualHeight || this.props.height || 600;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "diagram-component chart-component");
    g.setAttribute("id", this.id);
    g.setAttribute("data-id", this.id);

    // Extract child series
    const barSeries: BarComponent[] = [];
    const lineSeries: LineComponent[] = [];
    const pieSeries: PieComponent[] = [];

    this.children.forEach(child => {
      if (child instanceof BarComponent || child.type === 'Bar') {
        barSeries.push(child as BarComponent);
      } else if (child instanceof LineComponent || child.type === 'Line') {
        lineSeries.push(child as LineComponent);
      } else if (child instanceof PieComponent || child.type === 'Pie') {
        pieSeries.push(child as PieComponent);
      }
    });

    const title = this.props.title;
    const cardBg = this.resolveColor(this.themeOverride.backgroundColor, theme, theme.backgroundColor);
    const borderColor = this.resolveColor(this.themeOverride.borderColor, theme, theme.borderColor);
    const textColor = this.resolveColor(this.themeOverride.textColor, theme, theme.textColor);
    const fontFamily = this.themeOverride.fontFamily || theme.fontFamily || 'Outfit, system-ui, sans-serif';
    const isDark = isDarkColor(cardBg);
    const subtextColor = isDark ? "#a1a1aa" : "#64748b";
    const axisColor = isDark ? "#94a3b8" : "#94a3b8";
    const gridLineColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";

    // SVG defs (for gradients)
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    g.appendChild(defs);

    // 1. Container background card
    const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bgRect.setAttribute("width", totalWidth.toString());
    bgRect.setAttribute("height", totalHeight.toString());
    bgRect.setAttribute("fill", cardBg);
    bgRect.setAttribute("stroke", borderColor);
    bgRect.setAttribute("stroke-width", "1.5");
    bgRect.setAttribute("rx", "8");
    bgRect.setAttribute("ry", "8");
    g.appendChild(bgRect);

    // 2. Title
    if (title) {
      const titleElem = document.createElementNS("http://www.w3.org/2000/svg", "text");
      titleElem.setAttribute("x", (totalWidth / 2).toString());
      titleElem.setAttribute("y", "32");
      titleElem.setAttribute("fill", textColor);
      titleElem.setAttribute("font-family", fontFamily);
      titleElem.setAttribute("font-size", "18");
      titleElem.setAttribute("font-weight", "600");
      titleElem.setAttribute("text-anchor", "middle");
      titleElem.textContent = title;
      g.appendChild(titleElem);
    }

    // If Pie series present, render Pie / Donut Chart Mode
    if (pieSeries.length > 0) {
      this.renderPieChart(g, defs, pieSeries, totalWidth, totalHeight, title, theme, textColor, fontFamily);
      if (this.doc) {
        this.renderDocBadge(g, totalWidth);
      }
      return g;
    }

    const categories = this.resolveCategories(barSeries, lineSeries);
    const { yMin, yMax, ticks } = this.calculateYScale(barSeries, lineSeries);

    const xLabel = this.props.xLabel;
    const yLabel = this.props.yLabel;
    const showGrid = this.props.grid !== false;

    // Layout Margins
    const marginTop = title ? 55 : 35;
    const marginBottom = xLabel ? 65 : 45;
    const marginLeft = yLabel ? 90 : 70;
    const marginRight = 40;

    const plotX = marginLeft;
    const plotY = marginTop;
    const plotWidth = Math.max(50, totalWidth - marginLeft - marginRight);
    const plotHeight = Math.max(50, totalHeight - marginTop - marginBottom);

    // 3. Y-Axis Title (rotated -90)
    if (yLabel) {
      const yTitleElem = document.createElementNS("http://www.w3.org/2000/svg", "text");
      const centerY = plotY + plotHeight / 2;
      yTitleElem.setAttribute("x", "24");
      yTitleElem.setAttribute("y", centerY.toString());
      yTitleElem.setAttribute("fill", textColor);
      yTitleElem.setAttribute("font-family", fontFamily);
      yTitleElem.setAttribute("font-size", "14");
      yTitleElem.setAttribute("font-weight", "500");
      yTitleElem.setAttribute("text-anchor", "middle");
      yTitleElem.setAttribute("transform", `rotate(-90 24 ${centerY})`);
      yTitleElem.textContent = yLabel;
      g.appendChild(yTitleElem);
    }

    // 4. X-Axis Title
    if (xLabel) {
      const xTitleElem = document.createElementNS("http://www.w3.org/2000/svg", "text");
      xTitleElem.setAttribute("x", (plotX + plotWidth / 2).toString());
      xTitleElem.setAttribute("y", (totalHeight - 16).toString());
      xTitleElem.setAttribute("fill", textColor);
      xTitleElem.setAttribute("font-family", fontFamily);
      xTitleElem.setAttribute("font-size", "13");
      xTitleElem.setAttribute("font-weight", "500");
      xTitleElem.setAttribute("text-anchor", "middle");
      xTitleElem.textContent = xLabel;
      g.appendChild(xTitleElem);
    }

    // 5. Grid Lines & Y-Axis Ticks
    const gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    gridGroup.setAttribute("class", "chart-grid-group");

    ticks.forEach(tickVal => {
      const ratio = (tickVal - yMin) / (yMax - yMin);
      const tickY = plotY + plotHeight - (ratio * plotHeight);

      // Horizontal grid line
      if (showGrid && ratio > 0.001 && ratio < 0.999) {
        const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        gridLine.setAttribute("x1", plotX.toString());
        gridLine.setAttribute("y1", tickY.toString());
        gridLine.setAttribute("x2", (plotX + plotWidth).toString());
        gridLine.setAttribute("y2", tickY.toString());
        gridLine.setAttribute("stroke", gridLineColor);
        gridLine.setAttribute("stroke-dasharray", "3,3");
        gridLine.setAttribute("stroke-width", "1");
        gridGroup.appendChild(gridLine);
      }

      // Y-axis tick line
      const tickLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      tickLine.setAttribute("x1", (plotX - 5).toString());
      tickLine.setAttribute("y1", tickY.toString());
      tickLine.setAttribute("x2", plotX.toString());
      tickLine.setAttribute("y2", tickY.toString());
      tickLine.setAttribute("stroke", axisColor);
      tickLine.setAttribute("stroke-width", "1.5");
      gridGroup.appendChild(tickLine);

      // Y-axis tick label
      const tickText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      tickText.setAttribute("x", (plotX - 10).toString());
      tickText.setAttribute("y", tickY.toString());
      tickText.setAttribute("fill", subtextColor);
      tickText.setAttribute("font-family", fontFamily);
      tickText.setAttribute("font-size", "12");
      tickText.setAttribute("text-anchor", "end");
      tickText.setAttribute("dominant-baseline", "central");
      tickText.textContent = tickVal.toLocaleString();
      gridGroup.appendChild(tickText);
    });

    g.appendChild(gridGroup);

    // 6. Axis lines
    const axisGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    axisGroup.setAttribute("class", "chart-axes");

    // Y Axis vertical line
    const yAxisLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    yAxisLine.setAttribute("x1", plotX.toString());
    yAxisLine.setAttribute("y1", plotY.toString());
    yAxisLine.setAttribute("x2", plotX.toString());
    yAxisLine.setAttribute("y2", (plotY + plotHeight).toString());
    yAxisLine.setAttribute("stroke", axisColor);
    yAxisLine.setAttribute("stroke-width", "1.5");
    axisGroup.appendChild(yAxisLine);

    // X Axis horizontal line
    const xAxisLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    xAxisLine.setAttribute("x1", plotX.toString());
    xAxisLine.setAttribute("y1", (plotY + plotHeight).toString());
    xAxisLine.setAttribute("x2", (plotX + plotWidth).toString());
    xAxisLine.setAttribute("y2", (plotY + plotHeight).toString());
    xAxisLine.setAttribute("stroke", axisColor);
    xAxisLine.setAttribute("stroke-width", "1.5");
    axisGroup.appendChild(xAxisLine);

    // X Axis Ticks and Labels
    const numSlots = categories.length;
    const slotWidth = plotWidth / numSlots;

    categories.forEach((cat, i) => {
      const slotCenterX = plotX + (i + 0.5) * slotWidth;

      // Tick mark
      const xTick = document.createElementNS("http://www.w3.org/2000/svg", "line");
      xTick.setAttribute("x1", slotCenterX.toString());
      xTick.setAttribute("y1", (plotY + plotHeight).toString());
      xTick.setAttribute("x2", slotCenterX.toString());
      xTick.setAttribute("y2", (plotY + plotHeight + 5).toString());
      xTick.setAttribute("stroke", axisColor);
      xTick.setAttribute("stroke-width", "1.5");
      axisGroup.appendChild(xTick);

      // Category text
      const xText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      xText.setAttribute("x", slotCenterX.toString());
      xText.setAttribute("y", (plotY + plotHeight + 18).toString());
      xText.setAttribute("fill", textColor);
      xText.setAttribute("font-family", fontFamily);
      xText.setAttribute("font-size", "12");
      xText.setAttribute("text-anchor", "middle");
      xText.setAttribute("dominant-baseline", "hanging");
      xText.textContent = cat;
      axisGroup.appendChild(xText);
    });

    g.appendChild(axisGroup);

    // 7. Render Bars
    if (barSeries.length > 0) {
      const barsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      barsGroup.setAttribute("class", "chart-bars-layer");

      const numBarSeries = barSeries.length;
      const barGroupWidth = slotWidth * 0.72;
      const singleBarWidth = barGroupWidth / numBarSeries;

      barSeries.forEach((bar, bIdx) => {
        const seriesColor = this.resolveColor(bar.props.color, theme, '#38bdf8');
        const seriesLabel = bar.props.label || bar.id;
        const is3D = bar.props.is3D === true || bar.props.threeD === true;
        const depth = bar.props.depth ?? 8;
        const dx = Math.round(depth * 0.85);
        const dy = Math.round(depth * 0.65);
        const topColor = adjustHexBrightness(seriesColor, 1.35);
        const sideColor = adjustHexBrightness(seriesColor, 0.68);
        const values = bar.props.values || [];

        values.forEach((val, sIdx) => {
          if (sIdx >= numSlots) return;
          const cat = categories[sIdx];
          const slotCenterX = plotX + (sIdx + 0.5) * slotWidth;
          const valClamped = Math.max(yMin, Math.min(yMax, val));
          const barHeight = Math.max(0, ((valClamped - yMin) / (yMax - yMin)) * plotHeight);
          const barX = (slotCenterX - barGroupWidth / 2) + bIdx * singleBarWidth + singleBarWidth * 0.05;
          const barW = Math.max(2, singleBarWidth * 0.9);
          const barY = plotY + plotHeight - barHeight;

          if (is3D) {
            // 3D Bar Group
            const bar3dGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            bar3dGroup.setAttribute("class", "chart-bar-3d");
            bar3dGroup.setAttribute("data-series", seriesLabel);
            bar3dGroup.setAttribute("data-category", cat);
            bar3dGroup.setAttribute("data-value", val.toString());

            // 1. Front face
            const front = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            front.setAttribute("class", "chart-bar-front");
            front.setAttribute("x", barX.toString());
            front.setAttribute("y", barY.toString());
            front.setAttribute("width", barW.toString());
            front.setAttribute("height", barHeight.toString());
            front.setAttribute("fill", seriesColor);
            bar3dGroup.appendChild(front);

            if (barHeight > 0) {
              // 2. Top face cap (skewed parallelogram)
              const topCap = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
              topCap.setAttribute("class", "chart-bar-top");
              topCap.setAttribute("points", `${barX},${barY} ${barX + dx},${barY - dy} ${barX + barW + dx},${barY - dy} ${barX + barW},${barY}`);
              topCap.setAttribute("fill", topColor);
              bar3dGroup.appendChild(topCap);

              // 3. Right side face (skewed parallelogram)
              const sideFace = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
              sideFace.setAttribute("class", "chart-bar-side");
              sideFace.setAttribute("points", `${barX + barW},${barY} ${barX + barW + dx},${barY - dy} ${barX + barW + dx},${barY + barHeight - dy} ${barX + barW},${barY + barHeight}`);
              sideFace.setAttribute("fill", sideColor);
              bar3dGroup.appendChild(sideFace);
            }

            const titleTag = document.createElementNS("http://www.w3.org/2000/svg", "title");
            titleTag.textContent = `${seriesLabel}: ${cat} = ${val.toLocaleString()}`;
            bar3dGroup.appendChild(titleTag);

            barsGroup.appendChild(bar3dGroup);
          } else {
            // Standard 2D Bar
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("class", "chart-bar");
            rect.setAttribute("x", barX.toString());
            rect.setAttribute("y", barY.toString());
            rect.setAttribute("width", barW.toString());
            rect.setAttribute("height", barHeight.toString());
            rect.setAttribute("fill", seriesColor);
            rect.setAttribute("rx", (bar.props.rx ?? 3).toString());
            rect.setAttribute("ry", (bar.props.ry ?? 3).toString());
            rect.setAttribute("data-series", seriesLabel);
            rect.setAttribute("data-category", cat);
            rect.setAttribute("data-value", val.toString());

            // Native tooltip
            const titleTag = document.createElementNS("http://www.w3.org/2000/svg", "title");
            titleTag.textContent = `${seriesLabel}: ${cat} = ${val.toLocaleString()}`;
            rect.appendChild(titleTag);

            barsGroup.appendChild(rect);
          }
        });
      });

      g.appendChild(barsGroup);
    }

    // 8. Render Lines
    if (lineSeries.length > 0) {
      const linesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      linesGroup.setAttribute("class", "chart-lines-layer");

      lineSeries.forEach((line, lIdx) => {
        const seriesColor = this.resolveColor(line.props.color, theme, '#4ade80');
        const seriesLabel = line.props.label || line.id;
        const strokeWidth = line.props.strokeWidth ?? 3;
        const isFilled = line.props.filled === true || line.props.fill === true;
        const fillOpacity = line.props.fillOpacity ?? 0.35;
        const values = line.props.values || [];

        const points: { x: number; y: number; val: number; cat: string }[] = [];

        values.forEach((val, sIdx) => {
          if (sIdx >= numSlots) return;
          const cat = categories[sIdx];
          const slotCenterX = plotX + (sIdx + 0.5) * slotWidth;
          const valClamped = Math.max(yMin, Math.min(yMax, val));
          const ptY = plotY + plotHeight - (((valClamped - yMin) / (yMax - yMin)) * plotHeight);
          points.push({ x: slotCenterX, y: ptY, val, cat });
        });

        if (points.length > 0) {
          // If filled, create gradient and render area path under the line
          if (isFilled) {
            const gradId = `chart-area-grad-${this.id}-${lIdx}`;
            const grad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
            grad.setAttribute("id", gradId);
            grad.setAttribute("x1", "0");
            grad.setAttribute("y1", "0");
            grad.setAttribute("x2", "0");
            grad.setAttribute("y2", "1");

            const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
            stop1.setAttribute("offset", "0%");
            stop1.setAttribute("stop-color", seriesColor);
            stop1.setAttribute("stop-opacity", fillOpacity.toString());
            grad.appendChild(stop1);

            const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
            stop2.setAttribute("offset", "100%");
            stop2.setAttribute("stop-color", seriesColor);
            stop2.setAttribute("stop-opacity", "0.02");
            grad.appendChild(stop2);

            defs.appendChild(grad);

            const baselineY = plotY + plotHeight;
            const areaD = `M ${points[0].x},${baselineY} ` +
              points.map(p => `L ${p.x},${p.y}`).join(' ') +
              ` L ${points[points.length - 1].x},${baselineY} Z`;

            const areaPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            areaPath.setAttribute("class", "chart-line-area");
            areaPath.setAttribute("d", areaD);
            areaPath.setAttribute("fill", `url(#${gradId})`);
            linesGroup.appendChild(areaPath);
          }

          // Line Path
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          const d = points.map((p, idx) => (idx === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ');
          path.setAttribute("class", "chart-line-path");
          path.setAttribute("d", d);
          path.setAttribute("fill", "none");
          path.setAttribute("stroke", seriesColor);
          path.setAttribute("stroke-width", strokeWidth.toString());
          path.setAttribute("stroke-linecap", "round");
          path.setAttribute("stroke-linejoin", "round");
          linesGroup.appendChild(path);

          // Point Circles
          if (line.props.showPoints !== false) {
            points.forEach(pt => {
              const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
              circle.setAttribute("class", "chart-line-point");
              circle.setAttribute("cx", pt.x.toString());
              circle.setAttribute("cy", pt.y.toString());
              circle.setAttribute("r", "4.5");
              circle.setAttribute("fill", seriesColor);
              circle.setAttribute("stroke", "#ffffff");
              circle.setAttribute("stroke-width", "1.5");
              circle.setAttribute("data-series", seriesLabel);
              circle.setAttribute("data-category", pt.cat);
              circle.setAttribute("data-value", pt.val.toString());

              const titleTag = document.createElementNS("http://www.w3.org/2000/svg", "title");
              titleTag.textContent = `${seriesLabel}: ${pt.cat} = ${pt.val.toLocaleString()}`;
              circle.appendChild(titleTag);

              linesGroup.appendChild(circle);
            });
          }
        }
      });

      g.appendChild(linesGroup);
    }

    // 9. Render Documentation/URL Badges if configured
    if (this.doc) {
      this.renderDocBadge(g, totalWidth);
    }

    return g;
  }

  private renderDocBadge(g: SVGElement, totalWidth: number): void {
    const badge = document.createElementNS("http://www.w3.org/2000/svg", "g");
    badge.setAttribute("class", "element-doc-badge");
    badge.setAttribute("transform", `translate(${totalWidth - 24}, 24)`);
    badge.setAttribute("style", "cursor: pointer;");

    const badgeBg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    badgeBg.setAttribute("class", "doc-badge-bg");
    badgeBg.setAttribute("cx", "0");
    badgeBg.setAttribute("cy", "0");
    badgeBg.setAttribute("r", "9");
    badgeBg.setAttribute("fill", "#3b82f6");
    badge.appendChild(badgeBg);

    const docIcon = document.createElementNS("http://www.w3.org/2000/svg", "path");
    docIcon.setAttribute("class", "doc-badge-icon");
    docIcon.setAttribute("d", "M -4 -5 L 2 -5 L 5 -2 L 5 5 L -4 5 Z M 2 -5 L 2 -2 L 5 -2");
    docIcon.setAttribute("fill", "none");
    docIcon.setAttribute("stroke", "#ffffff");
    docIcon.setAttribute("stroke-width", "1");
    badge.appendChild(docIcon);

    g.appendChild(badge);
  }

  private renderPieChart(
    g: SVGElement,
    defs: SVGElement,
    pieSeries: PieComponent[],
    totalWidth: number,
    totalHeight: number,
    title: string | undefined,
    theme: ThemeVariables,
    textColor: string,
    fontFamily: string
  ): void {
    const cardBg = this.resolveColor(this.themeOverride.backgroundColor, theme, theme.backgroundColor);
    const isDark = isDarkColor(cardBg);
    const subtextColor = isDark ? "#a1a1aa" : "#64748b";

    const DEFAULT_PIE_PALETTE = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
      '#84cc16', '#eab308', '#d946ef', '#0ea5e9'
    ];

    const pie = pieSeries[0];
    const parsedSlices: Array<{ label: string; value: number; color: string; textColor?: string; pct: number }> = [];

    if (pie.props.items && Array.isArray(pie.props.items) && pie.props.items.length > 0) {
      for (let i = 0; i < pie.props.items.length; i++) {
        const item = pie.props.items[i];
        if (!item || typeof item !== 'object') continue;
        const val = typeof item.value === 'number' ? Math.max(0, item.value) : (typeof (item as any).val === 'number' ? (item as any).val : 1);
        const label = item.label || (item as any).name || `Item ${i + 1}`;
        const rawColor = item.color || DEFAULT_PIE_PALETTE[i % DEFAULT_PIE_PALETTE.length];
        const color = this.resolveColor(rawColor, theme, rawColor);
        const itemTextColor = item.textColor ? this.resolveColor(item.textColor, theme, item.textColor) : undefined;
        parsedSlices.push({ label, value: val, color, textColor: itemTextColor, pct: 0 });
      }
    } else {
      const values: number[] = pie.props.values || [];
      const labels: string[] = pie.props.labels || [];
      const colors: string[] = pie.props.colors || [];
      const sliceCount = Math.max(values.length, labels.length, 1);

      for (let i = 0; i < sliceCount; i++) {
        const val = Math.max(0, values[i] ?? 1);
        const label = labels[i] || `Item ${i + 1}`;
        const rawColor = colors[i] || DEFAULT_PIE_PALETTE[i % DEFAULT_PIE_PALETTE.length];
        const color = this.resolveColor(rawColor, theme, rawColor);
        parsedSlices.push({ label, value: val, color, pct: 0 });
      }
    }

    if (parsedSlices.length === 0) {
      parsedSlices.push({ label: 'Item 1', value: 1, color: DEFAULT_PIE_PALETTE[0], pct: 1 });
    }

    const totalSum = parsedSlices.reduce((sum, s) => sum + s.value, 0) || 1;
    parsedSlices.forEach(s => {
      s.pct = s.value / totalSum;
    });

    const showLegend = pie.props.showLegend !== undefined ? pie.props.showLegend : (pie.props.legend !== false);
    const is3D = pie.props.is3D || pie.props.threeD || false;

    // Margins and Dimensions
    const marginTop = title ? 60 : 35;
    const marginBottom = 35;
    const marginLeft = 35;
    const marginRight = 35;

    const availableW = totalWidth - marginLeft - marginRight;
    const availableH = totalHeight - marginTop - marginBottom;

    const legendWidth = showLegend ? Math.min(260, Math.max(160, availableW * 0.35)) : 0;
    const pieAreaWidth = availableW - legendWidth;

    const centerX = marginLeft + pieAreaWidth / 2;
    const centerY = marginTop + availableH / 2 + (is3D ? -10 : 0);

    const baseRadius = Math.min(pieAreaWidth, availableH) / 2 - 25;
    const radius = Math.max(35, baseRadius);

    let innerRadius = 0;
    if (pie.props.innerRadius && pie.props.innerRadius > 0) {
      innerRadius = Math.min(radius - 12, pie.props.innerRadius);
    } else if (pie.props.donut === true) {
      innerRadius = radius * 0.55;
    } else if (typeof pie.props.donut === 'number' && pie.props.donut > 0) {
      innerRadius = pie.props.donut <= 1 ? radius * pie.props.donut : Math.min(radius - 12, pie.props.donut);
    }

    const startAngleDeg = pie.props.startAngle ?? -90;
    let currentAngleRad = (startAngleDeg * Math.PI) / 180;

    const pieGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    pieGroup.setAttribute("class", "chart-pie-group");
    pieGroup.setAttribute("data-series-id", pie.id);

    // 3D Depth parameter
    const depth3D = is3D ? (pie.props.depth || 24) : 0;
    const ryRatio = is3D ? 0.65 : 1;

    // Helper for arc path
    const buildArcPath = (
      cx: number, cy: number, rOut: number, rIn: number, a1: number, a2: number, ryFactor: number = 1
    ): string => {
      const delta = a2 - a1;
      const isFull = delta >= 2 * Math.PI - 0.0001;

      const rOutY = rOut * ryFactor;
      const rInY = rIn * ryFactor;

      if (isFull) {
        if (rIn > 0) {
          return `M ${cx - rOut} ${cy} A ${rOut} ${rOutY} 0 1 0 ${cx + rOut} ${cy} A ${rOut} ${rOutY} 0 1 0 ${cx - rOut} ${cy} Z ` +
                 `M ${cx - rIn} ${cy} A ${rIn} ${rInY} 0 1 1 ${cx + rIn} ${cy} A ${rIn} ${rInY} 0 1 1 ${cx - rIn} ${cy} Z`;
        }
        return `M ${cx - rOut} ${cy} A ${rOut} ${rOutY} 0 1 0 ${cx + rOut} ${cy} A ${rOut} ${rOutY} 0 1 0 ${cx - rOut} ${cy} Z`;
      }

      const x1Out = cx + rOut * Math.cos(a1);
      const y1Out = cy + rOutY * Math.sin(a1);
      const x2Out = cx + rOut * Math.cos(a2);
      const y2Out = cy + rOutY * Math.sin(a2);
      const largeArc = delta > Math.PI ? 1 : 0;

      if (rIn > 0) {
        const x1In = cx + rIn * Math.cos(a1);
        const y1In = cy + rInY * Math.sin(a1);
        const x2In = cx + rIn * Math.cos(a2);
        const y2In = cy + rInY * Math.sin(a2);

        return `M ${x1Out} ${y1Out} A ${rOut} ${rOutY} 0 ${largeArc} 1 ${x2Out} ${y2Out} L ${x2In} ${y2In} A ${rIn} ${rInY} 0 ${largeArc} 0 ${x1In} ${y1In} Z`;
      } else {
        return `M ${cx} ${cy} L ${x1Out} ${y1Out} A ${rOut} ${rOutY} 0 ${largeArc} 1 ${x2Out} ${y2Out} Z`;
      }
    };

    // Add internal style for pure CSS hover in all environments (Live Editor, HTML Player, Chrome Extension)
    const styleElem = document.createElementNS("http://www.w3.org/2000/svg", "style");
    styleElem.textContent = `
      .chart-pie-slice {
        transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.22s ease;
        cursor: pointer;
      }
      .chart-pie-slice:hover {
        transform: translate(var(--exp-x, 0px), var(--exp-y, 0px));
        filter: brightness(1.15) drop-shadow(0 6px 16px rgba(0,0,0,0.6));
      }
    `;
    pieGroup.appendChild(styleElem);

    // Render Slices (with 3D side skirts encapsulated per slice)
    let sliceAngle = currentAngleRad;
    const slicesInfo: Array<{ midAngle: number; pct: number; label: string; val: number; color: string; expX: number; expY: number }> = [];

    parsedSlices.forEach((slice, idx) => {
      const span = slice.pct * 2 * Math.PI;
      const a1 = sliceAngle;
      const a2 = sliceAngle + span;
      const midAngle = a1 + span / 2;
      sliceAngle = a2;

      const explodeDist = 12;
      const expX = Math.round(explodeDist * Math.cos(midAngle) * 100) / 100;
      const expY = Math.round(explodeDist * ryRatio * Math.sin(midAngle) * 100) / 100;

      slicesInfo.push({ midAngle, pct: slice.pct, label: slice.label, val: slice.value, color: slice.color, expX, expY });

      const sliceG = document.createElementNS("http://www.w3.org/2000/svg", "g");
      sliceG.setAttribute("class", "chart-pie-slice");
      sliceG.setAttribute("id", `${this.id}-slice-${idx}`);
      sliceG.setAttribute("data-index", idx.toString());
      sliceG.setAttribute("data-label", slice.label);
      sliceG.setAttribute("data-value", slice.value.toString());
      sliceG.setAttribute("data-pct", (slice.pct * 100).toFixed(1));
      sliceG.setAttribute("style", `--exp-x: ${expX}px; --exp-y: ${expY}px;`);

      // 1. 3D Side Skirts for this slice
      if (is3D) {
        const sideGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        sideGroup.setAttribute("class", `pie-3d-side-group slice-side-${idx}`);

        const x1 = centerX + radius * Math.cos(a1);
        const y1 = centerY + radius * ryRatio * Math.sin(a1);
        const x2 = centerX + radius * Math.cos(a2);
        const y2 = centerY + radius * ryRatio * Math.sin(a2);

        const darkColor = adjustHexBrightness(slice.color, 0.65);
        const sideD = `M ${x1} ${y1} A ${radius} ${radius * ryRatio} 0 ${span > Math.PI ? 1 : 0} 1 ${x2} ${y2} ` +
                      `L ${x2} ${y2 + depth3D} A ${radius} ${radius * ryRatio} 0 ${span > Math.PI ? 1 : 0} 0 ${x1} ${y1 + depth3D} Z`;

        const sidePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        sidePath.setAttribute("d", sideD);
        sidePath.setAttribute("fill", darkColor);
        sidePath.setAttribute("stroke", adjustHexBrightness(slice.color, 0.45));
        sidePath.setAttribute("stroke-width", "0.5");
        sideGroup.appendChild(sidePath);

        if (innerRadius > 0) {
          const xi1 = centerX + innerRadius * Math.cos(a1);
          const yi1 = centerY + innerRadius * ryRatio * Math.sin(a1);
          const xi2 = centerX + innerRadius * Math.cos(a2);
          const yi2 = centerY + innerRadius * ryRatio * Math.sin(a2);

          const innerSideD = `M ${xi1} ${yi1} A ${innerRadius} ${innerRadius * ryRatio} 0 ${span > Math.PI ? 1 : 0} 1 ${xi2} ${yi2} ` +
                             `L ${xi2} ${yi2 + depth3D} A ${innerRadius} ${innerRadius * ryRatio} 0 ${span > Math.PI ? 1 : 0} 0 ${xi1} ${yi1 + depth3D} Z`;
          const innerPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
          innerPath.setAttribute("d", innerSideD);
          innerPath.setAttribute("fill", adjustHexBrightness(slice.color, 0.5));
          innerPath.setAttribute("stroke", adjustHexBrightness(slice.color, 0.35));
          innerPath.setAttribute("stroke-width", "0.5");
          sideGroup.appendChild(innerPath);
        }

        sliceG.appendChild(sideGroup);
      }

      // 2. Top Surface Path
      const pathD = buildArcPath(centerX, centerY, radius, innerRadius, a1, a2, ryRatio);
      const pathElem = document.createElementNS("http://www.w3.org/2000/svg", "path");
      pathElem.setAttribute("class", "chart-pie-slice-top");
      pathElem.setAttribute("d", pathD);
      pathElem.setAttribute("fill", slice.color);
      pathElem.setAttribute("stroke", cardBg);
      pathElem.setAttribute("stroke-width", "1.5");
      sliceG.appendChild(pathElem);

      // 3. Tooltip
      const titleTag = document.createElementNS("http://www.w3.org/2000/svg", "title");
      titleTag.textContent = `${slice.label}: ${slice.value.toLocaleString()} (${(slice.pct * 100).toFixed(1)}%)`;
      sliceG.appendChild(titleTag);

      // 4. Value / Percentage Text
      if (pie.props.showLabels !== false && slice.pct >= 0.03) {
        const textRadius = innerRadius > 0 ? (radius + innerRadius) / 2 : radius * 0.68;
        const textX = centerX + textRadius * Math.cos(midAngle);
        const textY = centerY + textRadius * ryRatio * Math.sin(midAngle);

        const valText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        valText.setAttribute("x", textX.toString());
        valText.setAttribute("y", textY.toString());
        valText.setAttribute("fill", slice.textColor || (isDarkColor(slice.color) ? "#ffffff" : "#0f172a"));
        valText.setAttribute("font-family", fontFamily);
        valText.setAttribute("font-size", slice.pct > 0.12 ? "12" : "10");
        valText.setAttribute("font-weight", "600");
        valText.setAttribute("text-anchor", "middle");
        valText.setAttribute("dominant-baseline", "central");
        valText.setAttribute("style", "pointer-events: none; text-shadow: 0 1px 3px rgba(0,0,0,0.8);");

        const isShowPercentage = pie.props.showPercentage === true || pie.props.showPercentages === true;
        valText.textContent = isShowPercentage ? `${Math.round(slice.pct * 100)}%` : slice.value.toLocaleString();
        sliceG.appendChild(valText);
      }

      // JS event listeners for legend syncing
      sliceG.addEventListener('mouseenter', () => {
        sliceG.style.transform = `translate(${expX}px, ${expY}px)`;
        sliceG.style.filter = "brightness(1.15) drop-shadow(0 6px 16px rgba(0,0,0,0.6))";
      });
      sliceG.addEventListener('mouseleave', () => {
        sliceG.style.transform = "";
        sliceG.style.filter = "";
      });

      pieGroup.appendChild(sliceG);
    });

    g.appendChild(pieGroup);

    // 8. Legend
    if (showLegend && legendWidth > 0) {
      const isDark = isDarkColor(cardBg);
      const subtextColor = isDark ? "#a1a1aa" : "#64748b";

      const legendGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      legendGroup.setAttribute("class", "chart-pie-legend");

      const legendX = marginLeft + pieAreaWidth + 20;
      const legendY = marginTop + 10;
      const itemHeight = 26;

      // Legend box background
      const legendBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      legendBg.setAttribute("x", (legendX - 10).toString());
      legendBg.setAttribute("y", (legendY - 10).toString());
      legendBg.setAttribute("width", (legendWidth - 10).toString());
      legendBg.setAttribute("height", Math.max(50, parsedSlices.length * itemHeight + 20).toString());
      legendBg.setAttribute("fill", isDark ? "rgba(0, 0, 0, 0.25)" : "rgba(0, 0, 0, 0.04)");
      legendBg.setAttribute("stroke", isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.12)");
      legendBg.setAttribute("stroke-width", "1");
      legendBg.setAttribute("rx", "6");
      legendGroup.appendChild(legendBg);

      parsedSlices.forEach((slice, idx) => {
        const itemY = legendY + idx * itemHeight + 10;

        const itemG = document.createElementNS("http://www.w3.org/2000/svg", "g");
        itemG.setAttribute("class", "chart-legend-item");
        itemG.setAttribute("style", "cursor: pointer;");

        // Color Swatch
        const swatch = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        swatch.setAttribute("x", legendX.toString());
        swatch.setAttribute("y", (itemY - 6).toString());
        swatch.setAttribute("width", "12");
        swatch.setAttribute("height", "12");
        swatch.setAttribute("rx", "3");
        swatch.setAttribute("fill", slice.color);
        itemG.appendChild(swatch);

        // Label
        const labelText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        labelText.setAttribute("x", (legendX + 20).toString());
        labelText.setAttribute("y", (itemY + 1).toString());
        labelText.setAttribute("fill", textColor);
        labelText.setAttribute("font-family", fontFamily);
        labelText.setAttribute("font-size", "12");
        labelText.setAttribute("dominant-baseline", "central");
        labelText.textContent = slice.label.length > 14 ? slice.label.slice(0, 13) + '…' : slice.label;
        itemG.appendChild(labelText);

        // Value / Pct
        const isShowPercentage = pie.props.showPercentage === true || pie.props.showPercentages === true;
        const valText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        valText.setAttribute("x", (legendX + legendWidth - 30).toString());
        valText.setAttribute("y", (itemY + 1).toString());
        valText.setAttribute("fill", subtextColor);
        valText.setAttribute("font-family", fontFamily);
        valText.setAttribute("font-size", "11");
        valText.setAttribute("text-anchor", "end");
        valText.setAttribute("dominant-baseline", "central");
        valText.textContent = isShowPercentage
          ? `${slice.value} (${(slice.pct * 100).toFixed(0)}%)`
          : slice.value.toLocaleString();
        itemG.appendChild(valText);

        // Hover highlighting between legend and slice
        const targetSlice = pieGroup.querySelector(`#${this.id}-slice-${idx}`) as HTMLElement;
        if (targetSlice) {
          const info = slicesInfo[idx];
          itemG.addEventListener('mouseenter', () => {
            targetSlice.style.transform = `translate(${info.expX}px, ${info.expY}px)`;
            targetSlice.style.filter = "brightness(1.2) drop-shadow(0 6px 16px rgba(0,0,0,0.6))";
          });
          itemG.addEventListener('mouseleave', () => {
            targetSlice.style.transform = "";
            targetSlice.style.filter = "";
          });
        }

        legendGroup.appendChild(itemG);
      });

      g.appendChild(legendGroup);
    }
  }
}
