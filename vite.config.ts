import svgr from '@svgr/rollup';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svgr(), react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          play: ['json5', '@typescript/vfs', '@monaco-editor/react'],
        },
      },
    },
  },
});
