import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  base: '/traders-tale/',
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  resolve: {
    alias: {
      '@lib': path.resolve(import.meta.dirname, './src/lib'),
    },
  },
});
