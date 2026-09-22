import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/bluestar-online/',
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
