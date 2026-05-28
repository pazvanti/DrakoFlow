// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { updateDslComponentPosition } from '../../src/utils/dslInsert';

describe('updateDslComponentPosition', () => {
  it('adds x and y coordinates to a component block if they do not exist', () => {
    const input = `Client: Process {
  label: "Client App"
}`;
    const output = updateDslComponentPosition(input, 'Client', 100, 200);
    expect(output).toBe(`Client: Process {
  label: "Client App"
  x: 100
  y: 200
}`);
  });

  it('updates existing x and y coordinates in a component block', () => {
    const input = `Client: Process {
  label: "Client App"
  x: 45
  y: -99
}`;
    const output = updateDslComponentPosition(input, 'Client', 123, 456);
    expect(output).toBe(`Client: Process {
  label: "Client App"
  x: 123
  y: 456
}`);
  });

  it('does not confuse rx or ry properties with x or y properties', () => {
    const input = `Database: Rectangle {
  label: "Database"
  rx: 6
  ry: 6
}`;
    const output = updateDslComponentPosition(input, 'Database', 100, 200);
    expect(output).toBe(`Database: Rectangle {
  label: "Database"
  rx: 6
  ry: 6
  x: 100
  y: 200
}`);
  });

  it('preserves other component blocks and comments', () => {
    const input = `// A comment
Client: Process {
  label: "Client App"
}

Server: Process {
  label: "Server App"
  x: 10
  y: 20
}`;
    const output = updateDslComponentPosition(input, 'Client', 50, 60);
    expect(output).toBe(`// A comment
Client: Process {
  label: "Client App"
  x: 50
  y: 60
}

Server: Process {
  label: "Server App"
  x: 10
  y: 20
}`);
  });
});
