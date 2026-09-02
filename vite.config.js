import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// The dev server proxies every same-origin API route through the existing Node
// server, which forwards only AI inference requests to the Python service.
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
