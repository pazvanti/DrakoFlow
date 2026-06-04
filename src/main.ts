import { BaseComponent, ThemeVariables } from './components/BaseComponent';
import { downloadDSLFile, exportToPNG, ExportOptions } from './utils/FileHandlers';
import { exportToHTML } from './utils/HTMLPlayerExporter';
import { findSafeInsertIndex, updateDslComponentPosition, clearDslManualPositions, setDslLayoutDirective } from './utils/dslInsert';
import { CatalogService } from './catalog/ComponentCatalog';
import { parseDslDocument, ParsedNode, ParsedChildEntry } from './dsl/parser';
import { createComponentsFromDsl } from './engine/componentFactory';
import { layoutRootComponents } from './engine/layout';
import { renderRelationships } from './engine/relationshipRenderer';
import { highlightDSL } from './utils/highlighter';
import { ParsedRelationship } from './engine/Relationship';
import { MarkdownParser } from './utils/MarkdownParser';
import { MarkdownRenderer } from './utils/MarkdownRenderer';
import { PlantUmlTranslator } from './utils/PlantUmlTranslator';
import LZString from 'lz-string';

const DEFAULT_DSL = `// Welcome to DrakoFlow!
// Type below to build sequence/flow interactions.

Client: Process {
  label: "Client App"
  lifeline: true
  themeOverride: {
    borderColor: "primaryColor"
  }
}

Server: Process {
  label: "API Server"
  lifeline: true
  themeOverride: {
    borderColor: "primaryColor"
  }
}

Database: Rectangle {
  label: "Database"
  rx: 6
  ry: 6
  themeOverride: {
    borderColor: "secondaryColor"
  }
}

Client -> Server : "1. GET /users" {
  lineStyle: "solid"
  color: "primaryColor"
}

Server -> Database : "2. Query Users" {
  lineStyle: "dashed"
  color: "secondaryColor"
}

Database -> Server : "3. Return records" {
  lineStyle: "dashed"
  color: "secondaryColor"
}

Server -> Client : "4. 200 OK (JSON)" {
  lineStyle: "solid"
  color: "#34d399"
}

Client -> Client : "5. Render UI" {
  lineStyle: "solid"
  color: "#f59e0b"
}
`;

// Global Theme Defaults
const THEMES: Record<string, ThemeVariables> = {
  "drako-dark": {
    primaryColor: "#60a5fa", // Richer blue for better visibility
    secondaryColor: "#a1a1aa",
    backgroundColor: "#18181b",
    textColor: "#f4f4f5",
    borderColor: "#52525b", // brighter arrows/lines on dark bg
    fontFamily: "Outfit, system-ui, -apple-system, sans-serif"
  },
  "drako-light": {
    primaryColor: "#1d4ed8",
    secondaryColor: "#4b5563",
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    borderColor: "#9ca3af", // highly visible dark borders on light bg
    fontFamily: "Outfit, system-ui, -apple-system, sans-serif"
  },
  "obsidian-dark": {
    primaryColor: "#a855f7", // Vibrant Purple
    secondaryColor: "#e9d5ff", // Soft Purple/Pink
    backgroundColor: "#09090b", // Deep Obsidian Black
    textColor: "#f4f4f5", // Bright zinc/white text
    borderColor: "#3f3f46", // Zinc-700 / nice dark border
    fontFamily: "Outfit, system-ui, -apple-system, sans-serif"
  },
  "serene-light": {
    primaryColor: "#0891b2", // Cyan-600
    secondaryColor: "#475569", // Slate-600
    backgroundColor: "#f8fafc", // Slate-50 background
    textColor: "#0f172a", // Slate-900 text
    borderColor: "#cbd5e1", // Slate-300 borders
    fontFamily: "Outfit, system-ui, -apple-system, sans-serif"
  }
};

let currentTheme = THEMES["drako-dark"];

// Active themes registry containing builtins and custom saved themes
const activeThemes: Record<string, ThemeVariables> = { ...THEMES };

// Diagram tag filtering state
let activeDiagramTags: string[] = [];

// Snap to grid settings
const SNAP_ENABLED_KEY = 'drako-snap-enabled';
const SNAP_SIZE_KEY = 'drako-snap-size';
let isSnapToGridEnabled = localStorage.getItem(SNAP_ENABLED_KEY) === 'true';
let snapGridSize = parseInt(localStorage.getItem(SNAP_SIZE_KEY) || '20', 10);
if (isNaN(snapGridSize) || snapGridSize < 10 || snapGridSize > 50) {
  snapGridSize = 20;
}

// Active components and relationships in the current render pass (used for drag & drop)
let currentComponents: BaseComponent[] = [];
let currentDisplayRelationships: ParsedRelationship[] = [];

// Minimap State
const MINIMAP_VISIBLE_KEY = 'drako-minimap-visible';
let isMinimapVisible = localStorage.getItem(MINIMAP_VISIBLE_KEY) !== 'false';
const MINIMAP_WIDTH = 180;
const MINIMAP_HEIGHT = 120;
let currentMinimapScale = 1.0;
let currentMinimapDx = 0;
let currentMinimapDy = 0;

// Range of editor text to highlight when hovering over a component in the SVG
let activeHighlightRange: { start: number; end: number } | null = null;

// Diagram dragging lock state (locked by default to prevent accidental moves)
let isDiagramLocked = true;

function collectAllNodes(nodes: ParsedNode[], map = new Map<string, ParsedNode>()): Map<string, ParsedNode> {
  nodes.forEach(node => {
    map.set(node.id, node);
    node.childEntries.forEach(entry => {
      if (entry.kind === 'inline') {
        collectAllNodes([entry.node], map);
      }
    });
  });
  return map;
}

function collectAllTags(nodes: ParsedNode[]): Set<string> {
  const tags = new Set<string>();
  const walk = (nodesList: ParsedNode[]) => {
    nodesList.forEach(node => {
      node.tags?.forEach(t => tags.add(t));
      node.childEntries.forEach(entry => {
        if (entry.kind === 'inline') {
          walk([entry.node]);
        } else if (entry.kind === 'reference') {
          entry.tags?.forEach(t => tags.add(t));
        }
      });
    });
  };
  walk(nodes);
  return tags;
}

function resolveAllComponentTags(components: ParsedNode[]): Map<string, string[]> {
  const resolved = new Map<string, string[]>();
  const registry = new Map<string, ParsedNode>();
  components.forEach(node => registry.set(node.id, node));

  const referencedIds = new Set<string>();
  const findRefs = (node: ParsedNode) => {
    node.childEntries.forEach(entry => {
      if (entry.kind === 'reference') {
        referencedIds.add(entry.refId);
      } else if (entry.kind === 'inline') {
        findRefs(entry.node);
      }
    });
  };
  components.forEach(findRefs);

  const resolveNode = (node: ParsedNode) => {
    const nodeTags = node.tags || [];
    resolved.set(node.id, nodeTags);

    node.childEntries.forEach(entry => {
      if (entry.kind === 'inline') {
        resolveNode(entry.node);
      } else if (entry.kind === 'reference') {
        const definition = registry.get(entry.refId);
        const entryTags = entry.tags || [];
        const definitionTags = definition ? (definition.tags || []) : [];
        const mergedTags = Array.from(new Set([...entryTags, ...definitionTags]));
        resolved.set(entry.slotId, mergedTags);
      }
    });
  };

  components.forEach(node => {
    if (!referencedIds.has(node.id)) {
      resolveNode(node);
    }
  });

  return resolved;
}

function buildParentMap(nodes: ParsedNode[], parentId: string | null = null, map = new Map<string, string>()): Map<string, string> {
  nodes.forEach(node => {
    if (parentId) {
      map.set(node.id, parentId);
    }
    node.childEntries.forEach(entry => {
      if (entry.kind === 'inline') {
        buildParentMap([entry.node], node.id, map);
      } else if (entry.kind === 'reference') {
        map.set(entry.slotId, node.id);
      }
    });
  });
  return map;
}

function buildReferenceDefMap(nodes: ParsedNode[], map = new Map<string, string>()): Map<string, string> {
  nodes.forEach(node => {
    node.childEntries.forEach(entry => {
      if (entry.kind === 'inline') {
        buildReferenceDefMap([entry.node], map);
      } else if (entry.kind === 'reference') {
        map.set(entry.slotId, entry.refId);
      }
    });
  });
  return map;
}

function filterNodeTree(nodes: ParsedNode[], visibleIds: Set<string>): ParsedNode[] {
  const result: ParsedNode[] = [];
  nodes.forEach(node => {
    if (visibleIds.has(node.id)) {
      const cloned = { ...node };
      cloned.childEntries = node.childEntries.map(entry => {
        if (entry.kind === 'inline') {
          const filteredChildren = filterNodeTree([entry.node], visibleIds);
          if (filteredChildren.length > 0) {
            return { kind: 'inline', node: filteredChildren[0] };
          }
          return null;
        } else {
          // reference
          if (visibleIds.has(entry.slotId)) {
            return entry;
          }
          return null;
        }
      }).filter((entry): entry is ParsedChildEntry => entry !== null);
      result.push(cloned);
    }
  });
  return result;
}

function addDescendants(nodeId: string, visibleIds: Set<string>, flatNodesMap: Map<string, ParsedNode>, referenceDefMap?: Map<string, string>): void {
  const resolvedId = referenceDefMap?.get(nodeId) || nodeId;
  if (resolvedId !== nodeId) {
    visibleIds.add(resolvedId);
  }
  const node = flatNodesMap.get(resolvedId);
  if (!node) return;
  node.childEntries.forEach(entry => {
    if (entry.kind === 'inline') {
      if (!visibleIds.has(entry.node.id)) {
        visibleIds.add(entry.node.id);
        addDescendants(entry.node.id, visibleIds, flatNodesMap, referenceDefMap);
      }
    } else if (entry.kind === 'reference') {
      if (!visibleIds.has(entry.slotId)) {
        visibleIds.add(entry.slotId);
        visibleIds.add(entry.refId);
        addDescendants(entry.slotId, visibleIds, flatNodesMap, referenceDefMap);
      }
    }
  });
}

const CUSTOM_THEMES_KEY = 'drako-custom-themes';

function loadCustomThemes(): Record<string, ThemeVariables> {
  try {
    const raw = localStorage.getItem(CUSTOM_THEMES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to load custom themes from localStorage', e);
    return {};
  }
}

function saveCustomThemes(themes: Record<string, ThemeVariables>): void {
  try {
    localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes));
  } catch (e) {
    console.error('Failed to save custom themes to localStorage', e);
  }
}

function refreshActiveThemes(): void {
  Object.keys(activeThemes).forEach(key => {
    if (key !== 'drako-dark' && key !== 'drako-light' && key !== 'obsidian-dark' && key !== 'serene-light') {
      delete activeThemes[key];
    }
  });

  const custom = loadCustomThemes();
  Object.entries(custom).forEach(([key, val]) => {
    activeThemes[key] = val;
  });
}

