import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The React SPA lives in ./client but builds to ./dist at the repo root so
// Vercel's static output + /api serverless functions live side by side.
export default defineConfig({
  root: 'client',
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    // In local dev the Express server runs separately on 5000.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
