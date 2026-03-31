import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default {
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@puzzling-potions/core': path.resolve(__dirname, '../core/src/index.ts'),
    },
  },
  server: {
    host: true,
    port: 8001,
  },
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
  },
};
