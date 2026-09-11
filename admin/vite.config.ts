import {defineConfig, loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {firebaseProcessEnvDefines} from '../shared/firebaseEnv';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(rootDir, '..');

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, repoRoot, 'VITE_');
  return {
    plugins: [react()],
    envDir: repoRoot,
    define: firebaseProcessEnvDefines(env),
    resolve: {
      alias: {
        '@shared': path.resolve(rootDir, '../shared'),
      },
    },
    server: {
      port: 5173,
      host: '127.0.0.1',
    },
  };
});
