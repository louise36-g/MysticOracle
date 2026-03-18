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
            globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,avif,woff,woff2}'],
            globIgnores: [
              '**/background-celestiarcana.png', // 2MB PNG excluded — AVIF/WebP are precached instead
              '**/Admin*.js',
              '**/BlogPostEditor*.js',
              '**/TarotArticleEditor*.js',
              '**/TranslationToolbar*.js',
              '**/WithdrawalForm*.js',
              '**/stats.html',
            ],
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
            ],
            clientsClaim: true,
            skipWaiting: true,
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
