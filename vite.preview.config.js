import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ root: 'preview', base: './', publicDir: '../public', plugins: [react()], build: { outDir: '../preview-dist', emptyOutDir: true } });
