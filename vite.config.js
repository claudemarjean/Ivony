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
    open: true
  },
  preview: {
    port: 4173
  }
});
