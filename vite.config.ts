import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from '@svgr/rollup';

// https://vitejs.dev/config/
export default defineConfig({
  css: {
    modules: {
      // localsConvention: 'camelCaseOnly',
      // scopeBehaviour: 'local',
    },
  },
  plugins: [svgr(), react()],
});
