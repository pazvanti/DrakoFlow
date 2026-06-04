import { BaseComponent, ThemeVariables } from '../components/BaseComponent';
import { ParsedRelationship } from '../engine/Relationship';
import { MarkdownParser } from './MarkdownParser';
import { MarkdownRenderer } from './MarkdownRenderer';
import { highlightDSL } from './highlighter';

export interface HTMLPlayerExportOptions {
  includeDocs: boolean;
  includeMinimap: boolean;
  components: BaseComponent[];
  relationships: ParsedRelationship[];
  themeName: string;
}

function isDarkColor(hexColor: string): boolean {
  const hex = hexColor.replace('#', '');
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq < 128;
  }
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq < 128;
  }
  return true;
}

function findImmediateParent(targetId: string, rootComponents: BaseComponent[]): string | null {
  const search = (comp: BaseComponent): string | null => {
    if ('children' in comp && Array.isArray((comp as any).children)) {
      for (const child of (comp as any).children) {
        if (child.id === targetId) {
          return comp.id;
        }
        const parentId = search(child);
        if (parentId) return parentId;
      }
    }
    return null;
  };
  for (const root of rootComponents) {
    const parentId = search(root);
    if (parentId) return parentId;
  }
  return null;
}

export function exportToHTML(
  svgMarkup: string,
  theme: ThemeVariables,
  dslCode: string,
  options: HTMLPlayerExportOptions
): string {
  const isThemeDark = isDarkColor(theme.backgroundColor);

  // Pre-render component documentation to HTML if requested
  const docsMap: Record<string, string> = {};
  if (options.includeDocs) {
    const parser = new MarkdownParser();
    const renderer = new MarkdownRenderer();
    options.components.forEach(comp => {
      if (comp.doc) {
        const ast = parser.parse(comp.doc);
        docsMap[comp.id] = renderer.render(ast);
      }
    });
  }

  // Pre-highlight the DSL code
  const highlightedCode = highlightDSL(dslCode).html;

  // Build component list metadata
  const componentsMetadata = options.components.map(comp => ({
    id: comp.id,
    tags: comp.tags || [],
    parentId: findImmediateParent(comp.id, options.components)
  }));

  // Build relationships metadata
  const relationshipsMetadata = options.relationships.map(rel => ({
    sourceId: rel.sourceId,
    targetId: rel.targetId
  }));

  // Get all unique tags
  const allTags = Array.from(new Set(options.components.flatMap(c => c.tags || []))).sort();

  return `<!DOCTYPE html>
<html lang="en" data-bs-theme="${isThemeDark ? 'dark' : 'light'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DrakoFlow Interactive Player</title>
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- Bootstrap 5 CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <!-- Bootstrap Icons -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  
  <style>
    :root {
      --diagram-bg: ${theme.backgroundColor};
      --diagram-dot-color: ${isThemeDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
      --app-bg-dark: ${theme.backgroundColor};
      --app-border-color: ${isThemeDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'};
      --app-text-main: ${theme.textColor};
      --app-text-muted: ${isThemeDark ? '#a1a1aa' : '#52525b'};
      --app-accent-color: #0d6efd;
      --app-accent-glow: rgba(13, 110, 253, 0.25);
    }
    
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      height: 100vh;
      width: 100vw;
      font-family: 'Outfit', sans-serif;
      background-color: var(--diagram-bg);
      color: var(--app-text-main);
    }
    
    .diagram-canvas-container {
      width: 100%;
      height: 100%;
      overflow: hidden;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--diagram-bg);
      background-image: radial-gradient(var(--diagram-dot-color) 1.2px, transparent 1.2px);
      background-size: 20px 20px;
      cursor: grab;
      user-select: none;
    }
    
    .diagram-canvas-container:active {
      cursor: grabbing;
    }
    
    .diagram-svg {
      width: 100%;
      height: 100%;
      display: block;
      transform-origin: center;
      overflow: visible;
    }
    
    .top-left-controls {
      position: absolute;
      top: 1.5rem;
      left: 1.5rem;
      z-index: 100;
    }
    
    #btn-toggle-code {
      background-color: rgba(24, 24, 27, 0.85);
      backdrop-filter: blur(8px);
      border-color: var(--app-border-color) !important;
      color: var(--app-text-main);
      font-weight: 500;
      transition: all 0.2s;
    }
    
    #btn-toggle-code:hover {
      background-color: rgba(39, 39, 42, 0.9);
      border-color: var(--app-accent-color) !important;
      color: #60a5fa;
    }
    
    .canvas-controls {
      position: absolute;
      bottom: 1.5rem;
      right: 1.5rem;
      background-color: rgba(24, 24, 27, 0.85);
      border: 1px solid var(--app-border-color);
      backdrop-filter: blur(8px);
      border-radius: 8px;
      padding: 0.35rem;
      display: flex;
      gap: 0.25rem;
      z-index: 10;
    }
    
    .btn-control {
      background: transparent;
      border: none;
      color: var(--app-text-main);
      padding: 0.4rem 0.6rem;
      border-radius: 6px;
      transition: all 0.2s;
    }
    
    .btn-control:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: #60a5fa;
    }
    
    .minimap-container {
      position: absolute;
      bottom: 1.5rem;
      left: 1.5rem;
      width: 180px;
      height: 120px;
      background-color: rgba(24, 24, 27, 0.85);
      border: 1px solid var(--app-border-color);
      backdrop-filter: blur(8px);
      border-radius: 8px;
      z-index: 10;
      overflow: hidden;
      display: block;
      transition: opacity 0.2s, visibility 0.2s;
    }
    
    .minimap-container.collapsed {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }
    
    .minimap-svg {
      width: 100%;
      height: 100%;
      display: block;
      cursor: crosshair;
    }
    
    .minimap-viewport-rect {
      cursor: move;
    }
    
    /* Sliding Code Panel */
    .code-panel {
      position: absolute;
      top: 0;
      left: 0;
      width: 380px;
      max-width: 90vw;
      height: 100%;
      background-color: rgba(12, 12, 14, 0.95);
      border-right: 1px solid var(--app-border-color);
      backdrop-filter: blur(12px);
      z-index: 200;
      display: flex;
      flex-direction: column;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 5px 0 25px rgba(0, 0, 0, 0.5);
    }
    
    .code-panel.collapsed {
      transform: translateX(-100%);
    }
    
    .code-panel .panel-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--app-border-color);
      background-color: rgba(24, 24, 27, 0.5);
    }
    
    .code-panel .panel-body {
      flex: 1;
      overflow: auto;
      padding: 0;
    }
    
    .editor-highlight {
      margin: 0;
      padding: 1.5rem;
      font-family: 'Fira Code', monospace;
      font-size: 0.85rem;
      line-height: 1.5;
      white-space: pre;
      color: #e4e4e7;
      background: transparent;
    }
    
    /* Tag Filtering Bar */
    #diagram-tag-filter-bar {
      margin-top: 0.5rem;
    }
    
    .tag-pill {
      font-size: 0.7rem;
      padding: 0.25rem 0.6rem;
      border-radius: 12px;
      border: 1px solid var(--app-border-color);
      background-color: rgba(9, 9, 11, 0.4);
      color: var(--app-text-muted);
      cursor: pointer;
      transition: all 0.15s ease;
      font-weight: 500;
    }
    
    .tag-pill:hover {
      color: var(--app-text-main);
      border-color: #52525b;
    }
    
    .tag-pill.active {
      background-color: rgba(59, 130, 246, 0.15);
      border-color: #3b82f6;
      color: #60a5fa;
    }
    
    /* Syntax highlighting inside player */
    .hl-comment { color: #6a737d; font-style: italic; }
    .hl-string { color: #9ece6a; }
    .hl-keyword { color: #bb9af3; font-weight: 700; }
    .hl-id { color: #e0af68; }
    .hl-property { color: #7aa2f7; }
    .hl-number { color: #ff9e64; }
    .hl-boolean { color: #ff9e64; }
    .hl-operator { color: #89ddff; }
    .hl-color { color: #2ac3de; }
    .hl-decorator { color: #f7768e; font-style: italic; }
    .hl-accessor { color: #4ade80; font-weight: bold; }
    
    /* SVG Elements styles */
    .diagram-component {
      transition: filter 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .diagram-component:hover {
      filter: drop-shadow(0 0 8px rgba(96, 165, 250, 0.4));
    }
    
    .element-doc-badge {
      opacity: 0.7;
      transition: opacity 0.2s ease;
    }
    .element-doc-badge:hover {
      opacity: 1;
    }
    .element-doc-badge .doc-badge-bg {
      fill: #3b82f6;
      stroke: #ffffff;
      stroke-width: 1.2px;
      transition: fill 0.2s ease, r 0.2s ease;
    }
    .element-doc-badge:hover .doc-badge-bg {
      fill: #2563eb;
      r: 10px;
    }
    .element-doc-badge .doc-badge-icon {
      fill: none;
      stroke: #ffffff;
      stroke-width: 1.2px;
      stroke-linecap: round;
      stroke-linejoin: round;
      transition: transform 0.2s ease;
      transform-origin: 9px 9px;
    }
    .element-doc-badge:hover .doc-badge-icon {
      transform: scale(1.1);
    }
    
    .element-url-badge {
      opacity: 0.7;
      transition: opacity 0.2s ease;
    }
    .element-url-badge:hover {
      opacity: 1;
    }
    .element-url-badge .url-badge-bg {
      fill: #8b5cf6;
      stroke: #ffffff;
      stroke-width: 1.2px;
      transition: fill 0.2s ease, r 0.2s ease;
    }
    .element-url-badge:hover .url-badge-bg {
      fill: #7c3aed;
      r: 10px;
    }
    .element-url-badge .url-badge-icon {
      fill: none;
      stroke: #ffffff;
      stroke-width: 1.6px;
      stroke-linecap: round;
      stroke-linejoin: round;
      transition: transform 0.2s ease;
      transform-origin: 9px 9px;
    }
    .element-url-badge:hover .url-badge-icon {
      transform: scale(1.1);
    }
    
    /* Doc Modal custom styles */
    .doc-modal-body {
      padding: 1.75rem;
      max-height: 70vh;
      overflow-y: auto;
      font-family: 'Outfit', sans-serif;
      line-height: 1.6;
      color: #f4f4f5;
    }
    .doc-modal-body h1, .doc-modal-body h2, .doc-modal-body h3 {
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      font-weight: 600;
      color: #ffffff;
    }
    .doc-modal-body h1 {
      font-size: 1.75rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 0.5rem;
    }
    .doc-modal-body h2 { font-size: 1.4rem; }
    .doc-modal-body h3 { font-size: 1.2rem; }
    .doc-modal-body p { margin-bottom: 1rem; }
    .doc-modal-body ul, .doc-modal-body ol { margin-bottom: 1rem; padding-left: 1.5rem; }
    .doc-modal-body code {
      font-family: 'Fira Code', monospace;
      background-color: rgba(255, 255, 255, 0.08);
      padding: 0.1rem 0.3rem;
      border-radius: 4px;
      font-size: 0.9em;
    }
    .doc-modal-body pre {
      background-color: #0c0c0e;
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 1rem;
      border-radius: 6px;
      overflow-x: auto;
      margin-bottom: 1rem;
    }
    .doc-modal-body pre code {
      background-color: transparent;
      padding: 0;
      font-size: 0.85rem;
    }
  </style>
</head>
<body>

  <!-- Floating Navigation Panel -->
  <div class="top-left-controls d-flex flex-column gap-2">
    <button id="btn-toggle-code" class="btn btn-sm d-flex align-items-center gap-2 border shadow" title="View DSL Code">
      <i class="bi bi-code-square text-primary"></i> <span>View Code</span>
    </button>
    
    <!-- Tag Filter Bar -->
    <div id="diagram-tag-filter-bar" class="d-none align-items-center gap-2 p-2 border rounded bg-dark bg-opacity-75 shadow" style="font-size: 0.75rem;">
      <span class="text-muted text-uppercase fw-bold" style="font-size: 0.7rem; letter-spacing: 0.05em; user-select: none;">Filter:</span>
      <div id="diagram-tag-filters" class="d-flex flex-wrap gap-1"></div>
      <button id="btn-clear-diagram-filters" class="btn btn-link text-muted p-0 text-decoration-none ms-2" style="font-size: 0.7rem;">Clear</button>
    </div>
  </div>

  <!-- Zoom Controls Toolbar -->
  <div class="canvas-controls shadow">
    <button id="btn-zoom-in" class="btn-control" title="Zoom In">
      <i class="bi bi-zoom-in"></i>
    </button>
    <button id="btn-zoom-out" class="btn-control" title="Zoom Out">
      <i class="bi bi-zoom-out"></i>
    </button>
    <button id="btn-zoom-reset" class="btn-control" title="Reset Zoom">
      <i class="bi bi-arrow-counterclockwise"></i>
    </button>
    ${options.includeMinimap ? `
    <button id="btn-toggle-minimap" class="btn-control" title="Toggle Minimap">
      <i class="bi bi-map-fill text-primary"></i>
    </button>
    ` : ''}
  </div>

  <!-- Minimap -->
  ${options.includeMinimap ? `
  <div id="minimap-container" class="minimap-container shadow">
    <svg id="minimap-svg" class="minimap-svg" width="180" height="120">
      <g id="minimap-content-g"></g>
      <rect id="minimap-viewport-rect" class="minimap-viewport-rect" fill="rgba(96, 165, 250, 0.2)" stroke="#3b82f6" stroke-width="1.5"></rect>
    </svg>
  </div>
  ` : ''}

  <!-- View Code Sidebar Panel -->
  <div id="code-panel" class="code-panel collapsed">
    <div class="panel-header d-flex justify-content-between align-items-center">
      <h5 class="m-0 text-white"><i class="bi bi-code-square text-primary me-2"></i> DSL Code</h5>
      <div class="d-flex align-items-center gap-2">
        <button id="btn-copy-code" class="btn btn-outline-light btn-sm py-0.5 px-2" style="font-size: 0.75rem;" title="Copy Code">
          <i class="bi bi-copy"></i> Copy
        </button>
        <button id="btn-close-code" class="btn-close btn-close-white" aria-label="Close"></button>
      </div>
    </div>
    <div class="panel-body">
      <pre class="editor-highlight"><code>${highlightedCode}</code></pre>
    </div>
  </div>

  <!-- Interactive Graphic Canvas -->
  <div id="canvas-container" class="diagram-canvas-container">
    ${svgMarkup}
  </div>

  <!-- Element Documentation Modal -->
  ${options.includeDocs ? `
  <div class="modal fade" id="element-documentation-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content bg-dark border-secondary border-opacity-50 text-white shadow-lg">
        <div class="modal-header border-secondary border-opacity-25">
          <h5 class="modal-title" id="element-documentation-title">Documentation</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body p-0">
          <div id="element-documentation-content" class="doc-modal-body"></div>
        </div>
        <div class="modal-footer border-secondary border-opacity-25">
          <button type="button" class="btn btn-outline-secondary btn-sm" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>
  ` : ''}

  <!-- Bootstrap Bundle JS -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

  <!-- Interactive Player Script -->
  <script>
    (function() {
      // Data embedded from builder
      const components = ${JSON.stringify(componentsMetadata)};
      const relationships = ${JSON.stringify(relationshipsMetadata)};
      const allTags = ${JSON.stringify(allTags)};
      const docsData = ${JSON.stringify(docsMap)};
      
      const canvasContainer = document.getElementById('canvas-container');
      const diagramSvg = document.querySelector('.diagram-svg');
      const viewportG = document.getElementById('viewport-g');
      
      let zoomLevel = 1.0;
      let panOffset = { x: 0, y: 0 };
      let isPanning = false;
      let startPan = { x: 0, y: 0 };
      
      // Setup default SVG drag styling
      if (diagramSvg) {
        diagramSvg.setAttribute('width', '100%');
        diagramSvg.setAttribute('height', '100%');
      }

      function applyTransformations() {
        if (viewportG) {
          viewportG.setAttribute('transform', 'translate(' + panOffset.x + ', ' + panOffset.y + ') scale(' + zoomLevel + ')');
        }
        if (typeof updateMinimapViewportRect === 'function') {
          updateMinimapViewportRect();
        }
      }

      // Drag to Pan
      canvasContainer.addEventListener('mousedown', function(e) {
        if (e.button !== 0 && e.button !== 1) return;
        isPanning = true;
        canvasContainer.style.cursor = 'grabbing';
        startPan = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      });

      canvasContainer.addEventListener('mousemove', function(e) {
        if (!isPanning) return;
        panOffset = {
          x: e.clientX - startPan.x,
          y: e.clientY - startPan.y
        };
        applyTransformations();
      });

      window.addEventListener('mouseup', function() {
        if (isPanning) {
          isPanning = false;
          canvasContainer.style.cursor = 'grab';
        }
      });

      // Mouse Wheel Zoom
      canvasContainer.addEventListener('wheel', function(e) {
        e.preventDefault();
        const zoomFactor = 1.1;
        const rect = canvasContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const mouseXInG = (mouseX - panOffset.x) / zoomLevel;
        const mouseYInG = (mouseY - panOffset.y) / zoomLevel;

        if (e.deltaY < 0) {
          zoomLevel = Math.min(5.0, zoomLevel * zoomFactor);
        } else {
          zoomLevel = Math.max(0.2, zoomLevel / zoomFactor);
        }

        panOffset = {
          x: mouseX - mouseXInG * zoomLevel,
          y: mouseY - mouseYInG * zoomLevel
        };

        applyTransformations();
      }, { passive: false });

      // Zoom Controls Toolbar
      document.getElementById('btn-zoom-in').addEventListener('click', function() {
        zoomLevel = Math.min(5.0, zoomLevel * 1.2);
        applyTransformations();
      });

      document.getElementById('btn-zoom-out').addEventListener('click', function() {
        zoomLevel = Math.max(0.2, zoomLevel / 1.2);
        applyTransformations();
      });

      document.getElementById('btn-zoom-reset').addEventListener('click', function() {
        zoomLevel = 1.0;
        panOffset = { x: 0, y: 0 };
        applyTransformations();
      });

      window.addEventListener('load', function() {
        zoomLevel = 1.0;
        panOffset = { x: 0, y: 0 };
        applyTransformations();
        if (typeof updateMinimapContent === 'function') {
          updateMinimapContent();
        }
      });

      window.addEventListener('resize', function() {
        if (typeof updateMinimapContent === 'function') {
          updateMinimapContent();
        }
      });

      // view code sidebar panel toggle
      const btnToggleCode = document.getElementById('btn-toggle-code');
      const btnCloseCode = document.getElementById('btn-close-code');
      const codePanel = document.getElementById('code-panel');

      if (btnToggleCode && codePanel) {
        btnToggleCode.addEventListener('click', function() {
          codePanel.classList.toggle('collapsed');
          const isCollapsed = codePanel.classList.contains('collapsed');
          btnToggleCode.querySelector('span').textContent = isCollapsed ? 'View Code' : 'Hide Code';
        });
      }
      if (btnCloseCode && codePanel) {
        btnCloseCode.addEventListener('click', function() {
          codePanel.classList.add('collapsed');
          btnToggleCode.querySelector('span').textContent = 'View Code';
        });
      }

      const btnCopyCode = document.getElementById('btn-copy-code');
      if (btnCopyCode) {
        btnCopyCode.addEventListener('click', function() {
          const codeEl = codePanel.querySelector('pre code');
          if (codeEl) {
            navigator.clipboard.writeText(codeEl.textContent)
              .then(function() {
                const originalHtml = btnCopyCode.innerHTML;
                btnCopyCode.innerHTML = '<i class="bi bi-check-lg text-success"></i> Copied!';
                btnCopyCode.classList.remove('btn-outline-light');
                btnCopyCode.classList.add('btn-outline-success');
                setTimeout(function() {
                  btnCopyCode.innerHTML = originalHtml;
                  btnCopyCode.classList.remove('btn-outline-success');
                  btnCopyCode.classList.add('btn-outline-light');
                }, 2000);
              })
              .catch(function(err) {
                console.error('Failed to copy code:', err);
              });
          }
        });
      }

      // Documentation Modal
      ${options.includeDocs ? `
      const docModalEl = document.getElementById('element-documentation-modal');
      const docTitleEl = document.getElementById('element-documentation-title');
      const docContentEl = document.getElementById('element-documentation-content');
      const bootstrap = window.bootstrap;
      
      if (docModalEl && docTitleEl && docContentEl && bootstrap) {
        const modalInstance = bootstrap.Modal.getOrCreateInstance(docModalEl);
        
        document.querySelectorAll('.element-doc-badge').forEach(function(badge) {
          const parentG = badge.closest('.diagram-component');
          if (parentG) {
            const compId = parentG.getAttribute('data-id');
            const docHtml = docsData[compId];
            
            if (docHtml) {
              badge.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                docTitleEl.textContent = 'Documentation: ' + compId;
                docContentEl.innerHTML = docHtml;
                modalInstance.show();
              });
              badge.addEventListener('mousedown', function(e) {
                e.stopPropagation();
              });
            }
          }
        });
      }
      ` : ''}

      // URL Link Badges Click Handling
      document.querySelectorAll('.element-url-badge').forEach(function(badge) {
        const parentG = badge.closest('.diagram-component');
        if (parentG) {
          const url = parentG.getAttribute('data-url');
          if (url) {
            badge.addEventListener('click', function(e) {
              e.stopPropagation();
              e.preventDefault();
              window.open(url, '_blank');
            });
            badge.addEventListener('mousedown', function(e) {
              e.stopPropagation();
            });
          }
        }
      });

      // Tag Filtering
      let activeTags = [];
      
      function getDescendants(compId) {
        const list = [];
        components.forEach(function(c) {
          if (c.parentId === compId) {
            list.push(c.id);
            list.push.apply(list, getDescendants(c.id));
          }
        });
        return list;
      }

      function getParents(compId) {
        const list = [];
        const comp = components.find(function(c) { return c.id === compId; });
        if (comp && comp.parentId) {
          list.push(comp.parentId);
          list.push.apply(list, getParents(comp.parentId));
        }
        return list;
      }

      function updateTagFiltering() {
        if (activeTags.length === 0) {
          document.querySelectorAll('.diagram-component').forEach(function(el) { el.style.display = ''; });
          document.querySelectorAll('[data-source-id][data-target-id]').forEach(function(el) { el.style.display = ''; });
          document.querySelectorAll('[data-lifeline-for]').forEach(function(el) { el.style.display = ''; });
          if (typeof updateMinimapContent === 'function') updateMinimapContent();
          return;
        }
        
        const visibleIds = new Set();
        
        // Find directly tagged
        components.forEach(function(comp) {
          const hasActiveTag = comp.tags.some(function(t) { return activeTags.includes(t); });
          if (hasActiveTag) {
            visibleIds.add(comp.id);
          }
        });
        
        // Find one-hop neighbors
        const directlyTagged = new Set(visibleIds);
        relationships.forEach(function(rel) {
          if (directlyTagged.has(rel.sourceId) || directlyTagged.has(rel.targetId)) {
            visibleIds.add(rel.sourceId);
            visibleIds.add(rel.targetId);
          }
        });
        
        // Include descendants
        const initialVisible = Array.from(visibleIds);
        initialVisible.forEach(function(id) {
          getDescendants(id).forEach(function(dId) { visibleIds.add(dId); });
        });
        
        // Include parents
        const idsToCheck = Array.from(visibleIds);
        idsToCheck.forEach(function(id) {
          getParents(id).forEach(function(pId) { visibleIds.add(pId); });
        });
        
        // Apply visibility
        components.forEach(function(comp) {
          const el = document.getElementById(comp.id);
          if (el) {
            el.style.display = visibleIds.has(comp.id) ? '' : 'none';
          }
        });
        
        document.querySelectorAll('[data-source-id][data-target-id]').forEach(function(el) {
          const src = el.getAttribute('data-source-id');
          const tgt = el.getAttribute('data-target-id');
          el.style.display = (visibleIds.has(src) && visibleIds.has(tgt)) ? '' : 'none';
        });
        
        document.querySelectorAll('[data-lifeline-for]').forEach(function(el) {
          const target = el.getAttribute('data-lifeline-for');
          el.style.display = visibleIds.has(target) ? '' : 'none';
        });
        
        if (typeof updateMinimapContent === 'function') updateMinimapContent();
      }

      // Populate tag filters UI
      const filterBar = document.getElementById('diagram-tag-filter-bar');
      const filtersContainer = document.getElementById('diagram-tag-filters');
      const btnClearFilters = document.getElementById('btn-clear-diagram-filters');

      if (allTags.length > 0 && filterBar && filtersContainer) {
        filterBar.classList.remove('d-none');
        filterBar.classList.add('d-flex');
        
        function renderPills() {
          filtersContainer.innerHTML = '';
          allTags.forEach(function(tag) {
            const pill = document.createElement('span');
            const isActive = activeTags.includes(tag);
            pill.className = 'tag-pill ' + (isActive ? 'active' : '');
            pill.textContent = tag;
            pill.addEventListener('click', function() {
              if (activeTags.includes(tag)) {
                activeTags = activeTags.filter(function(t) { return t !== tag; });
              } else {
                activeTags.push(tag);
              }
              renderPills();
              updateTagFiltering();
            });
            filtersContainer.appendChild(pill);
          });
        }
        
        renderPills();
        
        if (btnClearFilters) {
          btnClearFilters.addEventListener('click', function() {
            activeTags = [];
            renderPills();
            updateTagFiltering();
          });
        }
      }

      // Minimap logic
      ${options.includeMinimap ? `
      let isMinimapVisible = true;
      const MINIMAP_WIDTH = 180;
      const MINIMAP_HEIGHT = 120;
      let currentMinimapScale = 1.0;
      let currentMinimapDx = 0;
      let currentMinimapDy = 0;
      
      const minimapContainer = document.getElementById('minimap-container');
      const minimapSvg = document.getElementById('minimap-svg');
      const minimapContentG = document.getElementById('minimap-content-g');
      const minimapViewportRect = document.getElementById('minimap-viewport-rect');
      const btnToggleMinimap = document.getElementById('btn-toggle-minimap');

      function updateMinimapContent() {
        if (!minimapContainer || !minimapContentG || !viewportG || !canvasContainer) return;
        minimapContentG.innerHTML = '';
        
        // Temporarily reset transform to get accurate bounding box
        const oldTransform = viewportG.getAttribute('transform');
        viewportG.removeAttribute('transform');
        const bbox = viewportG.getBBox();
        if (oldTransform) {
          viewportG.setAttribute('transform', oldTransform);
        }

        if (bbox.width === 0 || bbox.height === 0) {
          minimapContainer.classList.add('collapsed');
          return;
        }
        if (isMinimapVisible) {
          minimapContainer.classList.remove('collapsed');
        } else {
          minimapContainer.classList.add('collapsed');
          return;
        }
        
        Array.from(viewportG.children).forEach(function(child) {
          if (child.style.display !== 'none') {
            const clone = child.cloneNode(true);
            minimapContentG.appendChild(clone);
          }
        });
        
        const padding = 5;
        const availableW = MINIMAP_WIDTH - padding * 2;
        const availableH = MINIMAP_HEIGHT - padding * 2;
        const scaleX = availableW / bbox.width;
        const scaleY = availableH / bbox.height;
        currentMinimapScale = Math.min(scaleX, scaleY);
        
        const diagramMinimapW = bbox.width * currentMinimapScale;
        const diagramMinimapH = bbox.height * currentMinimapScale;
        
        currentMinimapDx = padding + (availableW - diagramMinimapW) / 2 - bbox.x * currentMinimapScale;
        currentMinimapDy = padding + (availableH - diagramMinimapH) / 2 - bbox.y * currentMinimapScale;
        
        minimapContentG.setAttribute('transform', 'translate(' + currentMinimapDx + ', ' + currentMinimapDy + ') scale(' + currentMinimapScale + ')');
        updateMinimapViewportRect();
      }

      function updateMinimapViewportRect() {
        if (!isMinimapVisible || !minimapViewportRect || !canvasContainer || !viewportG) return;
        
        const containerWidth = canvasContainer.clientWidth || 800;
        const containerHeight = canvasContainer.clientHeight || 600;
        
        const visibleLeft = (0 - panOffset.x) / zoomLevel;
        const visibleTop = (0 - panOffset.y) / zoomLevel;
        const visibleWidth = containerWidth / zoomLevel;
        const visibleHeight = containerHeight / zoomLevel;
        
        const rectX = currentMinimapDx + visibleLeft * currentMinimapScale;
        const rectY = currentMinimapDy + visibleTop * currentMinimapScale;
        const rectW = visibleWidth * currentMinimapScale;
        const rectH = visibleHeight * currentMinimapScale;
        
        minimapViewportRect.setAttribute('x', rectX.toString());
        minimapViewportRect.setAttribute('y', rectY.toString());
        minimapViewportRect.setAttribute('width', Math.max(2, rectW).toString());
        minimapViewportRect.setAttribute('height', Math.max(2, rectH).toString());
      }

      if (btnToggleMinimap) {
        btnToggleMinimap.addEventListener('click', function() {
          isMinimapVisible = !isMinimapVisible;
          const icon = btnToggleMinimap.querySelector('i');
          if (isMinimapVisible) {
            icon.className = 'bi bi-map-fill text-primary';
            btnToggleMinimap.title = 'Hide Minimap';
          } else {
            icon.className = 'bi bi-map text-muted';
            btnToggleMinimap.title = 'Show Minimap';
          }
          updateMinimapContent();
        });
      }

      let isPanningMinimap = false;
      function panToMinimapPoint(clientX, clientY) {
        if (!minimapSvg || !canvasContainer) return;
        const rect = minimapSvg.getBoundingClientRect();
        const mx = clientX - rect.left;
        const my = clientY - rect.top;
        const containerWidth = canvasContainer.clientWidth || 800;
        const containerHeight = canvasContainer.clientHeight || 600;
        const rawX = (mx - currentMinimapDx) / currentMinimapScale;
        const rawY = (my - currentMinimapDy) / currentMinimapScale;
        panOffset.x = containerWidth / 2 - rawX * zoomLevel;
        panOffset.y = containerHeight / 2 - rawY * zoomLevel;
        applyTransformations();
      }

      if (minimapSvg) {
        minimapSvg.addEventListener('mousedown', function(e) {
          e.stopPropagation();
          e.preventDefault();
          isPanningMinimap = true;
          panToMinimapPoint(e.clientX, e.clientY);
        });
      }

      window.addEventListener('mousemove', function(e) {
        if (isPanningMinimap) {
          panToMinimapPoint(e.clientX, e.clientY);
        }
      });

      window.addEventListener('mouseup', function() {
        if (isPanningMinimap) {
          isPanningMinimap = false;
        }
      });

      // Run initial minimap draw
      setTimeout(updateMinimapContent, 200);
      ` : ''}
    })();
  </script>
</body>
</html>
`;
}
