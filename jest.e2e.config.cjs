module.exports = {
  preset: "jest-puppeteer",
  testMatch: [
    "<rootDir>/src/js/__tests__/**/*.puppeteer.test.js",
    "<rootDir>/src/js/__tests__/**/*.puppeteer.test.cjs",
    "<rootDir>/src/js/__tests__/**/entrata-filter-automation.puppeteer.test.js",
    "<rootDir>/src/js/__tests__/**/entrata-filter-automation.puppeteer.test.cjs"
  ],
};
