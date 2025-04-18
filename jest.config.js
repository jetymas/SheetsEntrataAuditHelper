module.exports = {
  testEnvironment: "jsdom",
  setupFiles: ["<rootDir>/jest.setup.js"],
  moduleFileExtensions: ["js", "json"],
  testMatch: ["**/tests/**/*.test.js"],
  coveragePathIgnorePatterns: ["/content.js$", "/background.js$", "/popup.js$", "/background-worker.js$", "/column-modules/", "/audit-types/", "/AuditController\.js$"],
  collectCoverageFrom: [
    "src/js/**/*.js",
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