// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

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

  localStorage.clear();
});

describe('Theme Customizer tests', () => {
  it('should correctly calculate background color darkness (isDarkColor)', async () => {
    const { isDarkColor } = await import('../../src/main');
    
    expect(isDarkColor('#000000')).toBe(true);
    expect(isDarkColor('#18181b')).toBe(true);
    expect(isDarkColor('#3f3f46')).toBe(true);
    
    expect(isDarkColor('#ffffff')).toBe(false);
    expect(isDarkColor('#f4f4f5')).toBe(false);
    expect(isDarkColor('#a1a1aa')).toBe(false);
  });

  it('should save and load custom themes in localStorage', async () => {
    const { saveCustomThemes, loadCustomThemes } = await import('../../src/main');

    const customThemes = {
      'Ocean Breeze': {
        primaryColor: '#0ea5e9',
        secondaryColor: '#64748b',
        backgroundColor: '#0f172a',
        textColor: '#f8fafc',
        borderColor: '#334155',
        fontFamily: 'Inter, sans-serif'
      }
    };

    saveCustomThemes(customThemes);
    const loaded = loadCustomThemes();

    expect(loaded['Ocean Breeze']).toBeDefined();
    expect(loaded['Ocean Breeze'].primaryColor).toBe('#0ea5e9');
    expect(loaded['Ocean Breeze'].fontFamily).toBe('Inter, sans-serif');
  });

  it('should refresh activeThemes registry with localStorage values', async () => {
    const { saveCustomThemes, refreshActiveThemes, activeThemes } = await import('../../src/main');

    const customThemes = {
      'Nordic Ice': {
        primaryColor: '#88c0d0',
        secondaryColor: '#4c566a',
        backgroundColor: '#2e3440',
        textColor: '#eceff4',
        borderColor: '#434c5e',
        fontFamily: 'Roboto, sans-serif'
      }
    };

    saveCustomThemes(customThemes);
    refreshActiveThemes();

    expect(activeThemes['Nordic Ice']).toBeDefined();
    expect(activeThemes['Nordic Ice'].primaryColor).toBe('#88c0d0');
    expect(activeThemes['drako-dark']).toBeDefined();
    expect(activeThemes['drako-light']).toBeDefined();
  });

  it('should populate options in theme selects correctly', async () => {
    const { saveCustomThemes, refreshActiveThemes, populateThemeSelects } = await import('../../src/main');

    const customThemes = {
      'Solarized Custom': {
        primaryColor: '#b58900',
        secondaryColor: '#586e75',
        backgroundColor: '#fdf6e3',
        textColor: '#657b83',
        borderColor: '#93a1a1',
        fontFamily: 'monospace'
      }
    };

    saveCustomThemes(customThemes);
    refreshActiveThemes();
    populateThemeSelects();

    const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
    const themeLoadSelect = document.getElementById('theme-load-select') as HTMLSelectElement;

    const selectOptions = Array.from(themeSelect.options).map(opt => opt.value);
    expect(selectOptions).toContain('drako-dark');
    expect(selectOptions).toContain('drako-light');
    expect(selectOptions).toContain('Solarized Custom');

    const loadOptions = Array.from(themeLoadSelect.options).map(opt => opt.value);
    expect(loadOptions).toContain('Solarized Custom');
    expect(loadOptions).not.toContain('drako-dark');
    expect(loadOptions).not.toContain('drako-light');
  });

  it('should reset current theme back to default values when reset button is clicked', async () => {
    const { activeThemes } = await import('../../src/main');

    const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
    const btnResetTheme = document.getElementById('btn-reset-theme') as HTMLButtonElement;
    const pickerPrimaryColor = document.getElementById('picker-primary-color') as HTMLInputElement;

    // Simulate switching to drako-dark and applying a temporary edit
    themeSelect.value = 'drako-dark';
    activeThemes['drako-dark'].primaryColor = '#FF0000'; // Override temporarily

    // Fire reset click event
    btnResetTheme.click();

    // Verify it is restored to default
    expect(activeThemes['drako-dark'].primaryColor).toBe('#60a5fa');
    expect(pickerPrimaryColor.value).toBe('#60a5fa');
  });
});