function isDarkColor(hex: string): boolean {
  if (!hex || hex[0] !== '#') return true;
  const rgb = parseInt(hex.substring(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma < 128;
}

// DOM Elements
const editor = document.getElementById('editor') as HTMLTextAreaElement;
const gutter = document.getElementById('gutter') as HTMLElement;
const highlighting = document.getElementById('highlighting') as HTMLElement;
const editorColorPicker = document.getElementById('editor-color-picker') as HTMLInputElement;
const colorPickerPopup = document.getElementById('color-picker-popup') as HTMLElement;
const editorHexInput = document.getElementById('editor-hex-input') as HTMLInputElement;
const applyHexBtn = document.getElementById('btn-apply-hex') as HTMLButtonElement;
const statusText = document.getElementById('status-text') as HTMLElement;
const editorStats = document.getElementById('editor-stats') as HTMLElement;
const diagramSvg = document.getElementById('diagram-svg') as unknown as SVGSVGElement;
const viewportG = document.getElementById('viewport-g') as unknown as SVGGElement;
const canvasContainer = document.getElementById('canvas-container') as HTMLElement;
const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
const layoutSelect = document.getElementById('layout-select') as HTMLSelectElement;

const diagramTagFilterBar = document.getElementById('diagram-tag-filter-bar') as HTMLElement;
const diagramTagFilters = document.getElementById('diagram-tag-filters') as HTMLElement;
const btnClearDiagramFilters = document.getElementById('btn-clear-diagram-filters') as HTMLButtonElement;

// Theme Customizer Elements
const btnEditTheme = document.getElementById('btn-edit-theme') as HTMLButtonElement;
const themeLoadSelect = document.getElementById('theme-load-select') as HTMLSelectElement;
const btnDeleteSavedTheme = document.getElementById('btn-delete-saved-theme') as HTMLButtonElement;

const pickerPrimaryColor = document.getElementById('picker-primary-color') as HTMLInputElement;
const inputPrimaryColor = document.getElementById('input-primary-color') as HTMLInputElement;

const pickerSecondaryColor = document.getElementById('picker-secondary-color') as HTMLInputElement;
const inputSecondaryColor = document.getElementById('input-secondary-color') as HTMLInputElement;

const pickerBgColor = document.getElementById('picker-bg-color') as HTMLInputElement;
const inputBgColor = document.getElementById('input-bg-color') as HTMLInputElement;

const pickerTextColor = document.getElementById('picker-text-color') as HTMLInputElement;
const inputTextColor = document.getElementById('input-text-color') as HTMLInputElement;

const pickerBorderColor = document.getElementById('picker-border-color') as HTMLInputElement;
const inputBorderColor = document.getElementById('input-border-color') as HTMLInputElement;

const inputFontFamily = document.getElementById('input-font-family') as HTMLInputElement;
const inputThemeName = document.getElementById('input-theme-name') as HTMLInputElement;

const btnSaveCustomTheme = document.getElementById('btn-save-custom-theme') as HTMLButtonElement;
const btnApplyTheme = document.getElementById('btn-apply-theme') as HTMLButtonElement;
const btnResetTheme = document.getElementById('btn-reset-theme') as HTMLButtonElement;

// Control Buttons
const btnLoad = document.getElementById('btn-load') as HTMLButtonElement;
const btnImportPuml = document.getElementById('btn-import-puml') as HTMLButtonElement;
const btnSave = document.getElementById('btn-save') as HTMLButtonElement;
const btnExportPng = document.getElementById('btn-export-png') as HTMLButtonElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;

const btnZoomIn = document.getElementById('btn-zoom-in') as HTMLButtonElement;
const btnZoomOut = document.getElementById('btn-zoom-out') as HTMLButtonElement;
const btnZoomReset = document.getElementById('btn-zoom-reset') as HTMLButtonElement;
const btnZoomFit = document.getElementById('btn-zoom-fit') as HTMLButtonElement;
const btnToggleLock = document.getElementById('btn-toggle-lock') as HTMLButtonElement;
const btnToggleSnap = document.getElementById('btn-toggle-snap') as HTMLButtonElement;
const snapGridEnable = document.getElementById('snap-grid-enable') as HTMLInputElement;
const snapGridSizeInput = document.getElementById('snap-grid-size') as HTMLInputElement;
const snapGridSizeVal = document.getElementById('snap-grid-size-val') as HTMLElement;
const btnToggleMinimap = document.getElementById('btn-toggle-minimap') as HTMLButtonElement;
const minimapContainer = document.getElementById('minimap-container') as HTMLElement;
const minimapSvg = document.getElementById('minimap-svg') as unknown as SVGSVGElement;
const minimapContentG = document.getElementById('minimap-content-g') as unknown as SVGGElement;
const minimapViewportRect = document.getElementById('minimap-viewport-rect') as unknown as SVGRectElement;
// Export Modal Elements
const exportRangeWhole = document.getElementById('export-range-whole') as HTMLInputElement;
const exportRangeCurrent = document.getElementById('export-range-current') as HTMLInputElement;
const exportResPreset = document.getElementById('export-res-preset') as HTMLSelectElement;
const exportCustomWidth = document.getElementById('export-custom-width') as HTMLInputElement;
const exportSizePreview = document.getElementById('export-size-preview') as HTMLElement;
const exportPadding = document.getElementById('export-padding') as HTMLInputElement;
const exportPaddingVal = document.getElementById('export-padding-val') as HTMLElement;
const exportPaddingGroup = document.getElementById('export-padding-group') as HTMLElement;
const exportBgTheme = document.getElementById('export-bg-theme') as HTMLInputElement;
const btnDoExport = document.getElementById('btn-do-export') as HTMLButtonElement;

// Export HTML Modal Elements
const btnExportHtml = document.getElementById('btn-export-html') as HTMLButtonElement;
const exportHtmlThemeSelect = document.getElementById('export-html-theme-select') as HTMLSelectElement;
const exportHtmlIncludeDocs = document.getElementById('export-html-include-docs') as HTMLInputElement;
const exportHtmlIncludeMinimap = document.getElementById('export-html-include-minimap') as HTMLInputElement;
const btnDoExportHtml = document.getElementById('btn-do-export-html') as HTMLButtonElement;

// Sidebar & Catalog UI Elements
const btnToggleLibrary = document.getElementById('btn-toggle-library') as HTMLButtonElement;
const btnShowDocs = document.getElementById('btn-show-docs') as HTMLButtonElement;
const libraryPanel = document.getElementById('library-panel') as HTMLElement;
const librarySearch = document.getElementById('library-search') as HTMLInputElement;
const tagFilterContainer = document.getElementById('tag-filter-container') as HTMLElement;
const libraryContent = document.getElementById('library-content') as HTMLElement;

// Zoom and Pan States
let zoomLevel = 1.0;
let panOffset = { x: 0, y: 0 };
let isPanning = false;
let startPan = { x: 0, y: 0 };

// Catalog Library states
let activeTags: string[] = [];
const collapsedGroups: Record<string, boolean> = {};

// Filename and Editor Toggle states
const editorPanel = document.getElementById('editor-panel') as HTMLElement;
const editorFilename = document.getElementById('editor-filename') as HTMLElement;
const btnToggleEditor = document.getElementById('btn-toggle-editor') as HTMLButtonElement;
let currentFileName = "diagram.drako";

// Editor tabs elements & state
const tabsContainer = document.getElementById('tabs-container') as HTMLElement | null;
const btnAddTab = document.getElementById('btn-add-tab') as HTMLButtonElement | null;

// Share diagram elements
const btnShare = document.getElementById('btn-share') as HTMLButtonElement | null;
const shareUrlInput = document.getElementById('share-url-input') as HTMLInputElement | null;
const btnCopyShareUrl = document.getElementById('btn-copy-share-url') as HTMLButtonElement | null;
const shareCopyToast = document.getElementById('share-copy-toast') as HTMLElement | null;
const btnCopySvg = document.getElementById('btn-copy-svg') as HTMLButtonElement | null;

interface DiagramTab {
  id: string;
  name: string;
  content: string;
  isDirty: boolean;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  isDiagramLocked: boolean;
}

let tabs: DiagramTab[] = [];
let activeTabId = "";

/**
 * Create a new tab with optional content and name, then select it.
 */
function createNewTab(content: string = DEFAULT_DSL, name?: string): void {
  const tabId = `tab-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  let tabName = name;
  if (!tabName) {
    let count = 1;
    while (tabs.some(t => t.name === `diagram_${count}.drako`)) {
      count++;
    }
    tabName = `diagram_${count}.drako`;
  } else {
    let base = tabName;
    let ext = "";
    if (tabName.endsWith('.drako')) {
      base = tabName.substring(0, tabName.length - 6);
      ext = ".drako";
    }
    let count = 1;
    while (tabs.some(t => t.name === tabName)) {
      tabName = `${base} (${count})${ext}`;
      count++;
    }
  }

  const newTab: DiagramTab = {
    id: tabId,
    name: tabName,
    content,
    isDirty: false,
    zoomLevel: 1.0,
    panOffset: { x: 0, y: 0 },
    isDiagramLocked: true
  };

  tabs.push(newTab);
  switchTab(tabId);
}

/**
 * Switch active tab.
 */
function switchTab(tabId: string): void {
  const currentTab = tabs.find(t => t.id === activeTabId);
  if (currentTab) {
    currentTab.content = editor.value;
    currentTab.zoomLevel = zoomLevel;
    currentTab.panOffset = { ...panOffset };
    currentTab.isDiagramLocked = isDiagramLocked;
  }

  const nextTab = tabs.find(t => t.id === tabId);
  if (!nextTab) return;

  activeTabId = tabId;
  currentFileName = nextTab.name;
  
  if (editorFilename) {
    editorFilename.innerHTML = `${currentFileName} <i class="bi bi-pencil-square ms-1" style="font-size: 0.7rem; opacity: 0.6;"></i>`;
  }

  editor.value = nextTab.content;
  
  // Restore tab-specific zoom, pan and lock state
  zoomLevel = nextTab.zoomLevel;
  panOffset = { ...nextTab.panOffset };
  isDiagramLocked = nextTab.isDiagramLocked;
  
  updateLockStateUI();
  updateEditorMetrics();
  renderDiagram();
  applyTransformations();
  renderTabs();
}

let pendingCloseTabId: string | null = null;

/**
 * Force close a tab bypassing dirty check.
 */
function forceCloseTab(tabId: string): void {
  const tabIndex = tabs.findIndex(t => t.id === tabId);
  tabs = tabs.filter(t => t.id !== tabId);

  if (activeTabId === tabId) {
    if (tabs.length > 0) {
      const nextActiveIndex = Math.max(0, tabIndex - 1);
      switchTab(tabs[nextActiveIndex].id);
    } else {
      createNewTab();
    }
  } else {
    renderTabs();
  }
}

/**
 * Close a tab. Warn if there are unsaved changes.
 */
function closeTab(tabId: string, event?: Event): void {
  if (event) {
    event.stopPropagation();
  }

  const targetTab = tabs.find(t => t.id === tabId);
  if (!targetTab) return;

  if (targetTab.isDirty) {
    pendingCloseTabId = tabId;
    const msgEl = document.getElementById('unsaved-changes-message');
    if (msgEl) {
      msgEl.textContent = `Do you want to close "${targetTab.name}"? You have unsaved changes.`;
    }
    const modalEl = document.getElementById('unsaved-changes-modal');
    if (modalEl) {
      const bootstrap = (window as any).bootstrap;
      if (bootstrap) {
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
      }
    }
  } else {
    forceCloseTab(tabId);
  }
}

/**
 * Render the tabs bar in the UI.
 */
function renderTabs(): void {
  if (!tabsContainer) return;
  tabsContainer.innerHTML = '';

  tabs.forEach(tab => {
    const isActive = tab.id === activeTabId;
    
    const tabEl = document.createElement('div');
    tabEl.className = `editor-tab-item ${isActive ? 'active' : ''}`;
    tabEl.title = tab.name;
    tabEl.dataset.tabId = tab.id;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'tab-name';
    nameSpan.textContent = tab.name;
    tabEl.appendChild(nameSpan);

    if (tab.isDirty) {
      const dot = document.createElement('span');
      dot.className = 'tab-dirty-dot';
      tabEl.appendChild(dot);
    }

    const closeBtn = document.createElement('span');
    closeBtn.className = 'tab-close-btn';
    closeBtn.innerHTML = '<i class="bi bi-x"></i>';
    closeBtn.title = 'Close tab';
    closeBtn.addEventListener('click', (e) => {
      closeTab(tab.id, e);
    });
    tabEl.appendChild(closeBtn);

    tabEl.addEventListener('click', () => {
      switchTab(tab.id);
    });

    tabsContainer.appendChild(tabEl);
  });
}

/**
 * Render tag filters as clickable pills
 */
function renderTagFilters(): void {
  const tags = CatalogService.getAllTags();
  tagFilterContainer.innerHTML = '';

  tags.forEach(tag => {
    const pill = document.createElement('span');
    const isActive = activeTags.includes(tag);
    pill.className = `tag-pill ${isActive ? 'active' : ''}`;
    pill.textContent = tag;

    pill.addEventListener('click', () => {
      if (activeTags.includes(tag)) {
        activeTags = activeTags.filter(t => t !== tag);
      } else {
        activeTags.push(tag);
      }
      renderTagFilters();
      renderComponentLibrary();
    });
    tagFilterContainer.appendChild(pill);
  });
}

/**
 * Render the categorized component list grouped by tags
 */
function renderComponentLibrary(): void {
  const query = librarySearch.value;
  const filteredItems = CatalogService.filterItems(query, activeTags);
  libraryContent.innerHTML = '';

  if (filteredItems.length === 0) {
    libraryContent.innerHTML = '<div class="text-center text-muted p-4 small">No components match filters.</div>';
    return;
  }

  // Group elements by tag
  const groups: Record<string, typeof filteredItems> = {};
  filteredItems.forEach(item => {
    item.tags.forEach(tag => {
      if (activeTags.length > 0 && !activeTags.includes(tag)) return;
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push(item);
    });
  });

  Object.keys(groups).sort().forEach(tag => {
    const items = groups[tag];
    const groupDiv = document.createElement('div');
    groupDiv.className = 'tag-group';

    const isCollapsed = collapsedGroups[tag] === true;

    const header = document.createElement('div');
    header.className = `tag-group-header ${isCollapsed ? 'collapsed' : ''}`;
    header.innerHTML = `<span>${tag} (${items.length})</span><i class="bi bi-chevron-down"></i>`;

    const itemsContainer = document.createElement('div');
    itemsContainer.className = `tag-group-items ${isCollapsed ? 'collapsed' : ''}`;

    header.addEventListener('click', () => {
      collapsedGroups[tag] = !collapsedGroups[tag];
      header.classList.toggle('collapsed');
      itemsContainer.classList.toggle('collapsed');
    });

    items.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'library-item d-flex justify-content-between align-items-center';

      const contentDiv = document.createElement('div');
      contentDiv.className = 'library-item-content flex-grow-1';
      contentDiv.innerHTML = `
        <div class="library-item-title">${item.displayName}</div>
        <div class="library-item-desc">${item.description}</div>
      `;
      contentDiv.addEventListener('click', () => {
        insertBoilerplate(item.template);
      });
      itemDiv.appendChild(contentDiv);

      const helpBtn = document.createElement('button');
      helpBtn.className = 'btn-help-icon text-muted p-1 border-0 bg-transparent';
      helpBtn.title = `View documentation for ${item.displayName}`;
      helpBtn.innerHTML = '<i class="bi bi-question-circle"></i>';
      helpBtn.style.cursor = 'pointer';
      helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openDocumentationModal(item.type);
      });
      itemDiv.appendChild(helpBtn);

      itemsContainer.appendChild(itemDiv);
    });

    groupDiv.appendChild(header);
    groupDiv.appendChild(itemsContainer);
    libraryContent.appendChild(groupDiv);
  });
}

/**
 * Insert shape boilerplate outside any enclosing `{...}` block so existing DSL stays valid.
 */
function insertBoilerplate(template: string): void {
  const selectionStart = editor.selectionStart;
  const selectionEnd = editor.selectionEnd;
  const text = editor.value;

  const safeIndex = findSafeInsertIndex(text, selectionStart);
  const insertAtCursor = safeIndex === selectionStart;

  const insertAt = insertAtCursor ? selectionStart : safeIndex;
  const before = insertAtCursor
    ? text.substring(0, selectionStart)
    : text.substring(0, safeIndex);
  const after = insertAtCursor
    ? text.substring(selectionEnd)
    : text.substring(safeIndex);

  const needsLeadingBreak = insertAt > 0 && before.length > 0 && before[before.length - 1] !== '\n';
  const needsTrailingBreak = after.length > 0 && after[0] !== '\n';
  const prefix = needsLeadingBreak ? '\n\n' : '';
  const suffix = needsTrailingBreak ? '\n' : '';
  const insertText = prefix + template + suffix;

  editor.value = before + insertText + after;

  const newPos = insertAt + insertText.length;
  editor.selectionStart = editor.selectionEnd = newPos;
  editor.focus();

  updateEditorMetrics();
  renderDiagram();
}

let activeColorStartPos: number | null = null;
let lastColorTriggers: { startPos: number; color: string }[] = [];

const PRESET_COLORS = [
  '#60a5fa', '#3b82f6', '#1d4ed8', '#34d399', '#10b981',
  '#f87171', '#ef4444', '#b91c1c', '#f59e0b', '#fbbf24',
  '#bb9af3', '#ec4899', '#f43f5e', '#a1a1aa', '#71717a',
  '#18181b', '#27272a', '#3f3f46', '#ffffff', '#000000'
];

function showColorPickerPopup(anchorX: number, anchorY: number, currentColor: string): void {
  if (!colorPickerPopup) return;

  // Render grid cells
  const grid = colorPickerPopup.querySelector('.color-grid');
  if (grid) {
    grid.innerHTML = '';
    PRESET_COLORS.forEach(color => {
      const cell = document.createElement('div');
      cell.className = 'color-grid-cell';
      cell.style.backgroundColor = color;
      cell.title = color;
      if (color.toLowerCase() === currentColor.toLowerCase()) {
        cell.style.borderColor = '#ffffff';
        cell.style.boxShadow = '0 0 5px rgba(255, 255, 255, 0.7)';
      }

      cell.addEventListener('click', (e) => {
        e.stopPropagation();
        applyNewColor(color);
        hideColorPickerPopup();
      });

      grid.appendChild(cell);
    });
  }

  // Sync the inline swatch and hex field to the current color
  if (editorColorPicker) editorColorPicker.value = currentColor;
  if (editorHexInput) editorHexInput.value = currentColor;

  // Position popup: first show it to measure
  colorPickerPopup.style.top = '-9999px';
  colorPickerPopup.style.left = '-9999px';
  colorPickerPopup.style.display = 'block';
  const popupRect = colorPickerPopup.getBoundingClientRect();

  let top = anchorY + 10;
  if (top + popupRect.height > window.innerHeight) {
    top = anchorY - popupRect.height - 10;
  }

  let left = anchorX;
  if (left + popupRect.width > window.innerWidth) {
    left = window.innerWidth - popupRect.width - 12;
  }

  colorPickerPopup.style.top = `${top}px`;
  colorPickerPopup.style.left = `${left}px`;
}

function hideColorPickerPopup(): void {
  if (colorPickerPopup) {
    colorPickerPopup.style.display = 'none';
  }
}

function applyNewColor(newColor: string): void {
  if (activeColorStartPos !== null) {
    const oldText = editor.value;

    const before = oldText.substring(0, activeColorStartPos);
    const after = oldText.substring(activeColorStartPos + 7);

    editor.value = before + newColor + after;

    const currentCursor = activeColorStartPos + 7;
    editor.selectionStart = editor.selectionEnd = currentCursor;

    updateEditorMetrics();
    renderDiagram();
  }
}

// No-op stub — color triggers are now detected via the textarea click handler.
function attachColorPickerListeners(): void {}

// Detect clicks on the textarea that fall over a hex color token.
editor.addEventListener('click', (e: MouseEvent) => {
  const cursorPos = editor.selectionStart;
  const hit = lastColorTriggers.find(
    t => cursorPos >= t.startPos && cursorPos <= t.startPos + 7
  );
  if (hit) {
    activeColorStartPos = hit.startPos;
    showColorPickerPopup(e.clientX, e.clientY, hit.color);
    // Stop propagation so the window-level dismiss handler doesn't
    // immediately close the popup we just opened on this same click.
    e.stopPropagation();
  } else {
    // Clicked on editor but not on a color token — close the popup.
    hideColorPickerPopup();
  }
});

// Inline color swatch inside the popup — browser opens native picker anchored here.
editorColorPicker.addEventListener('input', (e) => {
  e.stopPropagation();
  const newColor = editorColorPicker.value;
  if (editorHexInput) editorHexInput.value = newColor;
  applyNewColor(newColor);
});
// Prevent color-swatch clicks from bubbling up to the window dismiss handler.
editorColorPicker.addEventListener('click', (e) => e.stopPropagation());

// Hex text input — apply on Enter key.
editorHexInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    e.stopPropagation();
    const val = editorHexInput.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      editorColorPicker.value = val;
      applyNewColor(val);
      hideColorPickerPopup();
    }
  }
});
editorHexInput.addEventListener('click', (e) => e.stopPropagation());

// Apply hex button.
applyHexBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const val = editorHexInput.value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(val)) {
    editorColorPicker.value = val;
    applyNewColor(val);
    hideColorPickerPopup();
  }
});

// Close color picker popup when clicking outside (any click not inside the popup).
window.addEventListener('click', (e) => {
  if (colorPickerPopup && colorPickerPopup.style.display === 'block') {
    if (!colorPickerPopup.contains(e.target as Node)) {
      hideColorPickerPopup();
    }
  }
});

/**
 * Update Editor line numbers gutter and statistics
 */
function updateEditorMetrics(): void {
  const code = editor.value;
  const lines = code.split('\n');
  const linesCount = lines.length;
  const charsCount = code.length;

  // Update Gutter
  let gutterHtml = '';
  for (let i = 1; i <= linesCount; i++) {
    gutterHtml += `${i}<br>`;
  }
  gutter.innerHTML = gutterHtml;

  // Update Stats
  editorStats.textContent = `Lines: ${linesCount} | Chars: ${charsCount}`;

  // Update syntax highlighting
  if (highlighting) {
    const highlightResult = highlightDSL(code, activeHighlightRange || undefined);
    lastColorTriggers = highlightResult.colorTriggers;
    const codeElem = highlighting.querySelector('code');
    if (codeElem) {
      let html = highlightResult.html;
      if (code.endsWith('\n')) {
        html += '\n';
      }
      codeElem.innerHTML = html;
      attachColorPickerListeners();
    }
  }
}

/**
 * Sync the scroll of the textarea with the gutter
 */
function syncEditorScroll(): void {
  gutter.scrollTop = editor.scrollTop;
  if (highlighting) {
    highlighting.scrollTop = editor.scrollTop;
    highlighting.scrollLeft = editor.scrollLeft;
  }
}

/**
 * Apply current zoom and pan transformations to the SVG group viewport
 */
function applyTransformations(): void {
  viewportG.setAttribute('transform', `translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`);
  updateMinimapViewportRect();
}

/**
 * Center and fit diagram viewport bounds to screen dimensions
 */
function fitToScreen(): void {
  // Temporarily reset transformation to calculate accurate bounding box
  viewportG.setAttribute('transform', 'none');
  const bbox = viewportG.getBBox();

  if (bbox.width === 0 || bbox.height === 0) {
    zoomLevel = 1.0;
    panOffset = { x: 0, y: 0 };
    applyTransformations();
    return;
  }

  const containerWidth = canvasContainer.clientWidth || 800;
  const containerHeight = canvasContainer.clientHeight || 600;

  const padding = 60;
  const scaleX = (containerWidth - padding) / bbox.width;
  const scaleY = (containerHeight - padding) / bbox.height;

  // Apply a reasonable scale threshold limit [0.2x, 3.0x]
  zoomLevel = Math.max(0.2, Math.min(scaleX, scaleY, 2.0));

  // Centering calculations
  const centerX = bbox.x + bbox.width / 2;
  const centerY = bbox.y + bbox.height / 2;

  panOffset = {
    x: containerWidth / 2 - centerX * zoomLevel,
    y: containerHeight / 2 - centerY * zoomLevel
  };

  applyTransformations();
}

/**
 * Parse DSL, layout components, and render to the SVG viewport.
 */
function renderDiagram(): void {
  // Sync editor content with active tab and mark as dirty if changed
  const activeTab = tabs.find(t => t.id === activeTabId);
  if (activeTab && activeTab.content !== editor.value) {
    activeTab.content = editor.value;
    activeTab.isDirty = true;
    renderTabs();
  }

  const code = editor.value;

  if (canvasContainer) {
    const glowColor = currentTheme.primaryColor.startsWith('#') ? currentTheme.primaryColor + '66' : currentTheme.primaryColor;
    canvasContainer.style.setProperty('--diagram-hover-glow', glowColor);
  }

  try {
    const dslDocument = parseDslDocument(code);
    if (dslDocument.components.length === 0) {
      throw new Error('No components found in DSL');
    }

    const parsedLayout = dslDocument.layout === 'top-to-bottom' ? 'top-to-bottom' : 'left-to-right';
    if (layoutSelect) {
      layoutSelect.value = parsedLayout;
    }

    // 1. Tag Filtering Bar Management
    const allTags = collectAllTags(dslDocument.components);

    if (allTags.size === 0) {
      if (diagramTagFilterBar) {
        diagramTagFilterBar.classList.remove('d-flex');
        diagramTagFilterBar.classList.add('d-none');
      }
      activeDiagramTags = [];
    } else {
      if (diagramTagFilterBar) {
        diagramTagFilterBar.classList.remove('d-none');
        diagramTagFilterBar.classList.add('d-flex');
      }

      if (diagramTagFilters) {
        diagramTagFilters.innerHTML = '';
        allTags.forEach(tag => {
          const pill = document.createElement('span');
          const isActive = activeDiagramTags.includes(tag);
          pill.className = `tag-pill ${isActive ? 'active' : ''}`;
          pill.textContent = tag;
          pill.addEventListener('click', () => {
            if (activeDiagramTags.includes(tag)) {
              activeDiagramTags = activeDiagramTags.filter(t => t !== tag);
            } else {
              activeDiagramTags.push(tag);
            }
            renderDiagram(); // Filter and refresh layout
          });
          diagramTagFilters.appendChild(pill);
        });
      }
    }

    if (btnClearDiagramFilters) {
      btnClearDiagramFilters.onclick = () => {
        if (activeDiagramTags.length > 0) {
          activeDiagramTags = [];
          renderDiagram();
        }
      };
    }

    // 2. Perform Tag Filtering on the AST if filters are active
    let displayComponents = dslDocument.components;
    let displayRelationships = dslDocument.relationships;

    if (activeDiagramTags.length > 0) {
      const visibleIds = new Set<string>();
      const flatNodesMap = collectAllNodes(dslDocument.components);
      const resolvedTagsMap = resolveAllComponentTags(dslDocument.components);

      // Step A: Find directly tagged components
      const directlyTagged = new Set<string>();
      resolvedTagsMap.forEach((tags, id) => {
        if (tags.some(tag => activeDiagramTags.includes(tag))) {
          directlyTagged.add(id);
          visibleIds.add(id);
        }
      });

      // Step B: Find directly connected components (one-hop neighbors)
      dslDocument.relationships.forEach(rel => {
        const sourceIsTagged = directlyTagged.has(rel.sourceId);
        const targetIsTagged = directlyTagged.has(rel.targetId);
        if (sourceIsTagged || targetIsTagged) {
          visibleIds.add(rel.sourceId);
          visibleIds.add(rel.targetId);
        }
      });

      // Step B.5: Include all descendants of visible components (to show nested components of containers)
      const referenceDefMap = buildReferenceDefMap(dslDocument.components);
      const initialVisible = Array.from(visibleIds);
      initialVisible.forEach(id => {
        addDescendants(id, visibleIds, flatNodesMap, referenceDefMap);
      });

      // Step C: Include all parent containers recursively
      const parentMap = buildParentMap(dslDocument.components);
      const idsToCheck = Array.from(visibleIds);
      idsToCheck.forEach(id => {
        let parent = parentMap.get(id);
        while (parent) {
          visibleIds.add(parent);
          parent = parentMap.get(parent);
        }
      });

      // Step D: Filter components AST
      displayComponents = filterNodeTree(dslDocument.components, visibleIds);

      // Step E: Filter relationships AST
      displayRelationships = dslDocument.relationships.filter(rel => {
        return visibleIds.has(rel.sourceId) && visibleIds.has(rel.targetId);
      });
    }

    const components = createComponentsFromDsl(displayComponents);
    layoutRootComponents(components, currentTheme, displayRelationships, parsedLayout);

    viewportG.innerHTML = '';

    components.forEach((component: BaseComponent) => {
      const g = component.render(currentTheme);
      g.classList.add('diagram-component');
      g.style.cursor = 'grab';
      g.setAttribute('data-id', component.id);
      if (component.tags && component.tags.length > 0) {
        g.setAttribute('data-tags', component.tags.join(','));
      }
      if (component.doc) {
        g.setAttribute('data-doc', component.doc);
      }
      if (component.url) {
        g.setAttribute('data-url', component.url);
      }

      // Highlight declaration in the editor on mouseenter
      g.addEventListener('mouseenter', () => {
        const code = editor.value;
        const range = getComponentBlockRange(code, component.id);
        if (range) {
          activeHighlightRange = range;
          updateEditorMetrics();
        }
        g.classList.add('hovered');
      });

      // Clear highlighting on mouseleave
      g.addEventListener('mouseleave', () => {
        activeHighlightRange = null;
        updateEditorMetrics();
        g.classList.remove('hovered');
      });

      let badgeOffset = 24;

      if (component.doc) {
        const docBadgeG = document.createElementNS("http://www.w3.org/2000/svg", "g");
        docBadgeG.setAttribute("class", "element-doc-badge");
        const badgeX = component.bounds.width - badgeOffset;
        const badgeY = 6;
        docBadgeG.setAttribute("transform", `translate(${badgeX}, ${badgeY})`);
        docBadgeG.setAttribute("style", "cursor: pointer;");

        const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
        title.textContent = "View Documentation";
        docBadgeG.appendChild(title);

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", "9");
        circle.setAttribute("cy", "9");
        circle.setAttribute("r", "9");
        circle.setAttribute("class", "doc-badge-bg");
        docBadgeG.appendChild(circle);

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", "M6.5 4.5a1 1 0 0 1 1-1h3l2 2v6a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-7z M10.5 3.5v2h2 L10.5 3.5z");
        path.setAttribute("class", "doc-badge-icon");
        docBadgeG.appendChild(path);

        docBadgeG.addEventListener('mousedown', (e) => {
          e.stopPropagation();
        });
        docBadgeG.addEventListener('click', (e) => {
          e.stopPropagation();
          showDocumentationModal(component);
        });

        g.appendChild(docBadgeG);
        badgeOffset += 20;
      }

      if (component.url) {
        const urlBadgeG = document.createElementNS("http://www.w3.org/2000/svg", "g");
        urlBadgeG.setAttribute("class", "element-url-badge");
        const badgeX = component.bounds.width - badgeOffset;
        const badgeY = 6;
        urlBadgeG.setAttribute("transform", `translate(${badgeX}, ${badgeY})`);
        urlBadgeG.setAttribute("style", "cursor: pointer;");

        const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
        title.textContent = `Open Link: ${component.url}`;
        urlBadgeG.appendChild(title);

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", "9");
        circle.setAttribute("cy", "9");
        circle.setAttribute("r", "9");
        circle.setAttribute("class", "url-badge-bg");
        urlBadgeG.appendChild(circle);

        const iconG = document.createElementNS("http://www.w3.org/2000/svg", "g");
        iconG.setAttribute("class", "url-badge-icon");
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71");
        path.setAttribute("transform", "scale(0.75)");
        
        iconG.appendChild(path);
        urlBadgeG.appendChild(iconG);

        urlBadgeG.addEventListener('mousedown', (e) => {
          e.stopPropagation();
        });
        urlBadgeG.addEventListener('click', (e) => {
          e.stopPropagation();
          window.open(component.url, '_blank');
        });

        g.appendChild(urlBadgeG);
      }

      viewportG.appendChild(g);
    });

    if (displayRelationships.length > 0) {
      const { pathsLayer, labelsLayer } = renderRelationships(
        displayRelationships,
        components,
        currentTheme,
        diagramSvg
      );
      viewportG.appendChild(pathsLayer);
      viewportG.appendChild(labelsLayer);
    }

    // Save rendering state globally for drag & drop
    currentComponents = components;
    currentDisplayRelationships = displayRelationships;

    statusText.innerHTML = '<i class="bi bi-check-circle-fill"></i> Parsed & Rendered Successfully';
    statusText.className = 'd-flex align-items-center gap-1.5 text-success';

    // Update minimap
    updateMinimapContent();
  } catch (error: any) {
    statusText.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> Error: ${error.message}`;
    statusText.className = 'd-flex align-items-center gap-1.5 text-danger';
  }
}

// Wire up event handlers for Editor Inputs
editor.addEventListener('input', () => {
  updateEditorMetrics();
  renderDiagram();
});

editor.addEventListener('scroll', syncEditorScroll);

// Tab Indentation Handler
editor.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const value = editor.value;

    if (e.shiftKey) {
      // Shift + Tab: Outdent
      if (start === end) {
        const before = value.substring(0, start);
        const lastNewLine = before.lastIndexOf('\n');
        const lineStart = lastNewLine === -1 ? 0 : lastNewLine + 1;
        
        if (value.substring(lineStart, lineStart + 2) === '  ') {
          editor.value = value.substring(0, lineStart) + value.substring(lineStart + 2);
          editor.selectionStart = editor.selectionEnd = Math.max(lineStart, start - 2);
        } else if (value.substring(lineStart, lineStart + 1) === ' ') {
          editor.value = value.substring(0, lineStart) + value.substring(lineStart + 1);
          editor.selectionStart = editor.selectionEnd = Math.max(lineStart, start - 1);
        }
      } else {
        const selectedText = value.substring(start, end);
        const lines = selectedText.split('\n');
        const outdentedLines = lines.map(line => {
          if (line.startsWith('  ')) return line.substring(2);
          if (line.startsWith(' ')) return line.substring(1);
          return line;
        });
        const newText = outdentedLines.join('\n');
        editor.value = value.substring(0, start) + newText + value.substring(end);
        editor.selectionStart = start;
        editor.selectionEnd = start + newText.length;
      }
    } else {
      // Tab: Indent
      if (start === end) {
        editor.value = value.substring(0, start) + '  ' + value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 2;
      } else {
        const selectedText = value.substring(start, end);
        const lines = selectedText.split('\n');
        const indentedLines = lines.map(line => '  ' + line);
        const newText = indentedLines.join('\n');
        editor.value = value.substring(0, start) + newText + value.substring(end);
        editor.selectionStart = start;
        editor.selectionEnd = start + newText.length;
      }
    }

    updateEditorMetrics();
    renderDiagram();
  }
});

