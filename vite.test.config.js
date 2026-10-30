import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
const f = (n) => path.resolve('test/fake', n);
export default defineConfig({
  root: 'test',
  publicDir: path.resolve('public'),
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^firebase\/app$/, replacement: f('app.js') },
      { find: /^firebase\/auth$/, replacement: f('auth.js') },
      { find: /^firebase\/firestore$/, replacement: f('firestore.js') },
      { find: /^firebase\/storage$/, replacement: f('storage.js') },
      { find: /^virtual:pwa-register\/react$/, replacement: f('pwa.js') }
    ]
  },
  server: { port: 5199, strictPort: true, fs: { allow: [path.resolve('.')] } }
});
