import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['leaflet', 'react-leaflet']
  },
  server: {
    host: '0.0.0.0', // Permite acceso desde la red local
    port: 5173,
    strictPort: false,
  }
});
