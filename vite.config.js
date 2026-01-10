import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        applications: resolve(__dirname, 'applications.html')
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    cssMinify: true,
    copyPublicDir: true
  },
  publicDir: 'assets',
  server: {
    port: 3000,
    open: true,
    // Rewrites pour URLs propres en dev
    proxy: {
      '^/applications$': {
        target: 'http://localhost:3000',
        rewrite: () => '/applications.html'
      }
    }
  },
  preview: {
    port: 4173,
    // Rewrites pour URLs propres en preview
    proxy: {
      '^/applications$': {
        target: 'http://localhost:4173',
        rewrite: () => '/applications.html'
      }
    }
  }
});
