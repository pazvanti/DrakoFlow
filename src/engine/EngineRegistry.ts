import { RenderingEngine } from './types';
import { StandardEngine } from './StandardEngine';
import { GitFlowEngine } from './gitflow/GitFlowEngine';
import { MindmapEngine } from './mindmap/MindmapEngine';
import { DslDocument } from '../dsl/parser';

export class EngineRegistry {
  private static instance: EngineRegistry;
  private engines: RenderingEngine[] = [];

  private constructor() {
    // Register default engines (specialized engines first, fallback last)
    this.registerEngine(new GitFlowEngine());
    this.registerEngine(new MindmapEngine());
    this.registerEngine(new StandardEngine());
  }

  public static getInstance(): EngineRegistry {
    if (!EngineRegistry.instance) {
      EngineRegistry.instance = new EngineRegistry();
    }
    return EngineRegistry.instance;
  }

  public registerEngine(engine: RenderingEngine): void {
    const existingIdx = this.engines.findIndex(e => e.id === engine.id);
    if (existingIdx >= 0) {
      this.engines[existingIdx] = engine;
    } else {
      // Keep standard engine at the very end as default fallback
      const standardIdx = this.engines.findIndex(e => e.id === 'standard');
      if (standardIdx >= 0 && engine.id !== 'standard') {
        this.engines.splice(standardIdx, 0, engine);
      } else {
        this.engines.push(engine);
      }
    }
  }

  public getEngine(document: DslDocument, layoutDirective?: string): RenderingEngine {
    for (const engine of this.engines) {
      if (engine.canHandle(document, layoutDirective)) {
        return engine;
      }
    }
    return this.engines.find(e => e.id === 'standard') || this.engines[0];
  }

  public getEngineById(id: string): RenderingEngine | undefined {
    return this.engines.find(e => e.id === id);
  }

  public getAllEngines(): RenderingEngine[] {
    return [...this.engines];
  }
}
