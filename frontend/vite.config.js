import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development, requests to /api are proxied to the FastAPI backend,
// so no CORS setup or VITE_API_URL is needed locally.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: true,
    proxy: {
      "/api": { target: "http://127.0.0.1:8000", changeOrigin: true },
    },
  },
});
