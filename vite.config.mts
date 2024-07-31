import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/test/**/*.spec.ts"],
    environment: "node",
    coverage: {
      exclude: ["node_modules", "out", "src/typings", ".vscode-test"],
    },
  },
});
