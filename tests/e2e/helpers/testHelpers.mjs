import puppeteer from 'puppeteer';
import http from 'http';
import handler from 'serve-handler';
import sheetResponse from '../../fixtures/sheetResponse.json';
import getPort from './getPort.mjs';

/**
 * Injects the chrome.identity stub into all extension contexts.
 * @param {import('puppeteer').Browser} browser
 */
export async function injectChromeIdentityStub(browser) {
  const stubPath = new URL('./chrome-identity-stub.mjs', import.meta.url).pathname;
  const targets = await browser.targets();
  for (const target of targets) {
    if (['background_page','service_worker'].includes(target.type()) || target.url().includes('popup.html')) {
      try {
        const page = await target.page?.();
        if (page) await page.addScriptTag({ path: stubPath });
      } catch {}
    }
  }
}

export async function launchExtensionWithServer(extensionRoot, pagesPath) {
  const port = await getPort(0);
  const server = http.createServer((req, res) => handler(req, res, { public: pagesPath }));
  await new Promise(res => server.listen(port, res));
  const browser = await puppeteer.launch({ headless:false, pipe:true, args: [`--disable-extensions-except=${extensionRoot}`,`--load-extension=${extensionRoot}`, '--no-sandbox','--disable-setuid-sandbox'] });
  autoStubAllPages(browser);
  let extensionTarget, tries=0;
  while (!extensionTarget && tries<25) {
    await new Promise(r=>setTimeout(r,200));
    extensionTarget = (await browser.targets()).find(t=>t.url().startsWith('chrome-extension://'));
    tries++;
  }
  if (!extensionTarget) throw new Error('Extension target not found');
  const extensionId = extensionTarget.url().split('/')[2];
  await injectChromeIdentityStub(browser);
  return { browser, extensionId, server };
}

export function setupRequestInterception(page) {
  page.setDefaultNavigationTimeout(5000);
  page.setDefaultTimeout(5000);
  page.setRequestInterception(true);
  const sheetRequests = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('sheets.googleapis.com')) {
      sheetRequests.push(url);
      req.respond({ status:200, contentType:'application/json', body:JSON.stringify(sheetResponse) });
    } else req.continue();
  });
  return sheetRequests;
}

export async function captureScreenshotsOnFailure(browser, testName) {
  if (!browser) return;
  const pages = await browser.pages();
  for (let i=0;i<pages.length;i++) {
    const filePath = new URL(`../../screenshots/${testName}-page${i+1}.png`, import.meta.url).pathname;
    await pages[i].screenshot({ path:filePath });
  }
}

export async function autoStubAllPages(browser) {
  const { prepareE2EPage } = await import('./e2ePageHelper.mjs');
  browser.on('targetcreated', async target=>{
    const turl=target.url();
    if (target.type()==='page' && turl.includes('accounts.google.com')) {
      try{(await target.page()).close();}catch{}
      return;
    }
    try{
      const page = await target.page?.();
      if (page) await prepareE2EPage(page);
    }catch{}
  });
}
