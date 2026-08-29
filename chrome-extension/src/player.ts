import { parseDslDocument, DslDocument } from '../../src/dsl/parser';
import { createComponentsFromDsl } from '../../src/engine/componentFactory';
import { EngineRegistry } from '../../src/engine/EngineRegistry';
import { ThemeVariables, BaseComponent } from '../../src/components/BaseComponent';
import { ParsedRelationship } from '../../src/engine/Relationship';
import './player.css';

const defaultTheme: ThemeVariables = {
  primaryColor: '#60a5fa',
  secondaryColor: '#a1a1aa',
  backgroundColor: '#18181b',
  textColor: '#f4f4f5',
  borderColor: '#52525b',
  fontFamily: 'Outfit, system-ui, -apple-system, sans-serif'
};

let currentDsl = '';
let currentDoc: DslDocument | null = null;
let currentComponents: BaseComponent[] = [];
let currentRelationships: ParsedRelationship[] = [];
let currentBBox: { x: number; y: number; width: number; height: number } | null = null;

// Pan & Zoom State
let zoomLevel = 1.0;
const panOffset = { x: 0, y: 0 };
let isPanning = false;
const startPan = { x: 0, y: 0 };

// Minimap State
let isMinimapVisible = true;
const MINIMAP_WIDTH = 160;
const MINIMAP_HEIGHT = 110;
let currentMinimapScale = 1.0;
let currentMinimapDx = 0;
let currentMinimapDy = 0;

// Tag Filtering State
let activeTags: string[] = [];

// DOM Elements
const canvasContainer = document.getElementById('canvas-container') as HTMLDivElement;
const diagramSvg = document.getElementById('diagram-svg') as unknown as SVGSVGElement;
const viewportG = document.getElementById('viewport-g') as unknown as SVGGElement;
const minimapContainer = document.getElementById('minimap-container') as HTMLDivElement;
const minimapSvg = document.getElementById('minimap-svg') as unknown as SVGSVGElement;
const minimapContentG = document.getElementById('minimap-content-g') as unknown as SVGGElement;
const minimapViewportRect = document.getElementById('minimap-viewport-rect') as unknown as SVGRectElement;
const tagFilterBar = document.getElementById('tag-filter-bar') as HTMLDivElement;
const tagPillsContainer = document.getElementById('tag-pills') as HTMLDivElement;
const btnClearTags = document.getElementById('btn-clear-tags') as HTMLButtonElement;
const codeModalOverlay = document.getElementById('code-modal-overlay') as HTMLDivElement;
const codeModalBody = document.getElementById('code-modal-body') as HTMLPreElement;

function applyTransformations() {
  if (!viewportG) return;
  viewportG.setAttribute('transform', `translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`);
  updateMinimapViewportRect();
}

function updateMinimapContent() {
  if (!minimapContentG || !viewportG || !minimapContainer) return;
  minimapContentG.innerHTML = '';

  const oldTransform = viewportG.getAttribute('transform');
  viewportG.removeAttribute('transform');
  let bbox = currentBBox;
  try {
    const rawBBox = (viewportG as any).getBBox();
    if (rawBBox && rawBBox.width > 0) {
      bbox = rawBBox;
    }
  } catch (e) {
    // fallback to currentBBox
  }
  if (oldTransform) {
    viewportG.setAttribute('transform', oldTransform);
  }

  if (!bbox || bbox.width === 0 || bbox.height === 0) {
    minimapContainer.classList.add('collapsed');
    return;
  }

  if (isMinimapVisible) {
    minimapContainer.classList.remove('collapsed');
  } else {
    minimapContainer.classList.add('collapsed');
    return;
  }

  Array.from(viewportG.children).forEach((child) => {
    if ((child as HTMLElement).style.display !== 'none') {
      const clone = child.cloneNode(true);
      minimapContentG.appendChild(clone);
    }
  });

  const padding = 6;
  const availableW = MINIMAP_WIDTH - padding * 2;
  const availableH = MINIMAP_HEIGHT - padding * 2;
  const scaleX = availableW / bbox.width;
  const scaleY = availableH / bbox.height;
  currentMinimapScale = Math.min(scaleX, scaleY);

  const diagramMinimapW = bbox.width * currentMinimapScale;
  const diagramMinimapH = bbox.height * currentMinimapScale;

  currentMinimapDx = padding + (availableW - diagramMinimapW) / 2 - bbox.x * currentMinimapScale;
  currentMinimapDy = padding + (availableH - diagramMinimapH) / 2 - bbox.y * currentMinimapScale;

  minimapContentG.setAttribute(
    'transform',
    `translate(${currentMinimapDx}, ${currentMinimapDy}) scale(${currentMinimapScale})`
  );
  updateMinimapViewportRect();
}

