const { build } = require('vite');
const path = require('path');

async function buildAll() {
  const rootDir = path.resolve(__dirname, '..');
  const distDir = path.resolve(rootDir, 'dist');

  console.log('Building Chrome extension content script...');
  await build({
    root: rootDir,
    configFile: false,
    build: {
      outDir: distDir,
      emptyOutDir: true,
      lib: {
        entry: path.resolve(rootDir, 'src/content.ts'),
        name: 'DrakoFlowContent',
        formats: ['iife'],
        fileName: () => 'content.js'
      },
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'style.css') return 'content.css';
            return assetInfo.name || '';
          }
        }
      }
    }
  });

  console.log('Building Chrome extension player script...');
  await build({
    root: rootDir,
    configFile: false,
    build: {
      outDir: distDir,
      emptyOutDir: false,
      lib: {
        entry: path.resolve(rootDir, 'src/player.ts'),
        name: 'DrakoFlowPlayer',
        formats: ['iife'],
        fileName: () => 'player.js'
      },
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'style.css') return 'player.css';
            return assetInfo.name || '';
          }
        }
      }
    }
  });

  console.log('Chrome extension build complete.');
}

buildAll().catch((err) => {
  console.error('Chrome extension build failed:', err);
  process.exit(1);
});
