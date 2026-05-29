import { BaseComponent, ComponentMetadata, ThemeVariables, Dimension } from './BaseComponent';

export interface SVGImageProps {
  content?: string;
  scale?: number;
  width?: number;
  height?: number;
}

export class SVGImageComponent extends BaseComponent<SVGImageProps> {
  validateProps(): void {
    if (this.props.content !== undefined && typeof this.props.content !== 'string') {
      throw new Error(`Component [${this.id}]: 'content' must be a string.`);
    }
    if (this.props.scale !== undefined && typeof this.props.scale !== 'number') {
      throw new Error(`Component [${this.id}]: 'scale' must be a number.`);
    }
    if (this.props.width !== undefined && typeof this.props.width !== 'number') {
      throw new Error(`Component [${this.id}]: 'width' must be a number.`);
    }
    if (this.props.height !== undefined && typeof this.props.height !== 'number') {
      throw new Error(`Component [${this.id}]: 'height' must be a number.`);
    }
  }

  private getNormalizedSvgContent(): string {
    if (!this.props.content) return "";
    const trimmed = this.props.content.trim();
    const svgTagMatch = trimmed.match(/^<svg\b([^>]*)/i);
    if (svgTagMatch) {
      const attributes = svgTagMatch[1];
      if (!/xmlns\s*=/i.test(attributes)) {
        return trimmed.replace(/^<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
      }
    }
    return trimmed;
  }

  private getNativeDimensions(): Dimension {
    const svgContent = this.getNormalizedSvgContent();
    if (!svgContent) {
      return { width: 100, height: 100 };
    }
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, 'image/svg+xml');
      const svgElement = doc.documentElement;
      
      let width = 100;
      let height = 100;

      if (svgElement) {
        const wAttr = svgElement.getAttribute('width');
        const hAttr = svgElement.getAttribute('height');
        const vbAttr = svgElement.getAttribute('viewBox');

        if (wAttr) {
          const parsedW = parseFloat(wAttr);
          if (!isNaN(parsedW)) width = parsedW;
        }
        if (hAttr) {
          const parsedH = parseFloat(hAttr);
          if (!isNaN(parsedH)) height = parsedH;
        }

        if ((!wAttr || !hAttr) && vbAttr) {
          const parts = vbAttr.trim().split(/\s+/);
          if (parts.length === 4) {
            const vbW = parseFloat(parts[2]);
            const vbH = parseFloat(parts[3]);
            if (!isNaN(vbW) && !isNaN(vbH)) {
              if (!wAttr) width = vbW;
              if (!hAttr) height = vbH;
            }
          }
        }
      }
      return { width, height };
    } catch (e) {
      console.warn("Failed to parse native SVG dimensions:", e);
      return { width: 100, height: 100 };
    }
  }

  calculateMinDimensions(theme: ThemeVariables): Dimension {
    const native = this.getNativeDimensions();
    const baseWidth = this.props.width !== undefined ? this.props.width : native.width;
    const baseHeight = this.props.height !== undefined ? this.props.height : native.height;
    
    const scale = this.props.scale !== undefined ? this.props.scale : 1.0;
    return {
      width: baseWidth * scale,
      height: baseHeight * scale
    };
  }

  render(theme: ThemeVariables): SVGElement {
    const scale = this.props.scale !== undefined ? this.props.scale : 1.0;
    const native = this.getNativeDimensions();
    const baseWidth = this.props.width !== undefined ? this.props.width : native.width;
    const baseHeight = this.props.height !== undefined ? this.props.height : native.height;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", this.id);
    g.setAttribute("transform", `translate(${this.bounds.x}, ${this.bounds.y})`);

    const svgContent = this.getNormalizedSvgContent();
    if (svgContent) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, 'image/svg+xml');
        
        if (doc.getElementsByTagName("parsererror").length > 0) {
          this.renderErrorRect(g, baseWidth * scale, baseHeight * scale, "SVG Syntax Error");
          return g;
        }

        const parsedSvg = doc.documentElement;
        
        if (parsedSvg && parsedSvg.nodeName.toLowerCase() === 'svg') {
          const innerG = document.createElementNS("http://www.w3.org/2000/svg", "g");
          
          parsedSvg.setAttribute("width", baseWidth.toString());
          parsedSvg.setAttribute("height", baseHeight.toString());
          
          if (!parsedSvg.getAttribute("viewBox")) {
            parsedSvg.setAttribute("viewBox", `0 0 ${native.width} ${native.height}`);
          }

          innerG.setAttribute("transform", `scale(${scale})`);
          
          const importedNode = document.importNode(parsedSvg, true);
          innerG.appendChild(importedNode);
          g.appendChild(innerG);
        } else {
          this.renderErrorRect(g, baseWidth * scale, baseHeight * scale, "Invalid SVG");
        }
      } catch (e) {
        this.renderErrorRect(g, baseWidth * scale, baseHeight * scale, "SVG Parse Error");
      }
    } else {
      this.renderErrorRect(g, baseWidth * scale, baseHeight * scale, "No Content");
    }

    return g;
  }

  private renderErrorRect(g: SVGElement, w: number, h: number, msg: string): void {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", w.toString());
    rect.setAttribute("height", h.toString());
    rect.setAttribute("fill", "#fee2e2");
    rect.setAttribute("stroke", "#ef4444");
    rect.setAttribute("stroke-width", "1");
    g.appendChild(rect);

    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", (w / 2).toString());
    txt.setAttribute("y", (h / 2).toString());
    txt.setAttribute("fill", "#b91c1c");
    txt.setAttribute("font-size", "10");
    txt.setAttribute("text-anchor", "middle");
    txt.setAttribute("dominant-baseline", "central");
    txt.textContent = msg;
    g.appendChild(txt);
  }
}
