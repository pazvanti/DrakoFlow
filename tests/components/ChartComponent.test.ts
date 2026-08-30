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

  it('should parse and render Pie chart with labels, values, colors, and interactive legend', () => {
    const dsl = `
MyChart: Chart {
  width: 800
  height: 400
  title: "Sales Revenue"

  MyPieChart: Pie {
    labels: ["A", "B", "C", "D", "E"]
    values: [23, 45, 12, 67, 8]
    colors: [#f0f0f0, #ff0000, #00ff00, #0000ff, #00ffff]
  }
}
`;
    const doc = parseDslDocument(dsl);
    expect(doc.components).toHaveLength(1);
    expect(doc.components[0].childEntries).toHaveLength(1);

    const components = createComponentsFromDsl(doc.components);
    const chart = components[0] as ChartComponent;
    const svg = chart.render(mockTheme);

    // Verify Pie Group and Slices
    const pieGroup = svg.querySelector('.chart-pie-group');
    expect(pieGroup).not.toBeNull();

    const slices = svg.querySelectorAll('.chart-pie-slice');
    expect(slices.length).toBe(5);

    // Verify slice paths and tooltips
    const firstSlice = slices[0];
    const path = firstSlice.querySelector('path');
    expect(path).not.toBeNull();
    expect(path?.getAttribute('fill')).toBe('#f0f0f0');

    const titleTag = firstSlice.querySelector('title');
    expect(titleTag?.textContent).toContain('A: 23');

    // Verify Legend
    const legendGroup = svg.querySelector('.chart-pie-legend');
    expect(legendGroup).not.toBeNull();

    const legendItems = svg.querySelectorAll('.chart-legend-item');
    expect(legendItems.length).toBe(5);
    expect(legendItems[0].textContent).toContain('A');
  });

  it('should render Donut chart when donut: true or innerRadius is set', () => {
    const dsl = `
DonutChart: Chart {
  title: "Market Share"

  SharePie: Pie {
    labels: ["Product A", "Product B", "Product C"]
    values: [50, 30, 20]
    donut: true
  }
}
`;
    const doc = parseDslDocument(dsl);
    const components = createComponentsFromDsl(doc.components);
    const chart = components[0] as ChartComponent;
    const svg = chart.render(mockTheme);

    const slices = svg.querySelectorAll('.chart-pie-slice');
    expect(slices.length).toBe(3);

    // Donut paths contain both outer and inner arc commands (e.g. 'A' appears at least twice in 'd')
    const pathD = slices[0].querySelector('path')?.getAttribute('d') || '';
    const arcMatches = pathD.match(/A\s/g);
    expect(arcMatches && arcMatches.length).toBeGreaterThanOrEqual(2);
  });

  it('should render 3D Pie chart with extrusion side faces when is3D is true', () => {
    const dsl = `
ThreeDPieChart: Chart {
  title: "Asset Allocation"

  AllocationPie: Pie {
    labels: ["Stocks", "Bonds", "Real Estate"]
    values: [60, 25, 15]
    is3D: true
    depth: 20
  }
}
`;
    const doc = parseDslDocument(dsl);
    const components = createComponentsFromDsl(doc.components);
    const chart = components[0] as ChartComponent;
    const svg = chart.render(mockTheme);

    const sideGroups = svg.querySelectorAll('.pie-3d-side-group');
    expect(sideGroups.length).toBe(3);

    const topSlices = svg.querySelectorAll('.chart-pie-slice');
    expect(topSlices.length).toBe(3);
  });

  it('should parse and render Pie chart using items object array syntax', () => {
    const dsl = `
MyChart: Chart {
  width: 800
  height: 400

  title: "Sales Revenue"
  MyPieChart: Pie {
      items: [
        {
          label: "A"
          value: 23
          color: "#f0f0f0"
        }
        {
          label: "B"
          value: 45
          color: "#ff0000"
          textColor: "#ffffff"
        }
        {
          label: "C"
          value: 12
          color: "#00ff00"
        }
        {
          label: "D"
          value: 67
          color: "#0000ff"
        }
        {
          label: "E"
          value: 8
          color: "#00ffff"
        }
      ]
      is3D: true
      showLegend: true
   }
}
`;
    const doc = parseDslDocument(dsl);
    const components = createComponentsFromDsl(doc.components);
    const chart = components[0] as ChartComponent;
    const svg = chart.render(mockTheme);

    const slices = svg.querySelectorAll('.chart-pie-slice');
    expect(slices.length).toBe(5);

    const firstSlice = slices[0];
    expect(firstSlice.getAttribute('data-label')).toBe('A');
    expect(firstSlice.getAttribute('data-value')).toBe('23');
    expect(firstSlice.querySelector('.chart-pie-slice-top')?.getAttribute('fill')).toBe('#f0f0f0');

    // 3D extrusion sides
    const sideGroups = svg.querySelectorAll('.pie-3d-side-group');
    expect(sideGroups.length).toBe(5);

    // Legend
    const legendGroup = svg.querySelector('.chart-pie-legend');
    expect(legendGroup).not.toBeNull();
    const legendItems = svg.querySelectorAll('.chart-legend-item');
    expect(legendItems.length).toBe(5);

    // Verify default shows actual value text on slice
    const sliceTexts = svg.querySelectorAll('.chart-pie-slice text');
    expect(sliceTexts[0].textContent).toBe('23');

    // Verify pure CSS hover variables are set on slice group
    expect(firstSlice.getAttribute('style')).toContain('--exp-x:');
    expect(firstSlice.getAttribute('style')).toContain('--exp-y:');
  });

  it('should display percentage text when showPercentage is true', () => {
    const dsl = `
PiePercentage: Chart {
  MyPie: Pie {
    items: [
      { label: "A", value: 50 }
      { label: "B", value: 50 }
    ]
    showPercentage: true
  }
}
`;
    const doc = parseDslDocument(dsl);
    const components = createComponentsFromDsl(doc.components);
    const chart = components[0] as ChartComponent;
    const svg = chart.render(mockTheme);

    const sliceTexts = svg.querySelectorAll('.chart-pie-slice text');
    expect(sliceTexts[0].textContent).toBe('50%');
    expect(sliceTexts[1].textContent).toBe('50%');
  });

  it('should render standalone Pie component at top level with title, dimensions, items, is3D, and legend', () => {
    const dsl = `
MyPieChart: Pie {
  width: 800
  height: 400
  title: "Sales Revenue"

  items: [
    {
      label: "A"
      value: 23
    }
    {
      label: "B"
      value: 45
    }
    {
      label: "C"
      value: 12
      color: #00ff00
    }
    {
      label: "D"
      value: 67
      color: #0000ff
      textColor: #000000
    }
    {
      label: "E"
      value: 8
      color: #00ffff
    }
  ]
  is3D: true
  showLegend: true
  showPercentage: true
}
`;
    const doc = parseDslDocument(dsl);
    expect(doc.components).toHaveLength(1);
    expect(doc.components[0].type).toBe('Pie');

    const components = createComponentsFromDsl(doc.components);
    const pie = components[0] as PieComponent;
    expect(pie).toBeDefined();

    const svg = pie.render(mockTheme);
    expect(svg.getAttribute('class')).toContain('pie-component');

    // Title
    const titleText = svg.querySelector('text');
    expect(titleText?.textContent).toBe('Sales Revenue');

    // Slices
    const slices = svg.querySelectorAll('.chart-pie-slice');
    expect(slices.length).toBe(5);

    // 3D Skirts
    const sideGroups = svg.querySelectorAll('.pie-3d-side-group');
    expect(sideGroups.length).toBe(5);

    // Legend
    const legendGroup = svg.querySelector('.chart-pie-legend');
    expect(legendGroup).not.toBeNull();
    const legendItems = svg.querySelectorAll('.chart-legend-item');
    expect(legendItems.length).toBe(5);

    // Percentage
    const sliceTexts = svg.querySelectorAll('.chart-pie-slice text');
    expect(sliceTexts.length).toBeGreaterThanOrEqual(4);
    expect(sliceTexts[0].textContent).toContain('%');
  });

  it('should adapt colors correctly to light theme for both Chart and Pie components', () => {
    const lightTheme: ThemeVariables = {
      primaryColor: '#1d4ed8',
      secondaryColor: '#4b5563',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      borderColor: '#9ca3af',
      fontFamily: 'Outfit, sans-serif'
    };

    const dsl = `
MyPie: Pie {
  title: "Revenue"
  items: [
    { label: "Q1", value: 100 }
    { label: "Q2", value: 200 }
  ]
}
`;
    const doc = parseDslDocument(dsl);
    const components = createComponentsFromDsl(doc.components);
    const pie = components[0] as PieComponent;
    const svg = pie.render(lightTheme);

    // Card background should be white, border light grey
    const bgRect = svg.querySelector('rect');
    expect(bgRect?.getAttribute('fill')).toBe('#ffffff');
    expect(bgRect?.getAttribute('stroke')).toBe('#9ca3af');

    // Title should be dark text (#1f2937)
    const titleElem = svg.querySelector('text');
    expect(titleElem?.getAttribute('fill')).toBe('#1f2937');
  });
});
