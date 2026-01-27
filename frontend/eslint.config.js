import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";

export default [
  {
    ignores: ["dist/**"],
  },
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  pluginReactConfig,
  {
    languageOptions: {
      globals: globals.browser,
    },
    settings: {
      react: {
        version: "detect"
      }
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^React$" }]
    }
  }
];