// Keyboard Shortcuts: Ctrl+S to save, Ctrl+O to load, Ctrl+Shift+E to export PNG, Ctrl+Shift+C to copy SVG, Ctrl+Shift+S to share
window.addEventListener('keydown', (e: KeyboardEvent) => {
  const isModifier = e.ctrlKey || e.metaKey;
  if (isModifier) {
    if (e.shiftKey) {
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        btnExportPng.click();
      } else if (e.key === 'c' || e.key === 'C') {
        if (btnCopySvg) {
          e.preventDefault();
          btnCopySvg.click();
        }
      } else if (e.key === 's' || e.key === 'S') {
        if (btnShare) {
          e.preventDefault();
          btnShare.click();
        }
      }
    } else {
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        btnSave.click();
      } else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        btnLoad.click();
      }
    }
  }
});

// Drag & Drop State Variables
let dragTarget: BaseComponent | null = null;
let dragStartMouse = { x: 0, y: 0 };
let dragStartComponentPos = { x: 0, y: 0 };
let hasDragged = false;

function findRootComponentElement(target: EventTarget | null): SVGGElement | null {
  if (!target || !(target instanceof Element)) return null;
  let curr: Element | null = target;
  while (curr && curr !== diagramSvg && curr !== viewportG) {
    if (curr.tagName === 'g' && curr.id && currentComponents.some(c => c.id === curr!.id)) {
      return curr as SVGGElement;
    }
    curr = curr.parentElement;
  }
  return null;
}

