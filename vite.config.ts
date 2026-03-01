import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          injectRegister: false,
          includeAssets: ['logos/celestiarcana-moon.png', 'background-celestiarcana.avif', 'background-celestiarcana.webp'],
          manifest: false, // Use existing public/manifest.json
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,avif,woff,woff2}'],
            globIgnores: ['**/background-celestiarcana.png'], // 2MB PNG excluded — AVIF/WebP are precached instead
            maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB
            runtimeCaching: [
              {
                // API calls — network first, fall back to cache
                urlPattern: /\/api\//,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'api-cache',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60, // 1 hour
                  },
                  networkTimeoutSeconds: 10,
                },
              },
              {
                // Static image assets — cache first
                urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'image-cache',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                  },
                },
              },
              {
                // Google Fonts stylesheets
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'google-fonts-stylesheets',
                },
              },
              {
                // Google Fonts webfont files
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-webfonts',
                  expiration: {
                    maxEntries: 30,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                  },
                },
              },
            ],
            navigateFallback: 'index.html',
            navigateFallbackDenylist: [/^\/api/],
          },
        }),
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
              'vendor-ui': ['lucide-react', 'dompurify', '@dr.pogodin/react-helmet'],
            }
          }
        }
      },
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './test/setup.ts',
        exclude: [
          '**/node_modules/**',
          '**/dist/**',
          '**/.worktrees/**',
          '**/e2e/**',
          '**/*.spec.ts',
        ],
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
