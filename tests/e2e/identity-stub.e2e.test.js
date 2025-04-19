/**
 * E2E test: Chrome identity stub is injected and Google login is bypassed
 * Ensures that chrome.identity API is stubbed and Google login does not block tests
 */
// @jest-environment node
const path = require('path');
const puppeteer = require('puppeteer');
const { launchExtensionWithServer } = require('./helpers/testHelpers');

let browser, extensionId, server, popupPage;

jest.setTimeout(20000);

describe('Chrome Identity Stub E2E', () => {
  beforeAll(async () => {
    const extensionRoot = path.resolve(__dirname, '../../');
    ({ browser, extensionId, server } = await launchExtensionWithServer(extensionRoot, path.resolve(__dirname, '../../reference/webpages')));
    const { prepareE2EPage } = require('./helpers/e2ePageHelper');
    popupPage = await browser.newPage();
    await prepareE2EPage(popupPage);
    await popupPage.goto(`chrome-extension://${extensionId}/src/popup.html`, { waitUntil: 'load' });
  }, 30000);

  afterAll(async () => {
    if (browser) await browser.close();
    if (server) server.close();
  });

  it('injects chrome.identity stub and bypasses Google login', async () => {
    // Evaluate in popup context: check for stub log and call getAuthToken
    const stubLog = await popupPage.evaluate(() => {
      return window.console && Array.from(document.querySelectorAll('body *')).some(el => el.textContent.includes('chrome.identity stub injected'));
    });

    // Actually invoke the stubbed API
    const token = await popupPage.evaluate(() => {
      return new Promise(resolve => {
        chrome.identity.getAuthToken({}, resolve);
      });
    });
    expect(token).toBe('fake-oauth-token-e2e');
  });
});
