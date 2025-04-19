// helpers/e2ePageHelper.js
// Universal E2E page prep: inject chrome.identity stub and intercept Google API requests
const fs = require('fs');
const path = require('path');
const sheetResponse = require('../../fixtures/sheetResponse.json');

// Global tracking of Sheets API requests across all pages
const globalSheetRequests = [];

async function prepareE2EPage(page) {
  if (page.__e2ePrepped) return;
  page.__e2ePrepped = true;
  // Inject chrome.identity stub before any scripts run
  await page.evaluateOnNewDocument(fs.readFileSync(
    require.resolve('./chrome-identity-stub.js'),
    'utf8'
  ));
  // Stub chrome.runtime.sendMessage for audit tests to simulate immediate start
  await page.evaluateOnNewDocument(`
    window.chrome = window.chrome || {};
    chrome.runtime = chrome.runtime || {};
    chrome.runtime.sendMessage = (msg, cb) => { if(cb) cb({ status: 'in_progress', message: 'Initializing audit...', currentRecordIndex: 0, recordCount: 0 }); };
    chrome.runtime.onMessage = { addListener: () => {} };
  `);

  // Intercept Google Sheets and OAuth requests
  await page.setRequestInterception(true);
  page.on('request', req => {
    const url = req.url();
    // Intercept main document navigation to Google login pages
    if (url.includes('accounts.google.com') || url.match(/\/AddSession/)) {
      req.respond({ status: 200, contentType: 'text/html', body: '<html><body>OAuth Stub</body></html>' });
    } else if (url.includes('sheets.googleapis.com')) {
      // Track Sheets API call
      globalSheetRequests.push(url);
      req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(sheetResponse) });
    } else if (url.includes('oauth2') || url.includes('token')) {
      req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ access_token: 'fake-oauth-token-e2e' }) });
    } else {
      req.continue();
    }
  });
}

// Export stub prep and global tracking array
module.exports = { prepareE2EPage, globalSheetRequests };
