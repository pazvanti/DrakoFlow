import { describe, it, expect } from 'vitest';
import { MarkdownParser } from '../../src/utils/MarkdownParser';
import { MarkdownRenderer } from '../../src/utils/MarkdownRenderer';

describe('Markdown Engine', () => {
  const parser = new MarkdownParser();
  const renderer = new MarkdownRenderer();

  describe('MarkdownParser', () => {
    it('should parse basic headings', () => {
      const ast = parser.parse('# Heading 1\n## Heading 2\n###### Heading 6');
      expect(ast.children).toHaveLength(3);
      expect(ast.children[0]).toEqual({
        type: 'heading',
        level: 1,
        children: [{ type: 'text', text: 'Heading 1' }]
      });
      expect(ast.children[1]).toEqual({
        type: 'heading',
        level: 2,
        children: [{ type: 'text', text: 'Heading 2' }]
      });
      expect(ast.children[2]).toEqual({
        type: 'heading',
        level: 6,
        children: [{ type: 'text', text: 'Heading 6' }]
      });
    });

    it('should parse paragraphs', () => {
      const ast = parser.parse('Hello world.\n\nThis is a second paragraph.');
      expect(ast.children).toHaveLength(2);
      expect(ast.children[0]).toEqual({
        type: 'paragraph',
        children: [{ type: 'text', text: 'Hello world.' }]
      });
      expect(ast.children[1]).toEqual({
        type: 'paragraph',
        children: [{ type: 'text', text: 'This is a second paragraph.' }]
      });
    });

    it('should parse bold and italic inline styles', () => {
      const text = 'This is **bold** text and *italic* text.';
      const nodes = parser.parseInline(text);
      expect(nodes).toEqual([
        { type: 'text', text: 'This is ' },
        { type: 'bold', children: [{ type: 'text', text: 'bold' }] },
        { type: 'text', text: ' text and ' },
        { type: 'italic', children: [{ type: 'text', text: 'italic' }] },
        { type: 'text', text: ' text.' }
      ]);
    });

    it('should parse nested bold and italic styles', () => {
      const text = 'This is **bold and *italic* inside** bold.';
      const nodes = parser.parseInline(text);
      expect(nodes).toEqual([
        { type: 'text', text: 'This is ' },
        {
          type: 'bold',
          children: [
            { type: 'text', text: 'bold and ' },
            { type: 'italic', children: [{ type: 'text', text: 'italic' }] },
            { type: 'text', text: ' inside' }
          ]
        },
        { type: 'text', text: ' bold.' }
      ]);
    });

    it('should parse inline code and links', () => {
      const text = 'Check out `code` at [Google](https://google.com).';
      const nodes = parser.parseInline(text);
      expect(nodes).toEqual([
        { type: 'text', text: 'Check out ' },
        { type: 'code', text: 'code' },
        { type: 'text', text: ' at ' },
        { type: 'link', text: 'Google', url: 'https://google.com' },
        { type: 'text', text: '.' }
      ]);
    });

    it('should support escape sequences', () => {
      const text = 'Escaped \\*star\\* and \\\\ backslash.';
      const nodes = parser.parseInline(text);
      expect(nodes).toEqual([
        { type: 'text', text: 'Escaped *star* and \\ backslash.' }
      ]);
    });

    it('should parse code blocks', () => {
      const markdown = '```typescript\nconst a = 1;\nconsole.log(a);\n```';
      const ast = parser.parse(markdown);
      expect(ast.children).toHaveLength(1);
      expect(ast.children[0]).toEqual({
        type: 'code_block',
        language: 'typescript',
        code: 'const a = 1;\nconsole.log(a);'
      });
    });

    it('should parse horizontal rules', () => {
      const ast = parser.parse('---\n***\n___');
      expect(ast.children).toHaveLength(3);
      expect(ast.children[0].type).toBe('horizontal_rule');
      expect(ast.children[1].type).toBe('horizontal_rule');
      expect(ast.children[2].type).toBe('horizontal_rule');
    });

    it('should parse lists (ordered and unordered)', () => {
      const markdown = '- Item 1\n- Item 2\n\n1. First\n2. Second';
      const ast = parser.parse(markdown);
      expect(ast.children).toHaveLength(2);
      expect(ast.children[0]).toEqual({
        type: 'list',
        ordered: false,
        items: [
          { type: 'list_item', children: [{ type: 'text', text: 'Item 1' }] },
          { type: 'list_item', children: [{ type: 'text', text: 'Item 2' }] }
        ]
      });
      expect(ast.children[1]).toEqual({
        type: 'list',
        ordered: true,
        items: [
          { type: 'list_item', children: [{ type: 'text', text: 'First' }] },
          { type: 'list_item', children: [{ type: 'text', text: 'Second' }] }
        ]
      });
    });
  });

  describe('MarkdownRenderer', () => {
    it('should render HTML representation of markdown', () => {
      const markdown = '# Hello World\n\nThis is **bold** text.\n\n- Bullet 1\n- Bullet 2';
      const ast = parser.parse(markdown);
      const html = renderer.render(ast);
      expect(html).toBe(
        '<h1>Hello World</h1>\n' +
        '<p>This is <strong>bold</strong> text.</p>\n' +
        '<ul>\n' +
        '<li>Bullet 1</li>\n' +
        '<li>Bullet 2</li>\n' +
        '</ul>'
      );
    });

    it('should escape HTML symbols in text and attributes to prevent XSS', () => {
      const markdown = '<script>alert("xss")</script>\n\n[Attack](javascript:alert(1))';
      const ast = parser.parse(markdown);
      const html = renderer.render(ast);
      expect(html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(html).toContain('href="javascript:alert(1)"');
    });
  });
});
