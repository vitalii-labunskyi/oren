import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OREN",
    short_name: "OREN",
    description:
      "Особистий дашборд екосистеми: сервери, n8n, Supabase, час, агенти",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    // SVG-іконка достатня для Android/Chromium; PNG-набір і splash — у Phase 3
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
