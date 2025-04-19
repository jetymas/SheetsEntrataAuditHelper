const path = require('path');
const puppeteer = require('puppeteer');
const http = require('http');
const handler = require('serve-handler');
const sheetResponse = require('../../fixtures/sheetResponse.json');

const getPort = require('./getPort');

async function injectChromeIdentityStub(browser) {
  const stubPath = require.resolve('./chrome-identity-stub.js');
  const targets = await browser.targets();
  for (const target of targets) {
    if (target.type() === 'background_page' || target.type() === 'service_worker' || target.url().includes('popup.html')) {
      try {
        const page = await target.page?.();
        if (page) {
          await page.addScriptTag({ path: stubPath });
        }
      } catch (e) {
        // In case some targets don't support page()
      }
    }
  }
}

async function launchExtensionWithServer(extensionRoot, pagesPath) {
  const port = await getPort(8080);
  const server = http.createServer((req, res) => handler(req, res, { public: pagesPath }));
  await new Promise((res) => server.listen(port, res));

  const browser = await puppeteer.launch({
    headless: false,
    pipe: true,
    args: [
      `--disable-extensions-except=${extensionRoot}`,
      `--load-extension=${extensionRoot}`,
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  // Attach global auto-stubbing of pages for chrome.identity and Google login
  autoStubAllPages(browser);

  // Wait for extension target to appear (robust against slow loads)
  let extensionTarget, tries = 0;
  while (!extensionTarget && tries < 25) { // up to 5s
    await new Promise(res => setTimeout(res, 200));
    const targets = await browser.targets();
    extensionTarget = targets.find(t => t.url().startsWith('chrome-extension://'));
    tries++;
  }
  if (!extensionTarget) throw new Error('Extension target not found after waiting 5s');
  const extensionId = extensionTarget.url().split('/')[2];

  // Inject chrome.identity stub into all extension contexts
  await injectChromeIdentityStub(browser);

  return { browser, extensionId, server };
}

function setupRequestInterception(page) {
  page.setDefaultNavigationTimeout(5000);
  page.setDefaultTimeout(5000);
  page.setRequestInterception(true);
  const sheetRequests = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('sheets.googleapis.com')) {
      sheetRequests.push(url);
      req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(sheetResponse) });
    } else {
      req.continue();
    }
  });
  return sheetRequests;
}

async function captureScreenshotsOnFailure(browser, testName) {
  if (!browser) return;
  const pages = await browser.pages();
  for (let i = 0; i < pages.length; i++) {
    const filePath = path.resolve(__dirname, `../../screenshots/${testName}-page${i + 1}.png`);
    await pages[i].screenshot({ path: filePath });
  }
}

const { prepareE2EPage } = require('./e2ePageHelper');

// Automatically stub all new pages
function autoStubAllPages(browser) {
  browser.on('targetcreated', async target => {
    const turl = target.url();
    // Auto-close any Google login pages to prevent UI showing
    if (target.type() === 'page' && turl.includes('accounts.google.com')) {
      try {
        const page = await target.page();
        if (page) {
          // eslint-disable-next-line no-console
          console.log(`[autoStubAllPages] Closing Google login page: url=${turl}`);
          await page.close();
        }
      } catch (e) {
        // ignore
      }
      return;
    }
    // Log every target creation for debugging
    // eslint-disable-next-line no-console
    console.log(`[autoStubAllPages] New target: type=${target.type()}, url=${target.url()}`);
    try {
      if (target.type() === 'page') {
        const page = await target.page();
        if (page) {
          // eslint-disable-next-line no-console
          console.log(`[autoStubAllPages] prepareE2EPage called for page url=${page.url()}`);
          await prepareE2EPage(page);
        }
      } else if (target.type() === 'service_worker' || target.type() === 'background_page') {
        // Try to inject stub if possible (may not always be supported)
        const page = await target.page?.();
        if (page) {
          // eslint-disable-next-line no-console
          console.log(`[autoStubAllPages] prepareE2EPage called for ${target.type()} url=${target.url()}`);
          await prepareE2EPage(page);
        } else {
          // eslint-disable-next-line no-console
          console.log(`[autoStubAllPages] Could not get page() for ${target.type()} url=${target.url()}`);
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(`[autoStubAllPages] Error handling target:`, e);
    }
  });
}

module.exports = { launchExtensionWithServer, setupRequestInterception, captureScreenshotsOnFailure, autoStubAllPages };
