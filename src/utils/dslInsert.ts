/**
 * Returns brace depth at `index` (number of unmatched `{` before index).
 * Skips braces inside strings and comments.
 */
export function getBraceDepthAt(text: string, index: number): number {
  let depth = 0;
  let i = 0;
  const end = Math.min(index, text.length);

  while (i < end) {
    const ch = text[i];

    if (ch === '"') {
      i = skipDoubleQuotedString(text, i);
      continue;
    }

    if (ch === '/' && text[i + 1] === '/') {
      i = skipLineComment(text, i);
      continue;
    }

    if (ch === '/' && text[i + 1] === '*') {
      i = skipBlockComment(text, i);
      continue;
    }

    if (ch === '{') depth++;
    else if (ch === '}') depth = Math.max(0, depth - 1);

    i++;
  }

  return depth;
}

/**
 * Index where a new top-level component can be inserted without splitting a block.
 * If `cursor` is inside `{...}`, returns the position after the enclosing block's `}`.
 */
export function findSafeInsertIndex(text: string, cursor: number): number {
  const clampedCursor = Math.max(0, Math.min(cursor, text.length));
  let depth = getBraceDepthAt(text, clampedCursor);

  if (depth === 0) {
    return clampedCursor;
  }

  let i = clampedCursor;
  while (i < text.length) {
    const ch = text[i];

    if (ch === '"') {
      i = skipDoubleQuotedString(text, i);
      continue;
    }

    if (ch === '/' && text[i + 1] === '/') {
      i = skipLineComment(text, i);
      continue;
    }

    if (ch === '/' && text[i + 1] === '*') {
      i = skipBlockComment(text, i);
      continue;
    }

    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return i + 1;
      }
    }

    i++;
  }

  return text.length;
}

function skipDoubleQuotedString(text: string, start: number): number {
  let i = start + 1;
  while (i < text.length) {
    if (text[i] === '\\' && i + 1 < text.length) {
      i += 2;
      continue;
    }
    if (text[i] === '"') {
      return i + 1;
    }
    i++;
  }
  return text.length;
}

function skipLineComment(text: string, start: number): number {
  let i = start + 2;
  while (i < text.length && text[i] !== '\n') {
    i++;
  }
  return i;
}

function skipBlockComment(text: string, start: number): number {
  let i = start + 2;
  while (i < text.length - 1) {
    if (text[i] === '*' && text[i + 1] === '/') {
      return i + 2;
    }
    i++;
  }
  return text.length;
}

export function updateDslComponentPosition(code: string, compId: string, x: number, y: number): string {
  const declPattern = new RegExp(`\\b${compId}\\s*:\\s*([a-zA-Z_]\\w*)\\s*\\{`);
  const match = code.match(declPattern);
  if (!match) return code;

  const declStart = match.index!;
  const bodyStart = declStart + match[0].length - 1; // index of '{'

  // Find matching closing brace
  let depth = 0;
  let closeBraceIndex = -1;
  for (let idx = bodyStart; idx < code.length; idx++) {
    if (code[idx] === '{') {
      depth++;
    } else if (code[idx] === '}') {
      depth--;
      if (depth === 0) {
        closeBraceIndex = idx;
        break;
      }
    }
  }

  if (closeBraceIndex === -1) return code;

  const bodyText = code.slice(bodyStart + 1, closeBraceIndex);

  // Check if x and y properties already exist in the body.
  const xPattern = /(\b)(x\s*:\s*)-?\d+(\.\d+)?\b/;
  const yPattern = /(\b)(y\s*:\s*)-?\d+(\.\d+)?\b/;

  let newBodyText = bodyText;

  // Round positions to integers to keep DSL clean
  const rx = Math.round(x);
  const ry = Math.round(y);

  if (xPattern.test(newBodyText)) {
    newBodyText = newBodyText.replace(xPattern, `$1$2${rx}`);
  } else {
    // Detect trailing space/newline of the body to insert before it
    const trailingMatch = newBodyText.match(/(\r?\n\s*)$/);
    const trailing = trailingMatch ? trailingMatch[0] : '\n';
    newBodyText = newBodyText.replace(/(\r?\n\s*)$/, '');

    // Detect indent
    const lines = newBodyText.split('\n');
    let indent = '  ';
    for (const line of lines) {
      const m = line.match(/^(\s+)\w+\s*:/);
      if (m) {
        indent = m[1];
        break;
      }
    }
    newBodyText += `\n${indent}x: ${rx}${trailing}`;
  }

  if (yPattern.test(newBodyText)) {
    newBodyText = newBodyText.replace(yPattern, `$1$2${ry}`);
  } else {
    const trailingMatch = newBodyText.match(/(\r?\n\s*)$/);
    const trailing = trailingMatch ? trailingMatch[0] : '\n';
    newBodyText = newBodyText.replace(/(\r?\n\s*)$/, '');

    // Detect indent
    const lines = newBodyText.split('\n');
    let indent = '  ';
    for (const line of lines) {
      const m = line.match(/^(\s+)\w+\s*:/);
      if (m) {
        indent = m[1];
        break;
      }
    }
    newBodyText += `\n${indent}y: ${ry}${trailing}`;
  }

  // Combine back
  return code.slice(0, bodyStart + 1) + newBodyText + code.slice(closeBraceIndex);
}
