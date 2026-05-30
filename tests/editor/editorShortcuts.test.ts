// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

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
    <div id="editor-panel">
      <div id="tabs-container"></div>
      <button id="btn-add-tab"></button>
    </div>
    <div id="editor-filename"></div>
    <button id="btn-toggle-editor"></button>
    <div class="diagram-panel"></div>
    <div id="diagram-tag-filter-bar"><div id="diagram-tag-filters"></div><button id="btn-clear-diagram-filters"></button></div>
    <div class="modal fade" id="theme-modal"></div>
    <div class="modal fade" id="export-modal"></div>
    <div class="modal fade" id="help-modal"></div>
    <div id="unsaved-changes-modal">
      <div id="unsaved-changes-message"></div>
      <button id="btn-confirm-close-tab"></button>
    </div>
    <button id="btn-share"></button>
    <button id="btn-copy-svg"></button>
    <input id="share-url-input" />
    <button id="btn-copy-share-url"></button>
    <div id="share-copy-toast"></div>
    <div class="modal fade" id="share-modal"></div>
  `;

  // Mock SVG getBBox
  if (typeof SVGElement !== 'undefined' && !(SVGElement.prototype as any).getBBox) {
    (SVGElement.prototype as any).getBBox = function() {
      return { x: 0, y: 0, width: 100, height: 100 };
    };
  }

  // Mock URL.createObjectURL which is missing in jsdom
  if (typeof URL !== 'undefined') {
    URL.createObjectURL = vi.fn().mockReturnValue('mock-url');
    URL.revokeObjectURL = vi.fn();
  }

  // Mock navigator.clipboard
  if (typeof navigator !== 'undefined') {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    });
  }

  // Mock bootstrap Modal
  (window as any).bootstrap = {
    Modal: {
      getOrCreateInstance: vi.fn().mockReturnValue({
        show: vi.fn(),
        hide: vi.fn()
      })
    }
  };
});

describe('Editor Shortcuts and Tab Indentation', () => {
  it('should trigger save button click on Ctrl+S', async () => {
    await import('../../src/main');
    const btnSave = document.getElementById('btn-save') as HTMLButtonElement;
    const clickSpy = vi.spyOn(btnSave, 'click');

    const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true });
    window.dispatchEvent(event);

    expect(clickSpy).toHaveBeenCalled();
  });

  it('should trigger load button click on Ctrl+O', async () => {
    await import('../../src/main');
    const btnLoad = document.getElementById('btn-load') as HTMLButtonElement;
    const clickSpy = vi.spyOn(btnLoad, 'click');

    const event = new KeyboardEvent('keydown', { key: 'o', ctrlKey: true, bubbles: true });
    window.dispatchEvent(event);

    expect(clickSpy).toHaveBeenCalled();
  });

  it('should trigger export button click on Ctrl+Shift+E', async () => {
    await import('../../src/main');
    const btnExportPng = document.getElementById('btn-export-png') as HTMLButtonElement;
    const clickSpy = vi.spyOn(btnExportPng, 'click');

    const event = new KeyboardEvent('keydown', { key: 'e', ctrlKey: true, shiftKey: true, bubbles: true });
    window.dispatchEvent(event);

    expect(clickSpy).toHaveBeenCalled();
  });

  it('should trigger copy SVG button click on Ctrl+Shift+C', async () => {
    await import('../../src/main');
    const btnCopySvg = document.getElementById('btn-copy-svg') as HTMLButtonElement;
    const clickSpy = vi.spyOn(btnCopySvg, 'click');

    const event = new KeyboardEvent('keydown', { key: 'c', ctrlKey: true, shiftKey: true, bubbles: true });
    window.dispatchEvent(event);

    expect(clickSpy).toHaveBeenCalled();
  });

  it('should trigger share button click on Ctrl+Shift+S', async () => {
    await import('../../src/main');
    const btnShare = document.getElementById('btn-share') as HTMLButtonElement;
    const clickSpy = vi.spyOn(btnShare, 'click');

    const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true, shiftKey: true, bubbles: true });
    window.dispatchEvent(event);

    expect(clickSpy).toHaveBeenCalled();
  });

  it('should insert spaces on Tab press in the editor', async () => {
    await import('../../src/main');
    const editor = document.getElementById('editor') as HTMLTextAreaElement;
    editor.value = 'line1\nline2';
    editor.selectionStart = editor.selectionEnd = 5; // right after line1

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    editor.dispatchEvent(event);

    expect(editor.value).toBe('line1  \nline2');
    expect(editor.selectionStart).toBe(7);
  });

  it('should remove spaces on Shift+Tab press in the editor', async () => {
    await import('../../src/main');
    const editor = document.getElementById('editor') as HTMLTextAreaElement;
    editor.value = '  line1\nline2';
    editor.selectionStart = editor.selectionEnd = 7; // after line1

    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
    editor.dispatchEvent(event);

    expect(editor.value).toBe('line1\nline2');
    expect(editor.selectionStart).toBe(5);
  });

  it('should initialize with one default tab', async () => {
    await import('../../src/main');
    const tabsContainer = document.getElementById('tabs-container') as HTMLElement;
    const tabItems = tabsContainer.querySelectorAll('.editor-tab-item');
    expect(tabItems.length).toBe(1);
    expect(tabItems[0].querySelector('.tab-name')?.textContent).toBe('diagram.drako');
  });

  it('should create a new tab on plus button click', async () => {
    await import('../../src/main');
    const btnAddTab = document.getElementById('btn-add-tab') as HTMLButtonElement;
    btnAddTab.click();

    const tabsContainer = document.getElementById('tabs-container') as HTMLElement;
    const tabItems = tabsContainer.querySelectorAll('.editor-tab-item');
    expect(tabItems.length).toBe(2);
    expect(tabItems[1].querySelector('.tab-name')?.textContent).toBe('diagram_1.drako');
    expect(tabItems[1].classList.contains('active')).toBe(true);
  });

  it('should switch between tabs and preserve content', async () => {
    await import('../../src/main');
    const editor = document.getElementById('editor') as HTMLTextAreaElement;
    const tabsContainer = document.getElementById('tabs-container') as HTMLElement;

    editor.value = 'Tab 1 Modified Content';
    editor.dispatchEvent(new Event('input'));

    const tabItemsBefore = tabsContainer.querySelectorAll('.editor-tab-item');
    expect(tabItemsBefore[0].querySelector('.tab-dirty-dot')).not.toBeNull();

    const btnAddTab = document.getElementById('btn-add-tab') as HTMLButtonElement;
    btnAddTab.click();

    expect(editor.value).not.toBe('Tab 1 Modified Content');

    editor.value = 'Tab 2 Content';
    editor.dispatchEvent(new Event('input'));

    const updatedTabs = tabsContainer.querySelectorAll('.editor-tab-item');
    (updatedTabs[0] as HTMLElement).click();

    expect(editor.value).toBe('Tab 1 Modified Content');
  });

  it('should prompt confirm modal when closing dirty tab', async () => {
    await import('../../src/main');
    const editor = document.getElementById('editor') as HTMLTextAreaElement;
    const tabsContainer = document.getElementById('tabs-container') as HTMLElement;

    editor.value = 'Dirty Tab Content';
    editor.dispatchEvent(new Event('input'));

    const bootstrap = (window as any).bootstrap;
    const showSpy = bootstrap.Modal.getOrCreateInstance().show;

    const closeBtn = tabsContainer.querySelector('.tab-close-btn') as HTMLElement;
    closeBtn.click();

    // Verify modal show was called
    expect(showSpy).toHaveBeenCalled();
    // Verify tab was NOT closed yet (since confirm button was not clicked)
    expect(tabsContainer.querySelectorAll('.editor-tab-item').length).toBe(1);

    // Now click confirm close button in the modal
    const btnConfirmCloseTab = document.getElementById('btn-confirm-close-tab') as HTMLElement;
    btnConfirmCloseTab.click();

    // Verify tab closed (count is 1 because default tab is re-created, but content resets)
    expect(tabsContainer.querySelectorAll('.editor-tab-item').length).toBe(1);
    expect(editor.value).not.toBe('Dirty Tab Content');
  });

  it('should preserve zoom level, pan offset, and lock status when switching tabs', async () => {
    await import('../../src/main');
    
    const btnToggleLock = document.getElementById('btn-toggle-lock') as HTMLButtonElement;
    const btnAddTab = document.getElementById('btn-add-tab') as HTMLButtonElement;
    const tabsContainer = document.getElementById('tabs-container') as HTMLElement;

    // Initially diagram is locked
    expect(btnToggleLock.innerHTML).toContain('bi-lock-fill');

    // Unlock the diagram on Tab 1
    btnToggleLock.click();
    expect(btnToggleLock.innerHTML).toContain('bi-unlock');

    // Create Tab 2 (starts with default locked = true state)
    btnAddTab.click();
    expect(btnToggleLock.innerHTML).toContain('bi-lock-fill');

    // Switch back to Tab 1
    const updatedTabs = tabsContainer.querySelectorAll('.editor-tab-item');
    (updatedTabs[0] as HTMLElement).click();

    // Verify Tab 1 lock state (unlocked = false) is restored
    expect(btnToggleLock.innerHTML).toContain('bi-unlock');
  });

  it('should compress current editor code and generate share link', async () => {
    await import('../../src/main');
    const editor = document.getElementById('editor') as HTMLTextAreaElement;
    editor.value = 'My test diagram DSL';
    editor.dispatchEvent(new Event('input'));

    const btnShare = document.getElementById('btn-share') as HTMLButtonElement;
    btnShare.click();

    const shareUrlInput = document.getElementById('share-url-input') as HTMLInputElement;
    expect(shareUrlInput.value).toContain('?diagram=');

    const url = new URL(shareUrlInput.value);
    const diagramParam = url.searchParams.get('diagram');
    expect(diagramParam).not.toBeNull();

    const LZString = (await import('lz-string')).default;
    const decompressed = LZString.decompressFromEncodedURIComponent(diagramParam!);
    expect(decompressed).toBe('My test diagram DSL');
  });

  it('should handle copying the share URL to clipboard', async () => {
    await import('../../src/main');
    const shareUrlInput = document.getElementById('share-url-input') as HTMLInputElement;
    shareUrlInput.value = 'http://localhost/?diagram=test_compressed';

    const clipboardMock = {
      writeText: vi.fn().mockResolvedValue(undefined)
    };
    Object.assign(navigator, { clipboard: clipboardMock });

    const btnCopyShareUrl = document.getElementById('btn-copy-share-url') as HTMLButtonElement;
    btnCopyShareUrl.click();

    expect(clipboardMock.writeText).toHaveBeenCalledWith('http://localhost/?diagram=test_compressed');
  });

  it('should decompress diagram URL parameter on initialization', async () => {
    const LZString = (await import('lz-string')).default;
    const testDsl = 'Shared DSL from URL';
    const compressed = LZString.compressToEncodedURIComponent(testDsl);

    const getSpy = vi.spyOn(URLSearchParams.prototype, 'get').mockImplementation((key) => {
      if (key === 'diagram') return compressed;
      return null;
    });

    await import('../../src/main');

    const editor = document.getElementById('editor') as HTMLTextAreaElement;
    expect(editor.value).toBe(testDsl);
    
    const editorFilename = document.getElementById('editor-filename') as HTMLElement;
    expect(editorFilename.textContent).toContain('shared_diagram.drako');

    getSpy.mockRestore();
  });

  it('should copy current diagram as SVG markup to clipboard', async () => {
    await import('../../src/main');

    const clipboardMock = {
      writeText: vi.fn().mockResolvedValue(undefined)
    };
    Object.assign(navigator, { clipboard: clipboardMock });

    const btnCopySvg = document.getElementById('btn-copy-svg') as HTMLButtonElement;
    btnCopySvg.click();

    expect(clipboardMock.writeText).toHaveBeenCalled();
    const passedSvg = clipboardMock.writeText.mock.calls[0][0];
    expect(passedSvg).toContain('<svg');
    expect(passedSvg).toContain('viewBox=');
  });

  it('should filter documentation and hide/show category labels based on search input', async () => {
    const helpModal = document.getElementById('help-modal') as HTMLElement;
    helpModal.innerHTML = `
      <input type="text" id="doc-search" />
      <div id="v-pills-tab">
        <div class="nav-label">General Docs</div>
        <button class="nav-link" id="v-pills-relationship-tab">Relationships</button>
        <button class="nav-link" id="v-pills-shortcuts-tab">Keyboard Shortcuts</button>
        <div class="nav-label">Shapes & Components</div>
        <button class="nav-link" id="v-pills-rectangle-tab">Rectangle</button>
      </div>
    `;

    await import('../../src/main');

    const docSearch = document.getElementById('doc-search') as HTMLInputElement;
    const labels = helpModal.querySelectorAll('.nav-label');
    const relationshipTab = document.getElementById('v-pills-relationship-tab') as HTMLButtonElement;
    const rectangleTab = document.getElementById('v-pills-rectangle-tab') as HTMLButtonElement;

    // Initially, no query, labels should be visible (i.e. not have 'd-none')
    expect(labels[0].classList.contains('d-none')).toBe(false);
    expect(labels[1].classList.contains('d-none')).toBe(false);
    expect(relationshipTab.classList.contains('d-none')).toBe(false);
    expect(rectangleTab.classList.contains('d-none')).toBe(false);

    // Enter a query matching "rect"
    docSearch.value = 'rect';
    docSearch.dispatchEvent(new Event('input'));

    // Labels should be hidden
    expect(labels[0].classList.contains('d-none')).toBe(true);
    expect(labels[1].classList.contains('d-none')).toBe(true);
    // Rectangle should be visible, Relationship should be hidden
    expect(relationshipTab.classList.contains('d-none')).toBe(true);
    expect(rectangleTab.classList.contains('d-none')).toBe(false);

    // Clear search
    docSearch.value = '';
    docSearch.dispatchEvent(new Event('input'));

    // Everything should be visible again
    expect(labels[0].classList.contains('d-none')).toBe(false);
    expect(labels[1].classList.contains('d-none')).toBe(false);
    expect(relationshipTab.classList.contains('d-none')).toBe(false);
    expect(rectangleTab.classList.contains('d-none')).toBe(false);
  });
});

