import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^~(.+)/,
        replacement: path.join(process.cwd(), "node_modules/$1"),
      },
      {
        find: /^@\/(.+)/,
        replacement: path.join(process.cwd(), "src/$1"),
      },
    ],
  },
  test: {
    include: ["src/test/**/*.spec.ts"],
    environment: "node",
    coverage: {
      exclude: [
        "node_modules",
        "out",
        "src/test",
        "src/typings",
        ".vscode-test",
      ],
    },
  },
});
