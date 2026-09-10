import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2018', // Compatible with embedded engines (Cobalt SpiderMonkey/V8)
    minify: 'esbuild',
    sourcemap: false,
    cssMinify: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  server: {
    port: 3000,
    open: false,
  },
});
