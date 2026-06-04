import prettierConfig from "eslint-config-prettier";

const browserGlobals = {
  document: "readonly",
  fetch: "readonly",
  FormData: "readonly",
  Headers: "readonly",
  localStorage: "readonly",
  navigator: "readonly",
  requestAnimationFrame: "readonly",
  Response: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
  window: "readonly",
};

const nodeGlobals = {
  Buffer: "readonly",
  console: "readonly",
  module: "readonly",
  process: "readonly",
  require: "readonly",
  __dirname: "readonly",
};

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "**/*.ts",
      "**/*.tsx",
    ],
  },
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...browserGlobals,
        ...nodeGlobals,
      },
    },
    rules: {
      ...prettierConfig.rules,
      "no-unused-vars": "off",
    },
  },
];
