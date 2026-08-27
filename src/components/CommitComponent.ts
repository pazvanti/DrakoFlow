import { BaseComponent, ComponentMetadata, ThemeVariables, Dimension } from './BaseComponent';

export type CommitType = 'normal' | 'merge' | 'highlight' | 'reverse';

export interface CommitProps {
  hash?: string;
  id?: string;
  label?: string;
  msg?: string;
  message?: string;
  tag?: string;
  type?: CommitType;
  branch?: string;
  color?: string;
}

/**
 * Deterministically generate a 7-character hex commit hash from a string or number seed.
 */
export function generateCommitHash(seed: string | number): string {
  const str = String(seed);
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0').slice(0, 7);
}

/**
 * Represents a single Git Commit in a Git Flow diagram.
 */
export class CommitComponent extends BaseComponent<CommitProps> {
  public commitHash: string;
  public commitType: CommitType;
  public tag?: string;
  public branchName?: string;
  public message?: string;
  public color?: string;

  constructor(
    metadata: ComponentMetadata,
    props: CommitProps,
    themeOverride: Partial<ThemeVariables>
  ) {
    super(metadata, props, themeOverride);
    this.commitType = props.type || 'normal';
    this.tag = props.tag;
    this.branchName = props.branch;
    this.message = props.label || props.msg || props.message;
    this.color = props.color;

    // Resolve hash: props.hash -> props.id -> deterministic hash from component id
    if (props.hash) {
      this.commitHash = props.hash;
    } else if (props.id && props.id !== metadata.id) {
      this.commitHash = props.id;
    } else {
      const matchNumber = metadata.id.match(/\d+/);
      const prefix = matchNumber ? matchNumber[0] : metadata.id;
      this.commitHash = `${prefix}-${generateCommitHash(metadata.id)}`;
    }
  }

  validateProps(): void {
    if (this.props.type !== undefined) {
      const validTypes: CommitType[] = ['normal', 'merge', 'highlight', 'reverse'];
      if (!validTypes.includes(this.props.type)) {
        throw new Error(`Component [${this.id}]: 'type' must be one of: ${validTypes.join(', ')}.`);
      }
    }
    if (this.props.hash !== undefined && typeof this.props.hash !== 'string') {
      throw new Error(`Component [${this.id}]: 'hash' must be a string.`);
    }
    if (this.props.tag !== undefined && typeof this.props.tag !== 'string') {
      throw new Error(`Component [${this.id}]: 'tag' must be a string.`);
    }
    if (this.props.branch !== undefined && typeof this.props.branch !== 'string') {
      throw new Error(`Component [${this.id}]: 'branch' must be a string.`);
    }
    if (this.props.color !== undefined && typeof this.props.color !== 'string') {
      throw new Error(`Component [${this.id}]: 'color' must be a string.`);
    }
  }

  calculateMinDimensions(_theme: ThemeVariables): Dimension {
    return { width: 44, height: 44 };
  }

