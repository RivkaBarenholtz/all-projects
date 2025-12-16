import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
   resolve: {
    dedupe: [
      "@fortawesome/fontawesome-svg-core",
      "@fortawesome/react-fontawesome",
    ],
  },
   css: {
    postcss: './postcss.config.js', // Add this if it's missing
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Don't empty - we'll handle cleaning in build.js
    rollupOptions: {
      input: {
        payment: resolve(__dirname, 'src/popup/index.tsx'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'index.css' || assetInfo.name === 'styles.css') {
            return 'index.css';
          }
          return 'assets/[name].[ext]';
        }
      }
    }
  }
});