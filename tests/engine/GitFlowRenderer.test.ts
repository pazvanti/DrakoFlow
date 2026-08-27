// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { parseDslDocument } from '../../src/dsl/parser';
import { createComponentsFromDsl } from '../../src/engine/componentFactory';
import { computeGitFlowLayout } from '../../src/engine/gitflow/GitFlowLayout';
import { GitFlowRenderer } from '../../src/engine/gitflow/GitFlowRenderer';

describe('GitFlowRenderer', () => {
  const theme = {
    primaryColor: '#60a5fa',
    secondaryColor: '#a1a1aa',
    backgroundColor: '#18181b',
    textColor: '#f4f4f5',
    borderColor: '#52525b',
    fontFamily: 'Outfit, sans-serif'
  };

  const sampleDsl = `@layout: git-flow

Main: Branch {
  label: "main"

  c0: Commit {
    hash: "0-e3a3a20"
  }
  c2: Commit {
    type: "merge"
    tag: "v1.0"
  }
}

Develop: Branch {
  label: "develop"

  c1: Commit {
    hash: "1-201f4e4"
  }
}

c0 -> c1
c1 -> c2
c0 -> c2`;

  it('renders complete SVG structure with guide lines, paths, badges, and commit nodes', () => {
    const doc = parseDslDocument(sampleDsl);
    const components = createComponentsFromDsl(doc.components);
    const layout = computeGitFlowLayout(components, doc.relationships, theme, 'drako-dark');

    const viewportG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const onHover = vi.fn();

    GitFlowRenderer.render(layout, viewportG, {
      theme,
      themeName: 'drako-dark',
      isDiagramLocked: false,
      onComponentHover: onHover
    });

    const root = viewportG.querySelector('.git-flow-diagram');
    expect(root).not.toBeNull();

    // Check guide lines
    const guides = viewportG.querySelectorAll('.git-guide-line');
    expect(guides.length).toBe(2);

    // Check branch badges
    const branchBadges = viewportG.querySelectorAll('.git-branch-badge-group');
    expect(branchBadges.length).toBe(2);

    // Check paths
    const paths = viewportG.querySelectorAll('.git-branch-path');
    expect(paths.length).toBe(3);

    // Check commit nodes
    const commitNodes = viewportG.querySelectorAll('.git-commit-node');
    expect(commitNodes.length).toBe(3);

    // Check slanted hash badges
    const hashBadges = viewportG.querySelectorAll('.git-commit-hash-badge');
    expect(hashBadges.length).toBeGreaterThanOrEqual(2);

    // Check tag pill
    const tagPill = viewportG.querySelector('.git-tag-pill');
    expect(tagPill).not.toBeNull();
    expect(tagPill?.textContent).toBe('v1.0');
  });

  it('triggers hover callbacks on commit mouseenter and mouseleave', () => {
    const doc = parseDslDocument(sampleDsl);
    const components = createComponentsFromDsl(doc.components);
    const layout = computeGitFlowLayout(components, doc.relationships, theme, 'drako-dark');

    const viewportG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const onHover = vi.fn();

    GitFlowRenderer.render(layout, viewportG, {
      theme,
      themeName: 'drako-dark',
      isDiagramLocked: false,
      onComponentHover: onHover
    });

    const commitEl = viewportG.querySelector('.git-commit-node[data-id="c0"]') as SVGGElement;
    expect(commitEl).not.toBeNull();

    commitEl.dispatchEvent(new MouseEvent('mouseenter'));
    expect(onHover).toHaveBeenCalledWith('c0');
    expect(commitEl.classList.contains('hovered')).toBe(true);

    commitEl.dispatchEvent(new MouseEvent('mouseleave'));
    expect(onHover).toHaveBeenCalledWith(null);
    expect(commitEl.classList.contains('hovered')).toBe(false);
  });

  it('renders non-Git components (Text, VerticalContainer, Rectangle) and non-Git relationships', () => {
    const mixedDsl = `@layout: git-flow

Title: Text {
  label: "Pipeline Title"
  x: 40
  y: 15
}

Main: Branch {
  label: "main"
  c0: Commit { hash: "0-init" }
}

Notes: VerticalContainer {
  label: "Release Notes"
  x: 40
  y: 200

  Item1: Text { label: "• Item 1" }
}

Server: Rectangle {
  label: "Prod"
  x: 300
  y: 200
}

c0 -> Server : "deploy"
`;

    const doc = parseDslDocument(mixedDsl);
    const components = createComponentsFromDsl(doc.components);
    const layout = computeGitFlowLayout(components, doc.relationships, theme, 'drako-dark');

    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
    const viewportG = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    GitFlowRenderer.render(layout, viewportG, {
      theme,
      themeName: 'drako-dark',
      isDiagramLocked: false,
      svgElement
    });

    // Check non-git components rendered
    const titleEl = viewportG.querySelector('[data-id="Title"]');
    expect(titleEl).not.toBeNull();
    expect(titleEl?.classList.contains('diagram-component')).toBe(true);

    const notesEl = viewportG.querySelector('[data-id="Notes"]');
    expect(notesEl).not.toBeNull();
    expect(notesEl?.classList.contains('diagram-component')).toBe(true);

    const serverEl = viewportG.querySelector('[data-id="Server"]');
    expect(serverEl).not.toBeNull();

    // Check relationship paths layer exists for the non-git relationship c0 -> Server
    const relPaths = viewportG.querySelectorAll('.relationship-paths path');
    expect(relPaths.length).toBeGreaterThanOrEqual(1);

    const relLabels = viewportG.querySelectorAll('.relationship-labels text');
    expect(relLabels.length).toBeGreaterThanOrEqual(1);
    expect(Array.from(relLabels).some(el => el.textContent === 'deploy')).toBe(true);
  });
});
