import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

import packageJson from "./package.json";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
});
