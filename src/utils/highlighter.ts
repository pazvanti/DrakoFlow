export interface HighlightResult {
  html: string;
  colorTriggers: { startPos: number; color: string }[];
}

const tokenRegex = new RegExp(
  [
    // Hex Color codes (e.g. #60a5fa or "#60a5fa")
    '(?<hexColor>"?#[0-9a-fA-F]{6}"?)',
    // Block comments  /* ... */ and /** ... **/  (must come before line comments)
    '(?<blockComment>\\/\\*[\\s\\S]*?\\*\\/)',
    // Line comments
    '(?<comment>//.*)',
    // Double-quoted Strings
    '(?<string>"[^"]*")',
    // Numbers
    '(?<number>\\b\\d+\\b)',
    // Booleans
    '(?<boolean>\\b(true|false)\\b)',
    // Decorator keywords (e.g. @tags, @meta)
    '(?<decorator>@[a-zA-Z_][a-zA-Z0-9_]*)',
    // Keywords/Types (all registered component types)
    '(?<keyword>\\b(Rectangle|Process|Ellipse|VerticalContainer|Cylinder|Cube|Diamond|Hexagon|Actor|Parallelogram|Class|Interface|UMLComponent|Module|Package|Text|Paragraph)\\b)',
    // Properties (all known DSL property names)
    '(?<property>\\b(label|rx|ry|lifeline|themeOverride|lineStyle|color|gap|padding|tabWidthRatio|radius|backgroundColor|borderColor|textColor|strokeWidth|attributes|methods|items|align|text)\\b)',
    // Accessor modifiers at the start of a line (after optional leading whitespace)
    // These are +, -, #, ~ when they appear as the first non-space token on a line
    // inside a class sub-block. We match them as a line-leading token.
    '(?<accessor>(?:^|(?<=\\n))[^\\S\\n]*[+\\-#~](?=[^>\\s]))',
    // Operators: circle-arrow variants must come before plain arrow/dash forms
    '(?<operator>o->o|o<->o|o->|->o|o<->|<->o|o<-|<->|->|<-|[-:{}\\[\\]\\.])',
    // Identifiers/IDs (word followed by optional spaces then ':')
    '(?<id>\\b[a-zA-Z_][a-zA-Z0-9_]*\\s*(?=:))',
    // Plain text/whitespace
    '(?<text>[\\s\\S])'
  ].join('|'),
  'gm'
);

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function highlightDSL(code: string, activeRange?: { start: number; end: number }): HighlightResult {
  const colorTriggers: { startPos: number; color: string }[] = [];
  tokenRegex.lastIndex = 0;
  
  let html = '';
  let match;
  
  while ((match = tokenRegex.exec(code)) !== null) {
    const groups = match.groups as Record<string, string | undefined>;
    const value = match[0];
    const escapedValue = escapeHtml(value);
    
    let tokenHtml = '';
    
    if (groups.hexColor !== undefined) {
      const hasQuotes = value.startsWith('"');
      const startPos = match.index + (hasQuotes ? 1 : 0);
      const color = hasQuotes ? value.slice(1, -1) : value;
      colorTriggers.push({ startPos, color });
      tokenHtml = `<span class="hl-color">${escapedValue}<span class="color-picker-trigger" data-start-pos="${startPos}" style="background-color: ${color};" title="Click to change color"></span></span>`;
    } else if (groups.decorator !== undefined) {
      tokenHtml = `<span class="hl-decorator">${escapedValue}</span>`;
    } else if (groups.blockComment !== undefined) {
      tokenHtml = `<span class="hl-comment">${escapedValue}</span>`;
    } else if (groups.comment !== undefined) {
      tokenHtml = `<span class="hl-comment">${escapedValue}</span>`;
    } else if (groups.string !== undefined) {
      tokenHtml = `<span class="hl-string">${escapedValue}</span>`;
    } else if (groups.accessor !== undefined) {
      // Split leading whitespace from the symbol so we don't colour the indent
      const trimmed = value.trimStart();
      const indent = value.slice(0, value.length - trimmed.length);
      tokenHtml = escapeHtml(indent) + `<span class="hl-accessor">${escapeHtml(trimmed)}</span>`;
    } else if (groups.keyword !== undefined) {
      tokenHtml = `<span class="hl-keyword">${escapedValue}</span>`;
    } else if (groups.id !== undefined) {
      tokenHtml = `<span class="hl-id">${escapedValue}</span>`;
    } else if (groups.property !== undefined) {
      tokenHtml = `<span class="hl-property">${escapedValue}</span>`;
    } else if (groups.number !== undefined) {
      tokenHtml = `<span class="hl-number">${escapedValue}</span>`;
    } else if (groups.boolean !== undefined) {
      tokenHtml = `<span class="hl-boolean">${escapedValue}</span>`;
    } else if (groups.operator !== undefined) {
      tokenHtml = `<span class="hl-operator">${escapedValue}</span>`;
    } else {
      tokenHtml = escapedValue;
    }

    if (activeRange && match.index >= activeRange.start && match.index + value.length <= activeRange.end) {
      html += `<span class="hl-active-token">${tokenHtml}</span>`;
    } else {
      html += tokenHtml;
    }
  }
  
  return { html, colorTriggers };
}