function updateMinimapViewportRect() {
  if (!isMinimapVisible || !minimapViewportRect || !canvasContainer) return;

  const containerWidth = canvasContainer.clientWidth || 800;
  const containerHeight = canvasContainer.clientHeight || 500;

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

export function fitToScreen() {
  if (!viewportG || !canvasContainer) return;

  const oldTransform = viewportG.getAttribute('transform');
  viewportG.removeAttribute('transform');

  let bbox = currentBBox;
  try {
    const rawBBox = (viewportG as any).getBBox();
    if (rawBBox && rawBBox.width > 0 && rawBBox.height > 0) {
      bbox = rawBBox;
    }
  } catch (e) {}

  if (oldTransform) {
    viewportG.setAttribute('transform', oldTransform);
  }

  if (!bbox || bbox.width === 0 || bbox.height === 0) return;

  const containerW = canvasContainer.clientWidth || window.innerWidth || 800;
  const containerH = canvasContainer.clientHeight || window.innerHeight || 500;
  const padding = 35;

  const availableW = Math.max(50, containerW - padding * 2);
  const availableH = Math.max(50, containerH - padding * 2);

  const scaleX = availableW / bbox.width;
  const scaleY = availableH / bbox.height;
  zoomLevel = Math.min(1.4, Math.max(0.15, Math.min(scaleX, scaleY)));

  panOffset.x = (containerW - bbox.width * zoomLevel) / 2 - bbox.x * zoomLevel;
  panOffset.y = (containerH - bbox.height * zoomLevel) / 2 - bbox.y * zoomLevel;

  applyTransformations();
  setTimeout(updateMinimapContent, 80);
}

function renderTagFilters(tags: string[]) {
  if (!tagFilterBar || !tagPillsContainer) return;
  if (tags.length === 0) {
    tagFilterBar.style.display = 'none';
    return;
  }

  tagFilterBar.style.display = 'flex';
  tagPillsContainer.innerHTML = '';

  tags.forEach(tag => {
    const pill = document.createElement('span');
    pill.className = `tag-pill ${activeTags.includes(tag) ? 'active' : ''}`;
    pill.textContent = tag;
    pill.addEventListener('click', () => {
      if (activeTags.includes(tag)) {
        activeTags = activeTags.filter(t => t !== tag);
      } else {
        activeTags.push(tag);
      }
      pill.classList.toggle('active', activeTags.includes(tag));
      applyTagFiltering();
    });
    tagPillsContainer.appendChild(pill);
  });
}

function applyTagFiltering() {
  if (activeTags.length === 0) {
    document.querySelectorAll('.diagram-component').forEach(el => ((el as HTMLElement).style.display = ''));
    document.querySelectorAll('[data-source-id][data-target-id]').forEach(el => ((el as HTMLElement).style.display = ''));
    document.querySelectorAll('[data-lifeline-for]').forEach(el => ((el as HTMLElement).style.display = ''));
    updateMinimapContent();
    return;
  }

  const visibleIds = new Set<string>();
  currentComponents.forEach(comp => {
    if (comp.tags && comp.tags.some(t => activeTags.includes(t))) {
      visibleIds.add(comp.id);
    }
  });

  // Include 1-hop neighbors
  const directlyTagged = new Set(visibleIds);
  currentRelationships.forEach(rel => {
    if (directlyTagged.has(rel.sourceId) || directlyTagged.has(rel.targetId)) {
      visibleIds.add(rel.sourceId);
      visibleIds.add(rel.targetId);
    }
  });

  // Apply visibility to SVG
  currentComponents.forEach(comp => {
    const el = document.getElementById(comp.id) || document.querySelector(`[data-id="${comp.id}"]`);
    if (el) {
      (el as HTMLElement).style.display = visibleIds.has(comp.id) ? '' : 'none';
    }
  });

  document.querySelectorAll('[data-source-id][data-target-id]').forEach(el => {
    const src = el.getAttribute('data-source-id');
    const tgt = el.getAttribute('data-target-id');
    const ext = ['left', 'right', 'top', 'bottom'];
    const srcVis = (src && ext.includes(src.toLowerCase())) || (src && visibleIds.has(src));
    const tgtVis = (tgt && ext.includes(tgt.toLowerCase())) || (tgt && visibleIds.has(tgt));
    (el as HTMLElement).style.display = srcVis && tgtVis ? '' : 'none';
  });

  document.querySelectorAll('[data-lifeline-for]').forEach(el => {
    const target = el.getAttribute('data-lifeline-for');
    (el as HTMLElement).style.display = target && visibleIds.has(target) ? '' : 'none';
  });

  updateMinimapContent();
}

export function renderDiagram(dsl: string) {
  currentDsl = dsl.trim();
  if (!currentDsl) return;

  try {
    currentDoc = parseDslDocument(currentDsl);
    currentComponents = createComponentsFromDsl(currentDoc.components);
    currentRelationships = currentDoc.relationships;

    viewportG.innerHTML = '';

    const engine = EngineRegistry.getInstance().getEngine(currentDoc, currentDoc.layout);
    const result = engine.render({
      document: currentDoc,
      displayComponents: currentDoc.components,
      displayRelationships: currentDoc.relationships,
      theme: defaultTheme,
      themeName: 'drako-dark',
      isDiagramLocked: true,
      viewportG,
      rawCode: currentDsl,
      svgElement: diagramSvg
    });

    currentBBox = result.bbox;

    // Collect all tags for tag filter bar
    const allTags = Array.from(new Set(
      currentComponents.flatMap(c => c.tags || [])
    )).filter(Boolean);

    renderTagFilters(allTags);
    fitToScreen();
    setTimeout(updateMinimapContent, 150);
  } catch (err: any) {
    console.error('[DrakoFlow Player] Failed to render diagram:', err);
    viewportG.innerHTML = `
      <text x="50" y="50" fill="#ef4444" font-size="14" font-family="sans-serif">
        Diagram render error: ${err.message || err}
      </text>
    `;
  }
}

// Canvas Drag & Pan
canvasContainer.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  isPanning = true;
  startPan.x = e.clientX - panOffset.x;
  startPan.y = e.clientY - panOffset.y;
  canvasContainer.classList.add('panning');
});

