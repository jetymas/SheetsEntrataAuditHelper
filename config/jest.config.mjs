export default {
  // Ensure project root is parent of config folder
  rootDir: '../',
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/config/jest.setup.js"],
  moduleFileExtensions: ["js", "json", "mjs"],
  testMatch: ["**/tests/**/*.test.js", "**/tests/**/*.test.mjs"],
  transform: { "^.+\\.m?js$": "babel-jest" },
  transformIgnorePatterns: ["/node_modules/"],
  moduleNameMapper: {
    // Map ESM .mjs modules
    '^src/js/column-modules/(.*)\\.js$': '<rootDir>/src/js/column-modules/$1.mjs',
    // Map one-level relative imports from tests
    '^\\.\\.\\/src/js/column-modules/(.*)\\.js$': '<rootDir>/src/js/column-modules/$1.js',
    // Map two-level relative imports from tests
    '^\\.\\.\\/\\.\\.\\/src/js/column-modules/(.*)\\.js$': '<rootDir>/src/js/column-modules/$1.js'
  },
  coveragePathIgnorePatterns: [
    "/content.js$", "/background.js$", "/popup.js$", "/background-worker.js$", "/column-modules/", "/audit-types/", "/AuditController.js$"
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
    "!src/js/AuditController.js"
  ],
  coverageThreshold: {
    global: { branches: 85, functions: 85, lines: 85, statements: 85 }
  }
};
