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
    minify: true, 
    emptyOutDir: false, // Don't empty - we'll handle cleaning in build.js
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content.tsx'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'content.css' || assetInfo.name === 'styles.css') {
            return 'styles.css';
          }
          return 'assets/[name].[ext]';
        }
      }
    }
  }
});