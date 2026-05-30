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
    <button id="btn-toggle-snap"><i></i></button>
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
  if (typeof SVGElement !== 'undefined') {
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

  if (typeof SVGGElement !== 'undefined') {
    (SVGGElement.prototype as any).getBBox = function() {
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

  localStorage.clear();
});

describe('Snap to Grid functionality tests', () => {
  it('should initialize snap states correctly', async () => {
    const { isSnapToGridEnabled, snapGridSize } = await import('../../src/main');
    expect(isSnapToGridEnabled).toBe(false);
    expect(snapGridSize).toBe(20);
  });

  it('should toggle snap state via DOM switch changes', async () => {
    const main = await import('../../src/main');
    const snapGridEnable = document.getElementById('snap-grid-enable') as HTMLInputElement;
    const btnToggleSnap = document.getElementById('btn-toggle-snap') as HTMLButtonElement;

    expect(main.isSnapToGridEnabled).toBe(false);

    // Toggle switch to enabled
    snapGridEnable.checked = true;
    snapGridEnable.dispatchEvent(new Event('change'));

    // Check if state is updated
    expect(main.isSnapToGridEnabled).toBe(true);

    // Verify localStorage persistence
    expect(localStorage.getItem('drako-snap-enabled')).toBe('true');

    // Verify UI button is updated (has Text Primary class)
    const icon = btnToggleSnap.querySelector('i');
    expect(icon).not.toBeNull();
    expect(icon!.className).toContain('text-primary');

    // Toggle back
    snapGridEnable.checked = false;
    snapGridEnable.dispatchEvent(new Event('change'));
    expect(main.isSnapToGridEnabled).toBe(false);
    expect(localStorage.getItem('drako-snap-enabled')).toBe('false');
  });

  it('should update grid size via range input slider changes', async () => {
    const main = await import('../../src/main');
    const snapGridSizeInput = document.getElementById('snap-grid-size') as HTMLInputElement;
    const snapGridSizeVal = document.getElementById('snap-grid-size-val') as HTMLElement;

    expect(main.snapGridSize).toBe(20);

    // Change grid size to 35px
    snapGridSizeInput.value = '35';
    snapGridSizeInput.dispatchEvent(new Event('input'));

    expect(main.snapGridSize).toBe(35);
    expect(localStorage.getItem('drako-snap-size')).toBe('35');
    expect(snapGridSizeVal.textContent).toBe('35px');
  });
});
