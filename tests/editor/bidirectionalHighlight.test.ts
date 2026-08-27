// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { parseDslDocument } from '../../src/dsl/parser';
import { createComponentsFromDsl } from '../../src/engine/componentFactory';
import { StandardEngine } from '../../src/engine/StandardEngine';
import { GitFlowRenderer } from '../../src/engine/gitflow/GitFlowRenderer';
import { computeGitFlowLayout } from '../../src/engine/gitflow/GitFlowLayout';
import { exportToHTML } from '../../src/utils/HTMLPlayerExporter';
import { ThemeVariables } from '../../src/components/BaseComponent';
import { highlightDSL } from '../../src/utils/highlighter';

describe('Bi-directional Highlighting', () => {
  const theme: ThemeVariables = {
    primaryColor: '#60a5fa',
    secondaryColor: '#a1a1aa',
    backgroundColor: '#18181b',
    textColor: '#f4f4f5',
    borderColor: '#52525b',
    fontFamily: 'Outfit, sans-serif'
  };

  it('triggers onComponentHover callback on mouseenter and mouseleave in StandardEngine', () => {
    const dsl = `
@layout: left-to-right

BoxA: Rectangle {
  label: "Box A"
}

BoxB: Rectangle {
  label: "Box B"
}
`;
    const doc = parseDslDocument(dsl);
    const components = createComponentsFromDsl(doc.components);

    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const viewportG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svgElement.appendChild(viewportG);

    const onHoverMock = vi.fn();
    const engine = new StandardEngine();

    engine.render({
      document: doc,
      displayComponents: doc.components,
      displayRelationships: doc.relationships,
      theme,
      themeName: 'drako-dark',
      isDiagramLocked: false,
      viewportG,
      rawCode: dsl,
      svgElement,
      onComponentHover: onHoverMock
    });

    const boxAEl = viewportG.querySelector('[data-id="BoxA"]') as SVGElement;
    expect(boxAEl).not.toBeNull();

    // Trigger mouseenter
    boxAEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    expect(onHoverMock).toHaveBeenCalledWith('BoxA');
    expect(boxAEl.classList.contains('hovered')).toBe(true);

    // Trigger mouseleave
    boxAEl.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    expect(onHoverMock).toHaveBeenCalledWith(null);
    expect(boxAEl.classList.contains('hovered')).toBe(false);
  });

  it('triggers onComponentHover callback on branches and commits in GitFlowRenderer', () => {
    const dsl = `
@layout: git

Main: Branch {
  name: "main"
  color: #22c55e
  c0: Commit {
    hash: "0-e3a3a20"
    message: "Initial commit"
  }
}
`;
    const doc = parseDslDocument(dsl);
    const components = createComponentsFromDsl(doc.components);

    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const viewportG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svgElement.appendChild(viewportG);

    const onHoverMock = vi.fn();
    const layout = computeGitFlowLayout(components, doc.relationships, theme);

    GitFlowRenderer.render(layout, viewportG, {
      theme,
      themeName: 'drako-dark',
      isDiagramLocked: false,
      onComponentHover: onHoverMock,
      svgElement
    });

    // Test branch badge hover
    const branchBadge = viewportG.querySelector('.git-branch-badge-group') as SVGElement;
    expect(branchBadge).not.toBeNull();

    branchBadge.dispatchEvent(new MouseEvent('mouseenter'));
    expect(onHoverMock).toHaveBeenCalledWith('Main');
    expect(branchBadge.classList.contains('hovered')).toBe(true);

    branchBadge.dispatchEvent(new MouseEvent('mouseleave'));
    expect(onHoverMock).toHaveBeenCalledWith(null);
    expect(branchBadge.classList.contains('hovered')).toBe(false);

    // Test commit circle hover
    const commitNode = viewportG.querySelector('.git-commit-node') as SVGElement;
    expect(commitNode).not.toBeNull();

    commitNode.dispatchEvent(new MouseEvent('mouseenter'));
    expect(onHoverMock).toHaveBeenCalledWith('c0');
    expect(commitNode.classList.contains('hovered')).toBe(true);

    commitNode.dispatchEvent(new MouseEvent('mouseleave'));
    expect(onHoverMock).toHaveBeenCalledWith(null);
    expect(commitNode.classList.contains('hovered')).toBe(false);
  });

  it('includes interactive hover highlighting styles and logic in exported HTML Player', () => {
    const dsl = `
Main: Branch {
  name: "main"
  c0: Commit { hash: "0-e3a3a20" }
}
`;
    const doc = parseDslDocument(dsl);
    const components = createComponentsFromDsl(doc.components);

    const html = exportToHTML('<svg></svg>', theme, dsl, {
      includeDocs: false,
      includeMinimap: false,
      components,
      relationships: [],
      themeName: 'drako-dark'
    });

    // Verify CSS styles for active highlight
    expect(html).toContain('.hl-active-token');
    expect(html).toContain('.git-commit-node.hovered');
    expect(html).toContain('.git-branch-badge-group.hovered');

    // Verify hover synchronizing script logic
    expect(html).toContain('highlightCodeForComponent');
    expect(html).toContain('componentHighlights');
  });

  it('correctly applies hl-active-token across multiline component code blocks in highlightDSL', () => {
    const dsl = `Dev: Branch {
  name: "develop"
  color: #3b82f6
}`;
    const result = highlightDSL(dsl, { start: 0, end: dsl.length });
    expect(result.html).toContain('class="hl-id hl-active-token"');
    expect(result.html).toContain('class="hl-keyword hl-active-token"');
    expect(result.html).toContain('class="hl-property hl-active-token"');
    expect(result.html).toContain('class="hl-string hl-active-token"');
    expect(result.html).toContain('class="hl-color hl-active-token"');
  });
});
