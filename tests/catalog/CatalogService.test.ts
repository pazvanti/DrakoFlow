import { describe, it, expect } from 'vitest';
import { CatalogService, ComponentCatalog } from '../../src/catalog/ComponentCatalog';

describe('CatalogService', () => {
  it('should retrieve all unique tags', () => {
    const tags = CatalogService.getAllTags();
    expect(tags).toContain('Shapes');
    expect(tags).toContain('General');
    expect(tags).toContain('Flowchart');
    expect(tags).toContain('Layout');
    expect(tags).toContain('Containers');
    expect(tags).toContain('Deployment');
    expect(tags.length).toBeGreaterThanOrEqual(6);
  });

  it('should filter items by text query', () => {
    // Case insensitive match on name
    const matchesName = CatalogService.filterItems('rectangle', []);
    expect(matchesName.length).toBeGreaterThanOrEqual(1);
    expect(matchesName.some(i => i.type === 'Rectangle')).toBe(true);

    // Case insensitive match on description
    const matchesDesc = CatalogService.filterItems('standard', []);
    expect(matchesDesc.length).toBeGreaterThanOrEqual(1);

    // Match on type
    const matchesType = CatalogService.filterItems('Rect', []);
    expect(matchesType.length).toBeGreaterThanOrEqual(1);
    expect(matchesType.some(i => i.type === 'Rectangle')).toBe(true);

    // No matches
    const noMatches = CatalogService.filterItems('DatabaseTable', []);
    expect(noMatches.length).toBe(0);
  });

  it('should filter items by active tags', () => {
    // Single matching tag
    const matchShapes = CatalogService.filterItems('', ['Shapes']);
    expect(matchShapes.length).toBeGreaterThanOrEqual(3);

    // Multiple matching tags
    const matchBoth = CatalogService.filterItems('', ['Shapes', 'General']);
    expect(matchBoth.length).toBeGreaterThanOrEqual(2);

    // Non-matching tag
    const matchNone = CatalogService.filterItems('', ['Database']);
    expect(matchNone.length).toBe(0);
  });

  it('should filter items by both text query and active tags', () => {
    const matchBoth = CatalogService.filterItems('shape', ['Shapes']);
    expect(matchBoth.length).toBeGreaterThanOrEqual(1);

    const matchNone = CatalogService.filterItems('nonexistent', ['Shapes']);
    expect(matchNone.length).toBe(0);
  });
});
