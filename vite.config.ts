import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              // Core React and framework
              'vendor-react': ['react', 'react-dom'],
              // Animation library
              'vendor-motion': ['framer-motion'],
              // Authentication
              'vendor-clerk': ['@clerk/clerk-react'],
              // UI utilities
              'vendor-ui': ['lucide-react', 'dompurify', 'react-helmet-async'],
            }
          }
        }
      }
    };
});
