import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  webServer: {
    command: "pnpm --filter @linkatlas/desktop exec vite --host 127.0.0.1 --port 4173 --strictPort",
    reuseExistingServer: true,
    url: "http://127.0.0.1:4173",
  },
  use: {
    baseURL: "http://127.0.0.1:4173",
  },
});
