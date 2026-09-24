import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// Vitest runs without the PWA/Tailwind plugins (tests don't need a service worker or compiled CSS).
// jsdom + Testing Library + MSW cover components and the /api fetch layer; no headless browser.
export default defineConfig({
  // Stub the build stamp (real values are injected by vite.config.ts at build time).
  define: {
    __BUILD_INFO__: JSON.stringify({
      version: "0.0.0-test",
      sha: "test",
      time: "1970-01-01T00:00:00.000Z",
      id: "test",
      channel: "dev",
    }),
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    css: false,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // POLITE DEFAULTS: this suite runs on the same laptop as the live herd (bridge + agents), and
    // vitest's default is one jsdom worker per core — a full run pins every core and the whole
    // machine buckles. Four workers keep peak load to a quarter of the cores; the wall clock pays
    // for it, the other tenants don't. Override with --maxWorkers=N when you genuinely want the
    // burn. (Full-suite validation runs on CI — .github/workflows/ci.yml — so this is the laptop's
    // comfort, not the gate's.)
    maxWorkers: 4,
  },
});
