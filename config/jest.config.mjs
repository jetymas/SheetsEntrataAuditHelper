export default {
  // Ensure project root is parent of config folder
  rootDir: "../",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/config/jest.setup.js"],
  moduleFileExtensions: ["js", "json", "mjs"],
  testMatch: [
    "**/tests/**/*.test.js",
    "**/tests/**/*.test.mjs",
    "<rootDir>/src/js/__tests__/**/*.test.js",
    "<rootDir>/src/js/__tests__/**/*.test.mjs"
  ],
  // Exclude E2E and integration tests until setup is complete
  testPathIgnorePatterns: ["<rootDir>/tests/e2e", "<rootDir>/tests/integration"],
  transform: { "^.+\\.m?js$": "babel-jest" },
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
    "/content.js$",
    "/background.js$",
    "/popup.js$",
    "/background-worker.js$",
    "/column-modules/",
    "/audit-types/",
    "/AuditController.js$",
  ],
  collectCoverageFrom: [
    "src/js/**/*.js",
    "!src/js/content-helpers.js",
    "!src/js/content.js",
    "!src/js/background.js",
    "!src/js/popup.js",
    "!src/js/background-worker.js",
    "!src/js/column-modules/**",
    "!src/js/audit-types/**",
    "!src/js/AuditController.js",
  ],
  coverageThreshold: {
    global: { branches: 85, functions: 85, lines: 85, statements: 85 },
  },
};
