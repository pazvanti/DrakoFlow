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
});