function getComponentBlockRange(code: string, compId: string): { start: number; end: number } | null {
  const declPattern = new RegExp(`\\b${compId}\\s*:\\s*([a-zA-Z_]\\w*)\\s*\\{`);
  const match = code.match(declPattern);
  if (!match) return null;

  const start = match.index!;
  const bodyStart = start + match[0].length - 1; // index of '{'

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

  if (closeBraceIndex === -1) return null;
  return { start, end: closeBraceIndex + 1 };
}

function updateLockStateUI(): void {
  if (isDiagramLocked) {
    btnToggleLock.title = "Unlock Diagram (Enable dragging)";
    btnToggleLock.innerHTML = '<i class="bi bi-lock-fill text-warning"></i>';
    canvasContainer.classList.add('canvas-locked');
  } else {
    btnToggleLock.title = "Lock Diagram (Disable dragging)";
    btnToggleLock.innerHTML = '<i class="bi bi-unlock"></i>';
    canvasContainer.classList.remove('canvas-locked');
  }
}

// Panning and Drag-and-Drop Handlers
canvasContainer.addEventListener('mousedown', (e) => {
  if (e.button !== 0 && e.button !== 1) return; // Left or Middle mouse button

  // Check if we are clicking on a root component element
  const componentG = findRootComponentElement(e.target);
  if (componentG && e.button === 0 && !isDiagramLocked) { // Only left click for dragging if NOT locked
    const comp = currentComponents.find(c => c.id === componentG.id);
    if (comp) {
      dragTarget = comp;
      dragStartMouse = { x: e.clientX, y: e.clientY };
      dragStartComponentPos = { x: comp.bounds.x, y: comp.bounds.y };
      hasDragged = false;
      canvasContainer.style.cursor = 'move';
      e.stopPropagation();
      e.preventDefault();
      return;
    }
  }

  isPanning = true;
  canvasContainer.style.cursor = 'grabbing';
  startPan = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
});

canvasContainer.addEventListener('mousemove', (e) => {
  if (dragTarget) {
    hasDragged = true;
    const dx = e.clientX - dragStartMouse.x;
    const dy = e.clientY - dragStartMouse.y;
    
    // Scale delta by zoom level
    const dxSvg = dx / zoomLevel;
    const dySvg = dy / zoomLevel;
    
    let newX = dragStartComponentPos.x + dxSvg;
    let newY = dragStartComponentPos.y + dySvg;
    
    if (isSnapToGridEnabled) {
      newX = Math.round(newX / snapGridSize) * snapGridSize;
      newY = Math.round(newY / snapGridSize) * snapGridSize;
    }
    
    // Update bounds in memory
    dragTarget.bounds.x = newX;
    dragTarget.bounds.y = newY;
    
    // Visually move the component <g> immediately for buttery smoothness
    const element = document.getElementById(dragTarget.id);
    if (element) {
      element.setAttribute('transform', `translate(${newX}, ${newY})`);
    }
    
    // Update relationship lines dynamically in real-time
    const oldPaths = viewportG.querySelector('.relationship-paths');
    const oldLabels = viewportG.querySelector('.relationship-labels');
    if (oldPaths) oldPaths.remove();
    if (oldLabels) oldLabels.remove();
    
    if (currentDisplayRelationships.length > 0) {
      const { pathsLayer, labelsLayer } = renderRelationships(
        currentDisplayRelationships,
        currentComponents,
        currentTheme,
        diagramSvg
      );
      viewportG.appendChild(pathsLayer);
      viewportG.appendChild(labelsLayer);
    }
    return;
  }

  if (!isPanning) return;
  panOffset = {
    x: e.clientX - startPan.x,
    y: e.clientY - startPan.y
  };
  applyTransformations();
});

