export default {
  // Ensure project root is parent of config folder
  rootDir: ".",
  // Default to jsdom for unit tests, use puppeteer for E2E
  testEnvironment: process.env.PUPPETEER_TEST ? "jest-environment-puppeteer" : "jsdom",
  setupFilesAfterEnv: ["<rootDir>/config/jest.setup.mjs"],
  moduleFileExtensions: ["js", "json", "mjs"],
  testMatch: [
    "**/tests/**/*.test.js",
    "**/tests/**/*.test.mjs",
    "<rootDir>/src/js/__tests__/**/*.test.js",
    "<rootDir>/src/js/__tests__/**/*.test.mjs",
    "<rootDir>/src/js/__tests__/**/*.puppeteer.test.js",
  ],
  // Exclude E2E and integration tests until setup is complete
  testPathIgnorePatterns: [
    "<rootDir>/tests/e2e",
    "<rootDir>/tests/integration",
  ],
  transform: { "^.+\\.m?[jt]sx?$": "babel-jest" },

  transformIgnorePatterns: ["/node_modules/"],
  moduleNameMapper: {
    // Map ESM .mjs modules
    "^src/js/column-modules/(.*)\\.js$":
      "<rootDir>/src/js/column-modules/$1.mjs",
    // Map one-level relative imports from tests
    "^\\.\\.\\/src/js/column-modules/(.*)\\.js$":
      "<rootDir>/src/js/column-modules/$1.mjs",
    // Map two-level relative imports from tests
    "^\\.\\.\\/\\.\\.\\/src/js/column-modules/(.*)\\.js$":
      "<rootDir>/src/js/column-modules/$1.mjs",
  },
  coveragePathIgnorePatterns: [
    "/column-modules/",
    "/audit-types/",
  ],
  collectCoverageFrom: [
    "src/js/**/*.js",
    "!src/js/content-helpers.js",
    "!src/js/column-modules/**",
    "!src/js/audit-types/**",
    "!src/js/AuditController.js",
  ],
  coverageThreshold: {
    global: { branches: 85, functions: 85, lines: 85, statements: 85 },
  },
};
