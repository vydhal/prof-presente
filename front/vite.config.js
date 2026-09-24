import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { VitePWA } from "vite-plugin-pwa"; // 1. Importe o plugin VitePWA

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tailwindcss(),
    // 2. Adicione o plugin VitePWA à lista de plugins com sua configuração
    /* VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Prof Presente",
        short_name: "ProfPresente",
        description: "Sistema de check-in e gestão de eventos educacionais.",
        theme_color: "#1a202c", // Cor escura para combinar com o tema
        background_color: "#1a202c",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      devOptions: {
        enabled: false // Desabilita PWA em dev
      }
    }), */
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3001,
    strictPort: true, // Fail if port is busy instead of switching
  },
});
