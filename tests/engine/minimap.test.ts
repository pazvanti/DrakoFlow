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
    <button id="btn-toggle-minimap"><i></i></button>
    <div id="minimap-container"></div>
    <svg id="minimap-svg">
      <g id="minimap-content-g"></g>
      <rect id="minimap-viewport-rect"></rect>
    </svg>
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

describe('Floating Minimap functionality tests', () => {
  it('should initialize minimap states correctly', async () => {
    const { isMinimapVisible } = await import('../../src/main');
    expect(isMinimapVisible).toBe(true);
  });

  it('should toggle minimap visibility via DOM button click', async () => {
    const main = await import('../../src/main');
    const btnToggleMinimap = document.getElementById('btn-toggle-minimap') as HTMLButtonElement;
    const minimapContainer = document.getElementById('minimap-container') as HTMLElement;

    expect(main.isMinimapVisible).toBe(true);
    expect(minimapContainer.classList.contains('collapsed')).toBe(false);

    // Click toggle button to hide
    btnToggleMinimap.click();

    // Check if state is updated
    expect(main.isMinimapVisible).toBe(false);
    expect(minimapContainer.classList.contains('collapsed')).toBe(true);

    // Verify localStorage persistence
    expect(localStorage.getItem('drako-minimap-visible')).toBe('false');

    // Verify UI button is updated (has text-muted class)
    const icon = btnToggleMinimap.querySelector('i');
    expect(icon).not.toBeNull();
    expect(icon!.className).toContain('text-muted');

    // Click toggle button to show again
    btnToggleMinimap.click();
    expect(main.isMinimapVisible).toBe(true);
    expect(localStorage.getItem('drako-minimap-visible')).toBe('true');
    expect(icon!.className).toContain('text-primary');
  });
});
