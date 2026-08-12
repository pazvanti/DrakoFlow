import { describe, it, expect } from 'vitest';
import { hasIcon, createIconSvgElement, getIconSpacing, normalizeIconName } from '../../src/utils/IconRegistry';
import { parseDslDocument } from '../../src/dsl/parser';
import { createComponentsFromDsl } from '../../src/engine/componentFactory';

describe('IconRegistry Unit Tests', () => {
  it('normalizes icon names correctly', () => {
    expect(normalizeIconName(' Docker ')).toBe('docker');
    expect(normalizeIconName('"postgres"')).toBe('postgres');
    expect(normalizeIconName('AWS')).toBe('aws');
  });

  it('verifies minimum requested icons exist in registry', () => {
    const requiredIcons = ['docker', 'aws', 'postgres', 'gear', 'database', 'web-service'];
    requiredIcons.forEach(name => {
      expect(hasIcon(name)).toBe(true);
    });
  });

  it('verifies core tech icons exist in registry', () => {
    const extraIcons = ['redis', 'react', 'node', 'python', 'kubernetes', 'lock', 'user', 'api', 'queue', 'storage', 'cpu'];
    extraIcons.forEach(name => {
      expect(hasIcon(name)).toBe(true);
    });
  });

  it('verifies newly added database, cloud, language, and security icons exist in registry', () => {
    const newIcons = [
      'mongodb', 'mongo', 'mysql', 'sqlite', 'elasticsearch', 'elastic', 'graphql', 'rabbitmq', 'amqp',
      'azure', 'gcp', 'google-cloud', 'terraform', 'github', 'gitlab', 'nginx', 'linux', 'tux', 'terminal', 'cli', 'bash',
      'typescript', 'ts', 'javascript', 'js', 'vue', 'vuejs', 'angular', 'svelte', 'nextjs', 'next',
      'java', 'golang', 'go', 'rust', 'php', 'ruby', 'swift', 'csharp', 'dotnet', 'net',
      'shield', 'firewall', 'key', 'token', 'mail', 'email', 'smtp', 'bell', 'alert', 'search', 'wifi', 'lightning'
    ];
    newIcons.forEach(name => {
      expect(hasIcon(name)).toBe(true);
    });
  });

  it('returns null for unknown icon names', () => {
    expect(hasIcon('nonexistent-icon-xyz')).toBe(false);
  });

  it('calculates icon spacing correctly', () => {
    expect(getIconSpacing('docker', 16, 6)).toBe(22);
    expect(getIconSpacing('unknown', 16, 6)).toBe(0);
  });

  it('parses DSL with icon property and instantiates component with icon', () => {
    const dsl = `
      AuthService: Cube {
        label: "Auth API"
        icon: "docker"
      }
      DB: Cylinder {
        label: "Postgres DB"
        icon: "postgres"
      }
      App: Process {
        label: "TypeScript App"
        icon: "typescript"
      }
    `;

    const doc = parseDslDocument(dsl);
    expect(doc.components).toHaveLength(3);
    expect(doc.components[0].properties.icon).toBe('docker');
    expect(doc.components[1].properties.icon).toBe('postgres');
    expect(doc.components[2].properties.icon).toBe('typescript');

    const components = createComponentsFromDsl(doc.components);
    expect(components[0].icon).toBe('docker');
    expect(components[1].icon).toBe('postgres');
    expect(components[2].icon).toBe('typescript');
  });
});
