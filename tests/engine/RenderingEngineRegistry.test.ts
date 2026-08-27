// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { parseDslDocument } from '../../src/dsl/parser';
import { EngineRegistry } from '../../src/engine/EngineRegistry';
import { GitFlowEngine } from '../../src/engine/gitflow/GitFlowEngine';
import { StandardEngine } from '../../src/engine/StandardEngine';

describe('EngineRegistry and Engine Selection', () => {
  const registry = EngineRegistry.getInstance();

  it('contains GitFlowEngine and StandardEngine by default', () => {
    const engines = registry.getAllEngines();
    expect(engines.some(e => e instanceof GitFlowEngine)).toBe(true);
    expect(engines.some(e => e instanceof StandardEngine)).toBe(true);
  });

  it('selects StandardEngine for default standard diagrams', () => {
    const dsl = `
Client: Process {
  label: "Client App"
}
Server: Process {
  label: "Server App"
}
Client -> Server : "Request"`;

    const doc = parseDslDocument(dsl);
    const engine = registry.getEngine(doc);
    expect(engine.id).toBe('standard');
  });

  it('selects GitFlowEngine when @layout: git-flow is specified', () => {
    const dsl = `@layout: git-flow

Main: Branch {
  label: "main"
}
c0: Commit {
  branch: "main"
}`;

    const doc = parseDslDocument(dsl);
    const engine = registry.getEngine(doc, doc.layout);
    expect(engine.id).toBe('git-flow');
  });

  it('auto-detects GitFlowEngine when Branch or Commit components exist', () => {
    const dsl = `Main: Branch {
  label: "main"
  c0: Commit {
    hash: "0-e3a3a20"
  }
}`;

    const doc = parseDslDocument(dsl);
    const engine = registry.getEngine(doc);
    expect(engine.id).toBe('git-flow');
  });

  it('renders successfully using GitFlowEngine', () => {
    const dsl = `@layout: git-flow

Main: Branch {
  label: "main"
  c0: Commit {
    hash: "0-e3a3a20"
  }
}`;

    const doc = parseDslDocument(dsl);
    const engine = registry.getEngine(doc, doc.layout);

    const theme = {
      primaryColor: '#60a5fa',
      secondaryColor: '#a1a1aa',
      backgroundColor: '#18181b',
      textColor: '#f4f4f5',
      borderColor: '#52525b',
      fontFamily: 'Outfit, sans-serif'
    };

    const viewportG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const result = engine.render({
      document: doc,
      displayComponents: doc.components,
      displayRelationships: doc.relationships,
      theme,
      themeName: 'drako-dark',
      viewportG,
      isDiagramLocked: false
    });

    expect(result.engineId).toBe('git-flow');
    expect(result.componentsCount).toBe(1);
    expect(viewportG.querySelector('.git-flow-diagram')).not.toBeNull();
  });
});
