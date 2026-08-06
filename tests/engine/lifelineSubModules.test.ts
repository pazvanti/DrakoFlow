// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { parseDslDocument } from '../../src/dsl/parser';
import { createComponentsFromDsl } from '../../src/engine/componentFactory';
import { indexComponentsById } from '../../src/engine/componentIndex';
import { layoutRootComponents } from '../../src/engine/layout';
import { renderRelationships } from '../../src/engine/relationshipRenderer';

const defaultTheme = {
  primaryColor: '#60a5fa',
  secondaryColor: '#a1a1aa',
  backgroundColor: '#18181b',
  textColor: '#f4f4f5',
  borderColor: '#52525b',
  fontFamily: 'Outfit, sans-serif'
};

describe('Lifeline Sub-Modules & Dot Notation', () => {
  it('parses relationship arrows with dot-notation target and source IDs', () => {
    const dsl = `
      ClientApp: Process {
        label: "Client App"
        lifeline: true
      }

      PaymentService: Process {
        label: "Payment System"
        lifeline: true

        AuthHandler: Rectangle {
          label: "Auth Sub-module"
        }
      }

      ClientApp -> PaymentService.AuthHandler : "1. Validate Request"
      PaymentService.AuthHandler -> ClientApp : "2. Response"
    `;

    const doc = parseDslDocument(dsl);
    expect(doc.components).toHaveLength(2);
    expect(doc.relationships).toHaveLength(2);
    expect(doc.relationships[0].sourceId).toBe('ClientApp');
    expect(doc.relationships[0].targetId).toBe('PaymentService.AuthHandler');
    expect(doc.relationships[1].sourceId).toBe('PaymentService.AuthHandler');
    expect(doc.relationships[1].targetId).toBe('ClientApp');
  });

  it('indexes child components with both child ID and parent.child dot notation', () => {
    const dsl = `
      PaymentService: Process {
        label: "Payment Microservice"
        lifeline: true

        AuthHandler: Rectangle {
          label: "Auth Sub-module"
        }
        FraudCheck: Rectangle {
          label: "Fraud Detector"
        }
      }
    `;

    const doc = parseDslDocument(dsl);
    const comps = createComponentsFromDsl(doc.components);
    const index = indexComponentsById(comps);

    expect(index.has('PaymentService')).toBe(true);
    expect(index.has('AuthHandler')).toBe(true);
    expect(index.has('FraudCheck')).toBe(true);
    expect(index.has('PaymentService.AuthHandler')).toBe(true);
    expect(index.has('PaymentService.FraudCheck')).toBe(true);
  });

  it('positions sub-module child components centered on parent vertical lifeline axis at relationship step Y-coordinates', () => {
    const dsl = `
      ClientApp: Process {
        label: "Client App"
        lifeline: true
      }

      PaymentService: Process {
        label: "Payment System"
        lifeline: true

        AuthHandler: Rectangle {
          label: "Auth Sub-module"
        }
        FraudCheck: Rectangle {
          label: "Fraud Detector"
        }
      }

      ClientApp -> PaymentService.AuthHandler : "1. Authenticate"
      PaymentService.AuthHandler -> PaymentService.FraudCheck : "2. Check Fraud"
    `;

    const doc = parseDslDocument(dsl);
    const comps = createComponentsFromDsl(doc.components);
    layoutRootComponents(comps, defaultTheme, doc.relationships, 'left-to-right');

    const index = indexComponentsById(comps);
    const parentIndexed = index.get('PaymentService')!;
    const authIndexed = index.get('PaymentService.AuthHandler')!;
    const fraudIndexed = index.get('PaymentService.FraudCheck')!;

    // Parent center X should match child center X
    const parentCenterX = parentIndexed.globalBounds.x + parentIndexed.globalBounds.width / 2;
    const authCenterX = authIndexed.globalBounds.x + authIndexed.globalBounds.width / 2;
    const fraudCenterX = fraudIndexed.globalBounds.x + fraudIndexed.globalBounds.width / 2;

    expect(authCenterX).toBeCloseTo(parentCenterX, 1);
    expect(fraudCenterX).toBeCloseTo(parentCenterX, 1);

    // FraudCheck should be placed below AuthHandler (step 2 vs step 1)
    expect(fraudIndexed.globalBounds.y).toBeGreaterThan(authIndexed.globalBounds.y);
  });

  it('renders SVG output with sub-module boxes and sequence relationship paths', () => {
    const dsl = `
      ClientApp: Process {
        label: "Client App"
        lifeline: true
      }

      PaymentService: Process {
        label: "Payment System"
        lifeline: true

        AuthHandler: Rectangle {
          label: "Auth Sub-module"
        }
      }

      LEFT -> ClientApp : "Request"
      ClientApp -> PaymentService.AuthHandler : "Process"
    `;

    const doc = parseDslDocument(dsl);
    const comps = createComponentsFromDsl(doc.components);
    layoutRootComponents(comps, defaultTheme, doc.relationships, 'left-to-right');
    const index = indexComponentsById(comps);

    const svgRoot = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const { pathsLayer, labelsLayer } = renderRelationships(doc.relationships, comps, defaultTheme, svgRoot, index);

    expect(pathsLayer.querySelectorAll('path').length).toBeGreaterThan(0);
    expect(labelsLayer.querySelectorAll('text').length).toBeGreaterThan(0);
  });
});
