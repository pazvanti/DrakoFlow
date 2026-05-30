// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParsedNode } from '../../src/dsl/parser';

// Setup DOM elements required by main.ts before importing it
beforeEach(() => {
  vi.resetModules();
  document.body.innerHTML = `
    <textarea id="editor"></textarea>
    <div id="gutter"></div>
    <pre id="highlighting"><code></code></pre>
    <input type="color" id="editor-color-picker" />
    <div id="color-picker-popup"><div class="color-grid"></div></div>
    <input type="text" id="editor-hex-input" />
    <button id="btn-apply-hex"></button>
    <div id="status-text"></div>
    <div id="editor-stats"></div>
    <svg id="diagram-svg"><g id="viewport-g"></g></svg>
    <div id="canvas-container"></div>
    <select id="theme-select"></select>
    <button id="btn-edit-theme"></button>
    <select id="theme-load-select"></select>
    <button id="btn-delete-saved-theme"></button>
    <input type="color" id="picker-primary-color" />
    <input type="text" id="input-primary-color" />
    <input type="color" id="picker-secondary-color" />
    <input type="text" id="input-secondary-color" />
    <input type="color" id="picker-bg-color" />
    <input type="text" id="input-bg-color" />
    <input type="color" id="picker-text-color" />
    <input type="text" id="input-text-color" />
    <input type="color" id="picker-border-color" />
    <input type="text" id="input-border-color" />
    <input type="text" id="input-font-family" />
    <input type="text" id="input-theme-name" />
    <button id="btn-save-custom-theme"></button>
    <button id="btn-apply-theme"></button>
    <button id="btn-reset-theme"></button>
    <button id="btn-load"></button>
    <button id="btn-save"></button>
    <button id="btn-export-png"></button>
    <input type="file" id="file-input" />
    <button id="btn-zoom-in"></button>
    <button id="btn-zoom-out"></button>
    <button id="btn-zoom-reset"></button>
    <button id="btn-zoom-fit"></button>
    <button id="btn-toggle-lock"></button>
    <button id="btn-toggle-minimap"><i></i></button>
    <div id="minimap-container"></div>
    <svg id="minimap-svg">
      <g id="minimap-content-g"></g>
      <rect id="minimap-viewport-rect"></rect>
    </svg>
    <button id="btn-toggle-snap"></button>
    <input type="checkbox" id="snap-grid-enable" />
    <input type="range" id="snap-grid-size" />
    <div id="snap-grid-size-val"></div>
    <input type="radio" id="export-range-whole" name="export-range" checked />
    <input type="radio" id="export-range-current" name="export-range" />
    <select id="export-res-preset"></select>
    <input type="number" id="export-custom-width" />
    <div id="export-size-preview"></div>
    <input type="range" id="export-padding" />
    <div id="export-padding-val"></div>
    <div id="export-padding-group"></div>
    <input type="checkbox" id="export-bg-theme" />
    <button id="btn-do-export"></button>
    <button id="btn-toggle-library"></button>
    <button id="btn-show-docs"></button>
    <div id="library-panel"></div>
    <input type="text" id="library-search" />
    <div id="tag-filter-container"></div>
    <div id="library-content"></div>
    <div id="editor-panel"></div>
    <div id="editor-filename"></div>
    <button id="btn-toggle-editor"></button>
    <div class="diagram-panel"></div>
    <div id="diagram-tag-filter-bar"><div id="diagram-tag-filters"></div><button id="btn-clear-diagram-filters"></button></div>
    <div class="modal fade" id="theme-modal"></div>
    <div class="modal fade" id="export-modal"></div>
    <div class="modal fade" id="help-modal"></div>
  `;

  // Mock SVG getBBox which is missing in JSDOM
  if (typeof SVGElement !== 'undefined' && !(SVGElement.prototype as any).getBBox) {
    (SVGElement.prototype as any).getBBox = function() {
      return {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        top: 0,
        right: 100,
        bottom: 100,
        left: 0,
        toJSON: () => {}
      };
    };
  }
});

