import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: __dirname,
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, 'src/content.ts'),
      name: 'DrakoFlowContent',
      formats: ['iife'],
      fileName: () => 'content.js'
    },
    rollupOptions: {
      output: {
        extend: true,
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'content.css';
          return assetInfo.name || '';
        }
      }
    }
  }
});
