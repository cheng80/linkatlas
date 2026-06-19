import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

export default defineConfig({
  base: "./",
  plugins: [react(), devCspPlugin()],
  root: resolve(import.meta.dirname, "src/renderer"),
  build: {
    emptyOutDir: true,
    outDir: resolve(import.meta.dirname, "dist/renderer"),
  },
});

function devCspPlugin(): Plugin {
  return {
    apply: "serve",
    name: "linkatlas-dev-csp",
    transformIndexHtml(html): string {
      return html.replace("style-src 'self'", "style-src 'self' 'unsafe-inline'");
    },
  };
}
