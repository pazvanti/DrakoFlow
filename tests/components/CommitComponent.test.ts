// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { CommitComponent } from '../../src/components/CommitComponent';

describe('CommitComponent', () => {
  it('instantiates correctly with hash and tag', () => {
    const commit = new CommitComponent(
      { id: 'c0', type: 'Commit', tags: [] },
      { hash: '0-e3a3a20', tag: 'v1.0.0', type: 'normal' },
      {}
    );

    expect(commit.id).toBe('c0');
    expect(commit.commitHash).toBe('0-e3a3a20');
    expect(commit.tag).toBe('v1.0.0');
    expect(commit.commitType).toBe('normal');
    expect(() => commit.validateProps()).not.toThrow();
  });

  it('generates a deterministic hash if hash is omitted', () => {
    const commit1 = new CommitComponent(
      { id: 'c1', type: 'Commit', tags: [] },
      {},
      {}
    );

    expect(commit1.commitHash).toBeDefined();
    expect(commit1.commitHash.length).toBeGreaterThan(0);

    const commit2 = new CommitComponent(
      { id: 'c1', type: 'Commit', tags: [] },
      {},
      {}
    );
    expect(commit2.commitHash).toBe(commit1.commitHash);
  });

  it('validates property types', () => {
    const invalidHash = new CommitComponent(
      { id: 'c0', type: 'Commit', tags: [] },
      { hash: 123 as any },
      {}
    );
    expect(() => invalidHash.validateProps()).toThrow(/hash.*string/);

    const invalidTag = new CommitComponent(
      { id: 'c0', type: 'Commit', tags: [] },
      { tag: 123 as any },
      {}
    );
    expect(() => invalidTag.validateProps()).toThrow(/tag.*string/);

    const invalidType = new CommitComponent(
      { id: 'c0', type: 'Commit', tags: [] },
      { type: 'invalid-type' as any },
      {}
    );
    expect(() => invalidType.validateProps()).toThrow(/type.*must be one of/);
  });

  it('renders SVG representation for normal and merge commit nodes', () => {
    const theme = {
      primaryColor: '#60a5fa',
      secondaryColor: '#a1a1aa',
      backgroundColor: '#18181b',
      textColor: '#f4f4f5',
      borderColor: '#52525b',
      fontFamily: 'Outfit, sans-serif'
    };

    const normalCommit = new CommitComponent(
      { id: 'c0', type: 'Commit', tags: [] },
      { hash: '0-e3a3a20' },
      {}
    );
    const gNormal = normalCommit.render(theme);
    expect(gNormal.querySelector('circle')).not.toBeNull();
    expect(gNormal.querySelector('.git-commit-hash-badge text')?.textContent).toBe('0-e3a3a20');

    const mergeCommit = new CommitComponent(
      { id: 'c3', type: 'Commit', tags: [] },
      { type: 'merge' },
      {}
    );
    const gMerge = mergeCommit.render(theme);
    // Double ring for merge commit
    expect(gMerge.querySelectorAll('circle').length).toBe(3);
  });
});
