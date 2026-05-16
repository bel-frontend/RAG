import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = `http://localhost:${env.SERVER_PORT || '3001'}`;

  return {
    root: 'frontend',
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': apiTarget,
      },
    },
    build: {
      outDir: '../dist',
      emptyOutDir: true,
    },
  };
});
