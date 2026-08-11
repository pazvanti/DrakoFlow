/**
 * DrakoFlow Icon Registry
 * Provides crisp SVG vector icons for DSL components.
 * All icons use `currentColor` or stroke/fill inheritance so they automatically
 * respect the text color, themes, and themeOverride properties.
 */

export interface IconOptions {
  size?: number;
  color?: string;
  className?: string;
}

// Map of normalized icon name -> inner SVG XML content
const ICON_PATH_MAP: Record<string, string> = {
  // Docker Whale with Container Cargo Grid
  'docker': `<path fill="currentColor" d="M3 10.5h2.5v2H3v-2zm3.5 0H9v2H6.5v-2zm3.5 0h2.5v2H10v-2zm3.5 0H16v2h-2.5v-2zm-7-3h2.5v2H6.5v-2zm3.5 0H9v2H10v-2zm3.5 0H16v2h-2.5v-2zm0-3H16v2h-2.5v-2zM22.8 13.2c-.4-.1-1.1.1-1.5.3-.4-.5-1.1-.9-1.8-1-.1-.7-.6-1.3-1.3-1.5V10h-1.5v1H.5v2.5c0 2.5 2 4.5 4.5 4.5h9c3.2 0 6.1-1.8 7.6-4.5 1-.2 1.9-.6 2.4-1.3.2-.2.1-.8-.2-1z"/>`,

  // AWS / Cloud
  'aws': `<path fill="currentColor" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/>`,
  'cloud': `<path fill="currentColor" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>`,

  // Official PostgreSQL Elephant Head (Slonik) - Full Scale
  'postgres': `<path fill="currentColor" fill-rule="evenodd" d="M21.1 7.4c-.7-1.8-2.1-3.2-3.8-3.9-2.5-1-5.4-.5-7.5 1.1-1.4 1.1-2.4 2.7-2.9 4.4-.4 1.1-.3 2.3 0 3.4.3 1.1.9 2 1.6 2.7-1.2 1.1-2 2.5-2.4 4-.5 2-.2 4.1.7 5.9.5.9 1.2 1.6 2 2.1 1.2.7 2.6.8 3.9.4 1.5-.5 2.8-1.7 3.5-3.3.8.4 1.7.6 2.6.6 2.8 0 5.4-1.4 6.7-3.8 1-1.7 1.4-3.8 1.2-5.8-.1-2-1-3.9-2.6-5.2-.4-.3-.7-.7-1-1zM9.5 18.5c-.5.2-1.1.2-1.6 0-.4-.3-.7-.7-.8-1.2-.4-1.1-.2-2.3.3-3.3.4-.8 1-1.5 1.8-2 .4 1.1 1 2.1 1.8 2.9-.4 1.2-.8 2.4-1.5 3.6zm9.3-4.3c-.9 1.6-2.6 2.6-4.4 2.6-.6 0-1.2-.1-1.8-.4.5-1.5 1-3 1.4-4.5.8-.4 1.6-.9 2.2-1.6.4.5.9.9 1.5 1.1 1 .5 2.1.6 3.1.3.1.8 0 1.7-.5 2.5z"/>`,
  'postgresql': `<path fill="currentColor" fill-rule="evenodd" d="M21.1 7.4c-.7-1.8-2.1-3.2-3.8-3.9-2.5-1-5.4-.5-7.5 1.1-1.4 1.1-2.4 2.7-2.9 4.4-.4 1.1-.3 2.3 0 3.4.3 1.1.9 2 1.6 2.7-1.2 1.1-2 2.5-2.4 4-.5 2-.2 4.1.7 5.9.5.9 1.2 1.6 2 2.1 1.2.7 2.6.8 3.9.4 1.5-.5 2.8-1.7 3.5-3.3.8.4 1.7.6 2.6.6 2.8 0 5.4-1.4 6.7-3.8 1-1.7 1.4-3.8 1.2-5.8-.1-2-1-3.9-2.6-5.2-.4-.3-.7-.7-1-1zM9.5 18.5c-.5.2-1.1.2-1.6 0-.4-.3-.7-.7-.8-1.2-.4-1.1-.2-2.3.3-3.3.4-.8 1-1.5 1.8-2 .4 1.1 1 2.1 1.8 2.9-.4 1.2-.8 2.4-1.5 3.6zm9.3-4.3c-.9 1.6-2.6 2.6-4.4 2.6-.6 0-1.2-.1-1.8-.4.5-1.5 1-3 1.4-4.5.8-.4 1.6-.9 2.2-1.6.4.5.9.9 1.5 1.1 1 .5 2.1.6 3.1.3.1.8 0 1.7-.5 2.5z"/>`,

  // Gear / Cog / Settings
  'gear': `<path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>`,
  'cog': `<path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>`,

  // Database / DB cylinder
  'database': `<path fill="currentColor" d="M12 2C6.48 2 2 4.02 2 6.5v11C2 20.02 6.48 22 12 22s10-1.98 10-4.5v-11C22 4.02 17.52 2 12 2zm0 3c4.14 0 7.5 1.34 7.5 2S16.14 9 12 9 4.5 7.66 4.5 7s3.36-2 7.5-2zm0 5c4.14 0 7.5-1.34 7.5-2v3.17c-1.74 1.16-4.48 1.83-7.5 1.83s-5.76-.67-7.5-1.83V10c0 .66 3.36 2 7.5 2zm0 5c4.14 0 7.5-1.34 7.5-2v3.17c-1.74 1.16-4.48 1.83-7.5 1.83s-5.76-.67-7.5-1.83V15c0 .66 3.36 2 7.5 2z"/>`,
  'db': `<path fill="currentColor" d="M12 2C6.48 2 2 4.02 2 6.5v11C2 20.02 6.48 22 12 22s10-1.98 10-4.5v-11C22 4.02 17.52 2 12 2zm0 3c4.14 0 7.5 1.34 7.5 2S16.14 9 12 9 4.5 7.66 4.5 7s3.36-2 7.5-2zm0 5c4.14 0 7.5-1.34 7.5-2v3.17c-1.74 1.16-4.48 1.83-7.5 1.83s-5.76-.67-7.5-1.83V10c0 .66 3.36 2 7.5 2zm0 5c4.14 0 7.5-1.34 7.5-2v3.17c-1.74 1.16-4.48 1.83-7.5 1.83s-5.76-.67-7.5-1.83V15c0 .66 3.36 2 7.5 2z"/>`,

  // Official REST / Web Service Node
  'web-service': `<path fill="currentColor" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3zm-6.5-6.5v-2h-1v2H9.5l2.5 3 2.5-3h-2zm-1 5v-2h1v2h2l-2.5 3-2.5-3h2z"/>`,
  'globe': `<path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>`,
  'server': `<path fill="currentColor" d="M4 3h16c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1zm0 7h16c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1zm0 7h16c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1zm3-12a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>`,

  // Official Redis Stacked Memory Layers
  'redis': `<path fill="currentColor" d="M12 2L2 7l10 5 10-5-10-5zm0 9l-3.5-1.75L2 12.5l10 5 10-5-6.5-3.25L12 11zm0 5.5l-3.5-1.75L2 18l10 5 10-5-6.5-3.25L12 16.5z"/>`,

  // Official React Atom Symbol
  'react': `<circle cx="12" cy="12" r="2.5" fill="currentColor"/><g fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="12" rx="9.5" ry="3.8"/><ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(120 12 12)"/></g>`,

  // Node / Node.js
  'node': `<path fill="currentColor" d="M12 2L3.5 7v10l8.5 5 8.5-5V7L12 2zm6.5 14L12 19.8 5.5 16V8.2L12 4.4l6.5 3.8V16z"/>`,

  // Official Python Intertwined Snakes Logo
  'python': `<path fill="currentColor" d="M11.88 2c-4.32 0-4.05 1.87-4.05 1.87l.01 1.94h4.12v.58H6.18S3.5 6.09 3.5 10.45s2.33 4.23 2.33 4.23h1.39v-1.95c0-2.45 2.1-2.45 2.1-2.45h4.12s1.95.03 1.95-1.9v-4.14S16.19 2 11.88 2zm-2.22 1.34a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zM12.12 22c4.32 0 4.05-1.87 4.05-1.87l-.01-1.94h-4.12v-.58h5.78s2.68.3 2.68-4.06-2.33-4.23-2.33-4.23h-1.39v1.95c0 2.45-2.1 2.45-2.1 2.45h-4.12s-1.95-.03-1.95 1.9v4.14S7.81 22 12.12 22zm2.22-1.34a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z"/>`,

  // Kubernetes / Helm / k8s
  'kubernetes': `<path fill="currentColor" d="M12 2L4 6v12l8 4 8-4V6l-8-4zm6 13.5l-6 3-6-3V7.5l6-3 6 3v8.5zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>`,
  'k8s': `<path fill="currentColor" d="M12 2L4 6v12l8 4 8-4V6l-8-4zm6 13.5l-6 3-6-3V7.5l6-3 6 3v8.5zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>`,

  // Lock / Security
  'lock': `<path fill="currentColor" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>`,
  'security': `<path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>`,

  // User / Avatar
  'user': `<path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>`,

  // Code / API
  'api': `<path fill="currentColor" d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>`,
  'code': `<path fill="currentColor" d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>`,

  // Queue / Kafka
  'queue': `<path fill="currentColor" d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"/>`,

  // Storage / S3 / Bucket
  'storage': `<path fill="currentColor" d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V8h14v10z"/>`,
  's3': `<path fill="currentColor" d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V8h14v10z"/>`,

  // CPU / Microservice
  'cpu': `<path fill="currentColor" d="M15 9H9v6h6V9zm-2 4h-2v-2h2v2zm8-2V9h-2V7c0-1.1-.9-2-2-2h-2V3h-2v2h-2V3H9v2H7c-1.1 0-2 .9-2 2v2H3v2h2v2H3v2h2v2c0 1.1.9 2 2 2h2v2h2v-2h2v2h2v-2h2c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2zm-4 6H7V7h10v10z"/>`
};

