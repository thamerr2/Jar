import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icons/*.png"],
      manifest: {
        name: "Jar Property Management",
        short_name: "Jar",
        description: "Manage your properties, maintenance requests, and payments",
        theme_color: "#3b82f6",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https?.*\/api\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 300 }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") }
  },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:5001", changeOrigin: true },
      "/uploads": { target: "http://localhost:5001", changeOrigin: true }
    }
  },
  define: {
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || "")
  }
});