window.addEventListener('mouseup', () => {
  if (dragTarget) {
    const targetComp = dragTarget;
    dragTarget = null;
    canvasContainer.style.cursor = 'grab';
    
    if (hasDragged) {
      // Commit coordinates back to the DSL editor
      const code = editor.value;
      const updatedCode = updateDslComponentPosition(code, targetComp.id, targetComp.bounds.x, targetComp.bounds.y);
      
      if (code !== updatedCode) {
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.value = updatedCode;
        editor.selectionStart = start;
        editor.selectionEnd = end;
        
        updateEditorMetrics();
        renderDiagram();
      }
    }
    return;
  }

  if (isPanning) {
    isPanning = false;
    canvasContainer.style.cursor = 'grab';
  }
});

// Zoom Wheel Handler
canvasContainer.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomFactor = 1.1;
  const rect = canvasContainer.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Calculate mouse coordinates relative to the viewport group
  const mouseXInG = (mouseX - panOffset.x) / zoomLevel;
  const mouseYInG = (mouseY - panOffset.y) / zoomLevel;

  // Calculate new Zoom
  if (e.deltaY < 0) {
    zoomLevel = Math.min(5.0, zoomLevel * zoomFactor);
  } else {
    zoomLevel = Math.max(0.2, zoomLevel / zoomFactor);
  }

  // Adjust pan so the cursor location stays locked during zoom
  panOffset = {
    x: mouseX - mouseXInG * zoomLevel,
    y: mouseY - mouseYInG * zoomLevel
  };

  applyTransformations();
}, { passive: false });

// Control Toolbar Listeners
btnZoomIn.addEventListener('click', () => {
  zoomLevel = Math.min(5.0, zoomLevel * 1.2);
  applyTransformations();
});

btnZoomOut.addEventListener('click', () => {
  zoomLevel = Math.max(0.2, zoomLevel / 1.2);
  applyTransformations();
});

btnZoomReset.addEventListener('click', () => {
  zoomLevel = 1.0;
  panOffset = { x: 0, y: 0 };
  applyTransformations();
});

btnZoomFit.addEventListener('click', fitToScreen);

btnToggleLock.addEventListener('click', () => {
  isDiagramLocked = !isDiagramLocked;
  updateLockStateUI();
});

function updateSnapGridUI(): void {
  if (snapGridEnable) {
    snapGridEnable.checked = isSnapToGridEnabled;
  }
  if (snapGridSizeInput) {
    snapGridSizeInput.value = snapGridSize.toString();
  }
  if (snapGridSizeVal) {
    snapGridSizeVal.textContent = `${snapGridSize}px`;
  }
  if (btnToggleSnap) {
    const icon = btnToggleSnap.querySelector('i');
    if (icon) {
      if (isSnapToGridEnabled) {
        icon.className = 'bi bi-grid-3x3-gap-fill text-primary';
        btnToggleSnap.title = 'Snap to Grid (Enabled)';
      } else {
        icon.className = 'bi bi-grid-3x3-gap text-muted';
        btnToggleSnap.title = 'Snap to Grid (Disabled)';
      }
    }
  }
  if (canvasContainer) {
    if (isSnapToGridEnabled) {
      canvasContainer.style.setProperty('--diagram-grid-size', `${snapGridSize}px`);
    } else {
      canvasContainer.style.removeProperty('--diagram-grid-size');
    }
  }
}

// Initial update on page load
updateSnapGridUI();

// Event listeners for Snap to Grid
if (snapGridEnable) {
  snapGridEnable.addEventListener('change', () => {
    isSnapToGridEnabled = snapGridEnable.checked;
    localStorage.setItem(SNAP_ENABLED_KEY, isSnapToGridEnabled.toString());
    updateSnapGridUI();
  });
}

if (snapGridSizeInput) {
  snapGridSizeInput.addEventListener('input', () => {
    const val = parseInt(snapGridSizeInput.value, 10);
    if (!isNaN(val) && val >= 10 && val <= 50) {
      snapGridSize = val;
      localStorage.setItem(SNAP_SIZE_KEY, snapGridSize.toString());
      updateSnapGridUI();
    }
  });
}

function updateMinimapContent(): void {
  if (!minimapContainer || !minimapContentG || !viewportG || !canvasContainer) return;

  // Clear old content
  minimapContentG.innerHTML = '';

  // Get raw diagram bounding box
  // Temporarily reset transform to get accurate bounding box
  const oldTransform = viewportG.getAttribute('transform');
  viewportG.removeAttribute('transform');
  const bbox = viewportG.getBBox();
  if (oldTransform) {
    viewportG.setAttribute('transform', oldTransform);
  }

  // If diagram is empty, do nothing and hide minimap
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

  // Clone children of viewportG into minimapContentG
  Array.from(viewportG.childNodes).forEach(child => {
    if (child instanceof SVGElement) {
      const clone = child.cloneNode(true) as SVGElement;
      minimapContentG.appendChild(clone);
    }
  });

  // Calculate fitting scale and translation
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

  // Apply transform to the content group inside the minimap
  minimapContentG.setAttribute('transform', `translate(${currentMinimapDx}, ${currentMinimapDy}) scale(${currentMinimapScale})`);

  // Update viewport indicator
  updateMinimapViewportRect();
}

function updateMinimapViewportRect(): void {
  if (!isMinimapVisible || !minimapViewportRect || !canvasContainer || !viewportG) return;

  // Get screen size
  const containerWidth = canvasContainer.clientWidth || 800;
  const containerHeight = canvasContainer.clientHeight || 600;

  // Visible area in raw coordinates
  const visibleLeft = (0 - panOffset.x) / zoomLevel;
  const visibleTop = (0 - panOffset.y) / zoomLevel;
  const visibleWidth = containerWidth / zoomLevel;
  const visibleHeight = containerHeight / zoomLevel;

  // Map visible area to minimap space
  const rectX = currentMinimapDx + visibleLeft * currentMinimapScale;
  const rectY = currentMinimapDy + visibleTop * currentMinimapScale;
  const rectW = visibleWidth * currentMinimapScale;
  const rectH = visibleHeight * currentMinimapScale;

  // Set rect attributes
  minimapViewportRect.setAttribute('x', rectX.toString());
  minimapViewportRect.setAttribute('y', rectY.toString());
  minimapViewportRect.setAttribute('width', Math.max(2, rectW).toString());
  minimapViewportRect.setAttribute('height', Math.max(2, rectH).toString());
}

function updateMinimapToggleUI(): void {
  if (minimapContainer) {
    if (isMinimapVisible) {
      minimapContainer.classList.remove('collapsed');
      updateMinimapContent();
    } else {
      minimapContainer.classList.add('collapsed');
    }
  }
  if (btnToggleMinimap) {
    const icon = btnToggleMinimap.querySelector('i');
    if (icon) {
      if (isMinimapVisible) {
        icon.className = 'bi bi-map-fill text-primary';
        btnToggleMinimap.title = 'Hide Minimap';
      } else {
        icon.className = 'bi bi-map text-muted';
        btnToggleMinimap.title = 'Show Minimap';
      }
    }
  }
}

// Initial minimap setup
updateMinimapToggleUI();

// Event listeners for Minimap Drag to Pan
let isPanningMinimap = false;

function panToMinimapPoint(clientX: number, clientY: number) {
  if (!minimapSvg || !canvasContainer) return;
  const rect = minimapSvg.getBoundingClientRect();
  const mx = clientX - rect.left;
  const my = clientY - rect.top;

  const containerWidth = canvasContainer.clientWidth || 800;
  const containerHeight = canvasContainer.clientHeight || 600;

  // Map mx, my back to raw coordinates
  const rawX = (mx - currentMinimapDx) / currentMinimapScale;
  const rawY = (my - currentMinimapDy) / currentMinimapScale;

  // Center viewport at rawX, rawY
  panOffset.x = containerWidth / 2 - rawX * zoomLevel;
  panOffset.y = containerHeight / 2 - rawY * zoomLevel;

  applyTransformations();
}

if (minimapSvg) {
  minimapSvg.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    e.preventDefault();
    isPanningMinimap = true;
    panToMinimapPoint(e.clientX, e.clientY);
  });
}

window.addEventListener('mousemove', (e) => {
  if (isPanningMinimap) {
    panToMinimapPoint(e.clientX, e.clientY);
  }
});

window.addEventListener('mouseup', () => {
  if (isPanningMinimap) {
    isPanningMinimap = false;
  }
});

if (btnToggleMinimap) {
  btnToggleMinimap.addEventListener('click', () => {
    isMinimapVisible = !isMinimapVisible;
    localStorage.setItem(MINIMAP_VISIBLE_KEY, isMinimapVisible.toString());
    updateMinimapToggleUI();
  });
}

themeSelect.addEventListener('change', () => {
  const selectedTheme = themeSelect.value;
  currentTheme = activeThemes[selectedTheme] || activeThemes["drako-dark"];

  // Update diagram panel class
  const diagramPanel = document.querySelector('.diagram-panel');
  if (diagramPanel) {
    diagramPanel.className = `diagram-panel diagram-theme-${selectedTheme}`;
  }

  // Update canvas background variables
  if (canvasContainer) {
    canvasContainer.style.setProperty('--diagram-bg', currentTheme.backgroundColor);
    canvasContainer.style.setProperty('--diagram-dot-color', isDarkColor(currentTheme.backgroundColor) ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)');
  }

  renderDiagram();
});

function hasManualPositions(components: ParsedNode[]): boolean {
  const check = (nodes: ParsedNode[]): boolean => {
    for (const node of nodes) {
      if (node.properties && (node.properties.x !== undefined || node.properties.y !== undefined)) {
        return true;
      }
      const children = node.childEntries
        .filter((entry): entry is { kind: 'inline'; node: ParsedNode } => entry.kind === 'inline')
        .map(entry => entry.node);
      if (check(children)) return true;
    }
    return false;
  };
  return check(components);
}

if (layoutSelect) {
  layoutSelect.addEventListener('change', () => {
    const selectedLayout = layoutSelect.value as 'left-to-right' | 'top-to-bottom';
    let code = editor.value;
    try {
      const doc = parseDslDocument(code);
      if (hasManualPositions(doc.components)) {
        const proceed = confirm("Changing the layout algorithm will override your manual element positions. Do you want to proceed?");
        if (!proceed) {
          // Revert selection
          const parsedLayout = doc.layout === 'top-to-bottom' ? 'top-to-bottom' : 'left-to-right';
          layoutSelect.value = parsedLayout;
          return;
        }
        // User accepted, clear manual positions from DSL
        code = clearDslManualPositions(code);
      }
    } catch (err) {
      console.error("Failed to parse DSL for checking manual positions:", err);
    }

    // Set the @layout directive
    code = setDslLayoutDirective(code, selectedLayout);

    // Update the editor text while trying to keep cursor/scroll position
    const scrollPos = editor.scrollTop;
    const cursor = editor.selectionStart;
    editor.value = code;
    editor.scrollTop = scrollPos;
    try {
      editor.setSelectionRange(cursor, cursor);
    } catch (e) {}

    renderDiagram();
  });
}

function populateThemeSelects(): void {
  if (!themeSelect || !themeLoadSelect) return;

  const currentVal = themeSelect.value;
  const loadVal = themeLoadSelect.value;

  // Populate main themeSelect
  themeSelect.innerHTML = '';
  const darkOpt = document.createElement('option');
  darkOpt.value = 'drako-dark';
  darkOpt.textContent = 'Drako Dark';
  themeSelect.appendChild(darkOpt);

  const lightOpt = document.createElement('option');
  lightOpt.value = 'drako-light';
  lightOpt.textContent = 'Drako Light';
  themeSelect.appendChild(lightOpt);

  const obsidianOpt = document.createElement('option');
  obsidianOpt.value = 'obsidian-dark';
  obsidianOpt.textContent = 'Obsidian Dark';
  themeSelect.appendChild(obsidianOpt);

  const sereneOpt = document.createElement('option');
  sereneOpt.value = 'serene-light';
  sereneOpt.textContent = 'Serene Light';
  themeSelect.appendChild(sereneOpt);

  // Add custom themes
  Object.keys(activeThemes).forEach(key => {
    if (key !== 'drako-dark' && key !== 'drako-light' && key !== 'obsidian-dark' && key !== 'serene-light') {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = key;
      themeSelect.appendChild(opt);
    }
  });

  // Restore selection
  if (activeThemes[currentVal]) {
    themeSelect.value = currentVal;
  } else {
    themeSelect.value = 'drako-dark';
  }

  // Populate themeLoadSelect
  themeLoadSelect.innerHTML = '';
  const defaultLoadOpt = document.createElement('option');
  defaultLoadOpt.value = '';
  defaultLoadOpt.textContent = '-- Select a saved theme --';
  themeLoadSelect.appendChild(defaultLoadOpt);

  Object.keys(activeThemes).forEach(key => {
    if (key !== 'drako-dark' && key !== 'drako-light' && key !== 'obsidian-dark' && key !== 'serene-light') {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = key;
      themeLoadSelect.appendChild(opt);
    }
  });

  if (activeThemes[loadVal] && loadVal !== 'drako-dark' && loadVal !== 'drako-light' && loadVal !== 'obsidian-dark' && loadVal !== 'serene-light') {
    themeLoadSelect.value = loadVal;
  } else {
    themeLoadSelect.value = '';
  }
}

