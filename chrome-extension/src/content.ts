import { parseDslDocument } from '../../src/dsl/parser';
import { createComponentsFromDsl } from '../../src/engine/componentFactory';
import { EngineRegistry } from '../../src/engine/EngineRegistry';
import { exportToHTML } from '../../src/utils/HTMLPlayerExporter';
import { ThemeVariables } from '../../src/components/BaseComponent';
import LZString from 'lz-string';
import './content.css';

const defaultTheme: ThemeVariables = {
  primaryColor: '#60a5fa',
  secondaryColor: '#a1a1aa',
  backgroundColor: '#18181b',
  textColor: '#f4f4f5',
  borderColor: '#52525b',
  fontFamily: 'Outfit, system-ui, sans-serif'
};

function extractDslCode(text: string): string {
  let cleaned = text.trim();
  // Remove markdown fences ```drako or ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z0-9_-]*\n?/, '');
    cleaned = cleaned.replace(/\n?```$/, '');
  }
  return cleaned.trim();
}

function getLayoutDisplayName(layout?: string): string {
  if (!layout) return 'Flowchart';
  const lower = layout.toLowerCase();
  if (lower.startsWith('git-flow') || lower.startsWith('git')) return 'Git Flow';
  if (lower.startsWith('mindmap')) return 'Mindmap';
  if (lower.startsWith('top-to-bottom')) return 'Top to Bottom';
  if (lower.startsWith('left-to-right')) return 'Sequence / Flow';
  return layout;
}

function renderDrakoDiagram(targetElement: HTMLElement, rawDsl: string): void {
  const dsl = extractDslCode(rawDsl);
  if (!dsl || dsl.length < 5) return;

  try {
    const doc = parseDslDocument(dsl);
    const components = createComponentsFromDsl(doc.components);

    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgElement.setAttribute('id', 'diagram-svg');
    svgElement.setAttribute('class', 'diagram-svg');
    const viewportG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    viewportG.setAttribute('id', 'viewport-g');
    svgElement.appendChild(viewportG);

    const engine = EngineRegistry.getInstance().getEngine(doc, doc.layout);
    const result = engine.render({
      document: doc,
      displayComponents: doc.components,
      displayRelationships: doc.relationships,
      theme: defaultTheme,
      themeName: 'drako-dark',
      isDiagramLocked: false,
      viewportG,
      rawCode: dsl,
      svgElement
    });

    const svgMarkup = svgElement.outerHTML;
    const htmlPlayer = exportToHTML(svgMarkup, defaultTheme, dsl, {
      includeDocs: true,
      includeMinimap: true,
      components,
      relationships: doc.relationships,
      themeName: 'drako-dark',
      bbox: result.bbox
    });

    // Create Embed Wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'drakoflow-embed-wrapper';

    // Header bar
    const header = document.createElement('div');
    header.className = 'drakoflow-embed-header';

    const brand = document.createElement('div');
    brand.className = 'drakoflow-embed-brand';
    brand.innerHTML = `
      <span class="drakoflow-embed-logo">⚡</span>
      <span>DrakoFlow</span>
      <span class="drakoflow-embed-badge">${getLayoutDisplayName(doc.layout)}</span>
    `;

    const actions = document.createElement('div');
    actions.className = 'drakoflow-embed-actions';

    // Toggle Code Button
    const btnToggleCode = document.createElement('button');
    btnToggleCode.className = 'drakoflow-btn';
    btnToggleCode.type = 'button';
    btnToggleCode.innerHTML = `<span>&lt;/&gt; Code</span>`;
    btnToggleCode.title = 'Toggle DSL Source Code';

    // Copy Code Button
    const btnCopy = document.createElement('button');
    btnCopy.className = 'drakoflow-btn';
    btnCopy.type = 'button';
    btnCopy.innerHTML = `<span>📋 Copy</span>`;
    btnCopy.title = 'Copy DSL to Clipboard';
    btnCopy.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(dsl).then(() => {
        btnCopy.innerHTML = `<span>✓ Copied!</span>`;
        setTimeout(() => {
          btnCopy.innerHTML = `<span>📋 Copy</span>`;
        }, 2000);
      });
    });

    // Fullscreen Player Button (Opens extension player.html in new tab)
    const btnFullscreen = document.createElement('button');
    btnFullscreen.className = 'drakoflow-btn';
    btnFullscreen.type = 'button';
    btnFullscreen.innerHTML = `<span>⛶ Fullscreen</span>`;
    btnFullscreen.title = 'Open Fullscreen Interactive Player';
    btnFullscreen.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
        const fullPlayerUrl = chrome.runtime.getURL('player.html') + '#code=' + encodeURIComponent(dsl);
        window.open(fullPlayerUrl, '_blank');
      } else {
        const blob = new Blob([htmlPlayer], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      }
    });

    // Open in Web App Button
    const btnOpenApp = document.createElement('a');
    btnOpenApp.className = 'drakoflow-btn drakoflow-btn-primary';
    btnOpenApp.target = '_blank';
    btnOpenApp.rel = 'noopener noreferrer';
    const compressedCode = LZString.compressToEncodedURIComponent(dsl);
    btnOpenApp.href = `https://pazvanti.github.io/DrakoFlow/drako/index.html?diagram=${compressedCode}`;
    btnOpenApp.innerHTML = `<span>Edit Online ↗</span>`;
    btnOpenApp.title = 'Open and edit in DrakoFlow Web Studio';

    actions.appendChild(btnToggleCode);
    actions.appendChild(btnCopy);
    actions.appendChild(btnFullscreen);
    actions.appendChild(btnOpenApp);

    header.appendChild(brand);
    header.appendChild(actions);
    wrapper.appendChild(header);

    // Interactive Iframe (Uses isolated extension origin to bypass host page CSP)
    const iframe = document.createElement('iframe');
    iframe.className = 'drakoflow-embed-iframe';
    
    if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
      const playerUrl = chrome.runtime.getURL('player.html');
      iframe.src = `${playerUrl}#code=${encodeURIComponent(dsl)}`;
      iframe.addEventListener('load', () => {
        try {
          iframe.contentWindow?.postMessage({ type: 'RENDER_DRAKO', dsl }, '*');
        } catch (postErr) {}
      });
    } else {
      iframe.setAttribute('sandbox', 'allow-scripts allow-popups allow-downloads allow-modals');
      iframe.srcdoc = htmlPlayer;
    }

    // Calculate height
    const calculatedHeight = Math.min(750, Math.max(450, (result.bbox?.height || 400) + 120));
    iframe.style.height = `${calculatedHeight}px`;
    wrapper.appendChild(iframe);

    // Collapsible Code Block
    const codePanel = document.createElement('div');
    codePanel.className = 'drakoflow-embed-code';
    const preCode = document.createElement('pre');
    preCode.dataset.drakoflowProcessed = 'true';
    preCode.textContent = dsl;
    codePanel.appendChild(preCode);
    wrapper.appendChild(codePanel);

    btnToggleCode.addEventListener('click', (e) => {
      e.stopPropagation();
      codePanel.classList.toggle('open');
      btnToggleCode.classList.toggle('active');
    });

    // Replace the outermost code block wrapper (e.g. GitHub's .snippet-clipboard-content or .highlight)
    const containerToReplace = findOutermostCodeContainer(targetElement);
    containerToReplace.dataset.drakoflowProcessed = 'true';
    targetElement.dataset.drakoflowProcessed = 'true';

    const parent = containerToReplace.parentElement;
    if (parent) {
      parent.insertBefore(wrapper, containerToReplace);
      containerToReplace.style.display = 'none';
    }
  } catch (err: any) {
    console.debug('[DrakoFlow Chrome Extension] Diagram render skipped:', err.message || err);
  }
}

