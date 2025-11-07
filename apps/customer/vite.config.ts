import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { copyFileSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-404',
      closeBundle() {
        // Copy 404.html to dist for GitHub Pages SPA routing
        try {
          copyFileSync(
            join(__dirname, 'public/404.html'),
            join(__dirname, 'dist/404.html')
          );
        } catch (error) {
          console.warn('Could not copy 404.html:', error);
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: process.env.GITHUB_PAGES ? '/coffee-ordering-demo/customer/' : '/',
  publicDir: 'public',
});

