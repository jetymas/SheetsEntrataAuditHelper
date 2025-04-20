import _puppeteer from "puppeteer";

import path from "path";
import { launchExtensionWithServer } from "./helpers/testHelpers.mjs";
import { prepareE2EPage } from "./helpers/e2ePageHelper.mjs";

let browser, extensionId, server, popupPage;

jest.setTimeout(20000);

describe("Chrome Identity Stub E2E", () => {
  beforeAll(async () => {
    const extensionRoot = path.resolve(__dirname, "../../");
    ({ browser, extensionId, server } = await launchExtensionWithServer(
      extensionRoot,
      path.resolve(__dirname, "../../reference/webpages"),
    ));
    popupPage = await browser.newPage();
    await prepareE2EPage(popupPage);
    await popupPage.goto(`chrome-extension://${extensionId}/src/popup.html`, {
      waitUntil: "load",
    });
  }, 30000);

  afterAll(async () => {
    if (browser) await browser.close();
    if (server) server.close();
  });

  it("injects chrome.identity stub and bypasses Google login", async () => {
    // Evaluate in popup context: check for stub log and call getAuthToken
    const _stubLog = await popupPage.evaluate(() => {
      return (
        window.console &&
        Array.from(document.querySelectorAll("body *")).some((el) =>
          el.textContent.includes("chrome.identity stub injected"),
        )
      );
    });

    // Actually invoke the stubbed API
    const token = await popupPage.evaluate(() => {
      return new Promise((resolve) => {
        chrome.identity.getAuthToken({}, resolve);
      });
    });
    expect(token).toBe("fake-oauth-token-e2e");
  });
});