function setupColorSync(picker: HTMLInputElement, textInput: HTMLInputElement): void {
  if (!picker || !textInput) return;

  picker.addEventListener('input', () => {
    textInput.value = picker.value.toUpperCase();
  });

  textInput.addEventListener('input', () => {
    const val = textInput.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      picker.value = val;
    }
  });
}

// Wire up color sync
setupColorSync(pickerPrimaryColor, inputPrimaryColor);
setupColorSync(pickerSecondaryColor, inputSecondaryColor);
setupColorSync(pickerBgColor, inputBgColor);
setupColorSync(pickerTextColor, inputTextColor);
setupColorSync(pickerBorderColor, inputBorderColor);

if (btnEditTheme) {
  btnEditTheme.addEventListener('click', () => {
    // Populate form with currentTheme variables
    pickerPrimaryColor.value = currentTheme.primaryColor;
    inputPrimaryColor.value = currentTheme.primaryColor.toUpperCase();

    pickerSecondaryColor.value = currentTheme.secondaryColor;
    inputSecondaryColor.value = currentTheme.secondaryColor.toUpperCase();

    pickerBgColor.value = currentTheme.backgroundColor;
    inputBgColor.value = currentTheme.backgroundColor.toUpperCase();

    pickerTextColor.value = currentTheme.textColor;
    inputTextColor.value = currentTheme.textColor.toUpperCase();

    pickerBorderColor.value = currentTheme.borderColor;
    inputBorderColor.value = currentTheme.borderColor.toUpperCase();

    inputFontFamily.value = currentTheme.fontFamily || '';

    // If the active theme is a custom theme, set the inputs appropriately
    const activeKey = themeSelect.value;
    if (activeKey !== 'drako-dark' && activeKey !== 'drako-light' && activeKey !== 'obsidian-dark' && activeKey !== 'serene-light') {
      themeLoadSelect.value = activeKey;
      inputThemeName.value = activeKey;
    } else {
      themeLoadSelect.value = '';
      inputThemeName.value = '';
    }

    // Open Modal
    const modalEl = document.getElementById('theme-modal') as HTMLElement;
    const bootstrap = (window as any).bootstrap;
    if (bootstrap) {
      const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
      modalInstance.show();
    }
  });
}

if (themeLoadSelect) {
  themeLoadSelect.addEventListener('change', () => {
    const selectedKey = themeLoadSelect.value;
    if (selectedKey && activeThemes[selectedKey]) {
      const theme = activeThemes[selectedKey];
      pickerPrimaryColor.value = theme.primaryColor;
      inputPrimaryColor.value = theme.primaryColor.toUpperCase();

      pickerSecondaryColor.value = theme.secondaryColor;
      inputSecondaryColor.value = theme.secondaryColor.toUpperCase();

      pickerBgColor.value = theme.backgroundColor;
      inputBgColor.value = theme.backgroundColor.toUpperCase();

      pickerTextColor.value = theme.textColor;
      inputTextColor.value = theme.textColor.toUpperCase();

      pickerBorderColor.value = theme.borderColor;
      inputBorderColor.value = theme.borderColor.toUpperCase();

      inputFontFamily.value = theme.fontFamily || '';
      inputThemeName.value = selectedKey;
    }
  });
}

if (btnDeleteSavedTheme) {
  btnDeleteSavedTheme.addEventListener('click', () => {
    const selectedKey = themeLoadSelect.value;
    if (!selectedKey) {
      alert("Please select a saved theme to delete.");
      return;
    }

    if (selectedKey === 'drako-dark' || selectedKey === 'drako-light' || selectedKey === 'obsidian-dark' || selectedKey === 'serene-light') {
      alert("Cannot delete built-in themes.");
      return;
    }

    if (confirm(`Are you sure you want to delete the theme "${selectedKey}"?`)) {
      const custom = loadCustomThemes();
      delete custom[selectedKey];
      saveCustomThemes(custom);

      refreshActiveThemes();
      populateThemeSelects();

      // If the deleted theme was current, switch to drako-dark
      if (themeSelect.value === selectedKey) {
        themeSelect.value = 'drako-dark';
        currentTheme = activeThemes['drako-dark'];
        
        // Update diagram panel class and canvas variables
        const diagramPanel = document.querySelector('.diagram-panel');
        if (diagramPanel) {
          diagramPanel.className = 'diagram-panel diagram-theme-drako-dark';
        }
        if (canvasContainer) {
          canvasContainer.style.setProperty('--diagram-bg', currentTheme.backgroundColor);
          canvasContainer.style.setProperty('--diagram-dot-color', isDarkColor(currentTheme.backgroundColor) ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)');
        }
        renderDiagram();
      }

      // Reset modal inputs to currentTheme
      pickerPrimaryColor.value = currentTheme.primaryColor;
      inputPrimaryColor.value = currentTheme.primaryColor.toUpperCase();
      pickerSecondaryColor.value = currentTheme.secondaryColor;
      inputSecondaryColor.value = currentTheme.secondaryColor.toUpperCase();
      pickerBgColor.value = currentTheme.backgroundColor;
      inputBgColor.value = currentTheme.backgroundColor.toUpperCase();
      pickerTextColor.value = currentTheme.textColor;
      inputTextColor.value = currentTheme.textColor.toUpperCase();
      pickerBorderColor.value = currentTheme.borderColor;
      inputBorderColor.value = currentTheme.borderColor.toUpperCase();
      inputFontFamily.value = currentTheme.fontFamily || '';
      inputThemeName.value = '';
      themeLoadSelect.value = '';
    }
  });
}

if (btnSaveCustomTheme) {
  btnSaveCustomTheme.addEventListener('click', () => {
    const themeName = inputThemeName.value.trim();
    if (!themeName) {
      alert("Please enter a theme name.");
      return;
    }

    if (themeName === 'drako-dark' || themeName === 'drako-light' || themeName === 'obsidian-dark' || themeName === 'serene-light') {
      alert("Cannot overwrite built-in themes. Please choose a different name.");
      return;
    }

    const hexRegex = /^#[0-9a-fA-F]{6}$/;
    if (!hexRegex.test(inputPrimaryColor.value) ||
        !hexRegex.test(inputSecondaryColor.value) ||
        !hexRegex.test(inputBgColor.value) ||
        !hexRegex.test(inputTextColor.value) ||
        !hexRegex.test(inputBorderColor.value)) {
      alert("Please enter valid hex colors (e.g. #FFFFFF).");
      return;
    }

    const newTheme: ThemeVariables = {
      primaryColor: inputPrimaryColor.value,
      secondaryColor: inputSecondaryColor.value,
      backgroundColor: inputBgColor.value,
      textColor: inputTextColor.value,
      borderColor: inputBorderColor.value,
      fontFamily: inputFontFamily.value.trim() || "Outfit, system-ui, -apple-system, sans-serif"
    };

    const custom = loadCustomThemes();
    custom[themeName] = newTheme;
    saveCustomThemes(custom);

    refreshActiveThemes();
    populateThemeSelects();

    // Select the newly saved theme
    themeSelect.value = themeName;
    currentTheme = activeThemes[themeName];

    // Update diagram panel class and canvas variables
    const diagramPanel = document.querySelector('.diagram-panel');
    if (diagramPanel) {
      diagramPanel.className = `diagram-panel diagram-theme-${themeName}`;
    }
    if (canvasContainer) {
      canvasContainer.style.setProperty('--diagram-bg', currentTheme.backgroundColor);
      canvasContainer.style.setProperty('--diagram-dot-color', isDarkColor(currentTheme.backgroundColor) ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)');
    }

    renderDiagram();

    // Set themeLoadSelect value to the saved theme
    themeLoadSelect.value = themeName;
  });
}

if (btnApplyTheme) {
  btnApplyTheme.addEventListener('click', () => {
    const hexRegex = /^#[0-9a-fA-F]{6}$/;
    if (!hexRegex.test(inputPrimaryColor.value) ||
        !hexRegex.test(inputSecondaryColor.value) ||
        !hexRegex.test(inputBgColor.value) ||
        !hexRegex.test(inputTextColor.value) ||
        !hexRegex.test(inputBorderColor.value)) {
      alert("Please enter valid hex colors (e.g. #FFFFFF).");
      return;
    }

    // Override currentTheme in-place
    currentTheme.primaryColor = inputPrimaryColor.value;
    currentTheme.secondaryColor = inputSecondaryColor.value;
    currentTheme.backgroundColor = inputBgColor.value;
    currentTheme.textColor = inputTextColor.value;
    currentTheme.borderColor = inputBorderColor.value;
    currentTheme.fontFamily = inputFontFamily.value.trim() || "Outfit, system-ui, -apple-system, sans-serif";

    // Save modifications if editing an active custom theme
    const activeKey = themeSelect.value;
    if (activeKey !== 'drako-dark' && activeKey !== 'drako-light') {
      const custom = loadCustomThemes();
      custom[activeKey] = { ...currentTheme };
      saveCustomThemes(custom);
      refreshActiveThemes();
      populateThemeSelects();
    }

    // Update canvas background variables
    if (canvasContainer) {
      canvasContainer.style.setProperty('--diagram-bg', currentTheme.backgroundColor);
      canvasContainer.style.setProperty('--diagram-dot-color', isDarkColor(currentTheme.backgroundColor) ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)');
    }

    renderDiagram();

    // Hide Modal
    const modalEl = document.getElementById('theme-modal') as HTMLElement;
    const bootstrap = (window as any).bootstrap;
    if (bootstrap) {
      const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
      modalInstance.hide();
    }
  });
}

if (btnResetTheme) {
  btnResetTheme.addEventListener('click', () => {
    const activeKey = themeSelect.value;

    if (activeKey === 'drako-dark' || activeKey === 'drako-light') {
      // Revert built-in themes to default static values
      const defaults: Record<string, ThemeVariables> = {
        'drako-dark': {
          primaryColor: "#60a5fa",
          secondaryColor: "#a1a1aa",
          backgroundColor: "#18181b",
          textColor: "#f4f4f5",
          borderColor: "#52525b",
          fontFamily: "Outfit, system-ui, -apple-system, sans-serif"
        },
        'drako-light': {
          primaryColor: "#1d4ed8",
          secondaryColor: "#4b5563",
          backgroundColor: "#ffffff",
          textColor: "#1f2937",
          borderColor: "#9ca3af",
          fontFamily: "Outfit, system-ui, -apple-system, sans-serif"
        }
      };

      const original = defaults[activeKey];
      // Reset in activeThemes and currentTheme
      activeThemes[activeKey] = { ...original };
      currentTheme = activeThemes[activeKey];
    } else {
      // For custom themes, restore to last saved localStorage state
      const saved = loadCustomThemes();
      if (saved[activeKey]) {
        activeThemes[activeKey] = { ...saved[activeKey] };
        currentTheme = activeThemes[activeKey];
      }
    }

    // Prefill modal form with restored values
    pickerPrimaryColor.value = currentTheme.primaryColor;
    inputPrimaryColor.value = currentTheme.primaryColor.toUpperCase();

    pickerSecondaryColor.value = currentTheme.secondaryColor;
    inputSecondaryColor.value = currentTheme.secondaryColor.toUpperCase();

    pickerBgColor.value = currentTheme.backgroundColor;
    inputBgColor.value = currentTheme.backgroundColor.toUpperCase();

    pickerTextColor.value = currentTheme.textColor;
    inputTextColor.value = currentTheme.textColor.toUpperCase();

    pickerBorderColor.value = currentTheme.borderColor;
    inputBorderColor.value = currentTheme.borderColor.toUpperCase();

    inputFontFamily.value = currentTheme.fontFamily || '';

    // Update canvas inline variables
    if (canvasContainer) {
      canvasContainer.style.setProperty('--diagram-bg', currentTheme.backgroundColor);
      canvasContainer.style.setProperty('--diagram-dot-color', isDarkColor(currentTheme.backgroundColor) ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)');
    }

    renderDiagram();
  });
}

function setupLibraryPanelToggle(): void {
  if (!btnToggleLibrary || !libraryPanel) return;

  btnToggleLibrary.addEventListener('click', () => {
    const isCollapsed = libraryPanel.classList.toggle('collapsed');
    btnToggleLibrary.classList.toggle('active', !isCollapsed);
    btnToggleLibrary.setAttribute('aria-expanded', String(!isCollapsed));
  });
}

// Search input keyup query filter
librarySearch.addEventListener('input', () => {
  renderComponentLibrary();
});

// Save file
btnSave.addEventListener('click', () => {
  downloadDSLFile(editor.value, currentFileName);
  const activeTab = tabs.find(t => t.id === activeTabId);
  if (activeTab) {
    activeTab.isDirty = false;
    renderTabs();
  }
});