describe('Diagram Tag Filtering AST Helpers', () => {
  const sampleAST: ParsedNode[] = [
    {
      id: 'A',
      type: 'Rectangle',
      properties: { label: 'Node A' },
      themeOverride: {},
      tags: ['auth'],
      childEntries: []
    },
    {
      id: 'Container1',
      type: 'VerticalContainer',
      properties: { label: 'My Container' },
      themeOverride: {},
      childEntries: [
        {
          kind: 'inline',
          node: {
            id: 'B',
            type: 'Rectangle',
            properties: { label: 'Node B' },
            themeOverride: {},
            tags: ['database'],
            childEntries: []
          }
        }
      ]
    }
  ];

  it('collectAllNodes should flat-map all nodes recursively', async () => {
    const { collectAllNodes } = await import('../../src/main');
    const flatMap = collectAllNodes(sampleAST);

    expect(flatMap.size).toBe(3);
    expect(flatMap.has('A')).toBe(true);
    expect(flatMap.has('Container1')).toBe(true);
    expect(flatMap.has('B')).toBe(true);
    expect(flatMap.get('B')?.tags).toContain('database');
  });

  it('buildParentMap should map nested children to their parents', async () => {
    const { buildParentMap } = await import('../../src/main');
    const parentMap = buildParentMap(sampleAST);

    expect(parentMap.size).toBe(1);
    expect(parentMap.get('B')).toBe('Container1');
    expect(parentMap.get('A')).toBeUndefined();
  });

  it('filterNodeTree should filter out unselected branches and parent container', async () => {
    const { filterNodeTree } = await import('../../src/main');

    // Scenario 1: Only A is visible
    const visibleIds1 = new Set(['A']);
    const filtered1 = filterNodeTree(sampleAST, visibleIds1);
    expect(filtered1.length).toBe(1);
    expect(filtered1[0].id).toBe('A');

    // Scenario 2: Node B is visible, so Container1 is visible too
    const visibleIds2 = new Set(['B', 'Container1']);
    const filtered2 = filterNodeTree(sampleAST, visibleIds2);
    expect(filtered2.length).toBe(1);
    expect(filtered2[0].id).toBe('Container1');
    expect(filtered2[0].childEntries.length).toBe(1);
    const firstChild = filtered2[0].childEntries[0];
    expect(firstChild.kind).toBe('inline');
    if (firstChild.kind === 'inline') {
      expect(firstChild.node.id).toBe('B');
    }
  });

  it('addDescendants should recursively add all descendants of a node', async () => {
    const { addDescendants, collectAllNodes } = await import('../../src/main');
    const flatMap = collectAllNodes(sampleAST);
    const visibleIds = new Set<string>(['Container1']);
    
    addDescendants('Container1', visibleIds, flatMap);
    
    expect(visibleIds.has('Container1')).toBe(true);
    expect(visibleIds.has('B')).toBe(true);
  });
});