function findOutermostCodeContainer(element: HTMLElement): HTMLElement {
  const githubSnippet = element.closest('.snippet-clipboard-content') as HTMLElement;
  if (githubSnippet) return githubSnippet;

  const highlightDiv = element.closest('.highlight') as HTMLElement;
  if (highlightDiv) return highlightDiv;

  const notionBlock = element.closest('.notion-code-block') as HTMLElement;
  if (notionBlock) return notionBlock;

  const pre = element.closest('pre') as HTMLElement;
  if (pre) return pre;

  return element;
}

function isInsideDrakoFlowApp(element: HTMLElement): boolean {
  return !!element.closest('.editor-container, .editor-pane, #editor, #highlighting, #highlighting-wrap, .diagram-panel, .library-panel, textarea, [contenteditable="true"]');
}

export function scanAndProcessDocument(): void {
  // Guard: Detect if we are in the DrakoFlow Studio editor itself
  const isDrakoApp = !!(document.getElementById('editor') && document.getElementById('diagram-svg'));

  // 1. Target standard markdown fenced blocks with language-drako (e.g. GitHub, GitLab, ChatGPT, Notion)
  const codeBlocks = Array.from(document.querySelectorAll<HTMLElement>(
    'pre code.language-drako, pre code.lang-drako, pre[lang="drako"], div[data-language="drako"]'
  ));

  codeBlocks.forEach(block => {
    if (block.closest('.drakoflow-embed-wrapper')) return;
    if (isDrakoApp || isInsideDrakoFlowApp(block)) return;
    const target = (block.closest('pre') || block) as HTMLElement;
    if (target.dataset.drakoflowProcessed) return;
    renderDrakoDiagram(target, block.textContent || '');
  });

  // 2. Target pre blocks whose content explicitly starts with ```drako
  const allPreBlocks = Array.from(document.querySelectorAll<HTMLElement>('pre:not([data-drakoflow-processed])'));
  allPreBlocks.forEach(pre => {
    if (pre.dataset.drakoflowProcessed || pre.closest('.drakoflow-embed-wrapper')) return;
    if (isDrakoApp || isInsideDrakoFlowApp(pre)) return;
    const text = pre.textContent?.trim() || '';
    if (text.startsWith('```drako') || text.startsWith('``` drako')) {
      pre.dataset.drakoflowProcessed = 'true';
      renderDrakoDiagram(pre, text);
    }
  });
}

// Initial Scan on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scanAndProcessDocument);
} else {
  scanAndProcessDocument();
}

// Silent MutationObserver for dynamic SPAs, GitHub comments, ChatGPT streams, etc.
let observerTimeout: any = null;
const observer = new MutationObserver(() => {
  if (observerTimeout) clearTimeout(observerTimeout);
  observerTimeout = setTimeout(() => {
    scanAndProcessDocument();
  }, 250);
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
