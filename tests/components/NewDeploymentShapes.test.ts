// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { ComponentMetadata, ThemeVariables } from '../../src/components/BaseComponent';
import { CloudComponent } from '../../src/components/CloudComponent';
import { NodeComponent } from '../../src/components/NodeComponent';
import { ArtifactComponent } from '../../src/components/ArtifactComponent';
import { FolderComponent } from '../../src/components/FolderComponent';
import { FrameComponent } from '../../src/components/FrameComponent';
import { StorageComponent } from '../../src/components/StorageComponent';
import { StackComponent } from '../../src/components/StackComponent';
import { FileComponent } from '../../src/components/FileComponent';
import { CardComponent } from '../../src/components/CardComponent';

describe('New Deployment & Infrastructure Components', () => {
  const theme: ThemeVariables = {
    primaryColor: '#0d6efd',
    secondaryColor: '#6c757d',
    backgroundColor: '#ffffff',
    textColor: '#212529',
    borderColor: '#dee2e6',
    fontFamily: 'sans-serif'
  };

  it('renders a Cloud component', () => {
    const meta: ComponentMetadata = { id: 'cloud1', type: 'Cloud', tags: [] };
    const cloud = new CloudComponent(meta, { label: 'MyCloud' }, {});
    cloud.bounds = { x: 10, y: 10, width: 200, height: 120 };
    const g = cloud.render(theme);
    expect(g.getAttribute('transform')).toBe('translate(10, 10)');
    const path = g.querySelector('path');
    expect(path?.getAttribute('d')).toContain('M 30 90'); // path calculation
    const text = g.querySelector('text');
    expect(text?.textContent).toBe('MyCloud');
  });

  it('renders a Node component', () => {
    const meta: ComponentMetadata = { id: 'node1', type: 'Node', tags: [] };
    const node = new NodeComponent(meta, { label: 'MyNode' }, {});
    node.bounds = { x: 5, y: 5, width: 150, height: 150 };
    const g = node.render(theme);
    const paths = g.querySelectorAll('path');
    expect(paths.length).toBe(4); // top, top shade, right, right shade
    const rect = g.querySelector('rect');
    expect(rect?.getAttribute('width')).toBe('138'); // W - 12
    const text = g.querySelector('text');
    expect(text?.textContent).toBe('MyNode');
  });

  it('renders an Artifact component', () => {
    const meta: ComponentMetadata = { id: 'art1', type: 'Artifact', tags: [] };
    const artifact = new ArtifactComponent(meta, { label: 'artifact.jar' }, {});
    artifact.bounds = { x: 0, y: 0, width: 150, height: 80 };
    const g = artifact.render(theme);
    const rect = g.querySelector('rect');
    expect(rect).not.toBeNull();
    const paths = g.querySelectorAll('path');
    expect(paths.length).toBe(2); // doc sheet outer + fold
  });

  it('renders a Folder component', () => {
    const meta: ComponentMetadata = { id: 'fld1', type: 'Folder', tags: [] };
    const folder = new FolderComponent(meta, { label: 'assets/' }, {});
    folder.bounds = { x: 0, y: 0, width: 180, height: 100 };
    const g = folder.render(theme);
    const tab = g.querySelector('path');
    expect(tab).not.toBeNull();
    const body = g.querySelector('rect');
    expect(body?.getAttribute('y')).toBe('20');
  });

  it('renders a Frame component', () => {
    const meta: ComponentMetadata = { id: 'frm1', type: 'Frame', tags: [] };
    const frame = new FrameComponent(meta, { label: 'Subsystem' }, {});
    frame.bounds = { x: 0, y: 0, width: 200, height: 150 };
    const g = frame.render(theme);
    const body = g.querySelector('rect');
    expect(body?.getAttribute('width')).toBe('200');
    const headerTab = g.querySelector('path');
    expect(headerTab).not.toBeNull();
  });

  it('renders a Storage component', () => {
    const meta: ComponentMetadata = { id: 'stg1', type: 'Storage', tags: [] };
    const storage = new StorageComponent(meta, { label: 'DB Volume' }, {});
    storage.bounds = { x: 0, y: 0, width: 120, height: 60 };
    const g = storage.render(theme);
    const paths = g.querySelectorAll('path');
    expect(paths.length).toBe(2); // body + endcap
  });

  it('renders a Stack component', () => {
    const meta: ComponentMetadata = { id: 'stk1', type: 'Stack', tags: [] };
    const stack = new StackComponent(meta, { label: 'ReplicaStack' }, {});
    stack.bounds = { x: 0, y: 0, width: 100, height: 70 };
    const g = stack.render(theme);
    const rects = g.querySelectorAll('rect');
    expect(rects.length).toBe(3); // 3 stacked boxes
    const text = g.querySelector('text');
    expect(text?.textContent).toBe('ReplicaStack');
  });

  it('renders a File component', () => {
    const meta: ComponentMetadata = { id: 'file1', type: 'File', tags: [] };
    const file = new FileComponent(meta, { label: 'manifest.yml' }, {});
    file.bounds = { x: 0, y: 0, width: 120, height: 80 };
    const g = file.render(theme);
    const paths = g.querySelectorAll('path');
    expect(paths.length).toBe(2); // outline + fold
  });

  it('renders a Card component', () => {
    const meta: ComponentMetadata = { id: 'card1', type: 'Card', tags: [] };
    const card = new CardComponent(meta, { label: 'Task' }, {});
    card.bounds = { x: 0, y: 0, width: 150, height: 90 };
    const g = card.render(theme);
    const rects = g.querySelectorAll('rect');
    expect(rects.length).toBe(2); // body + stripe
    expect(rects[1].getAttribute('width')).toBe('5');
  });
});
