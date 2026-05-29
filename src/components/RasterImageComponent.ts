import { BaseComponent, ComponentMetadata, ThemeVariables, Dimension } from './BaseComponent';

export interface RasterImageProps {
  content?: string;
  scale?: number;
  width?: number;
  height?: number;
}

export class RasterImageComponent extends BaseComponent<RasterImageProps> {
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

  private getNativeDimensions(): Dimension {
    if (!this.props.content) {
      return { width: 150, height: 150 };
    }
    const parsed = this.parseImageDimensions(this.props.content);
    return parsed || { width: 150, height: 150 };
  }

  private parseImageDimensions(base64Str: string): Dimension | null {
    try {
      // Strip all whitespace/newlines from base64
      const cleaned = base64Str.replace(/\s/g, '');
      // Strip metadata prefix if present (e.g., "data:image/png;base64,")
      const base64Data = cleaned.replace(/^data:image\/[a-z]+;base64,/, '');
      
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // PNG Signature
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
        const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
        const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
        if (width > 0 && height > 0) return { width, height };
      }
      
      // JPEG Signature
      if (bytes[0] === 0xff && bytes[1] === 0xd8) {
        let offset = 2;
        while (offset < len) {
          const marker = (bytes[offset] << 8) | bytes[offset + 1];
          if (marker === 0xffd9 || marker === 0xffda) break;
          const chunkLen = (bytes[offset + 2] << 8) | bytes[offset + 3];
          if (offset + chunkLen + 2 > len) break;
          
          if ((marker >= 0xffc0 && marker <= 0xffc3) || (marker >= 0xffc5 && marker <= 0xffc7) || (marker >= 0xffc9 && marker <= 0xffcb) || (marker >= 0xffcd && marker <= 0xffcf)) {
            const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
            const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
            if (width > 0 && height > 0) return { width, height };
          }
          offset += chunkLen + 2;
        }
      }
      
      // GIF Signature
      if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
        const width = bytes[6] | (bytes[7] << 8);
        const height = bytes[8] | (bytes[9] << 8);
        if (width > 0 && height > 0) return { width, height };
      }
    } catch (e) {
      // ignore parsing errors
    }
    return null;
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
    const native = this.getNativeDimensions();
    const baseWidth = this.props.width !== undefined ? this.props.width : native.width;
    const baseHeight = this.props.height !== undefined ? this.props.height : native.height;
    const scale = this.props.scale !== undefined ? this.props.scale : 1.0;
    
    const finalW = baseWidth * scale;
    const finalH = baseHeight * scale;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", this.id);
    g.setAttribute("transform", `translate(${this.bounds.x}, ${this.bounds.y})`);

    if (this.props.content) {
      let src = this.props.content.replace(/\s/g, '');
      if (!src.startsWith("data:")) {
        src = `data:image/png;base64,${src}`;
      }

      const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
      img.setAttribute("x", "0");
      img.setAttribute("y", "0");
      img.setAttribute("width", finalW.toString());
      img.setAttribute("height", finalH.toString());
      img.setAttribute("href", src);
      g.appendChild(img);
    } else {
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("width", finalW.toString());
      rect.setAttribute("height", finalH.toString());
      rect.setAttribute("fill", "#f3f4f6");
      rect.setAttribute("stroke", "#9ca3af");
      rect.setAttribute("stroke-width", "1");
      g.appendChild(rect);

      const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
      txt.setAttribute("x", (finalW / 2).toString());
      txt.setAttribute("y", (finalH / 2).toString());
      txt.setAttribute("fill", "#4b5563");
      txt.setAttribute("font-size", "10");
      txt.setAttribute("text-anchor", "middle");
      txt.setAttribute("dominant-baseline", "central");
      txt.textContent = "No Base64 Image";
      g.appendChild(txt);
    }

    return g;
  }
}
