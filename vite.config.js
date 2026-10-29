import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['logos/*.png', 'icons/*.png'],
      manifest: {
        name: 'Moss Ajans',
        short_name: 'Moss',
        description: 'Moss Film Agency iş takip uygulaması',
        lang: 'tr',
        start_url: '/',
        display: 'standalone',
        background_color: '#F3F2EC',
        theme_color: '#2F4A2C',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: '/index.html'
      }
    })
  ]
});
