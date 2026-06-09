const typescriptEslintParser = require("@typescript-eslint/parser");
const typescriptEslintPlugin = require("@typescript-eslint/eslint-plugin");
const reactPlugin = require("eslint-plugin-react");
const prettierConfig = require("eslint-config-prettier");

module.exports = [
  {
    ignores: ["node_modules/", "dist/", "public/", "api/", "build/"]
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.cjs", "**/*.mjs"],
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      "@typescript-eslint": typescriptEslintPlugin,
      "react": reactPlugin
    },
    rules: {
      ...typescriptEslintPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "no-undef": "off" // TypeScript handles undefs
    },
    settings: {
      react: { version: "detect" }
    }
  },
  prettierConfig
];
