import { BaseComponent, ThemeVariables, Dimension } from './BaseComponent';

export interface StructProps {
  label?: string;
  attributes?: string;
  methods?: string;
  items?: string;
  attributeLines?: string[];
  methodLines?: string[];
  itemLines?: string[];
}

const ACCESSOR_REGEX = /^([+\-#~])\s*/;

function parseSemicolonList(val: string | undefined): string[] {
  if (!val) return [];
  return val.split(';').map(s => s.trim()).filter(s => s.length > 0);
}

function resolveLines(blockLines: string[] | undefined, legacyString: string | undefined): string[] {
  if (blockLines && blockLines.length > 0) return blockLines;
  return parseSemicolonList(legacyString);
}

export class StructComponent extends BaseComponent<StructProps> {
  validateProps(): void {
    if (this.props.label !== undefined && typeof this.props.label !== 'string') {
      throw new Error(`Component [${this.id}]: 'label' must be a string.`);
    }
    if (this.props.items !== undefined && typeof this.props.items !== 'string') {
      throw new Error(`Component [${this.id}]: 'items' must be a string.`);
    }
    if (this.props.attributes !== undefined && typeof this.props.attributes !== 'string') {
      throw new Error(`Component [${this.id}]: 'attributes' must be a string.`);
    }
    if (this.props.methods !== undefined && typeof this.props.methods !== 'string') {
      throw new Error(`Component [${this.id}]: 'methods' must be a string.`);
    }
  }

  calculateMinDimensions(theme: ThemeVariables): Dimension {
    const title = this.props.label || '';
    const attributes = resolveLines(this.props.attributeLines, this.props.attributes);
    const methods = resolveLines(this.props.methodLines, this.props.methods);
    const items = resolveLines(this.props.itemLines, this.props.items);

    const textLen = (line: string) => line.replace(ACCESSOR_REGEX, '  ').length;

    let maxChars = Math.max(title.length, '«struct»'.length);
    attributes.forEach(l => { maxChars = Math.max(maxChars, textLen(l)); });
    methods.forEach(l => { maxChars = Math.max(maxChars, textLen(l)); });
    items.forEach(l => { maxChars = Math.max(maxChars, l.length); });

    const width = Math.max(160, maxChars * 7.5 + 36);
    let height = 46;
    if (attributes.length > 0) height += 12 + attributes.length * 20;
    if (methods.length > 0)    height += 12 + methods.length * 20;
    if (items.length > 0)      height += 12 + items.length * 20;

    return { width, height };
  }

  render(theme: ThemeVariables): SVGElement {
    const background = this.resolveColor(this.themeOverride.backgroundColor, theme, theme.backgroundColor);
    const textColor  = this.resolveColor(this.themeOverride.textColor, theme, theme.textColor);
    const border     = this.resolveColor(this.themeOverride.borderColor, theme, theme.borderColor);
    const font       = theme.fontFamily;
    const strokeWidth = this.lineWidth !== undefined ? this.lineWidth.toString() : '1.5';

    const { width, height } = this.bounds;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', this.id);
    g.setAttribute('transform', `translate(${this.bounds.x}, ${this.bounds.y})`);

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', width.toString());
    rect.setAttribute('height', height.toString());
    rect.setAttribute('fill', background);
    rect.setAttribute('stroke', border);
    rect.setAttribute('stroke-width', strokeWidth);
    g.appendChild(rect);

    const stereo = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    stereo.setAttribute('x', (width / 2).toString());
    stereo.setAttribute('y', '14');
    stereo.setAttribute('fill', textColor);
    stereo.setAttribute('font-family', font);
    stereo.setAttribute('font-size', '10');
    stereo.setAttribute('font-style', 'italic');
    stereo.setAttribute('text-anchor', 'middle');
    stereo.setAttribute('dominant-baseline', 'central');
    stereo.setAttribute('opacity', '0.75');
    stereo.textContent = '«struct»';
    g.appendChild(stereo);

    const title = this.props.label || '';
    if (title) {
      const textElem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textElem.setAttribute('x', (width / 2).toString());
      textElem.setAttribute('y', '32');
      textElem.setAttribute('fill', textColor);
      textElem.setAttribute('font-family', font);
      textElem.setAttribute('font-weight', 'bold');
      textElem.setAttribute('font-size', '13');
      textElem.setAttribute('text-anchor', 'middle');
      textElem.setAttribute('dominant-baseline', 'central');
      textElem.textContent = title;
      g.appendChild(textElem);
    }

    let currentY = 46;
    const addCompartment = (lines: string[]): void => {
      if (lines.length === 0) return;

      const sep = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      sep.setAttribute('x1', '0');
      sep.setAttribute('y1', currentY.toString());
      sep.setAttribute('x2', width.toString());
      sep.setAttribute('y2', currentY.toString());
      sep.setAttribute('stroke', border);
      sep.setAttribute('stroke-width', strokeWidth);
      g.appendChild(sep);

      currentY += 6;
      lines.forEach(lineText => {
        const accessorMatch = lineText.match(ACCESSOR_REGEX);
        const accessor = accessorMatch ? accessorMatch[1] : null;
        const body = accessor ? lineText.slice(accessorMatch![0].length) : lineText;

        if (accessor) {
          const accElem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          accElem.setAttribute('x', '10');
          accElem.setAttribute('y', (currentY + 10).toString());
          accElem.setAttribute('fill', getAccessorColor(accessor, border, textColor));
          accElem.setAttribute('font-family', font);
          accElem.setAttribute('font-size', '12');
          accElem.setAttribute('font-weight', 'bold');
          accElem.setAttribute('text-anchor', 'start');
          accElem.setAttribute('dominant-baseline', 'central');
          accElem.textContent = accessor;
          g.appendChild(accElem);
        }

        const bodyElem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        bodyElem.setAttribute('x', accessor ? '22' : '12');
        bodyElem.setAttribute('y', (currentY + 10).toString());
        bodyElem.setAttribute('fill', textColor);
        bodyElem.setAttribute('font-family', font);
        bodyElem.setAttribute('font-size', '11');
        bodyElem.setAttribute('text-anchor', 'start');
        bodyElem.setAttribute('dominant-baseline', 'central');
        bodyElem.textContent = body;
        g.appendChild(bodyElem);

        currentY += 20;
      });
      currentY += 6;
    };

    const attributes = resolveLines(this.props.attributeLines, this.props.attributes);
    const methods    = resolveLines(this.props.methodLines, this.props.methods);
    const items      = resolveLines(this.props.itemLines, this.props.items);

    addCompartment(attributes);
    addCompartment(methods);
    addCompartment(items);

    return g;
  }
}

function getAccessorColor(symbol: string, border: string, textColor: string): string {
  switch (symbol) {
    case '+': return '#4ade80';
    case '-': return '#f87171';
    case '#': return '#fb923c';
    case '~': return '#a78bfa';
    default:  return textColor;
  }
}
