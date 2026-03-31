import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
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
          includeAssets: ['logos/celestiarcana-moon.webp', 'background-celestiarcana.avif', 'background-celestiarcana.webp'],
          manifest: false, // Use existing public/manifest.json
          workbox: {
            globPatterns: ['**/*.{js,css,ico,png,svg,webp,avif,woff,woff2}'],
            globIgnores: [
              '**/background-celestiarcana.png', // 2MB PNG excluded — AVIF/WebP are precached instead
              '**/Admin*.js',
              '**/BlogPostEditor*.js',
              '**/TarotArticleEditor*.js',
              '**/TranslationToolbar*.js',
              '**/WithdrawalForm*.js',
              '**/stats.html',
              '**/birthCard*.js',       // Birth card JSON data — loaded on demand
              '**/unifiedBirth*.js',    // Unified birth card data — loaded on demand
              '**/vendor-tiptap*.js',   // Rich text editor — admin only
            ],
            maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB
            runtimeCaching: [
              {
                // HTML pages — always fetch from network, cache as fallback for offline
                urlPattern: ({ request }) => request.mode === 'navigate',
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'html-cache',
                  expiration: {
                    maxEntries: 30,
                    maxAgeSeconds: 60 * 60 * 24, // 1 day
                  },
                  networkTimeoutSeconds: 5,
                },
              },
              // API calls are NOT cached by the service worker.
              // All API calls are cross-origin (api.celestiarcana.com) and
              // caching them causes stale auth responses and hanging admin requests.
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
            ],
            clientsClaim: true,
            skipWaiting: true,
            // No navigateFallback — use NetworkFirst runtime caching for navigation instead.
            // This ensures users always get fresh HTML after deploys.
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
            manualChunks(id) {
              if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'vendor-react';
              if (id.includes('node_modules/framer-motion')) return 'vendor-motion';
              if (id.includes('node_modules/@clerk/')) return 'vendor-clerk';
              if (id.includes('node_modules/lucide-react') || id.includes('node_modules/dompurify') || id.includes('node_modules/@dr.pogodin/react-helmet')) return 'vendor-ui';
              if (id.includes('node_modules/@sentry/')) return 'vendor-sentry';
              if (id.includes('node_modules/@tiptap/') || id.includes('node_modules/prosemirror')) return 'vendor-tiptap';
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
