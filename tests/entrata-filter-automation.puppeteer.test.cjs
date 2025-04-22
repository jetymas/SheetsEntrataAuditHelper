/**
 * @jest-environment puppeteer
 */
/* global page */
const path = require("path");
const fs = require("fs");

describe("Entrata Residents Filtering Automation", () => {
  beforeAll(async () => {
    // Stub jQuery and $ as globals to avoid ReferenceErrors from the HTML fixture
    await page.evaluateOnNewDocument(() => {
      window.$ = window.jQuery = function() { return { length: 0, on: () => {}, off: () => {}, ready: () => {}, find: () => ({}) }; }; //NOSONAR
    });
    // Load the Entrata residents HTML page as a local file
    const htmlPath = path.resolve(process.cwd(), "docs/webpages/Entrata page 2 - residents list/Entrata page 2 - residents.TESTFIXTURE.html");
    let html = fs.readFileSync(htmlPath, "utf8");
    // Remove all <script> tags to avoid loading Entrata JS and causing ReferenceErrors
    html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await page.addScriptTag({ path: path.resolve(__dirname, "../entrata-filter-automation.global.js") });
  });

  it("applies Lease Status Current and Sub Status Renewed", async () => {
    await page.evaluate(async () => {
      await window.applyEntrataResidentFilters({ status: ["4"], subStatus: ["3"] });
    });
    // Assert status checkbox is checked
    const isStatusChecked = await page.$eval("#status_filter_items input[type=\"checkbox\"][value=\"4\"]", el => el.checked);
    expect(isStatusChecked).toBe(true);
    // Assert sub status checkbox is checked
    const isSubStatusChecked = await page.$eval("#sub_status_filter_items input[type=\"checkbox\"][value=\"3\"]", el => el.checked);
    expect(isSubStatusChecked).toBe(true);
  });
});
