import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/test/**/*.spec.ts"],
    environment: "node",
    coverage: {
      include: ["src"],
      exclude: ["src/test", "src/extension.ts"],
    },
  },
});
