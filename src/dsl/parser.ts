import { isComponentType } from './componentTypes';
import { ParsedRelationship, RelationshipStyle } from '../engine/Relationship';

export interface ParsedReference {
  /** Instance id of the child slot inside the container. */
  slotId: string;
  /** Id of a previously defined top-level component. */
  refId: string;
}

export type ParsedChildEntry =
  | { kind: 'inline'; node: ParsedNode }
  | { kind: 'reference'; slotId: string; refId: string; tags?: string[] };

export interface ParsedNode {
  id: string;
  type: string;
  properties: Record<string, string | number | boolean>;
  themeOverride: Record<string, string>;
  /** Inline nested components and references, in source order. */
  childEntries: ParsedChildEntry[];
  /** Tags declared via @tags: ["a", "b"] before the component block. */
  tags?: string[];
  /**
   * Named line-list sub-blocks, e.g. `attributes: { ... }` parsed into
   * an array of trimmed, non-empty lines.  Used by ClassComponent.
   */
  subBlocks?: Record<string, string[]>;
}

export interface DslDocument {
  components: ParsedNode[];
  relationships: ParsedRelationship[];
}

/**
 * Parse DrakoFlow DSL into components and relationships.
 */
export function parseDslDocument(code: string): DslDocument {
  const stripped = stripComments(code);
  const components: ParsedNode[] = [];
  const relationships: ParsedRelationship[] = [];
  let i = 0;
  // Tags from the most recent @tags directive, to be applied to the next component.
  let pendingTags: string[] | undefined;

  while (i < stripped.length) {
    i = skipWhitespace(stripped, i);
    if (i >= stripped.length) break;

    // Try to parse a top-level @directive line (e.g. @tags: ["a", "b"]).
    const directive = tryParseDirective(stripped, i);
    if (directive) {
      if (directive.name === 'tags') pendingTags = directive.values;
      i = directive.end;
      continue;
    }

    const relationship = tryParseRelationship(stripped, i);
    if (relationship) {
      relationships.push(relationship.parsed);
      i = relationship.end;
      continue;
    }

    const decl = readComponentDeclaration(stripped, i);
    if (!decl) {
      throw new Error(`Unexpected syntax near: "${stripped.slice(i, i + 40).trim()}..."`);
    }

    const closeBrace = findMatchingBrace(stripped, decl.bodyStart);
    const body = stripped.slice(decl.bodyStart + 1, closeBrace);
    const node = parseNode(decl.id, decl.type, body);
    if (pendingTags) {
      node.tags = pendingTags;
      pendingTags = undefined;
    }
    components.push(node);
    i = closeBrace + 1;
  }

  return { components, relationships };
}

/**
 * Parse DrakoFlow DSL into a tree of component nodes (components only).
 */
export function parseDsl(code: string): ParsedNode[] {
  return parseDslDocument(code).components;
}

type ArrowMatch = {
  leftId: string;
  leftCard?: string;
  rightCard?: string;
  rightId: string;
  bidirectional: boolean;
  reverse: boolean;
  simple?: boolean;
  /** 'o' modifier appeared at the left side of the arrow */
  leftCircle?: boolean;
  /** 'o' modifier appeared at the right side of the arrow */
  rightCircle?: boolean;
  length: number;
};

/** Match arrow operators. Supported forms (longest match wins):
 *  Bidirectional:  <->  o<->  <->o  o<->o
 *  Reverse:        <-   o<-
 *  Forward:        ->   ->o   o->   o->o
 *  Simple:         -
 */
