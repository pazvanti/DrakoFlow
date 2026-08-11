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
    // Exterior direction keywords for relationships
    '(?<exterior>\\b(LEFT|RIGHT|TOP|BOTTOM|left|right|top|bottom)\\b)',
    // Keywords/Types (all registered component types)
    '(?<keyword>\\b(Rectangle|Process|Ellipse|VerticalContainer|Cylinder|Cube|Diamond|Hexagon|Actor|Parallelogram|Class|Interface|UMLComponent|Module|Package|Text|Paragraph|SVGImage|RasterImage|Cloud|Node|Artifact|Folder|Frame|Storage|Stack|File|Card|Usecase|Boundary|Control|Entity|Queue|Collections|Agent|Enum|Abstract|Annotation|Struct|Object|Table)\\b)',
    // Properties (all known DSL property names)
    '(?<property>\\b(label|icon|rx|ry|lifeline|url|lineWidth|shadow|themeOverride|lineStyle|color|thickness|routeType|startX|startY|animated|gap|padding|tabWidthRatio|radius|backgroundColor|borderColor|textColor|headerBackgroundColor|headerTextColor|headerType|headerTypeColor|headerTypeTextColor|colorizeHeaderByType|attributes|methods|items|align|text|content|scale|width|height|header|rows|headerAtTop|headerAtBottom)\\b)',
    // Accessor modifiers at the start of a line (after optional leading whitespace)
    '(?<accessor>(?:^|(?<=\\n))[^\\S\\n]*(?:\\*\\s*)?[+\\-#~](?=[^>\\s])|(?:^|(?<=\\n))[^\\S\\n]*\\*(?=\\s*[a-zA-Z_]))',
    // Operators: generic connector combinations followed by fallback chars
    '(?<operator>(?<![a-zA-Z0-9_])[<>o]+-[<>o]*(?![a-zA-Z0-9_])|(?<![a-zA-Z0-9_])[<>o]*-[<>o]+(?![a-zA-Z0-9_])|[-:{}\\[\\]\\.])',
    // Identifiers/IDs (word with optional dots followed by optional spaces then ':')
    '(?<id>\\b[a-zA-Z_][a-zA-Z0-9_.]*\\s*(?=:))',
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
    const matchIndex = match.index;
    
    // Check if token falls inside the active highlight range
    const isTokenHighlighted = activeRange !== undefined &&
      matchIndex >= activeRange.start &&
      (matchIndex + value.length) <= activeRange.end;

    const wrapTag = (cls: string, content: string): string => {
      const activeAttr = isTokenHighlighted ? ' class="hl-active-token"' : '';
      return `<span class="hl-${cls}"${activeAttr}>${escapeHtml(content)}</span>`;
    };

    if (groups.hexColor) {
      const colorVal = value.replace(/"/g, '');
      colorTriggers.push({ startPos: matchIndex, color: colorVal });
      const activeAttr = isTokenHighlighted ? ' class="hl-active-token"' : '';
      html += `<span class="hl-color"${activeAttr}><span class="color-picker-trigger" style="background-color: ${colorVal}"></span>${escapeHtml(value)}</span>`;
    } else if (groups.blockComment) {
      html += wrapTag('comment', value);
    } else if (groups.comment) {
      html += wrapTag('comment', value);
    } else if (groups.string) {
      html += wrapTag('string', value);
    } else if (groups.number) {
      html += wrapTag('number', value);
    } else if (groups.boolean) {
      html += wrapTag('boolean', value);
    } else if (groups.decorator) {
      html += wrapTag('decorator', value);
    } else if (groups.exterior) {
      html += wrapTag('keyword', value);
    } else if (groups.keyword) {
      html += wrapTag('keyword', value);
    } else if (groups.property) {
      html += wrapTag('property', value);
    } else if (groups.accessor) {
      html += wrapTag('accessor', value);
    } else if (groups.operator) {
      html += wrapTag('operator', value);
    } else if (groups.id) {
      html += wrapTag('id', value);
    } else {
      html += escapeHtml(value);
    }
  }

  return { html, colorTriggers };
}
