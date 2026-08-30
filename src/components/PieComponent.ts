import { BaseComponent, ComponentMetadata, ThemeVariables, Dimension } from './BaseComponent';

export interface PieItem {
  label?: string;
  value?: number;
  color?: string;
  textColor?: string;
}

export interface PieProps {
  items?: PieItem[];
  labels?: string[];
  values?: number[];
  colors?: string[];
  donut?: boolean | number;
  innerRadius?: number;
  is3D?: boolean;
  threeD?: boolean;
  depth?: number;
  startAngle?: number;
  showLabels?: boolean;
  showPercentage?: boolean;
  showPercentages?: boolean;
  showValues?: boolean;
  legend?: boolean;
  showLegend?: boolean;
  title?: string;
  width?: number;
  height?: number;
}

function adjustHexBrightness(hex: string, factor: number): string {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length !== 6 && cleanHex.length !== 8) {
    return hex;
  }
  const r = Math.min(255, Math.max(0, Math.round(parseInt(cleanHex.substring(0, 2), 16) * factor)));
  const g = Math.min(255, Math.max(0, Math.round(parseInt(cleanHex.substring(2, 4), 16) * factor)));
  const b = Math.min(255, Math.max(0, Math.round(parseInt(cleanHex.substring(4, 6), 16) * factor)));

  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
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

export class PieComponent extends BaseComponent<PieProps> {
  validateProps(): void {
    if (this.props.items !== undefined && !Array.isArray(this.props.items)) {
      throw new Error(`Component [${this.id}]: 'items' must be an array of objects.`);
    }
    if (this.props.values !== undefined && !Array.isArray(this.props.values)) {
      throw new Error(`Component [${this.id}]: 'values' must be an array of numbers.`);
    }
    if (this.props.labels !== undefined && !Array.isArray(this.props.labels)) {
      throw new Error(`Component [${this.id}]: 'labels' must be an array of strings.`);
    }
    if (this.props.colors !== undefined && !Array.isArray(this.props.colors)) {
      throw new Error(`Component [${this.id}]: 'colors' must be an array of color strings.`);
    }
  }

  calculateMinDimensions(_theme: ThemeVariables): Dimension {
    return {
      width: this.manualWidth || this.props.width || 600,
      height: this.manualHeight || this.props.height || 400
    };
  }

  render(theme: ThemeVariables): SVGElement {
    const totalWidth = this.bounds.width || this.manualWidth || this.props.width || 600;
    const totalHeight = this.bounds.height || this.manualHeight || this.props.height || 400;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "diagram-component chart-component pie-component");
    g.setAttribute("id", this.id);
    g.setAttribute("data-id", this.id);

    const title = this.props.title || (this.label && this.label !== this.id ? this.label : undefined);
    const cardBg = this.resolveColor(this.themeOverride.backgroundColor, theme, theme.backgroundColor);
    const borderColor = this.resolveColor(this.themeOverride.borderColor, theme, theme.borderColor);
    const textColor = this.resolveColor(this.themeOverride.textColor, theme, theme.textColor);
    const fontFamily = this.themeOverride.fontFamily || theme.fontFamily || 'Outfit, system-ui, sans-serif';
    const isDark = isDarkColor(cardBg);
    const subtextColor = isDark ? "#a1a1aa" : "#64748b";

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

    // 2. Title Header
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

    // 3. Slices extraction
    const DEFAULT_PIE_PALETTE = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
      '#84cc16', '#eab308', '#d946ef', '#0ea5e9'
    ];

    const parsedSlices: Array<{ label: string; value: number; color: string; textColor?: string; pct: number }> = [];

    if (this.props.items && Array.isArray(this.props.items) && this.props.items.length > 0) {
      for (let i = 0; i < this.props.items.length; i++) {
        const item = this.props.items[i];
        if (!item || typeof item !== 'object') continue;
        const val = typeof item.value === 'number' ? Math.max(0, item.value) : (typeof (item as any).val === 'number' ? (item as any).val : 1);
        const itemLabel = item.label || (item as any).name || `Item ${i + 1}`;
        const rawColor = item.color || DEFAULT_PIE_PALETTE[i % DEFAULT_PIE_PALETTE.length];
        const color = this.resolveColor(rawColor, theme, rawColor);
        const itemTextColor = item.textColor ? this.resolveColor(item.textColor, theme, item.textColor) : undefined;
        parsedSlices.push({ label: itemLabel, value: val, color, textColor: itemTextColor, pct: 0 });
      }
    } else {
      const values: number[] = this.props.values || [];
      const labels: string[] = this.props.labels || [];
      const colors: string[] = this.props.colors || [];
      const sliceCount = Math.max(values.length, labels.length, 1);

      for (let i = 0; i < sliceCount; i++) {
        const val = Math.max(0, values[i] ?? 1);
        const itemLabel = labels[i] || `Item ${i + 1}`;
        const rawColor = colors[i] || DEFAULT_PIE_PALETTE[i % DEFAULT_PIE_PALETTE.length];
        const color = this.resolveColor(rawColor, theme, rawColor);
        parsedSlices.push({ label: itemLabel, value: val, color, pct: 0 });
      }
    }

    if (parsedSlices.length === 0) {
      parsedSlices.push({ label: 'Item 1', value: 1, color: DEFAULT_PIE_PALETTE[0], pct: 1 });
    }

    const totalSum = parsedSlices.reduce((sum, s) => sum + s.value, 0) || 1;
    parsedSlices.forEach(s => {
      s.pct = s.value / totalSum;
    });

    const showLegend = this.props.showLegend !== undefined ? this.props.showLegend : (this.props.legend !== false);
    const is3D = this.props.is3D || this.props.threeD || false;

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
    if (this.props.innerRadius && this.props.innerRadius > 0) {
      innerRadius = Math.min(radius - 12, this.props.innerRadius);
    } else if (this.props.donut === true) {
      innerRadius = radius * 0.55;
    } else if (typeof this.props.donut === 'number' && this.props.donut > 0) {
      innerRadius = this.props.donut <= 1 ? radius * this.props.donut : Math.min(radius - 12, this.props.donut);
    }

    const startAngleDeg = this.props.startAngle ?? -90;
    let currentAngleRad = (startAngleDeg * Math.PI) / 180;

    const pieGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    pieGroup.setAttribute("class", "chart-pie-group");
    pieGroup.setAttribute("data-series-id", this.id);

    // 3D Depth parameter
    const depth3D = is3D ? (this.props.depth || 24) : 0;
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

    // Style element for pure CSS hover in all environments
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
      if (this.props.showLabels !== false && slice.pct >= 0.03) {
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

        const isShowPercentage = this.props.showPercentage === true || this.props.showPercentages === true;
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
        const isShowPercentage = this.props.showPercentage === true || this.props.showPercentages === true;
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

    // 9. Documentation Badge
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
