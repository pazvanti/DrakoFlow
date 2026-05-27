import { describe, it, expect } from 'vitest';
import { parseDslDocument } from '../../src/dsl/parser';

describe('relationship parsing', () => {
  it('parses a simple relationship', () => {
    const code = `A: Rectangle { label: "A" }
B: Rectangle { label: "B" }
A -> B`;
    const doc = parseDslDocument(code);
    expect(doc.relationships).toHaveLength(1);
    expect(doc.relationships[0]).toMatchObject({
      sourceId: 'A',
      targetId: 'B'
    });
  });

  it('parses cardinality, label, and style', () => {
    const code = `UserTable: Rectangle { label: "User" }
InvoiceTable: Rectangle { label: "Invoice" }
UserTable [1] -> [0..*] InvoiceTable : "has invoices" {
  lineStyle: "dashed"
  color: "#cccccc"
 }`;
    const doc = parseDslDocument(code);
    expect(doc.relationships[0]).toMatchObject({
      sourceId: 'UserTable',
      targetId: 'InvoiceTable',
      sourceCardinality: '1',
      targetCardinality: '0..*',
      label: 'has invoices',
      style: { lineStyle: 'dashed', color: '#cccccc' }
    });
  });

  it('parses reverse arrow (<-)', () => {
    const code = `A: Rectangle { label: "A" }
B: Rectangle { label: "B" }
B <- A`;
    const doc = parseDslDocument(code);
    expect(doc.relationships[0]).toMatchObject({
      sourceId: 'A',
      targetId: 'B',
      bidirectional: false
    });
  });

  it('parses bidirectional arrow (<->)', () => {
    const code = `A: Rectangle { label: "A" }
B: Rectangle { label: "B" }
A [1] <-> [0..*] B : "linked"`;
    const doc = parseDslDocument(code);
    expect(doc.relationships[0]).toMatchObject({
      sourceId: 'A',
      targetId: 'B',
      sourceCardinality: '1',
      targetCardinality: '0..*',
      label: 'linked',
      bidirectional: true
    });
  });

  it('parses components and relationships in order', () => {
    const code = `A: Process { label: "A" }
A -> B
B: Ellipse { label: "B" radius: 20 }`;
    const doc = parseDslDocument(code);
    expect(doc.components.map(c => c.id)).toEqual(['A', 'B']);
    expect(doc.relationships[0].targetId).toBe('B');
  });
});