window.addEventListener('mousemove', (e) => {
  if (!isPanning) return;
  panOffset.x = e.clientX - startPan.x;
  panOffset.y = e.clientY - startPan.y;
  applyTransformations();
});

window.addEventListener('mouseup', () => {
  if (isPanning) {
    isPanning = false;
    canvasContainer.classList.remove('panning');
  }
});

// Canvas Wheel Zoom
canvasContainer.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = canvasContainer.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const prevZoom = zoomLevel;
  const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
  zoomLevel = Math.min(4.0, Math.max(0.15, zoomLevel * zoomFactor));

  // Anchor zoom to cursor
  panOffset.x = mouseX - (mouseX - panOffset.x) * (zoomLevel / prevZoom);
  panOffset.y = mouseY - (mouseY - panOffset.y) * (zoomLevel / prevZoom);

  applyTransformations();
}, { passive: false });

// Toolbar Actions
document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
  const rect = canvasContainer.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const prevZoom = zoomLevel;
  zoomLevel = Math.min(4.0, zoomLevel * 1.25);
  panOffset.x = cx - (cx - panOffset.x) * (zoomLevel / prevZoom);
  panOffset.y = cy - (cy - panOffset.y) * (zoomLevel / prevZoom);
  applyTransformations();
});

document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
  const rect = canvasContainer.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const prevZoom = zoomLevel;
  zoomLevel = Math.max(0.15, zoomLevel * 0.8);
  panOffset.x = cx - (cx - panOffset.x) * (zoomLevel / prevZoom);
  panOffset.y = cy - (cy - panOffset.y) * (zoomLevel / prevZoom);
  applyTransformations();
});

