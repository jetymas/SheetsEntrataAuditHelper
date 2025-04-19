/**
 * E2E test for Chrome extension audit flow using Puppeteer.
 * Before running tests, start a static server for reference pages:
 *   npx http-server reference/webpages -p 8080
 */
/** @jest-environment node */
// @ts-nocheck
const path = require('path');
const puppeteer = require('puppeteer');
const http = require('http');
const handler = require('serve-handler');
const { launchExtensionWithServer, captureScreenshotsOnFailure, autoStubAllPages } = require('./helpers/testHelpers');
const { prepareE2EPage } = require('./helpers/e2ePageHelper');
const pagesPath = path.resolve(__dirname, '../../reference/webpages');
const sheetResponse = require('../fixtures/sheetResponse.json');
let server;
let browser;
let extensionId;
let popupPage;

jest.setTimeout(60000);

describe('E2E Audit Flow', () => {
  beforeAll(async () => {
    const extensionRoot = path.resolve(__dirname, '../../');
    ({ browser, extensionId, server } = await launchExtensionWithServer(extensionRoot, pagesPath));
    autoStubAllPages(browser);
    // Prepare popup page
    popupPage = await browser.newPage();
    await prepareE2EPage(popupPage);
    await popupPage.goto(`chrome-extension://${extensionId}/src/popup.html`, { waitUntil: 'load' });
  }, 30000);

  afterAll(async () => {
    if (browser) await browser.close();
    if (server) server.close();
  });

  afterEach(async () => {
    const testName = expect.getState().currentTestName.replace(/\s+/g, '_');
    if (expect.getState().testFailures > 0) {
      await captureScreenshotsOnFailure(browser, testName);
    }
  });

  it('runs audit and mocks Sheets API', async () => {
    // Log audit status messages from the extension
    popupPage.on('console', msg => {
      if (msg.text().includes('auditStatus')) {
        console.log('[PUPPETEER][AUDIT STATUS]', msg.text());
      }
    });
    // Capture intercepted Sheets API requests

    // Fill in the Google Sheet URL input before starting audit
    await popupPage.waitForSelector('#spreadsheetUrl', { timeout: 10000 });
    await popupPage.type('#spreadsheetUrl', 'https://docs.google.com/spreadsheets/d/test-sheet-id/edit');
    await popupPage.waitForSelector('#startAudit', { timeout: 10000 });
    await popupPage.click('#startAudit'); // updated selector based on popup.html

    // Assert startAudit button is disabled immediately after click
    const startDisabled = await popupPage.$eval('#startAudit', el => el.disabled);
    expect(startDisabled).toBe(true);
    // Assert status container is visible immediately after click
    const statusVisible = await popupPage.$eval('#status', el => !el.classList.contains('hidden'));
    expect(statusVisible).toBe(true);
  });
});
