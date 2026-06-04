// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { TableComponent, TableProps } from '../../src/components/TableComponent';
import { ThemeVariables, ComponentMetadata } from '../../src/components/BaseComponent';

const mockTheme: ThemeVariables = {
  primaryColor: '#3b82f6',
  secondaryColor: '#10b981',
  backgroundColor: '#18181b',
  textColor: '#f4f4f5',
  borderColor: '#27272a',
  fontFamily: 'Outfit'
};

const mockMetadata: ComponentMetadata = {
  id: 'TestTable',
  type: 'Table',
  tags: []
};

describe('TableComponent', () => {
  it('validates header and rows properties correctly', () => {
    const validProps: TableProps = {
      header: ['H1', 'H2'],
      rows: [
        ['R1C1', 'R1C2'],
        ['R2C1', 'R2C2']
      ],
      headerAtTop: true,
      headerAtBottom: false
    };
    const comp = new TableComponent(mockMetadata, validProps, {});
    expect(() => comp.validateProps()).not.toThrow();

    const invalidHeaderProps: TableProps = {
      header: 'NotAnArray' as any
    };
    const invalidHeaderComp = new TableComponent(mockMetadata, invalidHeaderProps, {});
    expect(() => invalidHeaderComp.validateProps()).toThrow(/header/);

    const invalidRowsProps: TableProps = {
      rows: 'NotAMatrix' as any
    };
    const invalidRowsComp = new TableComponent(mockMetadata, invalidRowsProps, {});
    expect(() => invalidRowsComp.validateProps()).toThrow(/rows/);
  });

  it('calculates minimum dimensions accurately based on character counts', () => {
    const props: TableProps = {
      header: ['Short', 'A Much Longer Header Name'],
      rows: [
        ['R1C1', 'Short Cell'],
        ['R2C1', 'Another Relatively Long Cell Text']
      ]
    };
    const comp = new TableComponent(mockMetadata, props, {});
    const minDim = comp.calculateMinDimensions(mockTheme);

    // Column 1 max length is "Short" (5 chars). 5 * 8 + 20 = 60.
    // Column 2 max length is "Another Relatively Long Cell Text" (33 chars). 33 * 8 + 20 = 284.
    // Header Name "A Much Longer Header Name" (25 chars) is shorter than 33 chars.
    // Total Min Width should be 60 + 284 = 344.
    expect(minDim.width).toBe(344);

    // Row heights:
    // Header height: max of cell heights (Short = 1 line = 30px, A Much Longer Header Name = 1 line = 30px) => 30px
    // Row 1 height: max of cell heights (R1C1 = 1 line = 30px, Short Cell = 1 line = 30px) => 30px
    // Row 2 height: max of cell heights (R2C1 = 1 line = 30px, Another Relatively Long Cell Text = 1 line = 30px) => 30px
    // Header is at top by default. Header at bottom is false.
    // Total Min Height = 30 (header) + 30 (row 1) + 30 (row 2) = 90.
    expect(minDim.height).toBe(90);
  });

  it('renders SVG table outlines, grid lines, clip paths, and text elements', () => {
    const props: TableProps = {
      header: ['Col A', 'Col B'],
      rows: [
        ['Val A1', 'Val B1']
      ]
    };
    const comp = new TableComponent(mockMetadata, props, {});
    comp.bounds = { x: 10, y: 20, width: 200, height: 100 };

    const svg = comp.render(mockTheme);

    expect(svg.tagName).toBe('g');
    expect(svg.getAttribute('id')).toBe('TestTable');
    expect(svg.getAttribute('transform')).toBe('translate(10, 20)');

    // Should contain a clipPath
    const clipPath = svg.querySelector('clipPath');
    expect(clipPath).not.toBeNull();
    expect(clipPath?.getAttribute('id')).toBe('clip-TestTable');

    const clipRect = clipPath?.querySelector('rect');
    expect(clipRect?.getAttribute('width')).toBe('200');
    expect(clipRect?.getAttribute('height')).toBe('100');

    // Should contain clipped group
    const clippedG = svg.querySelector('g[clip-path="url(#clip-TestTable)"]');
    expect(clippedG).not.toBeNull();

    // Check cells text rendering
    const texts = clippedG?.querySelectorAll('text');
    expect(texts).toHaveLength(4); // 2 header texts + 2 row texts
    expect(texts?.[0].textContent).toBe('Col A');
    expect(texts?.[1].textContent).toBe('Col B');
    expect(texts?.[2].textContent).toBe('Val A1');
    expect(texts?.[3].textContent).toBe('Val B1');

    // Check grid lines rendering
    const lines = clippedG?.querySelectorAll('line');
    expect(lines?.length).toBeGreaterThanOrEqual(2); // 1 horizontal divider + 1 vertical divider

    // Check outline rect
    const outline = svg.querySelector('rect[fill="none"]');
    expect(outline).not.toBeNull();
    expect(outline?.getAttribute('width')).toBe('200');
    expect(outline?.getAttribute('height')).toBe('100');
    expect(outline?.getAttribute('stroke')).toBe('#27272a');
  });
});