document.getElementById('btn-reset-zoom')?.addEventListener('click', () => {
  zoomLevel = 1.0;
  const rect = canvasContainer.getBoundingClientRect();
  panOffset.x = (rect.width - (currentBBox?.width || 600)) / 2;
  panOffset.y = (rect.height - (currentBBox?.height || 400)) / 2;
  applyTransformations();
});

document.getElementById('btn-fit-screen')?.addEventListener('click', fitToScreen);

document.getElementById('btn-toggle-minimap')?.addEventListener('click', () => {
  isMinimapVisible = !isMinimapVisible;
  updateMinimapContent();
});

document.getElementById('btn-view-code')?.addEventListener('click', () => {
  if (codeModalOverlay && codeModalBody) {
    codeModalBody.textContent = currentDsl;
    codeModalOverlay.classList.add('open');
  }
});

document.getElementById('btn-close-code-modal')?.addEventListener('click', () => {
  codeModalOverlay?.classList.remove('open');
});

codeModalOverlay?.addEventListener('click', (e) => {
  if (e.target === codeModalOverlay) {
    codeModalOverlay.classList.remove('open');
  }
});

document.getElementById('btn-copy-code-modal')?.addEventListener('click', () => {
  if (!currentDsl) return;
  navigator.clipboard.writeText(currentDsl).then(() => {
    const btn = document.getElementById('btn-copy-code-modal');
    const text = document.getElementById('copy-code-modal-text');
    if (btn && text) {
      btn.classList.add('copied');
      text.textContent = 'Copied!';
      setTimeout(() => {
        btn.classList.remove('copied');
        text.textContent = 'Copy';
      }, 2000);
    }
  });
});

btnClearTags?.addEventListener('click', () => {
  activeTags = [];
  document.querySelectorAll('.tag-pill').forEach(p => p.classList.remove('active'));
  applyTagFiltering();
});

// Minimap Interactive Click & Pan
let isPanningMinimap = false;
function panToMinimap(clientX: number, clientY: number) {
  if (!minimapSvg || !canvasContainer) return;
  const rect = minimapSvg.getBoundingClientRect();
  const mx = clientX - rect.left;
  const my = clientY - rect.top;
  const containerW = canvasContainer.clientWidth || 800;
  const containerH = canvasContainer.clientHeight || 500;
  const rawX = (mx - currentMinimapDx) / currentMinimapScale;
  const rawY = (my - currentMinimapDy) / currentMinimapScale;
  panOffset.x = containerW / 2 - rawX * zoomLevel;
  panOffset.y = containerH / 2 - rawY * zoomLevel;
  applyTransformations();
}

minimapSvg?.addEventListener('mousedown', (e) => {
  e.stopPropagation();
  e.preventDefault();
  isPanningMinimap = true;
  panToMinimap(e.clientX, e.clientY);
});

window.addEventListener('mousemove', (e) => {
  if (isPanningMinimap) {
    panToMinimap(e.clientX, e.clientY);
  }
});

window.addEventListener('mouseup', () => {
  if (isPanningMinimap) {
    isPanningMinimap = false;
  }
});

window.addEventListener('resize', () => {
  fitToScreen();
});

if (typeof ResizeObserver !== 'undefined' && canvasContainer) {
  const ro = new ResizeObserver(() => {
    fitToScreen();
  });
  ro.observe(canvasContainer);
}

// Listen for DSL from URL Hash or PostMessage
function loadFromHash() {
  const hash = window.location.hash.substring(1);
  if (hash) {
    const params = new URLSearchParams(hash);
    const codeParam = params.get('code');
    if (codeParam) {
      renderDiagram(codeParam);
      requestAnimationFrame(() => {
        fitToScreen();
        setTimeout(fitToScreen, 80);
      });
      return;
    }
    // Direct raw code in hash
    try {
      const decoded = decodeURIComponent(hash);
      if (decoded.length > 5) {
        renderDiagram(decoded);
        requestAnimationFrame(() => {
          fitToScreen();
          setTimeout(fitToScreen, 80);
        });
      }
    } catch (e) {}
  }
}

window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'RENDER_DRAKO' && event.data.dsl) {
    renderDiagram(event.data.dsl);
    requestAnimationFrame(() => {
      fitToScreen();
      setTimeout(fitToScreen, 80);
    });
  }
});

window.addEventListener('DOMContentLoaded', () => {
  loadFromHash();
});