/**
 * Normalizes an icon name for tolerant matching (lowercase, trims whitespace & quotes).
 */
export function normalizeIconName(rawName: string | undefined): string {
  if (!rawName) return '';
  return rawName.toLowerCase().replace(/['"]/g, '').trim();
}

/**
 * Returns true if the given icon name exists in the registry.
 */
export function hasIcon(name: string | undefined): boolean {
  const normalized = normalizeIconName(name);
  return Boolean(normalized && ICON_PATH_MAP[normalized]);
}

/**
 * Creates and returns an SVGElement representing the vector icon,
 * or null if the icon name is invalid/unrecognized.
 */
export function createIconSvgElement(
  iconName: string | undefined,
  options: IconOptions = {}
): SVGElement | null {
  const name = normalizeIconName(iconName);
  if (!name || !ICON_PATH_MAP[name]) {
    return null;
  }

  const size = options.size ?? 16;
  const color = options.color ?? 'currentColor';

  const svgElem = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgElem.setAttribute('viewBox', '0 0 24 24');
  svgElem.setAttribute('width', size.toString());
  svgElem.setAttribute('height', size.toString());
  svgElem.setAttribute('fill', color);
  svgElem.setAttribute('stroke', 'none');
  svgElem.style.display = 'inline-block';
  svgElem.style.verticalAlign = 'middle';

  if (options.className) {
    svgElem.setAttribute('class', options.className);
  }

  svgElem.innerHTML = ICON_PATH_MAP[name];
  return svgElem;
}

/**
 * Returns the width occupied by an icon (size + padding).
 * Used for dynamic layout dimension calculations.
 */
export function getIconSpacing(iconName: string | undefined, iconSize: number = 16, gap: number = 6): number {
  if (!hasIcon(iconName)) return 0;
  return iconSize + gap;
}
