import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'node:path';
import fs from 'node:fs';
const f = (n) => path.resolve('test/fake', n);
const inlineLogos = {
  name: 'inline-logos', enforce: 'pre',
  transform(code, id) {
    if (!/[\\/]src[\\/]/.test(id)) return;
    const b = (p) => JSON.stringify('data:image/png;base64,' + fs.readFileSync(path.resolve('public', p)).toString('base64'));
    return code.replace(/['"]\/((logos|icons)\/[\w-]+\.png)['"]/g, (_, p) => b(p));
  }
};
export default defineConfig({
  root: 'demo', publicDir: false, base: './',
  plugins: [inlineLogos, react(), viteSingleFile()],
  build: { outDir: path.resolve('demo-dist'), emptyOutDir: true },
  resolve: { alias: [
    { find: /^firebase\/app$/, replacement: f('app.js') },
    { find: /^firebase\/auth$/, replacement: f('auth.js') },
    { find: /^firebase\/firestore$/, replacement: f('firestore.js') },
    { find: /^firebase\/storage$/, replacement: f('storage.js') },
    { find: /^virtual:pwa-register\/react$/, replacement: f('pwa.js') }
  ] }
});