function matchRelationshipArrow(slice: string): ArrowMatch | null {
  // Each pattern captures: (leftId) (leftCard?) (leftCircle?) arrow (rightCircle?) (rightCard?) (rightId)
  // We build explicit patterns for all relevant o/non-o combos.
  type PatternDef = {
    bidirectional: boolean;
    reverse: boolean;
    simple?: boolean;
    leftCircle?: boolean;
    rightCircle?: boolean;
    regex: RegExp;
  };

  const patterns: PatternDef[] = [
    // ── Bidirectional o<->o ──
    { bidirectional: true,  reverse: false, leftCircle: true,  rightCircle: true,
      regex: /^(\w+)\s*(?:\[([^\]]*)\])?\s*o\s*<->\s*o\s*(?:\[([^\]]*)\])?\s*(\w+)/ },
    // ── Bidirectional o<-> ──
    { bidirectional: true,  reverse: false, leftCircle: true,  rightCircle: false,
      regex: /^(\w+)\s*(?:\[([^\]]*)\])?\s*o\s*<->\s*(?:\[([^\]]*)\])?\s*(\w+)/ },
    // ── Bidirectional <->o ──
    { bidirectional: true,  reverse: false, leftCircle: false, rightCircle: true,
      regex: /^(\w+)\s*(?:\[([^\]]*)\])?\s*<->\s*o\s*(?:\[([^\]]*)\])?\s*(\w+)/ },
    // ── Bidirectional <-> ──
    { bidirectional: true,  reverse: false,
      regex: /^(\w+)\s*(?:\[([^\]]*)\])?\s*<->\s*(?:\[([^\]]*)\])?\s*(\w+)/ },
    // ── Reverse o<- ──
    { bidirectional: false, reverse: true,  leftCircle: true,
      regex: /^(\w+)\s*(?:\[([^\]]*)\])?\s*o\s*<-\s*(?:\[([^\]]*)\])?\s*(\w+)/ },
    // ── Reverse <- ──
    { bidirectional: false, reverse: true,
      regex: /^(\w+)\s*(?:\[([^\]]*)\])?\s*<-\s*(?:\[([^\]]*)\])?\s*(\w+)/ },
    // ── Forward o->o ──
    { bidirectional: false, reverse: false, leftCircle: true,  rightCircle: true,
      regex: /^(\w+)\s*(?:\[([^\]]*)\])?\s*o\s*->\s*o\s*(?:\[([^\]]*)\])?\s*(\w+)/ },
    // ── Forward o-> ──
    { bidirectional: false, reverse: false, leftCircle: true,  rightCircle: false,
      regex: /^(\w+)\s*(?:\[([^\]]*)\])?\s*o\s*->\s*(?:\[([^\]]*)\])?\s*(\w+)/ },
    // ── Forward ->o ──
    { bidirectional: false, reverse: false, leftCircle: false, rightCircle: true,
      regex: /^(\w+)\s*(?:\[([^\]]*)\])?\s*->\s*o\s*(?:\[([^\]]*)\])?\s*(\w+)/ },
    // ── Forward -> ──
    { bidirectional: false, reverse: false,
      regex: /^(\w+)\s*(?:\[([^\]]*)\])?\s*->\s*(?:\[([^\]]*)\])?\s*(\w+)/ },
    // ── Simple - ──
    { bidirectional: false, reverse: false, simple: true,
      regex: /^(\w+)\s*(?:\[([^\]]*)\])?\s*-\s*(?:\[([^\]]*)\])?\s*(\w+)/ }
  ];

  for (const pattern of patterns) {
    const match = slice.match(pattern.regex);
    if (!match) continue;

    return {
      leftId: match[1],
      leftCard: match[2] || undefined,
      rightCard: match[3] || undefined,
      rightId: match[4],
      bidirectional: pattern.bidirectional,
      reverse: pattern.reverse,
      simple: pattern.simple || false,
      leftCircle: pattern.leftCircle || false,
      rightCircle: pattern.rightCircle || false,
      length: match[0].length
    };
  }

  return null;
}

function buildParsedRelationship(arrow: ArrowMatch): ParsedRelationship {
  if (arrow.reverse) {
    return {
      sourceId: arrow.rightId,
      targetId: arrow.leftId,
      sourceCardinality: arrow.rightCard,
      targetCardinality: arrow.leftCard,
      bidirectional: false,
      simple: arrow.simple,
      // When reversed, left/right circles swap to source/target
      sourceCircle: arrow.rightCircle || false,
      targetCircle: arrow.leftCircle || false
    };
  }

  return {
    sourceId: arrow.leftId,
    targetId: arrow.rightId,
    sourceCardinality: arrow.leftCard,
    targetCardinality: arrow.rightCard,
    bidirectional: arrow.bidirectional,
    simple: arrow.simple,
    sourceCircle: arrow.leftCircle || false,
    targetCircle: arrow.rightCircle || false
  };
}

function tryParseRelationship(
  text: string,
  start: number
): { parsed: ParsedRelationship; end: number } | null {
  const arrow = matchRelationshipArrow(text.slice(start));
  if (!arrow) return null;

  const parsed = buildParsedRelationship(arrow);

  let i = start + arrow.length;
  i = skipWhitespace(text, i);

  if (text[i] === ':') {
    i++;
    i = skipWhitespace(text, i);
    const label = readQuotedString(text, i);
    if (label) {
      parsed.label = label.value;
      i = label.end;
      i = skipWhitespace(text, i);
    }
  }

  if (text[i] === '{') {
    const open = i;
    const close = findMatchingBrace(text, open);
    Object.assign(parsed, { style: parseRelationshipStyleBlock(text.slice(open + 1, close)) });
    i = close + 1;
  }

  return { parsed, end: i };
}

