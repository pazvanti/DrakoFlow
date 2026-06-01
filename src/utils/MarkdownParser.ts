export interface MarkdownAST {
  type: 'document';
  children: MarkdownBlock[];
}

export type MarkdownBlock =
  | HeadingBlock
  | ParagraphBlock
  | CodeBlock
  | ListBlock
  | HorizontalRuleBlock;

export interface HeadingBlock {
  type: 'heading';
  level: number;
  children: InlineNode[];
}

export interface ParagraphBlock {
  type: 'paragraph';
  children: InlineNode[];
}

export interface CodeBlock {
  type: 'code_block';
  language?: string;
  code: string;
}

export interface ListBlock {
  type: 'list';
  ordered: boolean;
  items: ListItemBlock[];
}

export interface ListItemBlock {
  type: 'list_item';
  children: InlineNode[];
}

export interface HorizontalRuleBlock {
  type: 'horizontal_rule';
}

export type InlineNode =
  | TextInline
  | BoldInline
  | ItalicInline
  | CodeInline
  | LinkInline;

export interface TextInline {
  type: 'text';
  text: string;
}

export interface BoldInline {
  type: 'bold';
  children: InlineNode[];
}

export interface ItalicInline {
  type: 'italic';
  children: InlineNode[];
}

export interface CodeInline {
  type: 'code';
  text: string;
}

export interface LinkInline {
  type: 'link';
  text: string;
  url: string;
}

export class MarkdownParser {
  /**
   * Parse a string of markdown content into an AST.
   */
  public parse(markdown: string): MarkdownAST {
    const lines = markdown.split(/\r?\n/);
    const blocks: MarkdownBlock[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 1. Empty line
      if (line.trim() === '') {
        i++;
        continue;
      }

      // 2. Code block
      if (line.trim().startsWith('```')) {
        const langMatch = line.trim().match(/^```(\w+)?/);
        const language = langMatch ? langMatch[1] : undefined;
        let codeContent = '';
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeContent += lines[i] + '\n';
          i++;
        }
        if (i < lines.length) {
          i++; // skip closing ```
        }
        // remove trailing newline
        if (codeContent.endsWith('\n')) {
          codeContent = codeContent.slice(0, -1);
        }
        blocks.push({ type: 'code_block', language, code: codeContent });
        continue;
      }

      // 3. Horizontal Rule
      if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
        blocks.push({ type: 'horizontal_rule' });
        i++;
        continue;
      }

      // 4. Headings
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2].trim();
        blocks.push({
          type: 'heading',
          level,
          children: this.parseInline(text)
        });
        i++;
        continue;
      }

      // 5. Lists
      // Match unordered list items starting with `- `, `* `, `+ `
      // or ordered list items starting with `1. `, `2. ` etc.
      const listMatch = line.match(/^(\s*)(?:([-*+])|(\d+)\.)\s+(.+)$/);
      if (listMatch) {
        const isOrdered = listMatch[3] !== undefined;
        const items: ListItemBlock[] = [];
        
        // We will collect list items as long as they are part of the same list
        // and have matching list structure.
        while (i < lines.length) {
          const currentLine = lines[i];
          const itemMatch = currentLine.match(/^(\s*)(?:([-*+])|(\d+)\.)\s+(.+)$/);
          if (!itemMatch) {
            break;
          }
          const itemIsOrdered = itemMatch[3] !== undefined;
          if (itemIsOrdered !== isOrdered) {
            break;
          }
          
          const itemContent = itemMatch[4].trim();
          items.push({
            type: 'list_item',
            children: this.parseInline(itemContent)
          });
          i++;
        }
        
        blocks.push({
          type: 'list',
          ordered: isOrdered,
          items
        });
        continue;
      }

      // 6. Paragraph block (can span multiple lines)
      let paragraphText = line.trim();
      i++;
      while (i < lines.length) {
        const nextLine = lines[i];
        if (nextLine.trim() === '') break;
        // If the next line starts a code block, heading, list, or horizontal rule, stop paragraph
        if (nextLine.trim().startsWith('```')) break;
        if (/^(#{1,6})\s+(.+)$/.test(nextLine)) break;
        if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(nextLine.trim())) break;
        if (/^(\s*)(?:([-*+])|(\d+)\.)\s+(.+)$/.test(nextLine)) break;
        
        paragraphText += ' ' + nextLine.trim();
        i++;
      }
      
      blocks.push({
        type: 'paragraph',
        children: this.parseInline(paragraphText)
      });
    }

    return {
      type: 'document',
      children: blocks
    };
  }

  /**
   * Parse inline elements recursively.
   */
  public parseInline(text: string): InlineNode[] {
    if (!text) return [];

    const regexes = {
      boldStar: /^\*\*([\s\S]+?)\*\*/,
      boldUnderscore: /^__([\s\S]+?)__/,
      italicStar: /^\*([\s\S]+?)\*/,
      italicUnderscore: /^_([\s\S]+?)_/,
      code: /^`([\s\S]+?)`/,
      link: /^\[([\s\S]+?)\]\(([^)]*?\([^)]*?\)[^)]*?|[^)]+?)\)/
    };

    let index = 0;
    const nodes: InlineNode[] = [];

    while (index < text.length) {
      const slice = text.slice(index);

      // Check escape character backslash
      if (text[index] === '\\' && index + 1 < text.length) {
        const nextChar = text[index + 1];
        const lastNode = nodes[nodes.length - 1];
        if (lastNode && lastNode.type === 'text') {
          lastNode.text += nextChar;
        } else {
          nodes.push({ type: 'text', text: nextChar });
        }
        index += 2;
        continue;
      }

      // Check bold (star)
      let m = slice.match(regexes.boldStar);
      if (m) {
        nodes.push({ type: 'bold', children: this.parseInline(m[1]) });
        index += m[0].length;
        continue;
      }
      // Check bold (underscore)
      m = slice.match(regexes.boldUnderscore);
      if (m) {
        nodes.push({ type: 'bold', children: this.parseInline(m[1]) });
        index += m[0].length;
        continue;
      }
      // Check italic (star)
      m = slice.match(regexes.italicStar);
      if (m) {
        nodes.push({ type: 'italic', children: this.parseInline(m[1]) });
        index += m[0].length;
        continue;
      }
      // Check italic (underscore)
      m = slice.match(regexes.italicUnderscore);
      if (m) {
        nodes.push({ type: 'italic', children: this.parseInline(m[1]) });
        index += m[0].length;
        continue;
      }
      // Check code
      m = slice.match(regexes.code);
      if (m) {
        nodes.push({ type: 'code', text: m[1] });
        index += m[0].length;
        continue;
      }
      // Check link
      m = slice.match(regexes.link);
      if (m) {
        nodes.push({ type: 'link', text: m[1], url: m[2] });
        index += m[0].length;
        continue;
      }

      // If no pattern matched, consume 1 character as text
      const lastNode = nodes[nodes.length - 1];
      const char = text[index];
      if (lastNode && lastNode.type === 'text') {
        lastNode.text += char;
      } else {
        nodes.push({ type: 'text', text: char });
      }
      index++;
    }

    return nodes;
  }
}