describe('Integrated Diagram Tag Filtering UI & Event Handlers', () => {
  it('should render filter pills and clear button, and update canvas', async () => {
    const { renderDiagram, activeDiagramTags } = await import('../../src/main');

    const editorEl = document.getElementById('editor') as HTMLTextAreaElement;
    editorEl.value = `
      @tags: ["network"]
      Client: Process { label: "Client" }
      
      @tags: ["database"]
      Db: Rectangle { label: "Database" }
      
      Client -> Db : "query"
    `;

    // Perform initial render
    renderDiagram();

    // Verify filter bar is visible and has networking & database tag pills
    const filterBar = document.getElementById('diagram-tag-filter-bar') as HTMLElement;
    expect(filterBar.classList.contains('d-none')).toBe(false);

    const filtersContainer = document.getElementById('diagram-tag-filters') as HTMLElement;
    const pills = filtersContainer.querySelectorAll('.tag-pill');
    expect(pills.length).toBe(2);

    const tagNames = Array.from(pills).map(p => p.textContent);
    expect(tagNames).toContain('network');
    expect(tagNames).toContain('database');

    // Click "database" tag pill
    const dbPill = Array.from(pills).find(p => p.textContent === 'database') as HTMLElement;
    dbPill.click();

    // Verify "database" tag is active
    const activePills = filtersContainer.querySelectorAll('.tag-pill.active');
    expect(activePills.length).toBe(1);
    expect(activePills[0].textContent).toBe('database');

    // Clear filters using the clear button
    const clearBtn = document.getElementById('btn-clear-diagram-filters') as HTMLButtonElement;
    clearBtn.click();

    // Verify no pills are active
    const activePillsAfterClear = filtersContainer.querySelectorAll('.tag-pill.active');
    expect(activePillsAfterClear.length).toBe(0);
  });

  it('should show all elements inside a container when the container is part of a connection', async () => {
    const { renderDiagram } = await import('../../src/main');

    const editorEl = document.getElementById('editor') as HTMLTextAreaElement;
    editorEl.value = `
      @tags: ["network"]
      Client: Process { label: "Client" }
      
      ServerContainer: VerticalContainer {
        label: "Server Container"
        Db: Rectangle { label: "Database" }
      }
      
      Client -> ServerContainer : "connect"
    `;

    // Perform initial render
    renderDiagram();

    // Click "network" tag pill
    const filtersContainer = document.getElementById('diagram-tag-filters') as HTMLElement;
    const networkPill = Array.from(filtersContainer.querySelectorAll('.tag-pill')).find(p => p.textContent === 'network') as HTMLElement;
    networkPill.click();

    // The container (ServerContainer) and its child (Db) should be rendered
    const viewport = document.getElementById('viewport-g') as HTMLElement;
    
    // Check that ServerContainer is present in the rendered SVG
    const containerGroup = viewport.querySelector('#ServerContainer');
    expect(containerGroup).not.toBeNull();

    // Check that the child Db is also present in the rendered SVG
    const dbGroup = viewport.querySelector('#Db');
    expect(dbGroup).not.toBeNull();
  });

  it('should support tags declared on nested elements inside a container', async () => {
    const { renderDiagram } = await import('../../src/main');

    const editorEl = document.getElementById('editor') as HTMLTextAreaElement;
    editorEl.value = `
      MyContainer: VerticalContainer {
        label: "Container"
        
        Step1: Process {
          label: "Step 1"
        }
        
        @tags: ["nestedTag"]
        Step2: Process {
          label: "Step 2"
        }
      }
    `;

    // Perform initial render
    renderDiagram();

    // Verify filter bar has nestedTag
    const filtersContainer = document.getElementById('diagram-tag-filters') as HTMLElement;
    const pills = filtersContainer.querySelectorAll('.tag-pill');
    const tagNames = Array.from(pills).map(p => p.textContent);
    expect(tagNames).toContain('nestedTag');

    // Click "nestedTag" tag pill
    const nestedPill = Array.from(pills).find(p => p.textContent === 'nestedTag') as HTMLElement;
    nestedPill.click();

    // Step2 (the tagged node) and MyContainer (its parent) should be visible
    const viewport = document.getElementById('viewport-g') as HTMLElement;
    expect(viewport.querySelector('#MyContainer')).not.toBeNull();
    expect(viewport.querySelector('#Step2')).not.toBeNull();

    // Step1 (the untagged sibling) should be filtered out
    expect(viewport.querySelector('#Step1')).toBeNull();
  });

  it('should support tags declared on referenced elements inside a container', async () => {
    const { renderDiagram } = await import('../../src/main');

    const editorEl = document.getElementById('editor') as HTMLTextAreaElement;
    editorEl.value = `
      MyRectangle: Rectangle {
        label: "My Definition"
      }

      MyContainer: VerticalContainer {
        label: "Container"
        
        @tags: ["refTag"]
        Step2: MyRectangle
      }
    `;

    // Perform initial render
    renderDiagram();

    // Verify filter bar has refTag
    const filtersContainer = document.getElementById('diagram-tag-filters') as HTMLElement;
    const pills = filtersContainer.querySelectorAll('.tag-pill');
    const tagNames = Array.from(pills).map(p => p.textContent);
    expect(tagNames).toContain('refTag');

    // Click "refTag" tag pill
    const refPill = Array.from(pills).find(p => p.textContent === 'refTag') as HTMLElement;
    refPill.click();

    // Step2 (the tagged instance) and MyContainer (its parent) should be visible
    const viewport = document.getElementById('viewport-g') as HTMLElement;
    expect(viewport.querySelector('#MyContainer')).not.toBeNull();
    expect(viewport.querySelector('#Step2')).not.toBeNull();
  });

  it('should filter correctly for user scenario with bbb and aaa tags', async () => {
    const { renderDiagram } = await import('../../src/main');

    const editorEl = document.getElementById('editor') as HTMLTextAreaElement;
    editorEl.value = `
      @tags:["bbb"]
      Client: Process {
        label: "Client App"
      }

      Server: Process {
        label: "API Server"
      }

      MyRectangle: Rectangle {
        label: "Rectangle"
      }

      MyContainer: VerticalContainer {
        label: "Container"
        
        Step1: Process {
          label: "Step 1"
        }

        @tags: ["aaa"]
        Step2: MyRectangle
      }

      Server -> Step2
    `;

    // 1. Test Tag filtering for bbb
    renderDiagram();
    const filtersContainer = document.getElementById('diagram-tag-filters') as HTMLElement;
    
    // Select bbb tag
    const bbbPill = Array.from(filtersContainer.querySelectorAll('.tag-pill')).find(p => p.textContent === 'bbb') as HTMLElement;
    bbbPill.click();

    const viewport = document.getElementById('viewport-g') as HTMLElement;
    
    // Client should be visible
    expect(viewport.querySelector('#Client')).not.toBeNull();
    // Server and MyContainer should be invisible since they are not connected to bbb
    expect(viewport.querySelector('#Server')).toBeNull();
    expect(viewport.querySelector('#MyContainer')).toBeNull();
    // The definition MyRectangle should NOT be visible as an extra component
    expect(viewport.querySelector('#MyRectangle')).toBeNull();

    // 2. Clear filters
    const clearBtn = document.getElementById('btn-clear-diagram-filters') as HTMLButtonElement;
    clearBtn.click();

    // 3. Test Tag filtering for aaa
    const aaaPill = Array.from(filtersContainer.querySelectorAll('.tag-pill')).find(p => p.textContent === 'aaa') as HTMLElement;
    aaaPill.click();

    // Server (direct neighbor of Step2), MyContainer (parent of Step2), and Step2 itself should be visible
    expect(viewport.querySelector('#Server')).not.toBeNull();
    expect(viewport.querySelector('#MyContainer')).not.toBeNull();
    expect(viewport.querySelector('#Step2')).not.toBeNull();
    // Step1 (sibling in the container) should be filtered out
    expect(viewport.querySelector('#Step1')).toBeNull();
    // The definition MyRectangle should NOT be rendered as a standalone root component
    expect(viewport.querySelector('#MyRectangle')).toBeNull();
  });
});


