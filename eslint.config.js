import globals from "globals";

export default [
  {
    ignores: ["dist/**"],
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        chrome: "readonly",
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
      },
    },
    rules: {
      "no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-undef": "error",
      "no-console": "off",
      "prefer-const": "warn",
      eqeqeq: "error",
      semi: ["error", "always"],
      quotes: ["error", "double"],
      indent: ["error", 2],
    },
  },
  // Override for test files
  {
    files: ["tests/**/*.js", "tests/**/*.mjs", "tests/**/*.cjs"],
    languageOptions: {
      globals: {
        test: "readonly",
      },
    },
  },
];
