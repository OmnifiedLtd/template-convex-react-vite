import js from "@eslint/js"
import tseslint from "typescript-eslint"
import convexPlugin from "@convex-dev/eslint-plugin"

export default tseslint.config(
  {
    ignores: ["**/node_modules", "**/dist", "apps/**", "convex/_generated/**"],
  },
  {
    files: ["convex/**/*.ts"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: {
      "@convex-dev": convexPlugin,
    },
    rules: {
      // Convex-specific rules from the plugin
      "@convex-dev/no-old-registered-function-syntax": "error",

      // General TypeScript rules
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  }
)
