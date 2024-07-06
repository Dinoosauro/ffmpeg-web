import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import crossOriginIsolation from 'vite-plugin-cross-origin-isolation';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte(), crossOriginIsolation()],
  server: {
    port: 5173
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  },
  base: "",
  optimizeDeps: {
    exclude: ["ffmpeg12"],
  },
})
