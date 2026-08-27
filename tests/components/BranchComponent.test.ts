// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { BranchComponent } from '../../src/components/BranchComponent';
import { CommitComponent } from '../../src/components/CommitComponent';

describe('BranchComponent', () => {
  it('instantiates correctly with props', () => {
    const branch = new BranchComponent(
      { id: 'Develop', type: 'Branch', tags: [] },
      { label: 'develop', order: 1, color: '#db2777' },
      {}
    );

    expect(branch.id).toBe('Develop');
    expect(branch.props.label).toBe('develop');
    expect(branch.order).toBe(1);
    expect(branch.color).toBe('#db2777');
    expect(() => branch.validateProps()).not.toThrow();
  });

  it('validates property types strictly', () => {
    const invalidLabel = new BranchComponent(
      { id: 'b1', type: 'Branch', tags: [] },
      { label: 123 as any },
      {}
    );
    expect(() => invalidLabel.validateProps()).toThrow(/label.*string/);

    const invalidOrder = new BranchComponent(
      { id: 'b1', type: 'Branch', tags: [] },
      { order: 'first' as any },
      {}
    );
    expect(() => invalidOrder.validateProps()).toThrow(/order.*number/);

    const invalidColor = new BranchComponent(
      { id: 'b1', type: 'Branch', tags: [] },
      { color: 123 as any },
      {}
    );
    expect(() => invalidColor.validateProps()).toThrow(/color.*string/);
  });

  it('can contain child Commit components', () => {
    const branch = new BranchComponent(
      { id: 'Main', type: 'Branch', tags: [] },
      { label: 'main' },
      {}
    );

    const c0 = new CommitComponent(
      { id: 'c0', type: 'Commit', tags: [] },
      { hash: '0-e3a3a20' },
      {}
    );

    branch.children.push(c0);
    expect(branch.children.length).toBe(1);
    expect(branch.children[0]).toBe(c0);
  });

  it('renders SVG representation with branch badge and commits group', () => {
    const branch = new BranchComponent(
      { id: 'Main', type: 'Branch', tags: [] },
      { label: 'main', color: '#71717a' },
      {}
    );

    const theme = {
      primaryColor: '#60a5fa',
      secondaryColor: '#a1a1aa',
      backgroundColor: '#18181b',
      textColor: '#f4f4f5',
      borderColor: '#52525b',
      fontFamily: 'Outfit, sans-serif'
    };

    const g = branch.render(theme);
    expect(g.tagName.toLowerCase()).toBe('g');
    expect(g.querySelector('.git-branch-badge')).not.toBeNull();
    expect(g.querySelector('text')?.textContent).toBe('main');
  });
});
