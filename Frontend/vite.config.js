import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    {
      name: 'js-files-as-jsx',
      enforce: 'pre',
      async transform(code, id) {
        const filePath = id.split('?')[0].replace(/\\/g, '/');
        if (filePath.includes('/node_modules/')) return null;
        const srcRoot = path.resolve(rootDir, 'src').replace(/\\/g, '/');
        if (!filePath.startsWith(srcRoot) || !filePath.endsWith('.js')) return null;

        return transformWithEsbuild(code, id, {
          loader: 'jsx',
          jsx: 'automatic',
        });
      },
    },
    react(),
  ],
  envPrefix: ['VITE_', 'REACT_APP_'],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
      '@assets': path.resolve(rootDir, 'src/assets'),
      '@styles': path.resolve(rootDir, 'src/styles'),
      '@localization': path.resolve(rootDir, 'src/localization'),
      '@store': path.resolve(rootDir, 'src/store'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  preview: {
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: 'build',
    sourcemap: false,
  },
  optimizeDeps: {
    holdUntilCrawlEnd: false,
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react-redux',
      'react-router-dom',
      '@reduxjs/toolkit',
      'redux-persist',
      'redux-persist/lib/storage',
      'redux-persist/integration/react',
      '@tanstack/react-query',
      'axios',
      'i18next',
      'react-i18next',
      'i18next-browser-languagedetector',
    ],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
});
