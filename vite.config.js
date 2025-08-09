import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // 1年
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-stylesheets',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // 1年
                            }
                        }
                    }
                ]
            },
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon-192x192.png'],
            manifest: {
                name: 'はるメモ - アイデア前駆体収集器',
                short_name: 'はるメモ',
                description: '思い付きを逃がさない、アイデア前駆体収集器',
                theme_color: '#fcfbe4',
                background_color: '#fcfbe4',
                display: 'standalone',
                orientation: 'any',
                scope: '/',
                start_url: '/',
                categories: ['productivity', 'utilities'],
                lang: 'ja',
                icons: [
                    {
                        src: '/icons/app-icon-32.png',
                        sizes: '32x32',
                        type: 'image/png'
                    },
                    {
                        src: '/icons/app-icon-48.png',
                        sizes: '48x48',
                        type: 'image/png'
                    },
                    {
                        src: '/icons/app-icon-64.png',
                        sizes: '64x64',
                        type: 'image/png'
                    },
                    {
                        src: '/icons/app-icon-80.png',
                        sizes: '80x80',
                        type: 'image/png'
                    },
                    {
                        src: '/icons/app-icon-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any maskable'
                    },
                    {
                        src: '/icons/app-icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            },
            devOptions: {
                enabled: true, // 開発時もPWA機能をテスト
                type: 'module'
            }
        })
    ],
    build: {
        target: 'es2020',
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    konva: ['konva', 'react-konva'],
                    db: ['dexie']
                }
            }
        },
        sourcemap: false, // プロダクション用
        minify: 'esbuild',
        assetsInlineLimit: 4096
    },
    server: {
        host: true,
        port: 3000,
        https: false
    },
    preview: {
        host: true,
        port: 4173,
        https: false
    }
});