function parseRelationshipStyleBlock(body: string): RelationshipStyle {
  const style: RelationshipStyle = {};
  const lineStyle = body.match(/lineStyle\s*:\s*"([^"]*)"/);
  if (lineStyle) {
    const value = lineStyle[1] as RelationshipStyle['lineStyle'];
    if (value === 'solid' || value === 'dashed' || value === 'dotted') {
      style.lineStyle = value;
    }
  }
  const color = body.match(/color\s*:\s*"([^"]*)"/);
  if (color) style.color = color[1];
  return style;
}

function unescapeString(str: string): string {
  return str.replace(/\\(.)/g, (match, char) => {
    if (char === 'n') return '\n';
    if (char === 't') return '\t';
    if (char === 'r') return '\r';
    return char;
  });
}

function readQuotedString(
  text: string,
  start: number
): { value: string; end: number } | null {
  const i = skipWhitespace(text, start);
  if (text[i] !== '"') return null;

  let j = i + 1;
  while (j < text.length) {
    if (text[j] === '\\' && j + 1 < text.length) {
      j += 2;
      continue;
    }
    if (text[j] === '"') {
      return { value: unescapeString(text.slice(i + 1, j)), end: j + 1 };
    }
    j++;
  }
  return null;
}

function parseNode(id: string, type: string, body: string): ParsedNode {
  const properties: Record<string, string | number | boolean> = {};
  const themeOverride: Record<string, string> = {};
  const childEntries: ParsedChildEntry[] = [];
  const subBlocksList: Record<string, string[]> = {};
  let pendingTags: string[] | undefined;

  let i = 0;
  while (i < body.length) {
    i = skipWhitespace(body, i);
    if (i >= body.length) break;

    // Try to parse a directive inside the component body (e.g. @tags: ["test2"])
    const directive = tryParseDirective(body, i);
    if (directive) {
      if (directive.name === 'tags') {
        pendingTags = directive.values;
      }
      i = directive.end;
      continue;
    }

    const themeMatch = body.slice(i).match(/^themeOverride\s*:\s*\{/);
    if (themeMatch) {
      const open = i + themeMatch[0].length - 1;
      const close = findMatchingBrace(body, open);
      Object.assign(themeOverride, parseKeyValueBlock(body.slice(open + 1, close)));
      i = close + 1;
      continue;
    }

    // Named line-list sub-block: `attributes: { ... }`, `methods: { ... }`, `items: { ... }`, `content: { ... }`
    // Each non-empty line inside the block becomes one entry in the string[].
    const subBlockMatch = body.slice(i).match(/^(attributes|methods|items|content)\s*:\s*\{/);
    if (subBlockMatch) {
      const blockKey = subBlockMatch[1];
      const open = i + subBlockMatch[0].length - 1;
      const close = findMatchingBrace(body, open);
      const blockContent = body.slice(open + 1, close);
      const lines = blockContent
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);
      subBlocksList[blockKey] = lines;
      i = close + 1;
      continue;
    }

    const propMatch = body.slice(i).match(/^(\w+)\s*:/);
    if (!propMatch) {
      i++;
      continue;
    }

    const key = propMatch[1];
    const valueStart = i + propMatch[0].length;
    const valueIndex = skipWhitespace(body, valueStart);

    const value = readPropertyValue(body, valueIndex);
    if (value !== null) {
      properties[key] = value.value;
      i = value.end;
      continue;
    }

    const slotMatch = body.slice(i).match(/^(\w+)\s*:\s*(\w+)/);
    if (slotMatch) {
      const slotId = slotMatch[1];
      const name = slotMatch[2];
      const afterName = skipWhitespace(body, i + slotMatch[0].length);

      if (body[afterName] === '{') {
        if (!isComponentType(name)) {
          throw new Error(
            `Unknown component type "${name}" for "${slotId}". Expected one of: Rectangle, Process, Ellipse, VerticalContainer.`
          );
        }
        const bodyStart = afterName;
        const close = findMatchingBrace(body, bodyStart);
        const childBody = body.slice(bodyStart + 1, close);
        const childNode = parseNode(slotId, name, childBody);
        if (pendingTags) {
          childNode.tags = pendingTags;
          pendingTags = undefined;
        }
        childEntries.push({
          kind: 'inline',
          node: childNode
        });
        i = close + 1;
        continue;
      }

      if (isComponentType(name)) {
        throw new Error(`Component type "${name}" requires a definition block for "${slotId}".`);
      }

      const refEntry: ParsedChildEntry = { kind: 'reference', slotId, refId: name };
      if (pendingTags) {
        refEntry.tags = pendingTags;
        pendingTags = undefined;
      }
      childEntries.push(refEntry);
      i = afterName;
      continue;
    }

    i++;
  }

  const node: ParsedNode = { id, type, properties, themeOverride, childEntries };
  if (Object.keys(subBlocksList).length > 0) {
    node.subBlocks = subBlocksList;
  }
  return node;
}

/** Collect ids of top-level components referenced inside containers. */
export function collectReferencedIds(nodes: ParsedNode[]): Set<string> {
  const refs = new Set<string>();

  const walk = (node: ParsedNode): void => {
    node.childEntries.forEach(entry => {
      if (entry.kind === 'reference') {
        refs.add(entry.refId);
      } else {
        walk(entry.node);
      }
    });
  };

  nodes.forEach(walk);
  return refs;
}

function parseKeyValueBlock(body: string): Record<string, string> {
  const result: Record<string, string> = {};
  const pairs = body.matchAll(/(\w+)\s*:\s*"([^"]*)"/g);
  for (const match of pairs) {
    result[match[1]] = unescapeString(match[2]);
  }
  return result;
}

