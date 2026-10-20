import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  define: {
    __DEV__: true,
  },
  test: {
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts", "packages/**/*.test.ts", "scripts/**/*.test.ts"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
      {
        resolve: { alias: { "react-native": "react-native-web" } },
        test: {
          name: "components",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
    ],
    coverage: { provider: "v8", include: ["src/**", "packages/**"] },
  },
});