// Load file triggers
btnLoad.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target?.result;
    if (typeof text === 'string') {
      const wasDefaultUntouched = tabs.length === 1 && tabs[0].id === 'default' && !tabs[0].isDirty && tabs[0].content === DEFAULT_DSL;
      
      createNewTab(text, file.name);

      if (wasDefaultUntouched) {
        tabs = tabs.filter(t => t.id !== 'default');
        renderTabs();
      }

      isDiagramLocked = true;
      updateLockStateUI();
      updateEditorMetrics();
      renderDiagram();
      fitToScreen();
    }
  };
  reader.readAsText(file);
  fileInput.value = '';
});

// Wire up share button click to compress and open modal
if (btnShare) {
  btnShare.addEventListener('click', () => {
    const code = editor.value;
    const compressed = LZString.compressToEncodedURIComponent(code);
    const shareUrl = `${window.location.origin}${window.location.pathname}?diagram=${compressed}`;
    
    if (shareUrlInput) {
      shareUrlInput.value = shareUrl;
    }
    if (shareCopyToast) {
      shareCopyToast.classList.add('d-none');
    }
    
    const modalEl = document.getElementById('share-modal');
    if (modalEl) {
      const bootstrap = (window as any).bootstrap;
      if (bootstrap) {
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
      }
    }
  });
}

// Wire up share URL copy button click
if (btnCopyShareUrl && shareUrlInput) {
  btnCopyShareUrl.addEventListener('click', () => {
    shareUrlInput.select();
    shareUrlInput.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(shareUrlInput.value)
      .then(() => {
        if (shareCopyToast) {
          shareCopyToast.classList.remove('d-none');
        }
      })
      .catch(err => {
        console.error('Failed to copy share URL:', err);
      });
  });
}

// Wire up Copy SVG button click
if (btnCopySvg) {
  btnCopySvg.addEventListener('click', () => {
    try {
      const svgClone = diagramSvg.cloneNode(true) as SVGSVGElement;
      
      const viewportGClone = svgClone.querySelector('#viewport-g') as SVGElement;
      if (viewportGClone) {
        viewportGClone.removeAttribute('transform');
      }

      const originalTransform = viewportG.getAttribute('transform');
      viewportG.setAttribute('transform', 'none');
      const bbox = viewportG.getBBox();
      if (originalTransform) {
        viewportG.setAttribute('transform', originalTransform);
      } else {
        viewportG.removeAttribute('transform');
      }

      const padding = 20;
      const minX = bbox.x - padding;
      const minY = bbox.y - padding;
      const exportWidth = bbox.width + 2 * padding;
      const exportHeight = bbox.height + 2 * padding;

      svgClone.setAttribute('viewBox', `${minX} ${minY} ${exportWidth} ${exportHeight}`);
      svgClone.setAttribute('width', exportWidth.toString());
      svgClone.setAttribute('height', exportHeight.toString());

      const svgString = new XMLSerializer().serializeToString(svgClone);

      navigator.clipboard.writeText(svgString)
        .then(() => {
          const originalHtml = btnCopySvg.innerHTML;
          btnCopySvg.innerHTML = '<i class="bi bi-check-circle-fill text-success"></i> Copied!';
          btnCopySvg.classList.add('border-success');
          setTimeout(() => {
            btnCopySvg.innerHTML = originalHtml;
            btnCopySvg.classList.remove('border-success');
          }, 2000);

          statusText.innerHTML = '<i class="bi bi-check-circle-fill"></i> SVG copied to clipboard!';
          statusText.className = 'd-flex align-items-center gap-1.5 text-success';
        })
        .catch(err => {
          console.error('Failed to copy SVG:', err);
          statusText.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> Copy Failed: ${err.message}`;
          statusText.className = 'd-flex align-items-center gap-1.5 text-danger';
        });
    } catch (error: any) {
      console.error('Failed to prepare SVG:', error);
      statusText.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> Copy Failed: ${error.message}`;
      statusText.className = 'd-flex align-items-center gap-1.5 text-danger';
    }
  });
}

function getExportAspect(): number {
  const range = exportRangeWhole.checked ? 'whole' : 'current';
  if (range === 'current') {
    const originalWidth = diagramSvg.clientWidth || 800;
    const originalHeight = diagramSvg.clientHeight || 600;
    return originalWidth / originalHeight;
  } else {
    // Temporarily reset transform to get accurate bounds
    viewportG.setAttribute('transform', 'none');
    const bbox = viewportG.getBBox();
    applyTransformations(); // Restore transform
    
    if (bbox.width === 0 || bbox.height === 0) {
      return 800 / 600;
    }
    
    const padding = parseInt(exportPadding.value) || 0;
    const w = bbox.width + 2 * padding;
    const h = bbox.height + 2 * padding;
    return w / h;
  }
}

function getSelectedExportWidth(): number {
  const preset = exportResPreset.value;
  if (preset === 'custom') {
    return parseInt(exportCustomWidth.value) || 2048;
  }
  return parseInt(preset) || 2048;
}

function updateExportSizePreview(): void {
  const width = getSelectedExportWidth();
  const aspect = getExportAspect();
  const height = Math.round(width / aspect);
  exportSizePreview.textContent = `Estimated Output: ${width}px x ${height}px (approx.)`;
}

const handleRangeChange = () => {
  const isWhole = exportRangeWhole.checked;
  exportPadding.disabled = !isWhole;
  if (!isWhole) {
    exportPaddingGroup.style.opacity = '0.5';
    exportPaddingGroup.style.pointerEvents = 'none';
  } else {
    exportPaddingGroup.style.opacity = '1';
    exportPaddingGroup.style.pointerEvents = 'auto';
  }
  updateExportSizePreview();
};

// Wire up modal change listeners
exportRangeWhole.addEventListener('change', handleRangeChange);
exportRangeCurrent.addEventListener('change', handleRangeChange);

exportResPreset.addEventListener('change', () => {
  const isCustom = exportResPreset.value === 'custom';
  exportCustomWidth.disabled = !isCustom;
  if (!isCustom) {
    exportCustomWidth.value = exportResPreset.value;
  }
  updateExportSizePreview();
});

exportCustomWidth.addEventListener('input', () => {
  updateExportSizePreview();
});

exportPadding.addEventListener('input', () => {
  exportPaddingVal.textContent = `${exportPadding.value}px`;
  updateExportSizePreview();
});

// Export to PNG Download
btnExportPng.addEventListener('click', () => {
  const bootstrap = (window as any).bootstrap;
  const modalEl = document.getElementById('export-modal') as HTMLElement;
  if (bootstrap) {
    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
    handleRangeChange();
    updateExportSizePreview();
    modalInstance.show();
  }
});

btnDoExport.addEventListener('click', async () => {
  const bootstrap = (window as any).bootstrap;
  const modalEl = document.getElementById('export-modal') as HTMLElement;
  if (bootstrap) {
    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
    modalInstance.hide();
  }

  try {
    statusText.innerHTML = '<i class="bi bi-hourglass-split"></i> Generating PNG...';
    statusText.className = "d-flex align-items-center gap-1.5 text-warning";

    // Measure diagram bounds for 'whole' range
    let diagramBBox: any = undefined;
    if (exportRangeWhole.checked) {
      viewportG.setAttribute('transform', 'none');
      const bbox = viewportG.getBBox();
      applyTransformations();
      diagramBBox = {
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height
      };
    }

    const options: ExportOptions = {
      range: exportRangeWhole.checked ? 'whole' : 'current',
      width: getSelectedExportWidth(),
      padding: parseInt(exportPadding.value) || 0,
      background: exportBgTheme.checked ? 'theme' : 'transparent',
      backgroundColor: currentTheme.backgroundColor,
      diagramBBox
    };

    const blob = await exportToPNG(diagramSvg, options);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "diagram.png";
    link.click();
    URL.revokeObjectURL(url);

    statusText.innerHTML = '<i class="bi bi-check-circle-fill"></i> Exported PNG successfully';
    statusText.className = "d-flex align-items-center gap-1.5 text-success";
  } catch (err: any) {
    statusText.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> Export Failed: ${err.message}`;
    statusText.className = "d-flex align-items-center gap-1.5 text-danger";
  }
});

// Export to HTML Player Download
if (btnExportHtml) {
  btnExportHtml.addEventListener('click', () => {
    // Populate themes dropdown
    if (exportHtmlThemeSelect) {
      exportHtmlThemeSelect.innerHTML = '';
      Object.keys(activeThemes).forEach(themeKey => {
        const option = document.createElement('option');
        option.value = themeKey;
        option.textContent = themeKey.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        if (themeKey === themeSelect.value) {
          option.selected = true;
        }
        exportHtmlThemeSelect.appendChild(option);
      });
    }

    const bootstrap = (window as any).bootstrap;
    const modalEl = document.getElementById('export-html-modal') as HTMLElement;
    if (bootstrap && modalEl) {
      const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
      modalInstance.show();
    }
  });
}

if (btnDoExportHtml) {
  btnDoExportHtml.addEventListener('click', () => {
    const bootstrap = (window as any).bootstrap;
    const modalEl = document.getElementById('export-html-modal') as HTMLElement;
    if (bootstrap && modalEl) {
      const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
      modalInstance.hide();
    }

    try {
      statusText.innerHTML = '<i class="bi bi-hourglass-split"></i> Generating HTML...';
      statusText.className = "d-flex align-items-center gap-1.5 text-warning";

      const selectedThemeKey = exportHtmlThemeSelect ? exportHtmlThemeSelect.value : 'drako-dark';
      const includeDocs = exportHtmlIncludeDocs ? exportHtmlIncludeDocs.checked : true;
      const includeMinimap = exportHtmlIncludeMinimap ? exportHtmlIncludeMinimap.checked : true;

      // Temporarily switch active theme & clear active diagram tag filters to compile the COMPLETE SVG
      const originalTheme = currentTheme;
      const originalTags = activeDiagramTags;

      activeDiagramTags = [];
      currentTheme = activeThemes[selectedThemeKey];
      renderDiagram();

      // Clone SVG to avoid modifying the visible diagram attributes
      const svgClone = diagramSvg.cloneNode(true) as SVGSVGElement;
      
      // For standalone export, reset transform of the viewport group inside clone
      const viewportGClone = svgClone.querySelector('#viewport-g') as SVGElement;
      if (viewportGClone) {
        viewportGClone.removeAttribute('transform');
      }

      // Measure diagram bounds for proper viewBox setting
      viewportG.setAttribute('transform', 'none');
      const bbox = viewportG.getBBox();
      
      // Restore the viewportG transform in the active DOM
      applyTransformations();

      const padding = 40;
      const minX = bbox.x - padding;
      const minY = bbox.y - padding;
      const exportWidth = bbox.width + 2 * padding;
      const exportHeight = bbox.height + 2 * padding;

      svgClone.setAttribute('viewBox', `${minX} ${minY} ${exportWidth} ${exportHeight}`);
      // Let width and height be responsive
      svgClone.removeAttribute('width');
      svgClone.removeAttribute('height');

      // If documentation is not included, strip doc badges
      if (!includeDocs) {
        svgClone.querySelectorAll('.element-doc-badge').forEach(badge => badge.remove());
      }

      const svgString = new XMLSerializer().serializeToString(svgClone);

      // Call exportToHTML utility
      const htmlContent = exportToHTML(svgString, currentTheme, editor.value, {
        includeDocs,
        includeMinimap,
        components: currentComponents,
        relationships: currentDisplayRelationships,
        themeName: selectedThemeKey
      });

      // Restore the original user theme and tags in active app
      currentTheme = originalTheme;
      activeDiagramTags = originalTags;
      renderDiagram();

      // Trigger download
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // Name the file based on the current file name (replacing extension with .html)
      let filename = currentFileName || "diagram.drako";
      if (filename.endsWith('.drako')) {
        filename = filename.slice(0, -6) + '.html';
      } else {
        filename = filename + '.html';
      }

      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      statusText.innerHTML = '<i class="bi bi-check-circle-fill"></i> Exported HTML successfully';
      statusText.className = "d-flex align-items-center gap-1.5 text-success";
    } catch (err: any) {
      statusText.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> Export Failed: ${err.message}`;
      statusText.className = "d-flex align-items-center gap-1.5 text-danger";
    }
  });
}
/**
 * Highlight code examples inside the documentation modal.
 */
function highlightDocExamples(): void {
  const modalEl = document.getElementById('help-modal');
  if (!modalEl) return;
  const preElements = modalEl.querySelectorAll('pre');
  preElements.forEach(pre => {
    pre.classList.remove('text-success');
    const codeText = pre.textContent || '';
    const highlightResult = highlightDSL(codeText);
    pre.innerHTML = highlightResult.html;
  });
}

/**
 * Set up the search/filter for components in the documentation modal sidebar.
 */
function setupDocSearch(): void {
  const searchInput = document.getElementById('doc-search') as HTMLInputElement;
  const tabList = document.getElementById('v-pills-tab') as HTMLElement;
  if (!searchInput || !tabList) return;

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();
    const buttons = tabList.querySelectorAll('.nav-link') as NodeListOf<HTMLButtonElement>;
    const labels = tabList.querySelectorAll('.nav-label') as NodeListOf<HTMLElement>;
    
    buttons.forEach(btn => {
      const text = btn.textContent || '';
      if (text.toLowerCase().includes(query)) {
        btn.classList.remove('d-none');
      } else {
        btn.classList.add('d-none');
      }
    });

    labels.forEach(lbl => {
      if (query !== '') {
        lbl.classList.add('d-none');
      } else {
        lbl.classList.remove('d-none');
      }
    });
  });
}

