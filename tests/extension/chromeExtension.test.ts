// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { scanAndProcessDocument } from '../../chrome-extension/src/content';

describe('Chrome Extension Content Script', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('detects pre code.language-drako and renders embedded interactive player', () => {
    document.body.innerHTML = `
      <div class="markdown-body">
        <p>Here is a diagram:</p>
        <pre><code class="language-drako">
User: Actor { label: "User" }
Server: Rectangle { label: "API Gateway" }
User -> Server : "Request"
        </code></pre>
      </div>
    `;

    scanAndProcessDocument();

    const wrapper = document.querySelector('.drakoflow-embed-wrapper');
    expect(wrapper).not.toBeNull();

    const header = wrapper?.querySelector('.drakoflow-embed-header');
    expect(header).not.toBeNull();
    expect(header?.textContent).toContain('DrakoFlow');

    const iframe = wrapper?.querySelector('iframe.drakoflow-embed-iframe') as HTMLIFrameElement;
    expect(iframe).not.toBeNull();
    expect(iframe.srcdoc).toContain('DrakoFlow Interactive Player');
    expect(iframe.srcdoc).toContain('User');
    expect(iframe.srcdoc).toContain('API Gateway');

    const codePanel = wrapper?.querySelector('.drakoflow-embed-code');
    expect(codePanel).not.toBeNull();
    expect(codePanel?.textContent).toContain('User -> Server');
  });

  it('detects pre code with ```drako in text content', () => {
    document.body.innerHTML = `
      <pre><code>\`\`\`drako
MyChart: Chart {
  title: "Sales"
  x: [jan, feb]
  y: 0 -> 100
  MyBar: Bar { values: [50, 80] }
}
\`\`\`</code></pre>
    `;

    scanAndProcessDocument();

    const wrapper = document.querySelector('.drakoflow-embed-wrapper');
    expect(wrapper).not.toBeNull();

    const iframe = wrapper?.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe.srcdoc).toContain('MyChart');
    expect(iframe.srcdoc).toContain('Sales');
  });

  it('does not re-process already transformed code blocks', () => {
    document.body.innerHTML = `
      <pre><code class="language-drako">
A: Rectangle { label: "A" }
      </code></pre>
    `;

    scanAndProcessDocument();
    const count1 = document.querySelectorAll('.drakoflow-embed-wrapper').length;
    expect(count1).toBe(1);

    // Second scan
    scanAndProcessDocument();
    const count2 = document.querySelectorAll('.drakoflow-embed-wrapper').length;
    expect(count2).toBe(1);
  });

  it('handles invalid DSL without crashing', () => {
    document.body.innerHTML = `
      <pre><code class="language-drako">
Invalid syntax {{{{
      </code></pre>
    `;

    expect(() => scanAndProcessDocument()).not.toThrow();
  });
});
