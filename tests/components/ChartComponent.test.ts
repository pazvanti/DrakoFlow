// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { parseDslDocument } from '../../src/dsl/parser';
import { createComponentsFromDsl } from '../../src/engine/componentFactory';
import { ChartComponent } from '../../src/components/ChartComponent';
import { BarComponent } from '../../src/components/BarComponent';
import { LineComponent } from '../../src/components/LineComponent';
import { ThemeVariables } from '../../src/components/BaseComponent';

const mockTheme: ThemeVariables = {
  primaryColor: '#38bdf8',
  secondaryColor: '#4ade80',
  backgroundColor: '#18181b',
  textColor: '#f4f4f5',
  borderColor: '#3f3f46',
  fontFamily: 'Outfit, system-ui, sans-serif'
};

describe('ChartComponent', () => {
  it('should parse Chart DSL with range syntax and bracket array', () => {
    const dsl = `
MyChart: Chart {
  width: 800
  height: 600
  x: [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
  y: 4000 -> 11000
  title: "Sales Revenue"
  xLabel: "Months"
  yLabel: "Revenue (in $)"

  MyBarChart: Bar {
    values: [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    color: #ff0000
  }

  MyLineChart: Line {
    values: [5500, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    color: #00ff00
  }
}
`;

    const doc = parseDslDocument(dsl);
    expect(doc.components).toHaveLength(1);

    const chartNode = doc.components[0];
    expect(chartNode.id).toBe('MyChart');
    expect(chartNode.type).toBe('Chart');
    expect(chartNode.properties.width).toBe(800);
    expect(chartNode.properties.height).toBe(600);
    expect(chartNode.properties.title).toBe('Sales Revenue');
    expect(chartNode.properties.xLabel).toBe('Months');
    expect(chartNode.properties.yLabel).toBe('Revenue (in $)');
    expect(chartNode.properties.x).toEqual(['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']);
    expect(chartNode.properties.y).toEqual([4000, 11000]);
    expect(chartNode.childEntries).toHaveLength(2);
  });

  it('should instantiate ChartComponent with nested Bar and Line children', () => {
    const dsl = `
MyChart: Chart {
  width: 800
  height: 600
  x: [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
  y: 4000 -> 11000
  title: "Sales Revenue"

  MyBar: Bar {
    values: [5000, 6000, 7500]
    color: #38bdf8
  }

  MyLine: Line {
    values: [5500, 6200, 7800]
    color: #4ade80
  }
}
`;
    const doc = parseDslDocument(dsl);
    const components = createComponentsFromDsl(doc.components);

    expect(components).toHaveLength(1);
    const chart = components[0] as ChartComponent;
    expect(chart).toBeInstanceOf(ChartComponent);
    expect(chart.children).toHaveLength(2);
    expect(chart.children[0]).toBeInstanceOf(BarComponent);
    expect(chart.children[1]).toBeInstanceOf(LineComponent);
  });

  it('should render complete SVG with title, labels, ticks, bars, and line points', () => {
    const dsl = `
MyChart: Chart {
  width: 800
  height: 600
  x: [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
  y: 4000 -> 11000
  title: "Sales Revenue"
  xLabel: "Months"
  yLabel: "Revenue (in $)"

  MyBarChart: Bar {
    values: [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    color: #ff0000
  }

  MyLineChart: Line {
    values: [5500, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    color: #00ff00
  }
}
`;
    const doc = parseDslDocument(dsl);
    const components = createComponentsFromDsl(doc.components);
    const chart = components[0] as ChartComponent;
    const svg = chart.render(mockTheme);

    // Verify root SVG group
    expect(svg.tagName.toLowerCase()).toBe('g');
    expect(svg.getAttribute('class')).toContain('chart-component');
    expect(svg.getAttribute('id')).toBe('MyChart');

    // Title
    const title = Array.from(svg.querySelectorAll('text')).find(t => t.textContent === 'Sales Revenue');
    expect(title).toBeDefined();

    // Axis Labels
    const yLabel = Array.from(svg.querySelectorAll('text')).find(t => t.textContent === 'Revenue (in $)');
    expect(yLabel).toBeDefined();
    expect(yLabel?.getAttribute('transform')).toContain('rotate(-90');

    const xLabel = Array.from(svg.querySelectorAll('text')).find(t => t.textContent === 'Months');
    expect(xLabel).toBeDefined();

    // Category labels (jan .. dec)
    expect(Array.from(svg.querySelectorAll('text')).some(t => t.textContent === 'jan')).toBe(true);
    expect(Array.from(svg.querySelectorAll('text')).some(t => t.textContent === 'dec')).toBe(true);

    // Bars (12 bars rendered)
    const bars = svg.querySelectorAll('.chart-bar');
    expect(bars.length).toBe(12);
    expect(bars[0].getAttribute('fill')).toBe('#ff0000');
    expect(bars[0].getAttribute('data-category')).toBe('jan');
    expect(bars[0].getAttribute('data-value')).toBe('5000');

    // Line Path & Points (12 points rendered)
    const linePath = svg.querySelector('.chart-line-path');
    expect(linePath).toBeDefined();
    expect(linePath?.getAttribute('stroke')).toBe('#00ff00');

    const points = svg.querySelectorAll('.chart-line-point');
    expect(points.length).toBe(12);
    expect(points[6].getAttribute('data-category')).toBe('jul');
    expect(points[6].getAttribute('data-value')).toBe('11000');

    // Tooltip titles
    const barTitles = svg.querySelectorAll('.chart-bar title');
    expect(barTitles.length).toBe(12);
    expect(barTitles[0].textContent).toContain('5,000');
  });

  it('should auto-compute Y scale when y range is omitted', () => {
    const dsl = `
SimpleChart: Chart {
  title: "Auto Range"
  x: [A, B, C]

  Series1: Bar {
    values: [100, 200, 300]
  }
}
`;
    const doc = parseDslDocument(dsl);
    const components = createComponentsFromDsl(doc.components);
    const chart = components[0] as ChartComponent;
    const svg = chart.render(mockTheme);

    const bars = svg.querySelectorAll('.chart-bar');
    expect(bars.length).toBe(3);
    expect(bars[0].getAttribute('data-value')).toBe('100');
    expect(bars[2].getAttribute('data-value')).toBe('300');
  });

  it('should validate invalid values property gracefully', () => {
    const dsl = `
InvalidBar: Bar {
  values: "not an array"
}
`;
    const doc = parseDslDocument(dsl);
    expect(() => createComponentsFromDsl(doc.components)).toThrowError(/must be an array of numbers/);
  });

  it('should render filled area under Line chart when filled is true', () => {
    const dsl = `
AreaChart: Chart {
  title: "User Traffic"
  x: [Q1, Q2, Q3, Q4]
  y: 0 -> 1000

  TrafficLine: Line {
    values: [250, 450, 700, 950]
    color: #3b82f6
    filled: true
    fillOpacity: 0.4
  }
}
`;
    const doc = parseDslDocument(dsl);
    const components = createComponentsFromDsl(doc.components);
    const chart = components[0] as ChartComponent;
    const svg = chart.render(mockTheme);

    // Verify linearGradient in defs
    const gradient = svg.querySelector('defs linearGradient');
    expect(gradient).toBeDefined();
    expect(gradient?.getAttribute('id')).toContain('chart-area-grad-');

    // Verify area path
    const areaPath = svg.querySelector('.chart-line-area');
    expect(areaPath).toBeDefined();
    expect(areaPath?.getAttribute('fill')).toContain('url(#');
    expect(areaPath?.getAttribute('d')).toMatch(/^M \d+(?:\.\d+)?,/);
    expect(areaPath?.getAttribute('d')).toContain('Z');

    // Verify stroke line path is still rendered
    const strokeLine = svg.querySelector('.chart-line-path');
    expect(strokeLine).toBeDefined();
  });

  it('should render 3D columnar bars with front, top, and side faces when is3D is true', () => {
    const dsl = `
ThreeDChart: Chart {
  title: "Quarterly Revenue 3D"
  x: [2021, 2022, 2023, 2024]
  y: 0 -> 500

  RevenueBar: Bar {
    values: [150, 280, 420, 490]
    color: #10b981
    is3D: true
    depth: 10
  }
}
`;
    const doc = parseDslDocument(dsl);
    const components = createComponentsFromDsl(doc.components);
    const chart = components[0] as ChartComponent;
    const svg = chart.render(mockTheme);

    // Verify 3D bar groups (4 groups)
    const bar3dGroups = svg.querySelectorAll('.chart-bar-3d');
    expect(bar3dGroups.length).toBe(4);

    // Verify front rect, top polygon cap, and side polygon faces
    const frontFaces = svg.querySelectorAll('.chart-bar-front');
    expect(frontFaces.length).toBe(4);
    expect(frontFaces[0].getAttribute('fill')).toBe('#10b981');

    const topCaps = svg.querySelectorAll('.chart-bar-top');
    expect(topCaps.length).toBe(4);
    expect(topCaps[0].tagName.toLowerCase()).toBe('polygon');
    expect(topCaps[0].getAttribute('points')).toBeTruthy();

    const sideFaces = svg.querySelectorAll('.chart-bar-side');
    expect(sideFaces.length).toBe(4);
    expect(sideFaces[0].tagName.toLowerCase()).toBe('polygon');
    expect(sideFaces[0].getAttribute('points')).toBeTruthy();
  });
});
