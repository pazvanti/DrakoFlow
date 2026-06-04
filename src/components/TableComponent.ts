import { BaseComponent, ComponentMetadata, ThemeVariables, Dimension } from './BaseComponent';

export interface TableProps {
  header?: string[];
  rows?: string[][];
  headerAtTop?: boolean;
  headerAtBottom?: boolean;
}

function isDarkColor(hexColor: string): boolean {
  const hex = hexColor.replace('#', '');
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq < 128;
  }
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq < 128;
  }
  return true;
}

export class TableComponent extends BaseComponent<TableProps> {
  validateProps(): void {
    if (this.props.header !== undefined && !Array.isArray(this.props.header)) {
      throw new Error(`Component [${this.id}]: 'header' must be an array of strings.`);
    }
    if (this.props.rows !== undefined && !Array.isArray(this.props.rows)) {
      throw new Error(`Component [${this.id}]: 'rows' must be a two-dimensional array of strings.`);
    }
  }

  private getCellWidth(val: any): number {
    if (val === undefined || val === null) return 0;
    const lines = String(val).split('\n');
    return Math.max(...lines.map(line => line.length));
  }

  private getCellHeight(val: any): number {
    if (val === undefined || val === null) return 0;
    const lines = String(val).split('\n');
    return Math.max(30, lines.length * 15 + 15);
  }

  private getTableLayout(): { colWidths: number[]; rowHeights: number[]; headerHeight: number; showHeaderTop: boolean; showHeaderBottom: boolean; numCols: number } {
    const headerLen = this.props.header ? this.props.header.length : 0;
    const maxRowLen = this.props.rows ? Math.max(...this.props.rows.map(r => Array.isArray(r) ? r.length : 0), 0) : 0;
    const numCols = Math.max(headerLen, maxRowLen, 1);

    const colWidths = Array(numCols).fill(60);

    if (this.props.header) {
      this.props.header.forEach((h, c) => {
        if (c < numCols) {
          colWidths[c] = Math.max(colWidths[c], this.getCellWidth(h) * 8 + 20);
        }
      });
    }

    if (this.props.rows) {
      this.props.rows.forEach(r => {
        if (Array.isArray(r)) {
          r.forEach((cell, c) => {
            if (c < numCols) {
              colWidths[c] = Math.max(colWidths[c], this.getCellWidth(cell) * 8 + 20);
            }
          });
        }
      });
    }

    let headerHeight = 30;
    if (this.props.header) {
      this.props.header.forEach(h => {
        headerHeight = Math.max(headerHeight, this.getCellHeight(h));
      });
    }

    const rowHeights: number[] = [];
    if (this.props.rows) {
      this.props.rows.forEach(r => {
        let h = 30;
        if (Array.isArray(r)) {
          r.forEach(cell => {
            h = Math.max(h, this.getCellHeight(cell));
          });
        }
        rowHeights.push(h);
      });
    } else {
      rowHeights.push(30); // At least one body row if empty
    }

    const showHeaderTop = this.props.header !== undefined && this.props.header.length > 0 && this.props.headerAtTop !== false;
    const showHeaderBottom = this.props.header !== undefined && this.props.header.length > 0 && this.props.headerAtBottom === true;

    return { colWidths, rowHeights, headerHeight, showHeaderTop, showHeaderBottom, numCols };
  }

  calculateMinDimensions(theme: ThemeVariables): Dimension {
    const { colWidths, rowHeights, headerHeight, showHeaderTop, showHeaderBottom } = this.getTableLayout();

    const minWidth = colWidths.reduce((a, b) => a + b, 0);
    let minHeight = rowHeights.reduce((a, b) => a + b, 0);
    if (showHeaderTop) minHeight += headerHeight;
    if (showHeaderBottom) minHeight += headerHeight;

    return { width: minWidth, height: minHeight };
  }

