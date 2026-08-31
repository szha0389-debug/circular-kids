import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// The dev server proxies /api to the local Node API (server.js) so the browser
// always talks to a same-origin API, matching the production CSP (connect-src 'self').
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) }
  },
  server: {
    port: 5173,
    proxy: { "/api": { target: "http://127.0.0.1:5121", changeOrigin: true } }
  },
  build: {
    outDir: "dist",
    sourcemap: false
  }
});
