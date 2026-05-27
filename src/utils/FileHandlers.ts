/**
 * Save the DSL content as a local file download
 */
export function downloadDSLFile(dslContent: string, fileName: string = "diagram.draw"): void {
  const blob = new Blob([dslContent], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export interface ExportOptions {
  range: 'whole' | 'current';
  width: number;
  padding: number;
  background: 'theme' | 'transparent';
  backgroundColor?: string;
  diagramBBox?: { x: number; y: number; width: number; height: number };
}

/**
 * Export the interactive SVG element structure into a custom resolution PNG file download
 */
export async function exportToPNG(svgElement: SVGElement, options: ExportOptions): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Clone SVG to avoid modifying the visible diagram attributes
    const svgClone = svgElement.cloneNode(true) as SVGElement;
    
    let aspect = 1.0;
    
    if (options.range === 'current') {
      const originalWidth = svgElement.clientWidth || 800;
      const originalHeight = svgElement.clientHeight || 600;
      aspect = originalWidth / originalHeight;
      svgClone.setAttribute('viewBox', `0 0 ${originalWidth} ${originalHeight}`);
    } else {
      // For "whole" image, reset transform of the viewport group inside clone
      const viewportGClone = svgClone.querySelector('#viewport-g') as SVGElement;
      if (viewportGClone) {
        viewportGClone.removeAttribute('transform');
      }
      
      const bbox = options.diagramBBox || { x: 0, y: 0, width: 800, height: 600 };
      const padding = options.padding;
      const minX = bbox.x - padding;
      const minY = bbox.y - padding;
      const exportWidth = bbox.width + 2 * padding;
      const exportHeight = bbox.height + 2 * padding;
      aspect = exportWidth / exportHeight;
      svgClone.setAttribute('viewBox', `${minX} ${minY} ${exportWidth} ${exportHeight}`);
    }

    const targetWidth = options.width;
    const targetHeight = Math.round(targetWidth / aspect);

    svgClone.setAttribute('width', targetWidth.toString());
    svgClone.setAttribute('height', targetHeight.toString());
    
    const svgString = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to get 2D canvas context."));
        return;
      }
      
      if (options.background === 'theme') {
        ctx.fillStyle = options.backgroundColor || "#09090b";
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }
      
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to generate PNG blob."));
        }
      }, "image/png");
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}