  render(theme: ThemeVariables): SVGElement {
    const background = this.resolveColor(this.themeOverride.backgroundColor, theme, theme.backgroundColor);
    const text = this.resolveColor(this.themeOverride.textColor, theme, theme.textColor);
    const border = this.resolveColor(this.themeOverride.borderColor, theme, theme.borderColor);
    const font = theme.fontFamily;
    const strokeWidth = this.lineWidth !== undefined ? this.lineWidth.toString() : '1.5';

    const headerBg = this.themeOverride.headerBackgroundColor || (isDarkColor(background) ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)');

    const width = this.bounds.width;
    const height = this.bounds.height;

    const minDim = this.calculateMinDimensions(theme);
    const scaleX = width / minDim.width;
    const scaleY = height / minDim.height;

    const { colWidths, rowHeights, headerHeight, showHeaderTop, showHeaderBottom, numCols } = this.getTableLayout();

    const scaledColWidths = colWidths.map(w => w * scaleX);
    const scaledRowHeights = rowHeights.map(h => h * scaleY);
    const scaledHeaderHeight = headerHeight * scaleY;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", this.id);
    g.setAttribute("transform", `translate(${this.bounds.x}, ${this.bounds.y})`);

    // Setup clip path for rounded corner clipping of internal grids/cells background
    const clipPathId = `clip-${this.id}`;
    const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    clipPath.setAttribute("id", clipPathId);
    const clipRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    clipRect.setAttribute("width", width.toString());
    clipRect.setAttribute("height", height.toString());
    clipRect.setAttribute("rx", "4");
    clipRect.setAttribute("ry", "4");
    clipPath.appendChild(clipRect);
    g.appendChild(clipPath);

    // Clipped group containing elements
    const clippedG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    clippedG.setAttribute("clip-path", `url(#${clipPathId})`);
    g.appendChild(clippedG);

    // Draw main background
    const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bgRect.setAttribute("width", width.toString());
    bgRect.setAttribute("height", height.toString());
    bgRect.setAttribute("fill", background);
    clippedG.appendChild(bgRect);

    let currentY = 0;

    // Helper cell text drawer
    const renderCellText = (container: SVGElement, cellText: string, cx: number, cy: number, cw: number, ch: number, isHeader: boolean) => {
      const lines = String(cellText).split('\n');
      const lineH = 14;
      const totalTextH = lines.length * lineH;
      const startY = cy + (ch - totalTextH) / 2 + 10;

      lines.forEach((lineText, idx) => {
        const textElem = document.createElementNS("http://www.w3.org/2000/svg", "text");
        textElem.setAttribute("x", (cx + 8).toString());
        textElem.setAttribute("y", (startY + idx * lineH).toString());
        textElem.setAttribute("fill", text);
        textElem.setAttribute("font-family", font);
        textElem.setAttribute("font-size", "12px");
        if (isHeader) {
          textElem.setAttribute("font-weight", "600");
        }
        textElem.textContent = lineText;
        container.appendChild(textElem);
      });
    };

    // Helper line drawer
    const drawGridLine = (container: SVGElement, x1: number, y1: number, x2: number, y2: number) => {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x1.toString());
      line.setAttribute("y1", y1.toString());
      line.setAttribute("x2", x2.toString());
      line.setAttribute("y2", y2.toString());
      line.setAttribute("stroke", border);
      line.setAttribute("stroke-width", strokeWidth);
      container.appendChild(line);
    };

    // Draw Top Header
    if (showHeaderTop) {
      const hBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      hBg.setAttribute("x", "0");
      hBg.setAttribute("y", currentY.toString());
      hBg.setAttribute("width", width.toString());
      hBg.setAttribute("height", scaledHeaderHeight.toString());
      hBg.setAttribute("fill", headerBg);
      clippedG.appendChild(hBg);

      let currentX = 0;
      for (let col = 0; col < numCols; col++) {
        const colW = scaledColWidths[col];
        const cellText = this.props.header?.[col] ?? '';
        renderCellText(clippedG, cellText, currentX, currentY, colW, scaledHeaderHeight, true);
        currentX += colW;
      }
      currentY += scaledHeaderHeight;
    }

    // Draw Rows
    if (this.props.rows) {
      this.props.rows.forEach((row, rowIndex) => {
        const rowH = scaledRowHeights[rowIndex];
        let currentX = 0;
        for (let col = 0; col < numCols; col++) {
          const colW = scaledColWidths[col];
          const cellText = (Array.isArray(row) ? row[col] : '') ?? '';
          renderCellText(clippedG, cellText, currentX, currentY, colW, rowH, false);
          currentX += colW;
        }
        currentY += rowH;
      });
    }

    // Draw Bottom Header
    if (showHeaderBottom) {
      const hBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      hBg.setAttribute("x", "0");
      hBg.setAttribute("y", currentY.toString());
      hBg.setAttribute("width", width.toString());
      hBg.setAttribute("height", scaledHeaderHeight.toString());
      hBg.setAttribute("fill", headerBg);
      clippedG.appendChild(hBg);

      let currentX = 0;
      for (let col = 0; col < numCols; col++) {
        const colW = scaledColWidths[col];
        const cellText = this.props.header?.[col] ?? '';
        renderCellText(clippedG, cellText, currentX, currentY, colW, scaledHeaderHeight, true);
        currentX += colW;
      }
      currentY += scaledHeaderHeight;
    }

    // Draw Grid Lines (Horizontal)
    let gridY = 0;
    if (showHeaderTop) {
      gridY += scaledHeaderHeight;
      drawGridLine(clippedG, 0, gridY, width, gridY);
    }
    if (this.props.rows) {
      for (let r = 0; r < this.props.rows.length - 1; r++) {
        gridY += scaledRowHeights[r];
        drawGridLine(clippedG, 0, gridY, width, gridY);
      }
      if (this.props.rows.length > 0) {
        gridY += scaledRowHeights[this.props.rows.length - 1];
      }
    }
    if (showHeaderBottom) {
      drawGridLine(clippedG, 0, gridY, width, gridY);
    }

    // Draw Grid Lines (Vertical)
    let gridX = 0;
    for (let c = 0; c < numCols - 1; c++) {
      gridX += scaledColWidths[c];
      drawGridLine(clippedG, gridX, 0, gridX, height);
    }

    // Draw Outer Outline (unclipped, on top of clipped content)
    const outline = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    outline.setAttribute("width", width.toString());
    outline.setAttribute("height", height.toString());
    outline.setAttribute("fill", "none");
    outline.setAttribute("stroke", border);
    outline.setAttribute("stroke-width", strokeWidth);
    outline.setAttribute("rx", "4");
    outline.setAttribute("ry", "4");
    g.appendChild(outline);

    return g;
  }
}
