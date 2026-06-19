import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@linkatlas/contracts": new URL("./packages/contracts/src/index.ts", import.meta.url)
        .pathname,
      "@linkatlas/domain": new URL("./packages/domain/src/index.ts", import.meta.url).pathname,
      "@linkatlas/ingestion": new URL("./packages/ingestion/src/index.ts", import.meta.url)
        .pathname,
      "@linkatlas/storage": new URL("./packages/storage/src/index.ts", import.meta.url).pathname,
    },
  },
  test: {
    environment: "node",
    include: [
      "packages/**/*.test.ts",
      "apps/**/*.test.ts",
      "tests/**/*.test.ts",
      "tests/**/*.spec.ts",
    ],
    exclude: ["tests/e2e/**", "**/node_modules/**", "**/dist/**"],
    restoreMocks: true,
  },
});
