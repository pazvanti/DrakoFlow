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

  // Official PostgreSQL Elephant Head (Slonik)
  'postgres': `<path fill="currentColor" fill-rule="evenodd" d="M21.1 7.4c-.7-1.8-2.1-3.2-3.8-3.9-2.5-1-5.4-.5-7.5 1.1-1.4 1.1-2.4 2.7-2.9 4.4-.4 1.1-.3 2.3 0 3.4.3 1.1.9 2 1.6 2.7-1.2 1.1-2 2.5-2.4 4-.5 2-.2 4.1.7 5.9.5.9 1.2 1.6 2 2.1 1.2.7 2.6.8 3.9.4 1.5-.5 2.8-1.7 3.5-3.3.8.4 1.7.6 2.6.6 2.8 0 5.4-1.4 6.7-3.8 1-1.7 1.4-3.8 1.2-5.8-.1-2-1-3.9-2.6-5.2-.4-.3-.7-.7-1-1zM9.5 18.5c-.5.2-1.1.2-1.6 0-.4-.3-.7-.7-.8-1.2-.4-1.1-.2-2.3.3-3.3.4-.8 1-1.5 1.8-2 .4 1.1 1 2.1 1.8 2.9-.4 1.2-.8 2.4-1.5 3.6zm9.3-4.3c-.9 1.6-2.6 2.6-4.4 2.6-.6 0-1.2-.1-1.8-.4.5-1.5 1-3 1.4-4.5.8-.4 1.6-.9 2.2-1.6.4.5.9.9 1.5 1.1 1 .5 2.1.6 3.1.3.1.8 0 1.7-.5 2.5z"/>`,
  'postgresql': `<path fill="currentColor" fill-rule="evenodd" d="M21.1 7.4c-.7-1.8-2.1-3.2-3.8-3.9-2.5-1-5.4-.5-7.5 1.1-1.4 1.1-2.4 2.7-2.9 4.4-.4 1.1-.3 2.3 0 3.4.3 1.1.9 2 1.6 2.7-1.2 1.1-2 2.5-2.4 4-.5 2-.2 4.1.7 5.9.5.9 1.2 1.6 2 2.1 1.2.7 2.6.8 3.9.4 1.5-.5 2.8-1.7 3.5-3.3.8.4 1.7.6 2.6.6 2.8 0 5.4-1.4 6.7-3.8 1-1.7 1.4-3.8 1.2-5.8-.1-2-1-3.9-2.6-5.2-.4-.3-.7-.7-1-1zM9.5 18.5c-.5.2-1.1.2-1.6 0-.4-.3-.7-.7-.8-1.2-.4-1.1-.2-2.3.3-3.3.4-.8 1-1.5 1.8-2 .4 1.1 1 2.1 1.8 2.9-.4 1.2-.8 2.4-1.5 3.6zm9.3-4.3c-.9 1.6-2.6 2.6-4.4 2.6-.6 0-1.2-.1-1.8-.4.5-1.5 1-3 1.4-4.5.8-.4 1.6-.9 2.2-1.6.4.5.9.9 1.5 1.1 1 .5 2.1.6 3.1.3.1.8 0 1.7-.5 2.5z"/>`,

  // Gear / Cog / Settings
  'gear': `<path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>`,
  'cog': `<path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>`,

  // Database / DB cylinder
  'database': `<path fill="currentColor" d="M12 2C6.48 2 2 4.02 2 6.5v11C2 20.02 6.48 22 12 22s10-1.98 10-4.5v-11C22 4.02 17.52 2 12 2zm0 3c4.14 0 7.5 1.34 7.5 2S16.14 9 12 9 4.5 7.66 4.5 7s3.36-2 7.5-2zm0 5c4.14 0 7.5-1.34 7.5-2v3.17c-1.74 1.16-4.48 1.83-7.5 1.83s-5.76-.67-7.5-1.83V10c0 .66 3.36 2 7.5 2zm0 5c4.14 0 7.5-1.34 7.5-2v3.17c-1.74 1.16-4.48 1.83-7.5 1.83s-5.76-.67-7.5-1.83V15c0 .66 3.36 2 7.5 2z"/>`,
  'db': `<path fill="currentColor" d="M12 2C6.48 2 2 4.02 2 6.5v11C2 20.02 6.48 22 12 22s10-1.98 10-4.5v-11C22 4.02 17.52 2 12 2zm0 3c4.14 0 7.5 1.34 7.5 2S16.14 9 12 9 4.5 7.66 4.5 7s3.36-2 7.5-2zm0 5c4.14 0 7.5-1.34 7.5-2v3.17c-1.74 1.16-4.48 1.83-7.5 1.83s-5.76-.67-7.5-1.83V10c0 .66 3.36 2 7.5 2zm0 5c4.14 0 7.5-1.34 7.5-2v3.17c-1.74 1.16-4.48 1.83-7.5 1.83s-5.76-.67-7.5-1.83V15c0 .66 3.36 2 7.5 2z"/>`,

  // Web Service / Globe / Server
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

  // Queue / Message Queue FIFO Buffer
  'queue': `<path fill="currentColor" fill-rule="evenodd" d="M2 7a1 1 0 0 1 1-1h18a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1zm0 10a1 1 0 0 1 1-1h18a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1zm3-7h3v4H5v-4zm5 0h3v4h-3v-4zm5 0h3v4h-3v-4z"/>`,

  // Storage / S3 / Bucket
  'storage': `<path fill="currentColor" d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V8h14v10z"/>`,
  's3': `<path fill="currentColor" d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V8h14v10z"/>`,

  // CPU / Microservice
  'cpu': `<path fill="currentColor" d="M15 9H9v6h6V9zm-2 4h-2v-2h2v2zm8-2V9h-2V7c0-1.1-.9-2-2-2h-2V3h-2v2h-2V3H9v2H7c-1.1 0-2 .9-2 2v2H3v2h2v2H3v2h2v2c0 1.1.9 2 2 2h2v2h2v-2h2v2h2v-2h2c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2zm-4 6H7V7h10v10z"/>`,

  // MongoDB Leaf
  'mongodb': `<path fill="currentColor" d="M12 2a.5.5 0 0 0-.42.23C10.15 4.3 4 12.8 4 16.5A8 8 0 0 0 12 22a8 8 0 0 0 8-5.5c0-3.7-6.15-12.2-7.58-14.27A.5.5 0 0 0 12 2zm0 2.5c1.2 1.8 6 9.4 6 12A6 6 0 0 1 12.5 20V8a.5.5 0 0 0-1 0v12A6 6 0 0 1 6 16.5c0-2.6 4.8-10.2 6-12z"/>`,
  'mongo': `<path fill="currentColor" d="M12 2a.5.5 0 0 0-.42.23C10.15 4.3 4 12.8 4 16.5A8 8 0 0 0 12 22a8 8 0 0 0 8-5.5c0-3.7-6.15-12.2-7.58-14.27A.5.5 0 0 0 12 2zm0 2.5c1.2 1.8 6 9.4 6 12A6 6 0 0 1 12.5 20V8a.5.5 0 0 0-1 0v12A6 6 0 0 1 6 16.5c0-2.6 4.8-10.2 6-12z"/>`,

  // MySQL Dolphin Emblem (Sakila)
  'mysql': `<path fill="currentColor" fill-rule="evenodd" d="M2 2.2c-.5.5-.4 1.1.5 2.5.5.7 1 1.8 1.2 2.4.2.7.6 1.5.9 2 .5.7.5.9.2 2.2-.2.8-.3 1.9-.2 2.5.2 1.1 1 2.7 1.6 2.9.5.2 1.1-.7 1.2-1.4 0-.7 0-.7.3-.2.5.8 2 2.5 2.2 2.4.7-.6.4-1.3-.1-2.1-.5-.8-1-1.8-1.2-2.3-.3-.8-.4-.8-.8-.4-.2.2-.5.8-.5 1.3-.2 1.2-.7 1.4-1 .3-.4-1.1-.4-2.9 0-4.1.7-1.4.7-1.7.2-2.3-.3-.4-.7-1.3-1-2.1-.2-.7-.8-1.8-1.2-2.4C4 3.1 4 2.6 5 2.8c.4.1 1.1.4 1.5.7.4.3 1.1.5 1.5.5 1.2 0 3.4 1.2 5 2.8 1.2 1.2 1.8 2.2 3.2 4.9 1.5 3.2 1.7 3.4 2.6 3.7 1.1.4 3.5 1.8 3.5 2.1 0 .1-.6.3-1.3.3-1.9.2-2.1.6-.9 1.7.6.5 1.7 1.3 2.5 1.8L22.5 22l-.7-.9c-.4-.5-1.2-1.2-1.8-1.6-.6-.4-1.1-.8-1.1-.9 0-.1.4-.3 1-.4 1.4-.3 1.9-.4 1.9-.7 0-.4-2.6-2.4-3.8-2.9C16.8 14.4 16.7 14.2 15.3 11.4c-1.2-2.6-1.7-3.3-3.2-4.9C10.1 4.5 8.7 3.6 7 3.4c-.6-.1-1.4-.4-1.8-.7C4.8 2.1 3.1 1.9 2.7 2.3Z"/>`,

  // SQLite Database Emblem
  'sqlite': `<path fill="currentColor" d="M4 4h16v3H4V4zm0 6h16v4H4v-4zm0 7h16v3H4v-3zm2-11v1h2V6H6zm0 6v2h2v-2H6zm0 7v1h2v-1H6z"/>`,

  // Elasticsearch / Elastic Cluster Search Emblem
  'elasticsearch': `<path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 2a8 8 0 0 1 8 8c0 1.25-.28 2.45-.79 3.52l-2.77-2.77a4 4 0 0 0-5.66-5.66L7.2 6.79A7.95 7.95 0 0 1 12 4zm-8 8c0-1.25.28-2.45.79-3.52l2.77 2.77a4 4 0 0 0 5.66 5.66l1.38-1.38A7.95 7.95 0 0 1 12 20a8 8 0 0 1-8-8zm5.5 0a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0z"/>`,
  'elastic': `<path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 2a8 8 0 0 1 8 8c0 1.25-.28 2.45-.79 3.52l-2.77-2.77a4 4 0 0 0-5.66-5.66L7.2 6.79A7.95 7.95 0 0 1 12 4zm-8 8c0-1.25.28-2.45.79-3.52l2.77 2.77a4 4 0 0 0 5.66 5.66l1.38-1.38A7.95 7.95 0 0 1 12 20a8 8 0 0 1-8-8zm5.5 0a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0z"/>`,

  // GraphQL Hexagon Vertices Logo
  'graphql': `<path fill="currentColor" d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2zm0 2.31L5 8.35v7.3l7 4.04 7-4.04v-7.3L12 4.31zM12 7a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-4.33 7.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm8.66 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/>`,

  // RabbitMQ Rabbit Head Emblem
  'rabbitmq': `<path fill="currentColor" fill-rule="evenodd" d="M9 2c-.8 0-1.5.7-1.5 1.5v6.1C6.2 10.2 5.5 11.5 5.5 13c0 2.5 2 4.5 4.5 4.5h.3c.4 1.8 2 3.1 3.7 3.1s3.3-1.3 3.7-3.1h.3c2.5 0 4.5-2 4.5-4.5 0-1.5-.7-2.8-2-3.4V3.5c0-.8-.7-1.5-1.5-1.5S17.5 2.7 17.5 3.5v4.8c-.8-.5-1.6-.8-2.5-.8s-1.7.3-2.5.8V3.5c0-.8-.7-1.5-1.5-1.5S9.5 2.7 9.5 3.5v5c0 .1 0 .2-.1.2H9V3.5C9 2.7 8.3 2 7.5 2h1.5zm-.5 2h1v4.5h-1V4zm7 0h1v4.5h-1V4zM9.5 12.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm5 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>`,
  'amqp': `<path fill="currentColor" fill-rule="evenodd" d="M9 2c-.8 0-1.5.7-1.5 1.5v6.1C6.2 10.2 5.5 11.5 5.5 13c0 2.5 2 4.5 4.5 4.5h.3c.4 1.8 2 3.1 3.7 3.1s3.3-1.3 3.7-3.1h.3c2.5 0 4.5-2 4.5-4.5 0-1.5-.7-2.8-2-3.4V3.5c0-.8-.7-1.5-1.5-1.5S17.5 2.7 17.5 3.5v4.8c-.8-.5-1.6-.8-2.5-.8s-1.7.3-2.5.8V3.5c0-.8-.7-1.5-1.5-1.5S9.5 2.7 9.5 3.5v5c0 .1 0 .2-.1.2H9V3.5C9 2.7 8.3 2 7.5 2h1.5zm-.5 2h1v4.5h-1V4zm7 0h1v4.5h-1V4zM9.5 12.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm5 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>`,

  // Microsoft Azure Emblem
  'azure': `<path fill="currentColor" d="M13.05 2.5L5.7 15.3l4.3 6.2h9l-6-19zM3 16.5l4-7 4.5 7.5H3z"/>`,

  // Google Cloud Platform (GCP)
  'gcp': `<path fill="currentColor" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM12 17.5L8.5 14l1.41-1.41L12 14.67l4.09-4.08L17.5 12 12 17.5z"/>`,
  'google-cloud': `<path fill="currentColor" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM12 17.5L8.5 14l1.41-1.41L12 14.67l4.09-4.08L17.5 12 12 17.5z"/>`,

  // Terraform Stacked Blocks
  'terraform': `<path fill="currentColor" d="M1.5 3.5l7 4v8l-7-4v-8zm8.5 4.8l7-4v8l-7 4v-8zm0 9.2l7-4v8l-7 4v-8zm8.5 -14l7 4v8l-7-4v-8z"/>`,

  // GitHub Octocat Emblem
  'github': `<path fill="currentColor" fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>`,

  // GitLab Fox Emblem
  'gitlab': `<path fill="currentColor" d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.29-.94l2.43-7.48a.84.84 0 0 1 1.59 0L7.5 13.5h9l2.42-7.53a.84.84 0 0 1 1.59 0l2.43 7.48a.84.84 0 0 1-.29.94z"/>`,

  // NGINX Server Logo
  'nginx': `<path fill="currentColor" d="M12 2L2 7v10l10 5 10-5V7L12 2zm-1 14H8V8h3l3 5V8h3v8h-3l-3-5v5z"/>`,

  // Linux Tux Emblem
  'linux': `<path fill="currentColor" d="M12 2c-2.76 0-5 2.24-5 5v3c-1.1 0-2 .9-2 2v4c0 1.66 1.34 3 3 3h8c1.66 0 3-1.34 3-3v-4c0-1.1-.9-2-2-2V7c0-2.76-2.24-5-5-5zm-2 5a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm4 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm-5 7h6v2H9v-2z"/>`,
  'tux': `<path fill="currentColor" d="M12 2c-2.76 0-5 2.24-5 5v3c-1.1 0-2 .9-2 2v4c0 1.66 1.34 3 3 3h8c1.66 0 3-1.34 3-3v-4c0-1.1-.9-2-2-2V7c0-2.76-2.24-5-5-5zm-2 5a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm4 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm-5 7h6v2H9v-2z"/>`,

  // Terminal Prompt / CLI
  'terminal': `<path fill="currentColor" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10zm-14-8l4 4-4 4 1.41 1.41L12.83 14l-5.42-5.41L6 10zm7 7h5v2h-5v-2z"/>`,
  'cli': `<path fill="currentColor" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10zm-14-8l4 4-4 4 1.41 1.41L12.83 14l-5.42-5.41L6 10zm7 7h5v2h-5v-2z"/>`,
  'bash': `<path fill="currentColor" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10zm-14-8l4 4-4 4 1.41 1.41L12.83 14l-5.42-5.41L6 10zm7 7h5v2h-5v-2z"/>`,

  // TypeScript TS Square Logo
  'typescript': `<path fill="currentColor" fill-rule="evenodd" d="M3 3h18v18H3V3zm8.7 10.3h-2.1v5.7H7.7v-5.7H5.6v-1.6h6.1v1.6zm6.8 2.4c0-1.8-1.3-2.6-3.2-3.1l-.6-.2c-.8-.2-1.2-.5-1.2-1 0-.5.5-.8 1.2-.8.8 0 1.5.3 2 .8l1.1-1.2c-.8-.9-1.9-1.3-3.2-1.3-1.9 0-3.2 1.1-3.2 2.6 0 1.6 1.1 2.4 2.9 2.9l.6.2c.9.3 1.4.6 1.4 1.1 0 .6-.6 1-1.5 1-.9 0-1.9-.4-2.5-1.1l-1.1 1.2c.9 1.1 2.2 1.6 3.7 1.6 2.2 0 3.6-1.1 3.6-2.7z"/>`,
  'ts': `<path fill="currentColor" fill-rule="evenodd" d="M3 3h18v18H3V3zm8.7 10.3h-2.1v5.7H7.7v-5.7H5.6v-1.6h6.1v1.6zm6.8 2.4c0-1.8-1.3-2.6-3.2-3.1l-.6-.2c-.8-.2-1.2-.5-1.2-1 0-.5.5-.8 1.2-.8.8 0 1.5.3 2 .8l1.1-1.2c-.8-.9-1.9-1.3-3.2-1.3-1.9 0-3.2 1.1-3.2 2.6 0 1.6 1.1 2.4 2.9 2.9l.6.2c.9.3 1.4.6 1.4 1.1 0 .6-.6 1-1.5 1-.9 0-1.9-.4-2.5-1.1l-1.1 1.2c.9 1.1 2.2 1.6 3.7 1.6 2.2 0 3.6-1.1 3.6-2.7z"/>`,

  // JavaScript JS Square Logo
  'javascript': `<path fill="currentColor" fill-rule="evenodd" d="M3 3h18v18H3V3zm7.8 12.8c0 1.7-1.2 2.9-3.2 2.9-1.4 0-2.6-.5-3.3-1.4l1.2-1.2c.5.6 1.2.9 2 .9.9 0 1.4-.4 1.4-1.2v-5.5h1.9v4.5zm7.7.1c0-1.8-1.3-2.6-3.2-3.1l-.6-.2c-.8-.2-1.2-.5-1.2-1 0-.5.5-.8 1.2-.8.8 0 1.5.3 2 .8l1.1-1.2c-.8-.9-1.9-1.3-3.2-1.3-1.9 0-3.2 1.1-3.2 2.6 0 1.6 1.1 2.4 2.9 2.9l.6.2c.9.3 1.4.6 1.4 1.1 0 .6-.6 1-1.5 1-.9 0-1.9-.4-2.5-1.1l-1.1 1.2c.9 1.1 2.2 1.6 3.7 1.6 2.2 0 3.6-1.1 3.6-2.7z"/>`,
  'js': `<path fill="currentColor" fill-rule="evenodd" d="M3 3h18v18H3V3zm7.8 12.8c0 1.7-1.2 2.9-3.2 2.9-1.4 0-2.6-.5-3.3-1.4l1.2-1.2c.5.6 1.2.9 2 .9.9 0 1.4-.4 1.4-1.2v-5.5h1.9v4.5zm7.7.1c0-1.8-1.3-2.6-3.2-3.1l-.6-.2c-.8-.2-1.2-.5-1.2-1 0-.5.5-.8 1.2-.8.8 0 1.5.3 2 .8l1.1-1.2c-.8-.9-1.9-1.3-3.2-1.3-1.9 0-3.2 1.1-3.2 2.6 0 1.6 1.1 2.4 2.9 2.9l.6.2c.9.3 1.4.6 1.4 1.1 0 .6-.6 1-1.5 1-.9 0-1.9-.4-2.5-1.1l-1.1 1.2c.9 1.1 2.2 1.6 3.7 1.6 2.2 0 3.6-1.1 3.6-2.7z"/>`,

  // Vue.js V Emblem
  'vue': `<path fill="currentColor" d="M2 3h3.5L12 15 18.5 3H22L12 21 2 3zm6 0h3l3 5.5L17 3h3l-8 14.5L8 3z"/>`,
  'vuejs': `<path fill="currentColor" d="M2 3h3.5L12 15 18.5 3H22L12 21 2 3zm6 0h3l3 5.5L17 3h3l-8 14.5L8 3z"/>`,

  // Angular Shield Logo
  'angular': `<path fill="currentColor" d="M12 2.5L2.5 6v10.5L12 21.5l9.5-5V6L12 2.5zm0 3.3l5.5 12.2h-2.1l-1.1-2.8H9.7l-1.1 2.8H6.5L12 5.8zm1.5 7.6L12 8.7l-1.5 4.7h3z"/>`,

  // Svelte Emblem
  'svelte': `<path fill="currentColor" d="M18.8 4.2c-2.3-1.6-5.4-1.4-7.4.4L7.5 8.1c-.8.7-1.3 1.6-1.4 2.6-.1 1.2.3 2.3 1.2 3.1l.9.7-3.9 3.3c-1.5 1.3-2.1 3.3-1.5 5.2.6 1.9 2.2 3.2 4.2 3.2.9 0 1.8-.2 2.6-.8l3.9-3.3c.8-.7 1.3-1.6 1.4-2.6.1-1.2-.3-2.3-1.2-3.1l-.9-.7 3.9-3.3c1.5-1.3 2.1-3.3 1.5-5.2-.5-1.9-2.1-3.2-4.1-3.2-.9 0-1.8.2-2.6.8z"/>`,

  // Next.js Emblem
  'nextjs': `<path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 14.5l-6-8.5V16.5H9V7.5h2l6 8.5v-8.5h1.5v9z"/>`,
  'next': `<path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 14.5l-6-8.5V16.5H9V7.5h2l6 8.5v-8.5h1.5v9z"/>`,

  // Java Coffee Cup Logo
  'java': `<path fill="currentColor" d="M4 19c1.5 1 5 1.5 8 1.5s6.5-.5 8-1.5c-1 0-3 .5-8 .5s-7-.5-8-.5zm2.5-3c2 1 4.5 1 5.5 1s3.5 0 5.5-1c-2 0-4.5.5-5.5.5s-3.5-.5-5.5-.5zM12 2C9.5 5 12 7 12 9c0 2-2 3-2 5 2.5-2 1-4 2-6 1-2-1-4 0-6zm3 4c-1 1-2 2.5-1 4 1 1.5.5 2.5 0 3.5 2-1 2.5-3 1.5-4.5-1-1.5 0-2.5-.5-3z"/>`,

  // Go Gopher / Golang Logo
  'golang': `<path fill="currentColor" d="M1.5 11.5h7v1h-7zm0 2h5v1h-5zm0-4h9v1h-9zm14.8-1.5c-2.3 0-3.8 1.6-3.8 3.8 0 2.3 1.6 3.9 4 3.9 2 0 3.2-1.1 3.5-2.4h-3.6v-1.3h5.2c.1.4.1.7.1 1.1 0 3.1-2.1 5.2-5.3 5.2-3.3 0-5.7-2.3-5.7-5.5 0-3.2 2.4-5.5 5.6-5.5 2.1 0 3.8.9 4.7 2.3l-1.3 1c-.7-.9-1.8-1.4-3.4-1.4z"/>`,
  'go': `<path fill="currentColor" d="M1.5 11.5h7v1h-7zm0 2h5v1h-5zm0-4h9v1h-9zm14.8-1.5c-2.3 0-3.8 1.6-3.8 3.8 0 2.3 1.6 3.9 4 3.9 2 0 3.2-1.1 3.5-2.4h-3.6v-1.3h5.2c.1.4.1.7.1 1.1 0 3.1-2.1 5.2-5.3 5.2-3.3 0-5.7-2.3-5.7-5.5 0-3.2 2.4-5.5 5.6-5.5 2.1 0 3.8.9 4.7 2.3l-1.3 1c-.7-.9-1.8-1.4-3.4-1.4z"/>`,

  // Rust Gear Emblem
  'rust': `<path fill="currentColor" fill-rule="evenodd" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-1 4h2v2.1a6 6 0 0 1 3.5 2h2.1v2h-2.1a6 6 0 0 1-2 3.5V18h-2v-2.1a6 6 0 0 1-3.5-2H4.9v-2h2.1a6 6 0 0 1 2-3.5V6zm1 4a4 4 0 1 0 4 4 4 4 0 0 0-4-4zm-1.5 2h2.5c.8 0 1.5.4 1.5 1.2 0 .6-.4 1.1-1 1.2l1.2 2.1h-1.4l-1-1.8h-.8V15h-1v-5zm1 1v1.5h1.2c.4 0 .7-.2.7-.7s-.3-.8-.7-.8H11.5z"/>`,

  // PHP Emblem
  'php': `<path fill="currentColor" d="M12 3C6.48 3 2 7.03 2 12s4.48 9 10 9 10-4.03 10-9-4.48-9-10-9zm-4.5 12H6v-6h1.5c.83 0 1.5.67 1.5 1.5S8.33 12 7.5 12zm.5-3H7v-1.5h1c.28 0 .5.22.5.5s-.22 1-.5 1zm4.5 3H11V9h1.5v2.25H14V9h1.5v6H14v-2.25h-1.5V15zm5.5 0H16.5v-6H18c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5zm.5-3h-1v-1.5h1c.28 0 .5.22.5.5s-.22 1-.5 1z"/>`,

  // Ruby Gem Logo
  'ruby': `<path fill="currentColor" d="M2.5 8.5L7 3h10l4.5 5.5L12 21 2.5 8.5zM7.8 5L4.5 9h15l-3.3-4H7.8z"/>`,

  // Swift Bird Logo
  'swift': `<path fill="currentColor" d="M20.5 4.5c-2 2.5-4 4-7 5.5 3-1.5 6-1 7.5.5-2.5 1.5-5.5 2-8 2 4 1 6.5 3 7.5 5.5-3-1-5.5-1-8-.5C10 17.5 6 15 3.5 11c3.5 3 8 4 12 2.5C11 14 7.5 11.5 5 7.5c4 3 8.5 3.5 12.5.5-1.5 1.5-3.5 2.5-7 3.5 4.5-2 7.5-4.5 10-7z"/>`,

  // C# / .NET (C# Hexagon Shield Logo)
  'csharp': `<path fill="currentColor" fill-rule="evenodd" d="M12 0.7L22.4 6.7V17.3L12 23.3L1.6 17.3V6.7L12 0.7ZM10.1 6.4C7.2 6.4 4.8 8.8 4.8 11.7V12.3C4.8 15.2 7.2 17.6 10.1 17.6C11 17.6 11.8 17.4 12.5 17L13.1 16.7L12.4 15.3L11.8 15.6C11.3 15.9 10.7 16 10.1 16C8.1 16 6.4 14.3 6.4 12.3V11.7C6.4 9.7 8.1 8 10.1 8C10.7 8 11.3 8.1 11.8 8.4L12.4 8.7L13.1 7.3L12.5 7C11.8 6.6 11 6.4 10.1 6.4ZM14.4 8V9.6H12.8V11.2H14.4V12.8H12.8V14.4H14.4V16H16V14.4H17.6V16H19.2V14.4H20.8V12.8H19.2V11.2H20.8V9.6H19.2V8H17.6V9.6H16V8H14.4Z"/>`,
  'dotnet': `<path fill="currentColor" fill-rule="evenodd" d="M12 0.7L22.4 6.7V17.3L12 23.3L1.6 17.3V6.7L12 0.7ZM10.1 6.4C7.2 6.4 4.8 8.8 4.8 11.7V12.3C4.8 15.2 7.2 17.6 10.1 17.6C11 17.6 11.8 17.4 12.5 17L13.1 16.7L12.4 15.3L11.8 15.6C11.3 15.9 10.7 16 10.1 16C8.1 16 6.4 14.3 6.4 12.3V11.7C6.4 9.7 8.1 8 10.1 8C10.7 8 11.3 8.1 11.8 8.4L12.4 8.7L13.1 7.3L12.5 7C11.8 6.6 11 6.4 10.1 6.4ZM14.4 8V9.6H12.8V11.2H14.4V12.8H12.8V14.4H14.4V16H16V14.4H17.6V16H19.2V14.4H20.8V12.8H19.2V11.2H20.8V9.6H19.2V8H17.6V9.6H16V8H14.4Z"/>`,
  'net': `<path fill="currentColor" fill-rule="evenodd" d="M12 0.7L22.4 6.7V17.3L12 23.3L1.6 17.3V6.7L12 0.7ZM10.1 6.4C7.2 6.4 4.8 8.8 4.8 11.7V12.3C4.8 15.2 7.2 17.6 10.1 17.6C11 17.6 11.8 17.4 12.5 17L13.1 16.7L12.4 15.3L11.8 15.6C11.3 15.9 10.7 16 10.1 16C8.1 16 6.4 14.3 6.4 12.3V11.7C6.4 9.7 8.1 8 10.1 8C10.7 8 11.3 8.1 11.8 8.4L12.4 8.7L13.1 7.3L12.5 7C11.8 6.6 11 6.4 10.1 6.4ZM14.4 8V9.6H12.8V11.2H14.4V12.8H12.8V14.4H14.4V16H16V14.4H17.6V16H19.2V14.4H20.8V12.8H19.2V11.2H20.8V9.6H19.2V8H17.6V9.6H16V8H14.4Z"/>`,

  // Shield / Security / Firewall
  'shield': `<path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>`,
  'firewall': `<path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>`,

  // Key / Token / Auth
  'key': `<path fill="currentColor" d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v2h2v-2h2v-2h-8.35zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>`,
  'token': `<path fill="currentColor" d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v2h2v-2h2v-2h-8.35zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>`,
  'auth': `<path fill="currentColor" d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v2h2v-2h2v-2h-8.35zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>`,

  // Mail / Email / SMTP
  'mail': `<path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>`,
  'email': `<path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>`,
  'smtp': `<path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>`,

  // Bell / Alert / Notification
  'bell': `<path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>`,
  'alert': `<path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>`,
  'notification': `<path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>`,

  // Search / Find
  'search': `<path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>`,
  'find': `<path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>`,

  // Wireless / Wifi Concentric Arcs
  'wifi': `<path fill="currentColor" fill-rule="evenodd" d="M12 18a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-4.95-3.54a7 7 0 0 1 9.9 0l-1.41 1.42a5 5 0 0 0-7.08 0l-1.41-1.42zM4.12 11.53a11 11 0 0 1 15.76 0l-1.42 1.41a9 9 0 0 0-12.92 0l-1.42-1.41zM1.29 8.7a15 15 0 0 1 21.42 0l-1.41 1.42a13 13 0 0 0-18.6 0L1.29 8.7z"/>`,
  'wireless': `<path fill="currentColor" fill-rule="evenodd" d="M12 18a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-4.95-3.54a7 7 0 0 1 9.9 0l-1.41 1.42a5 5 0 0 0-7.08 0l-1.41-1.42zM4.12 11.53a11 11 0 0 1 15.76 0l-1.42 1.41a9 9 0 0 0-12.92 0l-1.42-1.41zM1.29 8.7a15 15 0 0 1 21.42 0l-1.41 1.42a13 13 0 0 0-18.6 0L1.29 8.7z"/>`,

  // Lightning / Event
  'lightning': `<path fill="currentColor" d="M7 2v11h3v9l7-12h-4l4-8z"/>`,
  'event': `<path fill="currentColor" d="M7 2v11h3v9l7-12h-4l4-8z"/>`
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
  if (typeof document === 'undefined') {
    return null;
  }
  const name = normalizeIconName(iconName);
  if (!name || !ICON_PATH_MAP[name]) {
    return null;
  }

  const size = options.size ?? 16;
  const color = options.color ?? 'currentColor';
  const content = ICON_PATH_MAP[name].trim();

  // If entry is a complete <svg ...> element, parse and scale it while preserving its native viewBox
  if (content.startsWith('<svg')) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const svgElem = tempDiv.querySelector('svg');
    if (svgElem) {
      svgElem.setAttribute('width', size.toString());
      svgElem.setAttribute('height', size.toString());
      svgElem.setAttribute('fill', color);
      svgElem.style.display = 'inline-block';
      svgElem.style.verticalAlign = 'middle';
      if (options.className) {
        svgElem.setAttribute('class', options.className);
      }
      return svgElem;
    }
  }

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

  svgElem.innerHTML = content;
  return svgElem;
}

/**
 * Returns an array of all registered icon names sorted alphabetically.
 * Automatically includes all icons in ICON_PATH_MAP with zero manual updates required.
 */
export function getAllRegisteredIcons(): string[] {
  return Object.keys(ICON_PATH_MAP).sort();
}

/**
 * Returns the width occupied by an icon (size + padding).
 * Used for dynamic layout dimension calculations.
 */
export function getIconSpacing(iconName: string | undefined, iconSize: number = 16, gap: number = 6): number {
  if (!hasIcon(iconName)) return 0;
  return iconSize + gap;
}
