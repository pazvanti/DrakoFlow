import { MarkdownAST, MarkdownBlock, InlineNode, ListItemBlock } from './MarkdownParser';

export class MarkdownRenderer {
  /**
   * Render the AST to an HTML string.
   */
  public render(ast: MarkdownAST): string {
    return ast.children.map(block => this.renderBlock(block)).join('\n');
  }

  protected renderBlock(block: MarkdownBlock): string {
    switch (block.type) {
      case 'heading':
        return `<h${block.level}>${this.renderInlineList(block.children)}</h${block.level}>`;
      case 'paragraph':
        return `<p>${this.renderInlineList(block.children)}</p>`;
      case 'code_block': {
        const langClass = block.language ? ` class="language-${block.language}"` : '';
        const escapedCode = this.escapeHtml(block.code);
        return `<pre><code${langClass}>${escapedCode}</code></pre>`;
      }
      case 'list': {
        const tag = block.ordered ? 'ol' : 'ul';
        const itemsHtml = block.items.map(item => this.renderListItem(item)).join('\n');
        return `<${tag}>\n${itemsHtml}\n</${tag}>`;
      }
      case 'horizontal_rule':
        return '<hr>';
      default:
        return '';
    }
  }

  protected renderListItem(item: ListItemBlock): string {
    return `<li>${this.renderInlineList(item.children)}</li>`;
  }

  protected renderInlineList(nodes: InlineNode[]): string {
    return nodes.map(node => this.renderInline(node)).join('');
  }

  protected renderInline(node: InlineNode): string {
    switch (node.type) {
      case 'text':
        return this.escapeHtml(node.text);
      case 'bold':
        return `<strong>${this.renderInlineList(node.children)}</strong>`;
      case 'italic':
        return `<em>${this.renderInlineList(node.children)}</em>`;
      case 'code':
        return `<code>${this.escapeHtml(node.text)}</code>`;
      case 'link':
        return `<a href="${this.escapeHtml(node.url)}" target="_blank" rel="noopener noreferrer">${this.escapeHtml(node.text)}</a>`;
      default:
        return '';
    }
  }

  protected escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
