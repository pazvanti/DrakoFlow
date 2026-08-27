// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseDslDocument } from '../../src/dsl/parser';
import { createComponentsFromDsl } from '../../src/engine/componentFactory';
import { EngineRegistry } from '../../src/engine/EngineRegistry';
import { exportToHTML } from '../../src/utils/HTMLPlayerExporter';
import { ThemeVariables } from '../../src/components/BaseComponent';

const themeName = 'drako-dark';
const theme: ThemeVariables = {
  primaryColor: '#60a5fa',
  secondaryColor: '#a1a1aa',
  backgroundColor: '#18181b',
  textColor: '#f4f4f5',
  borderColor: '#52525b',
  fontFamily: 'Outfit, sans-serif'
};

function generateExample(filename: string) {
  const drakoPath = path.resolve(__dirname, `../../docs/examples/${filename}.drako`);
  const outHtmlPath = path.resolve(__dirname, `../../docs/examples/${filename}.html`);

  const dslCode = fs.readFileSync(drakoPath, 'utf8');
  const doc = parseDslDocument(dslCode);
  const components = createComponentsFromDsl(doc.components);

  const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgElement.setAttribute('id', 'diagram-svg');
  svgElement.setAttribute('class', 'diagram-svg');
  const viewportG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  viewportG.setAttribute('id', 'viewport-g');
  svgElement.appendChild(viewportG);

  const engine = EngineRegistry.getInstance().getEngine(doc, doc.layoutDirective);
  
  const result = engine.render({
    document: doc,
    displayComponents: doc.components,
    displayRelationships: doc.relationships,
    theme,
    themeName,
    isDiagramLocked: false,
    viewportG,
    rawCode: dslCode,
    svgElement
  });

  const svgMarkup = svgElement.outerHTML;

  const htmlPlayer = exportToHTML(svgMarkup, theme, dslCode, {
    includeDocs: true,
    includeMinimap: true,
    components,
    relationships: doc.relationships,
    themeName,
    bbox: result.bbox
  });

  expect(htmlPlayer).toContain('DrakoFlow Interactive Player');
  fs.writeFileSync(outHtmlPath, htmlPlayer, 'utf8');
  expect(fs.existsSync(outHtmlPath)).toBe(true);
}

describe('Generate HTML Player Examples', () => {
  it('generates docs/examples/git.html with full player features and no clipping', () => {
    generateExample('git');
    const content = fs.readFileSync(path.resolve(__dirname, '../../docs/examples/git.html'), 'utf8');
    expect(content).toContain('git-flow-diagram');
    expect(content).toContain('class="diagram-svg"');
    expect(content).toContain('id="viewport-g"');
    expect(content).toContain('fitToScreen');
  });

  it('generates docs/examples/simple.html', () => {
    generateExample('simple');
  });

  it('generates docs/examples/sequence-with-tags.html', () => {
    generateExample('sequence-with-tags');
  });

  it('generates docs/examples/sequence-with-components.html', () => {
    generateExample('sequence-with-components');
  });
});
