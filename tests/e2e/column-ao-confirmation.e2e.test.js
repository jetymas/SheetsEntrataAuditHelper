/**
 * E2E test for AO column user confirmation workflow in the Entrata Lease Audit Assistant Chrome extension.
 * Validates that the popup UI displays the correct confirmation dialog and processes user input for AO.
 * Requires Puppeteer and Jest. Assumes extension and static server are started as in audit.e2e.test.js.
 */
// @jest-environment node
const path = require('path');
const puppeteer = require('puppeteer');
const { launchExtensionWithServer, setupRequestInterception } = require('./helpers/testHelpers');
const pagesPath = path.resolve(__dirname, '../../reference/webpages');

let server, browser, extensionId, page, popupPage;

jest.setTimeout(20000);

describe('Column AO User Confirmation E2E', () => {
  beforeAll(async () => {
    // LOG: Setup started
    // eslint-disable-next-line no-console
    console.log('E2E beforeAll: Setup started');
    const extensionRoot = path.resolve(__dirname, '../../');
    ({ browser, extensionId, server } = await launchExtensionWithServer(extensionRoot, pagesPath));
    // LOG: Extension and server launched
    // eslint-disable-next-line no-console
    console.log('E2E beforeAll: Extension and server launched');
    const { autoStubAllPages } = require('./helpers/testHelpers');
    autoStubAllPages(browser);
    // LOG: autoStubAllPages attached
    // eslint-disable-next-line no-console
    console.log('E2E beforeAll: autoStubAllPages attached');
    page = await browser.newPage();
    // LOG: Blank page created
    // eslint-disable-next-line no-console
    console.log('E2E beforeAll: Blank page created');
    const { prepareE2EPage } = require('./helpers/e2ePageHelper');
    popupPage = await browser.newPage();
    // Capture all console output from popupPage
    popupPage.on('console', msg => {
      for (let i = 0; i < msg.args().length; ++i)
        // eslint-disable-next-line no-console
        console.log(`POPUP LOG [${msg.type()}]: ${msg.args()[i]}`);
    });
    await prepareE2EPage(popupPage);
    // LOG: prepareE2EPage run for popupPage
    // eslint-disable-next-line no-console
    console.log('E2E beforeAll: prepareE2EPage run for popupPage');
    await popupPage.goto(`chrome-extension://${extensionId}/src/popup.html`, { waitUntil: 'load' });
    // LOG: popupPage loaded
    // eslint-disable-next-line no-console
    console.log('E2E beforeAll: popupPage loaded');
  }, 30000);

  afterAll(async () => {
    if (browser) await browser.close();
    if (server) server.close();
  });

  it('prompts user for AO column and processes confirmation', async () => {
    try {
      // Fill in the Google Sheet URL input
      await popupPage.waitForSelector('#spreadsheetUrl', { timeout: 20000 });
      await popupPage.type('#spreadsheetUrl', 'https://docs.google.com/spreadsheets/d/test-sheet-id/edit');
      await popupPage.waitForSelector('#startAudit', { timeout: 10000 });
      await popupPage.click('#startAudit');

      // Simulate the background/content sending a fieldVerificationPrompt for AO in the popup's JS context
      await popupPage.evaluate(() => {
        chrome.runtime.onMessage.dispatch({
          type: 'fieldVerificationPrompt',
          promptData: {
            fieldName: 'Document Upload Verification',
            pdfValue: '',
            expectedValue: '',
            message: 'Please verify that proof of employment, rental history, or international documents are uploaded. Navigate to the resident\'s Documents tab and click Next when completed.',
            column: 'AO'
          }
        });
      });

      // Wait for the dialog to appear
      await popupPage.waitForSelector('#ea-popup-verification-dialog', { timeout: 10000 });
      const dialogText = await popupPage.$eval('#ea-popup-verification-dialog', el => el.textContent);
      expect(dialogText).toContain('Document Upload Verification');
      expect(dialogText).toContain('Please verify that proof of employment');

      // Click 'Mark as Verified'
      await popupPage.click('.ea-popup-btn-confirm');

      // The dialog should disappear
      await popupPage.waitForSelector('#ea-popup-verification-dialog', { hidden: true, timeout: 5000 });
    } catch (err) {
      // Capture screenshot and console logs for debugging
      await popupPage.screenshot({ path: 'ao-popup-failure.png' });
      const logs = await popupPage.evaluate(() => Array.from(window.console.logs || []));
      // eslint-disable-next-line no-console
      console.error('AO Confirmation E2E Debug:', err, logs);
      throw err;
    }
  }, 40000);
});
