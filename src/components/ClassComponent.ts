import { BaseComponent, ThemeVariables, Dimension } from './BaseComponent';

// PlantUML accessor symbol → human-readable label + colour hint
const ACCESSOR_SYMBOLS: Record<string, { label: string; color?: string }> = {
  '+': { label: '+' },  // public
  '-': { label: '-' },  // private
  '#': { label: '#' },  // protected
  '~': { label: '~' }   // package / internal
};

const ACCESSOR_REGEX = /^([+\-#~])\s*/;

/**
 * ClassProps supports two forms for attributes / methods / items:
 *
 *   Block form (preferred, comes from ParsedNode.subBlocks):
 *     attributeLines, methodLines, itemLines — already an array of lines.
 *
 *   Legacy string form (backward-compatible, comes from properties map):
 *     attributes, methods, items — semicolon-separated strings.
 */
export interface ClassProps {
  label?: string;
  headerType?: string;
  /** Legacy semicolon-separated strings */
  attributes?: string;
  methods?: string;
  items?: string;
  /** Block form: one entry per line */
  attributeLines?: string[];
  methodLines?: string[];
  itemLines?: string[];
}

const HEADER_TYPES: Record<string, { char: string; color: string }> = {
  'abstract': { char: 'A', color: '#a5f3fc' },
  'class': { char: 'C', color: '#bbf7d0' },
  'enum': { char: 'E', color: '#fed7aa' },
  'interface': { char: 'I', color: '#e9d5ff' },
  'annotation': { char: '@', color: '#fca5a5' },
  'struct': { char: 'S', color: '#e2e8f0' },
  'entity': { char: 'E', color: '#bbf7d0' },
  'exception': { char: 'X', color: '#fecaca' },
  'metaclass': { char: 'M', color: '#e2e8f0' },
  'protocol': { char: 'P', color: '#e2e8f0' },
  'record': { char: 'R', color: '#fed7aa' },
  'stereotype': { char: 'S', color: '#fbcfe8' }
};

/** Parse a semicolon-separated legacy string into an array of trimmed, non-empty lines. */
function parseSemicolonList(val: string | undefined): string[] {
  if (!val) return [];
  return val.split(';').map(s => s.trim()).filter(s => s.length > 0);
}

/** Resolve lines from either block form or legacy string form. */
function resolveLines(blockLines: string[] | undefined, legacyString: string | undefined): string[] {
  if (blockLines && blockLines.length > 0) return blockLines;
  return parseSemicolonList(legacyString);
}

export class ClassComponent extends BaseComponent<ClassProps> {
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

    // Strip accessor prefix for width calculation
    const textLen = (line: string) => {
      let cleaned = line;
      let extra = 0;
      if (cleaned.startsWith('*')) {
        cleaned = cleaned.slice(1).trimStart();
        extra = 6; // badge length (approx 6 characters)
      }
      return cleaned.replace(ACCESSOR_REGEX, '  ').length + extra;
    };

    let maxChars = title.length;
    if (this.props.headerType) {
      maxChars += 3;
    }
    attributes.forEach(l => { maxChars = Math.max(maxChars, textLen(l)); });
    methods.forEach(l => { maxChars = Math.max(maxChars, textLen(l)); });
    items.forEach(l => { maxChars = Math.max(maxChars, l.length); });

    // Width: ~7.5px per char + horizontal padding, minimum 160px
    const width = Math.max(160, maxChars * 7.5 + 36);

    // Height: 36px header, each compartment adds 12px spacing + 20px per line
    let height = 36;
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

    const headerBg = this.themeOverride.headerBackgroundColor
      ? this.resolveColor(this.themeOverride.headerBackgroundColor, theme, theme.backgroundColor)
      : null;
    const headerText = this.themeOverride.headerTextColor
      ? this.resolveColor(this.themeOverride.headerTextColor, theme, textColor)
      : textColor;

    const { width, height } = this.bounds;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', this.id);
    g.setAttribute('transform', `translate(${this.bounds.x}, ${this.bounds.y})`);

    // Outer rect background (fill only, no stroke, to prevent overlapping when headerBg is filled)
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', width.toString());
    rect.setAttribute('height', height.toString());
    rect.setAttribute('fill', background);
    rect.setAttribute('stroke', 'none');
    g.appendChild(rect);

    // Header background rect (if headerBg is specified)
    if (headerBg) {
      const headerRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      headerRect.setAttribute('width', width.toString());
      headerRect.setAttribute('height', '36');
      headerRect.setAttribute('fill', headerBg);
      headerRect.setAttribute('stroke', 'none');
      g.appendChild(headerRect);
    }

    // Header (class name / title) — bold, centred, 36px tall
    const title = this.props.label || '';
    if (title) {
      const textElem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      let titleX = width / 2;

      if (this.props.headerType) {
        const headerTypeLower = this.props.headerType.trim().toLowerCase();
        const typeInfo = HEADER_TYPES[headerTypeLower] || {
          char: this.props.headerType.trim().charAt(0).toUpperCase(),
          color: '#e2e8f0'
        };
        const typeColor = this.themeOverride.headerTypeColor
          ? this.resolveColor(this.themeOverride.headerTypeColor, theme, '#e2e8f0')
          : typeInfo.color;
        const typeChar = typeInfo.char;

        const textWidth = title.length * 7.5;
        const cx = width / 2 - 3 - textWidth / 2;
        titleX = width / 2 + 11;

        // Draw header type circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', cx.toString());
        circle.setAttribute('cy', '18');
        circle.setAttribute('r', '8');
        circle.setAttribute('fill', typeColor);
        circle.setAttribute('stroke', border);
        circle.setAttribute('stroke-width', '1');
        g.appendChild(circle);

        const typeTextColor = this.themeOverride.headerTypeTextColor
          ? this.resolveColor(this.themeOverride.headerTypeTextColor, theme, '#111827')
          : '#111827';

        // Draw header type letter
        const charElem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        charElem.setAttribute('x', cx.toString());
        charElem.setAttribute('y', '18');
        charElem.setAttribute('fill', typeTextColor);
        charElem.setAttribute('font-family', font);
        charElem.setAttribute('font-size', '9');
        charElem.setAttribute('font-weight', 'bold');
        charElem.setAttribute('text-anchor', 'middle');
        charElem.setAttribute('dominant-baseline', 'central');
        charElem.textContent = typeChar;
        g.appendChild(charElem);
      }

      textElem.setAttribute('x', titleX.toString());
      textElem.setAttribute('y', '18');
      textElem.setAttribute('fill', headerText);
      textElem.setAttribute('font-family', font);
      textElem.setAttribute('font-weight', 'bold');
      textElem.setAttribute('font-size', '13');
      textElem.setAttribute('text-anchor', 'middle');
      textElem.setAttribute('dominant-baseline', 'central');
      textElem.textContent = title;
      g.appendChild(textElem);
    }

    let currentY = 36;
    let separatorDrawnAt36 = false;

    // Draw partition separator at y=36 if headerBg is present
    if (headerBg) {
      const sep = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      sep.setAttribute('x1', '0');
      sep.setAttribute('y1', '36');
      sep.setAttribute('x2', width.toString());
      sep.setAttribute('y2', '36');
      sep.setAttribute('stroke', border);
      sep.setAttribute('stroke-width', strokeWidth);
      g.appendChild(sep);
      separatorDrawnAt36 = true;
    }

    const addCompartment = (lines: string[]): void => {
      if (lines.length === 0) return;

      // Horizontal separator
      if (currentY !== 36 || !separatorDrawnAt36) {
        const sep = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        sep.setAttribute('x1', '0');
        sep.setAttribute('y1', currentY.toString());
        sep.setAttribute('x2', width.toString());
        sep.setAttribute('y2', currentY.toString());
        sep.setAttribute('stroke', border);
        sep.setAttribute('stroke-width', strokeWidth);
        g.appendChild(sep);
        if (currentY === 36) {
          separatorDrawnAt36 = true;
        }
      }

      currentY += 6; // top padding

      lines.forEach(lineText => {
        let isMandatory = false;
        let remainingText = lineText;
        if (remainingText.startsWith('*')) {
          isMandatory = true;
          remainingText = remainingText.slice(1).trimStart();
        }

        // Extract accessor prefix if present
        const accessorMatch = remainingText.match(ACCESSOR_REGEX);
        const accessor = accessorMatch ? accessorMatch[1] : null;
        const body = accessor ? remainingText.slice(accessorMatch![0].length) : remainingText;

        // Accessor glyph (coloured)
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

        // Line body text
        const bodyElem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        bodyElem.setAttribute('x', accessor ? '22' : '12');
        bodyElem.setAttribute('y', (currentY + 10).toString());
        bodyElem.setAttribute('fill', textColor);
        bodyElem.setAttribute('font-family', font);
        bodyElem.setAttribute('font-size', '11');
        bodyElem.setAttribute('text-anchor', 'start');
        bodyElem.setAttribute('dominant-baseline', 'central');
        if (isMandatory) {
          bodyElem.setAttribute('font-weight', 'bold');
        }
        bodyElem.textContent = body;
        g.appendChild(bodyElem);

        // Draw (M) markdown-like inline code block badge next to text
        if (isMandatory) {
          const charWidth = font.includes('monospace') || font.includes('Fira Code') ? 6.6 : 6.1;
          const textWidth = body.length * charWidth;
          const badgeX = (accessor ? 22 : 12) + textWidth + 8;

          const badgeRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          badgeRect.setAttribute('x', badgeX.toString());
          badgeRect.setAttribute('y', (currentY + 3).toString());
          badgeRect.setAttribute('width', '28');
          badgeRect.setAttribute('height', '14');
          badgeRect.setAttribute('rx', '3');
          badgeRect.setAttribute('ry', '3');
          const isDark = theme.backgroundColor === '#1e1e2e' || theme.backgroundColor.startsWith('#1') || theme.backgroundColor.startsWith('#0');
          badgeRect.setAttribute('fill', isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)');
          badgeRect.setAttribute('stroke', isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)');
          badgeRect.setAttribute('stroke-width', '1');
          g.appendChild(badgeRect);

          const badgeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          badgeText.setAttribute('x', (badgeX + 14).toString());
          badgeText.setAttribute('y', (currentY + 10).toString());
          badgeText.setAttribute('fill', isDark ? '#a1a1aa' : '#555555');
          badgeText.setAttribute('font-family', font);
          badgeText.setAttribute('font-size', '9');
          badgeText.setAttribute('font-weight', 'bold');
          badgeText.setAttribute('text-anchor', 'middle');
          badgeText.setAttribute('dominant-baseline', 'central');
          badgeText.textContent = '(M)';
          g.appendChild(badgeText);
        }

        currentY += 20;
      });

      currentY += 6; // bottom padding
    };

    const attributes = resolveLines(this.props.attributeLines, this.props.attributes);
    const methods    = resolveLines(this.props.methodLines, this.props.methods);
    const items      = resolveLines(this.props.itemLines, this.props.items);

    addCompartment(attributes);
    addCompartment(methods);
    addCompartment(items);

    // Outer rect border (drawn on top of background & header rect to keep borders crisp)
    const borderRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    borderRect.setAttribute('width', width.toString());
    borderRect.setAttribute('height', height.toString());
    borderRect.setAttribute('fill', 'none');
    borderRect.setAttribute('stroke', border);
    borderRect.setAttribute('stroke-width', strokeWidth);
    g.appendChild(borderRect);

    return g;
  }
}

/** Return a distinct colour for each PlantUML access modifier symbol. */
function getAccessorColor(symbol: string, border: string, textColor: string): string {
  switch (symbol) {
    case '+': return '#4ade80'; // green — public
    case '-': return '#f87171'; // red   — private
    case '#': return '#fb923c'; // amber — protected
    case '~': return '#a78bfa'; // violet — package
    default:  return textColor;
  }
}