/**
 * Try to parse a top-level @directive line such as:
 *   @tags: ["database", "auth"]
 * Returns the directive name, its string array values, and the position after the line.
 */
function tryParseDirective(
  text: string,
  start: number
): { name: string; values: string[]; end: number } | null {
  if (text[start] !== '@') return null;

  const slice = text.slice(start);
  // Match @word: ["str", "str", ...]  — the array content is captured.
  const m = slice.match(/^@([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*\[([^\]]*)\]/);
  if (!m) return null;

  const name = m[1];
  const inner = m[2];
  const values: string[] = [];
  // Extract all double-quoted strings from the array literal.
  const strPattern = /"([^"]*)"/g;
  let sm: RegExpExecArray | null;
  while ((sm = strPattern.exec(inner)) !== null) {
    values.push(sm[1]);
  }

  return { name, values, end: start + m[0].length };
}

function readComponentDeclaration(
  text: string,
  start: number
): { id: string; type: string; bodyStart: number } | null {
  const match = text.slice(start).match(/^(\w+)\s*:\s*(\w+)\s*\{/);
  if (!match) return null;

  return {
    id: match[1],
    type: match[2],
    bodyStart: start + match[0].length - 1
  };
}

function readPropertyValue(
  text: string,
  start: number
): { value: string | number | boolean; end: number } | null {
  const i = skipWhitespace(text, start);

  if (text[i] === '"') {
    let j = i + 1;
    while (j < text.length) {
      if (text[j] === '\\') {
        j += 2;
        continue;
      }
      if (text[j] === '"') {
        return { value: unescapeString(text.slice(i + 1, j)), end: j + 1 };
      }
      j++;
    }
    return null;
  }

  const boolMatch = text.slice(i).match(/^(true|false)\b/);
  if (boolMatch) {
    return { value: boolMatch[0] === 'true', end: i + boolMatch[0].length };
  }

  const numMatch = text.slice(i).match(/^-?\d+(\.\d+)?/);
  if (numMatch) {
    return { value: parseFloat(numMatch[0]), end: i + numMatch[0].length };
  }

  return null;
}

function stripComments(code: string): string {
  let result = '';
  let i = 0;
  while (i < code.length) {
    if (code[i] === '/' && code[i + 1] === '/') {
      i += 2;
      while (i < code.length && code[i] !== '\n') i++;
      continue;
    }
    if (code[i] === '/' && code[i + 1] === '*') {
      i += 2;
      while (i < code.length - 1 && !(code[i] === '*' && code[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (code[i] === '"') {
      const start = i;
      i++;
      while (i < code.length) {
        if (code[i] === '\\') {
          i += 2;
          continue;
        }
        if (code[i] === '"') {
          i++;
          break;
        }
        i++;
      }
      result += code.slice(start, i);
      continue;
    }
    result += code[i];
    i++;
  }
  return result;
}

function skipWhitespace(text: string, index: number): number {
  while (index < text.length && /\s/.test(text[index])) index++;
  return index;
}

function findMatchingBrace(text: string, openIndex: number): number {
  let depth = 0;
  let i = openIndex;

  while (i < text.length) {
    if (text[i] === '"') {
      i++;
      while (i < text.length) {
        if (text[i] === '\\') {
          i += 2;
          continue;
        }
        if (text[i] === '"') {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
    i++;
  }

  throw new Error('Unclosed block in DSL');
}
