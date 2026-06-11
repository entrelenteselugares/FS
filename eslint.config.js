const typescriptEslintParser = require("@typescript-eslint/parser");
const typescriptEslintPlugin = require("@typescript-eslint/eslint-plugin");
const reactPlugin = require("eslint-plugin-react");
const reactHooksPlugin = require("eslint-plugin-react-hooks");
const reactRefreshPlugin = require("eslint-plugin-react-refresh").default;
const prettierConfig = require("eslint-config-prettier");

module.exports = [
  {
    ignores: [
      "node_modules/",
      "dist/",
      "public/",
      "api/",
      "build/",
      "scratch/",
      "scripts/",
      "backend/scratch/",
      "backend/scripts/",
      "backend/src/scripts/",
      "backend/*.js",
      "*.js",
      "*.cjs",
      "wa-worker/dist/",
      "MANUAIS_DE_TELA/"
    ]
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
      "react": reactPlugin,
      "react-hooks": reactHooksPlugin,
      "react-refresh": reactRefreshPlugin
    },
    rules: {
      ...typescriptEslintPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/set-state-in-render": "off",
      "react-hooks/static-components": "off",
      "react-hooks/error-boundaries": "off",
      "react-hooks/globals": "off",
      "react-hooks/refs": "off",
      "react-hooks/unsupported-syntax": "off",
      "react-hooks/config": "off",
      "react-hooks/gating": "off",
      "react-hooks/use-memo": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-expressions": "off",
    },
    settings: {
      react: { version: "detect" }
    }
  },
  prettierConfig
];
