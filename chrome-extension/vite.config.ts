import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: __dirname,
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        content: path.resolve(__dirname, 'src/content.ts'),
        player: path.resolve(__dirname, 'src/player.ts')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.includes('content') || assetInfo.name === 'style.css') return 'content.css';
          if (assetInfo.name?.includes('player')) return 'player.css';
          return '[name].[ext]';
        },
        format: 'iife',
        name: 'DrakoFlowBundle'
      }
    }
  }
});
