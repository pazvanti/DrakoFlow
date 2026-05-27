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
