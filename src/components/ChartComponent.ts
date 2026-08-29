import { BaseComponent, ComponentMetadata, ThemeVariables, Dimension } from './BaseComponent';
import { BarComponent } from './BarComponent';
import { LineComponent } from './LineComponent';

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

    this.children.forEach(child => {
      if (child instanceof BarComponent || child.type === 'Bar') {
        barSeries.push(child as BarComponent);
      } else if (child instanceof LineComponent || child.type === 'Line') {
        lineSeries.push(child as LineComponent);
      }
    });

    const categories = this.resolveCategories(barSeries, lineSeries);
    const { yMin, yMax, ticks } = this.calculateYScale(barSeries, lineSeries);

    const title = this.props.title;
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

    const cardBg = this.resolveColor(this.themeOverride.backgroundColor, theme, '#27272a');
    const borderColor = this.resolveColor(this.themeOverride.borderColor, theme, '#3f3f46');
    const textColor = this.resolveColor(this.themeOverride.textColor, theme, theme.textColor || '#f4f4f5');
    const fontFamily = this.themeOverride.fontFamily || theme.fontFamily || 'Outfit, system-ui, sans-serif';
    const axisColor = '#94a3b8';

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
        gridLine.setAttribute("stroke", "rgba(255, 255, 255, 0.08)");
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
      tickText.setAttribute("fill", "#a1a1aa");
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

    return g;
  }
}