  render(theme: ThemeVariables): SVGElement {
    const primary = this.resolveColor(this.themeOverride.primaryColor, theme, theme.primaryColor);
    const background = this.resolveColor(this.themeOverride.backgroundColor, theme, theme.backgroundColor);
    const text = this.resolveColor(this.themeOverride.textColor, theme, theme.textColor);
    const font = theme.fontFamily;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', this.id);
    g.setAttribute('class', `git-commit-node git-commit-${this.commitType}`);
    g.setAttribute('transform', `translate(${this.bounds.x}, ${this.bounds.y})`);

    const centerX = this.bounds.width / 2;
    const centerY = this.bounds.height / 2;

    // Tooltip title
    const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    const details = [
      `Commit: ${this.commitHash}`,
      this.branchName ? `Branch: ${this.branchName}` : null,
      this.commitType !== 'normal' ? `Type: ${this.commitType}` : null,
      this.tag ? `Tag: ${this.tag}` : null,
      this.message ? `Message: ${this.message}` : null
    ].filter(Boolean).join('\n');
    titleEl.textContent = details;
    g.appendChild(titleEl);

    // Commit node graphic
    if (this.commitType === 'merge') {
      // Outer ring + inner dark fill + center dot (matching reference image)
      const outerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      outerCircle.setAttribute('cx', centerX.toString());
      outerCircle.setAttribute('cy', centerY.toString());
      outerCircle.setAttribute('r', '10');
      outerCircle.setAttribute('fill', primary);
      g.appendChild(outerCircle);

      const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      innerCircle.setAttribute('cx', centerX.toString());
      innerCircle.setAttribute('cy', centerY.toString());
      innerCircle.setAttribute('r', '5.5');
      innerCircle.setAttribute('fill', background);
      g.appendChild(innerCircle);

      const centerDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      centerDot.setAttribute('cx', centerX.toString());
      centerDot.setAttribute('cy', centerY.toString());
      centerDot.setAttribute('r', '2.5');
      centerDot.setAttribute('fill', primary);
      g.appendChild(centerDot);
    } else if (this.commitType === 'highlight') {
      // Glowing halo outer ring
      const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      halo.setAttribute('cx', centerX.toString());
      halo.setAttribute('cy', centerY.toString());
      halo.setAttribute('r', '14');
      halo.setAttribute('fill', 'none');
      halo.setAttribute('stroke', primary);
      halo.setAttribute('stroke-width', '2');
      halo.setAttribute('stroke-dasharray', '3,2');
      g.appendChild(halo);

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', centerX.toString());
      circle.setAttribute('cy', centerY.toString());
      circle.setAttribute('r', '9');
      circle.setAttribute('fill', primary);
      g.appendChild(circle);
    } else if (this.commitType === 'reverse') {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', centerX.toString());
      circle.setAttribute('cy', centerY.toString());
      circle.setAttribute('r', '10');
      circle.setAttribute('fill', primary);
      g.appendChild(circle);

      // Revert "X"
      const xLine1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      xLine1.setAttribute('x1', (centerX - 4).toString());
      xLine1.setAttribute('y1', (centerY - 4).toString());
      xLine1.setAttribute('x2', (centerX + 4).toString());
      xLine1.setAttribute('y2', (centerY + 4).toString());
      xLine1.setAttribute('stroke', background);
      xLine1.setAttribute('stroke-width', '2');
      g.appendChild(xLine1);

      const xLine2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      xLine2.setAttribute('x1', (centerX + 4).toString());
      xLine2.setAttribute('y1', (centerY - 4).toString());
      xLine2.setAttribute('x2', (centerX - 4).toString());
      xLine2.setAttribute('y2', (centerY + 4).toString());
      xLine2.setAttribute('stroke', background);
      xLine2.setAttribute('stroke-width', '2');
      g.appendChild(xLine2);
    } else {
      // Normal solid circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', centerX.toString());
      circle.setAttribute('cy', centerY.toString());
      circle.setAttribute('r', '10');
      circle.setAttribute('fill', primary);
      g.appendChild(circle);
    }

    // Slanted commit hash badge (-45 degrees) if not a merge or if hash is present
    if (this.commitType !== 'merge' || this.props.hash) {
      const badgeG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      badgeG.setAttribute('class', 'git-commit-hash-badge');
      badgeG.setAttribute('transform', `translate(${centerX - 8}, ${centerY + 16}) rotate(-45)`);

      const textLen = this.commitHash.length;
      const bWidth = Math.max(56, textLen * 7.5 + 12);
      const bHeight = 18;

      const badgeBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      badgeBg.setAttribute('x', (-bWidth / 2).toString());
      badgeBg.setAttribute('y', '0');
      badgeBg.setAttribute('width', bWidth.toString());
      badgeBg.setAttribute('height', bHeight.toString());
      badgeBg.setAttribute('rx', '3');
      badgeBg.setAttribute('ry', '3');
      badgeBg.setAttribute('fill', '#27272a');
      badgeBg.setAttribute('stroke', '#3f3f46');
      badgeBg.setAttribute('stroke-width', '1');
      badgeBg.setAttribute('opacity', '0.9');
      badgeG.appendChild(badgeBg);

      const hashText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      hashText.setAttribute('x', '0');
      hashText.setAttribute('y', '12.5');
      hashText.setAttribute('text-anchor', 'middle');
      hashText.setAttribute('fill', '#f4f4f5');
      hashText.setAttribute('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace');
      hashText.setAttribute('font-size', '10.5px');
      hashText.setAttribute('font-weight', '600');
      hashText.textContent = this.commitHash;
      badgeG.appendChild(hashText);

      g.appendChild(badgeG);
    }

    // Tag badge above commit node
    if (this.tag) {
      const tagG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      tagG.setAttribute('class', 'git-tag-pill');
      tagG.setAttribute('transform', `translate(${centerX}, ${centerY - 22})`);

      const tagTextLen = this.tag.length;
      const tWidth = Math.max(48, tagTextLen * 7 + 16);
      const tHeight = 18;

      const tagBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      tagBg.setAttribute('x', (-tWidth / 2).toString());
      tagBg.setAttribute('y', (-tHeight).toString());
      tagBg.setAttribute('width', tWidth.toString());
      tagBg.setAttribute('height', tHeight.toString());
      tagBg.setAttribute('rx', '4');
      tagBg.setAttribute('ry', '4');
      tagBg.setAttribute('fill', primary);
      tagG.appendChild(tagBg);

      const tagText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tagText.setAttribute('x', '0');
      tagText.setAttribute('y', (-5).toString());
      tagText.setAttribute('text-anchor', 'middle');
      tagText.setAttribute('fill', '#ffffff');
      tagText.setAttribute('font-family', font);
      tagText.setAttribute('font-size', '10px');
      tagText.setAttribute('font-weight', 'bold');
      tagText.textContent = this.tag;
      tagG.appendChild(tagText);

      g.appendChild(tagG);
    }

    return g;
  }
}
