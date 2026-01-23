import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        visualizer({
          filename: './dist/stats.html',
          open: false,
          gzipSize: true,
          brotliSize: true,
        }),
      ],
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
      },
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './test/setup.ts',
        coverage: {
          provider: 'v8',
          reporter: ['text', 'json', 'html'],
          exclude: [
            'node_modules/',
            'test/',
            '**/*.d.ts',
            '**/*.config.*',
            '**/mockData',
            'dist/',
          ],
        },
      },
    };
});
