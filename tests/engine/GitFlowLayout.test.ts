import { describe, it, expect } from 'vitest';
import { parseDslDocument } from '../../src/dsl/parser';
import { createComponentsFromDsl } from '../../src/engine/componentFactory';
import { computeGitFlowLayout, getBranchColor } from '../../src/engine/gitflow/GitFlowLayout';

const sampleGitFlowDSL = `@layout: git-flow

Main: Branch {
  label: "main"

  c0: Commit {
    hash: "0-e3a3a20"
  }
  c3: Commit {
    type: "merge"
  }
  c4: Commit {
    hash: "4-646b55f"
  }
  c7: Commit {
    type: "merge"
  }
}

Develop: Branch {
  label: "develop"

  c1: Commit {
    hash: "1-201f4e4"
  }
  c2: Commit {
    hash: "2-6c2e9d5"
  }
}

Feature: Branch {
  label: "feature"

  c5: Commit {
    hash: "5-71f2792"
  }
  c6: Commit {
    hash: "6-e534d9"
  }
}

c0 -> c1
c1 -> c2
c2 -> c3
c0 -> c3
c3 -> c4
c4 -> c5
c5 -> c6
c6 -> c7
c4 -> c7`;

describe('GitFlowLayout', () => {
  const theme = {
    primaryColor: '#60a5fa',
    secondaryColor: '#a1a1aa',
    backgroundColor: '#18181b',
    textColor: '#f4f4f5',
    borderColor: '#52525b',
    fontFamily: 'Outfit, sans-serif'
  };

  it('correctly maps branches and lanes', () => {
    const doc = parseDslDocument(sampleGitFlowDSL);
    const components = createComponentsFromDsl(doc.components);
    const layout = computeGitFlowLayout(components, doc.relationships, theme, 'drako-dark');

    expect(layout.branches.length).toBe(3);
    expect(layout.branches[0].name).toBe('main');
    expect(layout.branches[1].name).toBe('develop');
    expect(layout.branches[2].name).toBe('feature');

    // Lane Y coordinates should be ordered vertically
    expect(layout.branches[0].y).toBeLessThan(layout.branches[1].y);
    expect(layout.branches[1].y).toBeLessThan(layout.branches[2].y);
  });

  it('computes chronological steps and X coordinates for commits', () => {
    const doc = parseDslDocument(sampleGitFlowDSL);
    const components = createComponentsFromDsl(doc.components);
    const layout = computeGitFlowLayout(components, doc.relationships, theme, 'drako-dark');

    expect(layout.commits.length).toBe(8);

    const c0 = layout.commits.find(c => c.id === 'c0')!;
    const c1 = layout.commits.find(c => c.id === 'c1')!;
    const c2 = layout.commits.find(c => c.id === 'c2')!;
    const c3 = layout.commits.find(c => c.id === 'c3')!;
    const c4 = layout.commits.find(c => c.id === 'c4')!;
    const c5 = layout.commits.find(c => c.id === 'c5')!;
    const c6 = layout.commits.find(c => c.id === 'c6')!;
    const c7 = layout.commits.find(c => c.id === 'c7')!;

    expect(c0.step).toBeLessThan(c1.step);
    expect(c1.step).toBeLessThan(c2.step);
    expect(c2.step).toBeLessThan(c3.step);
    expect(c3.step).toBeLessThan(c4.step);
    expect(c4.step).toBeLessThan(c5.step);
    expect(c5.step).toBeLessThan(c6.step);
    expect(c6.step).toBeLessThan(c7.step);

    expect(c0.x).toBeLessThan(c1.x);
    expect(c1.x).toBeLessThan(c2.x);
    expect(c2.x).toBeLessThan(c3.x);
  });

  it('generates fork, merge, and in-branch path definitions with smooth curves', () => {
    const doc = parseDslDocument(sampleGitFlowDSL);
    const components = createComponentsFromDsl(doc.components);
    const layout = computeGitFlowLayout(components, doc.relationships, theme, 'drako-dark');

    expect(layout.paths.length).toBe(9);

    const forkPath = layout.paths.find(p => p.sourceId === 'c0' && p.targetId === 'c1')!;
    expect(forkPath.pathType).toBe('fork');
    expect(forkPath.d).toContain('Q'); // Has quadratic bezier curve

    const inBranchPath = layout.paths.find(p => p.sourceId === 'c1' && p.targetId === 'c2')!;
    expect(inBranchPath.pathType).toBe('in-branch');
    expect(inBranchPath.d).toMatch(/^M [\d.]+,\d+ L [\d.]+,\d+$/);

    const mergePath = layout.paths.find(p => p.sourceId === 'c2' && p.targetId === 'c3')!;
    expect(mergePath.pathType).toBe('merge');
    expect(mergePath.d).toContain('Q');
  });

  it('supports flat commits with branch property', () => {
    const flatDsl = `@layout: git-flow

c0: Commit {
  hash: "c0"
  branch: "main"
}
c1: Commit {
  hash: "c1"
  branch: "feature"
}
c0 -> c1`;

    const doc = parseDslDocument(flatDsl);
    const components = createComponentsFromDsl(doc.components);
    const layout = computeGitFlowLayout(components, doc.relationships, theme, 'drako-dark');

    expect(layout.branches.length).toBe(2);
    expect(layout.branches.map(b => b.name)).toEqual(['main', 'feature']);
    expect(layout.commits.length).toBe(2);
  });

  it('returns appropriate branch colors per theme', () => {
    const darkColor0 = getBranchColor(0, 'drako-dark');
    const darkColor1 = getBranchColor(1, 'drako-dark');
    const explicit = getBranchColor(0, 'drako-dark', '#ff0000');

    expect(darkColor0).toBe('#71717a');
    expect(darkColor1).toBe('#db2777');
    expect(explicit).toBe('#ff0000');
  });

  it('correctly lays out non-Git components (Text, Containers, Shapes) alongside Git flow', () => {
    const mixedDsl = `@layout: git-flow

Title: Text {
  label: "Production Deployment Pipeline"
  x: 40
  y: 15
}

Main: Branch {
  label: "main"
  c0: Commit { hash: "0-init" }
  c2: Commit { type: "merge" }
}

Develop: Branch {
  label: "develop"
  c1: Commit { hash: "1-feat" }
}

c0 -> c1
c1 -> c2
c0 -> c2

InfoBox: VerticalContainer {
  label: "Branching Rules"
  x: 40
  y: 280

  Rule1: Text { label: "1. PR required for merge" }
  Rule2: Text { label: "2. Tests must pass" }
}

Server: Rectangle {
  label: "Production Cluster"
  x: 350
  y: 280
}

c2 -> Server : "triggers deploy"
`;

    const doc = parseDslDocument(mixedDsl);
    const components = createComponentsFromDsl(doc.components);
    const layout = computeGitFlowLayout(components, doc.relationships, theme, 'drako-dark');

    expect(layout.branches.length).toBe(2);
    expect(layout.commits.length).toBe(3);
    expect(layout.nonGitComponents.length).toBe(3); // Title, InfoBox, Server

    const titleComp = layout.nonGitComponents.find(c => c.id === 'Title')!;
    expect(titleComp).toBeDefined();
    expect(titleComp.bounds.x).toBe(40);
    expect(titleComp.bounds.y).toBe(15);

    const infoBoxComp = layout.nonGitComponents.find(c => c.id === 'InfoBox')!;
    expect(infoBoxComp).toBeDefined();
    expect(infoBoxComp.bounds.x).toBe(40);
    expect(infoBoxComp.bounds.y).toBe(280);
    expect((infoBoxComp as any).children.length).toBe(2);
    expect((infoBoxComp as any).children[0].bounds.y).toBeGreaterThan(0);

    const serverComp = layout.nonGitComponents.find(c => c.id === 'Server')!;
    expect(serverComp).toBeDefined();
    expect(serverComp.bounds.x).toBe(350);
    expect(serverComp.bounds.y).toBe(280);

    // Non-git relationship should be identified
    expect(layout.nonGitRelationships.length).toBe(1);
    expect(layout.nonGitRelationships[0].sourceId).toBe('c2');
    expect(layout.nonGitRelationships[0].targetId).toBe('Server');
    expect(layout.nonGitRelationships[0].label).toBe('triggers deploy');

    // Bounding box should encompass both title at y=15 and server at y=280+height
    expect(layout.bbox.y).toBeLessThanOrEqual(15);
    expect(layout.bbox.y + layout.bbox.height).toBeGreaterThan(320);
  });

  it('automatically positions non-Git components without manual coordinates below Git tracks', () => {
    const autoDsl = `@layout: git-flow

Main: Branch {
  label: "main"
  c0: Commit { hash: "0-init" }
}

Legend: Text {
  label: "Automatic note below tracks"
}
`;

    const doc = parseDslDocument(autoDsl);
    const components = createComponentsFromDsl(doc.components);
    const layout = computeGitFlowLayout(components, doc.relationships, theme, 'drako-dark');

    expect(layout.branches.length).toBe(1);
    expect(layout.nonGitComponents.length).toBe(1);

    const legend = layout.nonGitComponents.find(c => c.id === 'Legend')!;
    expect(legend).toBeDefined();
    // Should be placed below the main branch y (which is 60)
    expect(legend.bounds.y).toBeGreaterThan(60);
  });

  it('handles diagrams with only non-Git components gracefully under git-flow layout', () => {
    const nonGitDsl = `@layout: git-flow

BoxA: Rectangle { label: "Component A" }
BoxB: Rectangle { label: "Component B" }
BoxA -> BoxB
`;

    const doc = parseDslDocument(nonGitDsl);
    const components = createComponentsFromDsl(doc.components);
    const layout = computeGitFlowLayout(components, doc.relationships, theme, 'drako-dark');

    expect(layout.branches.length).toBe(0);
    expect(layout.commits.length).toBe(0);
    expect(layout.nonGitComponents.length).toBe(2);
    expect(layout.nonGitRelationships.length).toBe(1);
    expect(layout.bbox.width).toBeGreaterThan(0);
  });

  it('applies custom branch color and propagates to commits and in-branch paths', () => {
    const colorDsl = `@layout: git-flow

Main: Branch {
  label: "main"
  color: #ff0000

  c0: Commit {
    hash: "0-e3a3a20"
  }
  c1: Commit {
    hash: "1-custom"
    color: #00ff00
  }
}
c0 -> c1
`;

    const doc = parseDslDocument(colorDsl);
    const components = createComponentsFromDsl(doc.components);
    const layout = computeGitFlowLayout(components, doc.relationships, theme, 'drako-dark');

    expect(layout.branches[0].color).toBe('#ff0000');
    expect(layout.commits[0].color).toBe('#ff0000');
    expect(layout.commits[1].color).toBe('#00ff00');
    expect(layout.paths[0].color).toBe('#ff0000');
  });
});
