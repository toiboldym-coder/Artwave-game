import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

const base = process.env.VITE_BASE || "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon.svg", "portraits/*.jpg"],
      manifest: {
        name: "Artwave",
        short_name: "Artwave",
        description: "Взрывной матч-3 про Айдара, Адиля и Артёма",
        theme_color: "#140b2e",
        background_color: "#140b2e",
        display: "standalone",
        orientation: "portrait",
        start_url: base,
        icons: [
          {
            src: "icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
});