function showDocumentationModal(component: BaseComponent): void {
  const modalEl = document.getElementById('element-documentation-modal');
  if (!modalEl) return;

  const titleEl = document.getElementById('element-documentation-title');
  if (titleEl) {
    titleEl.textContent = `Documentation: ${component.props.label || component.id} (${component.type})`;
  }

  const contentEl = document.getElementById('element-documentation-content');
  if (contentEl) {
    const rawMarkdown = component.doc || '';
    const parser = new MarkdownParser();
    const renderer = new MarkdownRenderer();
    const ast = parser.parse(rawMarkdown);
    const html = renderer.render(ast);
    contentEl.innerHTML = html;
  }

  const bootstrap = (window as any).bootstrap;
  if (bootstrap) {
    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
    modalInstance.show();
  }
}

function openDocumentationModal(componentType?: string): void {
  const bootstrap = (window as any).bootstrap;
  const modalEl = document.getElementById('help-modal') as HTMLElement;
  if (!bootstrap) return;
  const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
  
  // Reset documentation search input when opening
  const docSearchInput = document.getElementById('doc-search') as HTMLInputElement;
  if (docSearchInput) {
    docSearchInput.value = '';
    docSearchInput.dispatchEvent(new Event('input'));
  }
  
  if (componentType) {
    // Map component type to tab ID
    const tabMap: Record<string, string> = {
      'common': 'v-pills-common-tab',
      'general': 'v-pills-common-tab',
      'rectangle': 'v-pills-rectangle-tab',
      'process': 'v-pills-process-tab',
      'ellipse': 'v-pills-ellipse-tab',
      'verticalcontainer': 'v-pills-container-tab',
      'cylinder': 'v-pills-cylinder-tab',
      'cube': 'v-pills-cube-tab',
      'diamond': 'v-pills-diamond-tab',
      'hexagon': 'v-pills-hexagon-tab',
      'actor': 'v-pills-actor-tab',
      'parallelogram': 'v-pills-parallelogram-tab',
      'class': 'v-pills-class-tab',
      'interface': 'v-pills-interface-tab',
      'umlcomponent': 'v-pills-umlcomponent-tab',
      'module': 'v-pills-module-tab',
      'package': 'v-pills-package-tab',
      'text': 'v-pills-text-tab',
      'paragraph': 'v-pills-paragraph-tab',
      'relationship': 'v-pills-relationship-tab',
      'relationships': 'v-pills-relationship-tab',
      'shortcuts': 'v-pills-shortcuts-tab',
      'keyboard': 'v-pills-shortcuts-tab',
      'cloud': 'v-pills-cloud-tab',
      'node': 'v-pills-node-tab',
      'artifact': 'v-pills-artifact-tab',
      'folder': 'v-pills-folder-tab',
      'frame': 'v-pills-frame-tab',
      'storage': 'v-pills-storage-tab',
      'stack': 'v-pills-stack-tab',
      'file': 'v-pills-file-tab',
      'card': 'v-pills-card-tab',
      'usecase': 'v-pills-usecase-tab',
      'boundary': 'v-pills-boundary-tab',
      'control': 'v-pills-control-tab',
      'entity': 'v-pills-entity-tab',
      'queue': 'v-pills-queue-tab',
      'collections': 'v-pills-collections-tab',
      'agent': 'v-pills-agent-tab',
      'enum': 'v-pills-enum-tab',
      'abstract': 'v-pills-abstract-tab',
      'annotation': 'v-pills-annotation-tab',
      'struct': 'v-pills-struct-tab',
      'object': 'v-pills-object-tab'
    };
    
    const key = componentType.toLowerCase();
    const tabId = tabMap[key] || 'v-pills-relationship-tab';
    
    // Find the tab element and show it
    const tabEl = document.getElementById(tabId);
    if (tabEl) {
      const trigger = new bootstrap.Tab(tabEl);
      trigger.show();
    }
  }
  
  modalInstance.show();
}

// Wire up documentation show button in Library header
if (btnShowDocs) {
  btnShowDocs.addEventListener('click', () => {
    openDocumentationModal();
  });
}

// Wire up PlantUML Import Modal and submit logic
if (btnImportPuml) {
  btnImportPuml.addEventListener('click', () => {
    const modalEl = document.getElementById('import-puml-modal');
    const textarea = document.getElementById('import-puml-textarea') as HTMLTextAreaElement;
    const errorDiv = document.getElementById('import-puml-error');
    if (textarea) textarea.value = '';
    if (errorDiv) {
      errorDiv.classList.add('d-none');
      errorDiv.textContent = '';
    }
    
    if (modalEl) {
      const bootstrap = (window as any).bootstrap;
      if (bootstrap) {
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
      }
    }
  });
}

const btnSubmitImportPuml = document.getElementById('btn-submit-import-puml');
if (btnSubmitImportPuml) {
  btnSubmitImportPuml.addEventListener('click', () => {
    const textarea = document.getElementById('import-puml-textarea') as HTMLTextAreaElement;
    const errorDiv = document.getElementById('import-puml-error');
    if (!textarea) return;

    const pumlCode = textarea.value.trim();
    if (!pumlCode) {
      if (errorDiv) {
        errorDiv.classList.remove('d-none');
        errorDiv.textContent = 'Please enter PlantUML code to translate.';
      }
      return;
    }

    try {
      const translator = new PlantUmlTranslator();
      const translatedDsl = translator.translate(pumlCode);
      
      createNewTab(translatedDsl, 'imported_plantuml.drako');
      
      const modalEl = document.getElementById('import-puml-modal');
      if (modalEl) {
        const bootstrap = (window as any).bootstrap;
        if (bootstrap) {
          bootstrap.Modal.getOrCreateInstance(modalEl).hide();
        }
      }
    } catch (err: any) {
      if (errorDiv) {
        errorDiv.classList.remove('d-none');
        errorDiv.textContent = `Translation error: ${err.message}`;
      }
    }
  });
}

// Wire up inline filename editing
if (editorFilename) {
  editorFilename.addEventListener('click', () => {
    // If we are already editing, do nothing
    if (editorFilename.querySelector('input')) return;

    const originalText = currentFileName;
    
    // Create inline text input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control form-control-sm bg-dark text-white border-secondary d-inline-block';
    input.style.fontSize = '0.75rem';
    input.style.width = '140px';
    input.style.padding = '0.1rem 0.3rem';
    input.value = originalText;

    // Replace the filename contents with the input
    editorFilename.innerHTML = '';
    editorFilename.appendChild(input);
    input.focus();

    // Select the base name without .drako extension if possible
    const extIdx = originalText.lastIndexOf('.drako');
    if (extIdx > 0) {
      input.setSelectionRange(0, extIdx);
    } else {
      input.select();
    }

    const saveName = () => {
      let value = input.value.trim();
      if (!value) {
        value = originalText;
      }
      if (!value.endsWith('.drako')) {
        value += '.drako';
      }
      currentFileName = value;
      // Update active tab name
      const activeTab = tabs.find(t => t.id === activeTabId);
      if (activeTab) {
        activeTab.name = value;
        renderTabs();
      }
      editorFilename.innerHTML = `${currentFileName} <i class="bi bi-pencil-square ms-1" style="font-size: 0.7rem; opacity: 0.6;"></i>`;
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveName();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        editorFilename.innerHTML = `${originalText} <i class="bi bi-pencil-square ms-1" style="font-size: 0.7rem; opacity: 0.6;"></i>`;
      }
    });

    input.addEventListener('blur', () => {
      saveName();
    });
  });
}

// Wire up editor collapse toggle
if (btnToggleEditor && editorPanel) {
  btnToggleEditor.addEventListener('click', () => {
    const isCollapsed = editorPanel.classList.toggle('collapsed');
    
    // Update button contents
    const icon = btnToggleEditor.querySelector('i');
    const label = btnToggleEditor.querySelector('span');
    
    if (isCollapsed) {
      if (icon) icon.className = 'bi bi-layout-sidebar-reverse';
      if (label) label.textContent = 'Show Editor';
    } else {
      if (icon) icon.className = 'bi bi-layout-sidebar';
      if (label) label.textContent = 'Hide Editor';
    }

    // Explicitly update SVG dimensions and fit to screen
    const width = canvasContainer.clientWidth || 800;
    const height = canvasContainer.clientHeight || 600;
    diagramSvg.setAttribute('width', width.toString());
    diagramSvg.setAttribute('height', height.toString());
    
    fitToScreen();
  });
}

// Startup Initialization
// Initialization function to set up app UI and state
function initializeApp(): void {
  // Check for diagram parameter in URL
  const urlParams = new URLSearchParams(window.location.search);
  const urlDiagram = urlParams.get('diagram');
  let initialDsl = DEFAULT_DSL;
  let initialFileName = currentFileName;

  if (urlDiagram) {
    try {
      const decompressed = LZString.decompressFromEncodedURIComponent(urlDiagram);
      if (decompressed) {
        initialDsl = decompressed;
        initialFileName = "shared_diagram.drako";
        currentFileName = initialFileName;
      }
    } catch (e) {
      console.error('Failed to decompress diagram from URL:', e);
    }
  }

  // Initialize tabs state
  tabs = [
    {
      id: 'default',
      name: initialFileName,
      content: initialDsl,
      isDirty: false,
      zoomLevel: 1.0,
      panOffset: { x: 0, y: 0 },
      isDiagramLocked: true
    }
  ];
  activeTabId = 'default';

  if (btnAddTab) {
    btnAddTab.addEventListener('click', () => {
      createNewTab();
    });
  }

  const btnConfirmCloseTab = document.getElementById('btn-confirm-close-tab');
  if (btnConfirmCloseTab) {
    btnConfirmCloseTab.addEventListener('click', () => {
      if (pendingCloseTabId) {
        forceCloseTab(pendingCloseTabId);
        pendingCloseTabId = null;
      }
      const modalEl = document.getElementById('unsaved-changes-modal');
      if (modalEl) {
        const bootstrap = (window as any).bootstrap;
        if (bootstrap) {
          bootstrap.Modal.getOrCreateInstance(modalEl).hide();
        }
      }
    });
  }

  editor.value = initialDsl;
  if (editorFilename) {
    editorFilename.innerHTML = `${initialFileName} <i class="bi bi-pencil-square ms-1" style="font-size: 0.7rem; opacity: 0.6;"></i>`;
  }
  updateLockStateUI();
  updateEditorMetrics();
  renderTabs();

  // Load custom themes from localStorage and populate selects
  refreshActiveThemes();
  populateThemeSelects();

  // Set initial currentTheme
  const selectedTheme = themeSelect.value || "drako-dark";
  currentTheme = activeThemes[selectedTheme] || activeThemes["drako-dark"];

  // Set initial diagram theme class and inline CSS variables
  const diagramPanel = document.querySelector('.diagram-panel');
  if (diagramPanel) {
    diagramPanel.className = `diagram-panel diagram-theme-${selectedTheme}`;
  }
  if (canvasContainer) {
    canvasContainer.style.setProperty('--diagram-bg', currentTheme.backgroundColor);
    canvasContainer.style.setProperty('--diagram-dot-color', isDarkColor(currentTheme.backgroundColor) ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)');
  }

  renderDiagram();

  // Render Sidebar Content
  setupLibraryPanelToggle();
  renderTagFilters();
  renderComponentLibrary();

  // Initialize Documentation Modal features (highlighting & search)
  highlightDocExamples();
  setupDocSearch();

  // Set explicit SVG dimensions based on its bounding container size on load
  const resizeSvg = () => {
    const width = canvasContainer.clientWidth || 800;
    const height = canvasContainer.clientHeight || 600;
    diagramSvg.setAttribute('width', width.toString());
    diagramSvg.setAttribute('height', height.toString());
  };
  resizeSvg();
  window.addEventListener('resize', resizeSvg);

  // Initial Centering zoom fit after a short delay
  setTimeout(fitToScreen, 150);
}

// Run initialization when DOM is ready (handle case where DOMContentLoaded may have already fired)
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

export {
  loadCustomThemes,
  saveCustomThemes,
  refreshActiveThemes,
  isDarkColor,
  populateThemeSelects,
  activeThemes,
  currentTheme,
  collectAllNodes,
  collectAllTags,
  resolveAllComponentTags,
  buildParentMap,
  buildReferenceDefMap,
  filterNodeTree,
  addDescendants,
  activeDiagramTags,
  renderDiagram,
  isSnapToGridEnabled,
  snapGridSize,
  updateSnapGridUI,
  isMinimapVisible,
  updateMinimapContent,
  updateMinimapViewportRect
};
