// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { ComponentMetadata, ThemeVariables } from '../../src/components/BaseComponent';
import { UsecaseComponent } from '../../src/components/UsecaseComponent';
import { BoundaryComponent } from '../../src/components/BoundaryComponent';
import { ControlComponent } from '../../src/components/ControlComponent';
import { EntityComponent } from '../../src/components/EntityComponent';
import { QueueComponent } from '../../src/components/QueueComponent';
import { CollectionsComponent } from '../../src/components/CollectionsComponent';
import { AgentComponent } from '../../src/components/AgentComponent';

describe('New UML Use Case, Sequence, and Robustness Components', () => {
  const theme: ThemeVariables = {
    primaryColor: '#0d6efd',
    secondaryColor: '#6c757d',
    backgroundColor: '#ffffff',
    textColor: '#212529',
    borderColor: '#dee2e6',
    fontFamily: 'sans-serif'
  };

  it('renders a Usecase component (Ellipse shape)', () => {
    const meta: ComponentMetadata = { id: 'uc1', type: 'Usecase', tags: [] };
    const usecase = new UsecaseComponent(meta, { label: 'My Usecase' }, {});
    const minDim = usecase.calculateMinDimensions(theme);
    expect(minDim.width).toBeGreaterThanOrEqual(120);
    expect(minDim.height).toBe(60);

    usecase.bounds = { x: 10, y: 15, width: 140, height: 60 };
    const g = usecase.render(theme);
    expect(g.getAttribute('transform')).toBe('translate(10, 15)');
    const ellipse = g.querySelector('ellipse');
    expect(ellipse).not.toBeNull();
    expect(ellipse?.getAttribute('cx')).toBe('70');
    expect(ellipse?.getAttribute('cy')).toBe('30');
    const text = g.querySelector('text');
    expect(text?.textContent).toBe('My Usecase');
    expect(text?.getAttribute('dominant-baseline')).toBe('central');
  });

  it('renders a Boundary component (Robustness Boundary shape)', () => {
    const meta: ComponentMetadata = { id: 'bd1', type: 'Boundary', tags: [] };
    const boundary = new BoundaryComponent(meta, { label: 'BoundaryUI' }, {});
    const minDim = boundary.calculateMinDimensions(theme);
    expect(minDim.width).toBeGreaterThanOrEqual(90);
    expect(minDim.height).toBe(80);

    boundary.bounds = { x: 20, y: 30, width: 100, height: 80 };
    const g = boundary.render(theme);
    expect(g.getAttribute('transform')).toBe('translate(20, 30)');
    const circle = g.querySelector('circle');
    expect(circle).not.toBeNull();
    expect(circle?.getAttribute('r')).toBe('10');
    const lines = g.querySelectorAll('line');
    expect(lines.length).toBe(2); // horizontal connector + vertical line
    const text = g.querySelector('text');
    expect(text?.textContent).toBe('BoundaryUI');
  });

  it('renders a Control component (Robustness Control shape)', () => {
    const meta: ComponentMetadata = { id: 'ct1', type: 'Control', tags: [] };
    const control = new ControlComponent(meta, { label: 'AuthControl' }, {});
    const minDim = control.calculateMinDimensions(theme);
    expect(minDim.width).toBeGreaterThanOrEqual(90);
    expect(minDim.height).toBe(80);

    control.bounds = { x: 30, y: 40, width: 100, height: 80 };
    const g = control.render(theme);
    expect(g.getAttribute('transform')).toBe('translate(30, 40)');
    const circle = g.querySelector('circle');
    expect(circle).not.toBeNull();
    expect(circle?.getAttribute('r')).toBe('10');
    const paths = g.querySelectorAll('path');
    expect(paths.length).toBe(2); // arrow arc + arrowhead
    const text = g.querySelector('text');
    expect(text?.textContent).toBe('AuthControl');
  });

  it('renders an Entity component (Robustness Entity shape)', () => {
    const meta: ComponentMetadata = { id: 'ent1', type: 'Entity', tags: [] };
    const entity = new EntityComponent(meta, { label: 'UserEntity' }, {});
    const minDim = entity.calculateMinDimensions(theme);
    expect(minDim.width).toBeGreaterThanOrEqual(90);
    expect(minDim.height).toBe(80);

    entity.bounds = { x: 40, y: 50, width: 100, height: 80 };
    const g = entity.render(theme);
    expect(g.getAttribute('transform')).toBe('translate(40, 50)');
    const circle = g.querySelector('circle');
    expect(circle).not.toBeNull();
    expect(circle?.getAttribute('r')).toBe('10');
    const line = g.querySelector('line');
    expect(line).not.toBeNull(); // horizontal baseline
    const text = g.querySelector('text');
    expect(text?.textContent).toBe('UserEntity');
  });

  it('renders a Queue component (Queue tube/pipe shape)', () => {
    const meta: ComponentMetadata = { id: 'q1', type: 'Queue', tags: [] };
    const queue = new QueueComponent(meta, { label: 'MsgQueue' }, {});
    const minDim = queue.calculateMinDimensions(theme);
    expect(minDim.width).toBeGreaterThanOrEqual(120);
    expect(minDim.height).toBe(50);

    queue.bounds = { x: 50, y: 60, width: 150, height: 50 };
    const g = queue.render(theme);
    expect(g.getAttribute('transform')).toBe('translate(50, 60)');
    const paths = g.querySelectorAll('path');
    expect(paths.length).toBe(2); // tube body + endcap arc
    const mouth = g.querySelector('ellipse');
    expect(mouth).not.toBeNull(); // open mouth left ellipse
    const text = g.querySelector('text');
    expect(text?.textContent).toBe('MsgQueue');
  });

  it('renders a Collections component (Stacked participants)', () => {
    const meta: ComponentMetadata = { id: 'col1', type: 'Collections', tags: [] };
    const collections = new CollectionsComponent(meta, { label: 'Participants' }, {});
    const minDim = collections.calculateMinDimensions(theme);
    expect(minDim.width).toBeGreaterThanOrEqual(108);
    expect(minDim.height).toBe(68);

    collections.bounds = { x: 60, y: 70, width: 120, height: 68 };
    const g = collections.render(theme);
    expect(g.getAttribute('transform')).toBe('translate(60, 70)');
    const rects = g.querySelectorAll('rect');
    expect(rects.length).toBe(2); // two offset overlapping rectangles
    const text = g.querySelector('text');
    expect(text?.textContent).toBe('Participants');
  });

  it('renders an Agent component (Double-border container)', () => {
    const meta: ComponentMetadata = { id: 'ag1', type: 'Agent', tags: [] };
    const agent = new AgentComponent(meta, { label: 'NotifierAgent' }, {});
    const minDim = agent.calculateMinDimensions(theme);
    expect(minDim.width).toBeGreaterThanOrEqual(140);
    expect(minDim.height).toBe(80);

    agent.bounds = { x: 70, y: 80, width: 160, height: 100 };
    const g = agent.render(theme);
    expect(g.getAttribute('transform')).toBe('translate(70, 80)');
    const rects = g.querySelectorAll('rect');
    expect(rects.length).toBe(2); // outer rounded rect + inner rounded rect
    const text = g.querySelector('text');
    expect(text?.textContent).toBe('NotifierAgent');
  });
});
