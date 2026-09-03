import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  publicDir: path.resolve(rootDir, '../admin/public'),
  resolve: {
    alias: {
      '@shared': path.resolve(rootDir, '../shared'),
    },
  },
  server: {
    port: 5174,
    host: '127.0.0.1',
  },
});
