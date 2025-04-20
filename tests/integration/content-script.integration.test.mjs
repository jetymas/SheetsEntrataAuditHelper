import fs from "fs";
import { TextEncoder, TextDecoder } from "util";
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
import { JSDOM, VirtualConsole, ResourceLoader } from "jsdom";
import path from "path";

describe("Content Script Integration", () => {
  let dom, window, _document;
  let addListenerSpy;

  beforeAll(() => {
    const logPath = "reference/error logs/set2/test7flushed.log";
    fs.appendFileSync(logPath, "[TEST] beforeAll: starting setup\n");
    // Pipe all window.console logs to file and suppress jsdom errors
    const virtualConsole = new VirtualConsole();
    virtualConsole.on("log", (msg) => {
      fs.appendFileSync(logPath, `[JSDOM console.log] ${msg}\n`);
    });
    virtualConsole.on("error", (msg) => {
      fs.appendFileSync(logPath, `[JSDOM console.error] ${msg}\n`);
    });
    virtualConsole.on("warn", (msg) => {
      fs.appendFileSync(logPath, `[JSDOM console.warn] ${msg}\n`);
    });
    virtualConsole.on("jsdomError", () => {});
    // (remainder of setup code follows)

    const htmlPath = path.resolve(
      process.cwd(),
      "reference",
      "webpages",
      "Entrata page 1 - start page",
      "Entrata Start Page.html",
    );
    const html = fs.readFileSync(htmlPath, "utf8");
    const resourceLoader = new ResourceLoader({
      fetch: () => Promise.resolve(Buffer.alloc(0)), // disables all external fetches
    });
    dom = new JSDOM(html, {
      runScripts: "outside-only",
      resources: resourceLoader,
      virtualConsole,
    });
    window = dom.window;
    document = window.document;

    // Mock chrome.runtime.onMessage
    addListenerSpy = jest.fn();
    window.chrome = {
      runtime: { onMessage: { addListener: addListenerSpy } },
    };

    // Load content script into JSDOM
    const scriptCode = fs.readFileSync(
      path.resolve(process.cwd(), "dist/content.bundle.js"),
      "utf8",
    );
    window.eval(
      `
  console.log('[TEST] content.bundle.js: script start');
` +
        scriptCode +
        `
  console.log('[TEST] content.bundle.js: script end');
`,
    );
  });

  it("registers onMessage listener", () => {
    expect(addListenerSpy).toHaveBeenCalled();
  });

  it("responds to ping with alive status and debug info", () => {
    const listener = addListenerSpy.mock.calls[0][0];
    const sendResponse = jest.fn();
    listener({ action: "ping" }, null, sendResponse);
    const allResponses = sendResponse.mock.calls.map((c) => c[0]);
    const resp = allResponses.find((r) => r.status === "alive");
    expect(resp).toBeDefined();
    expect(resp.debug).toHaveProperty("url");
    expect(resp.debug).toHaveProperty("timestamp");
  });

  afterAll(() => {
    const logPath = "reference/error logs/set2/test7flushed.log";
    fs.appendFileSync(logPath, "[TEST] afterAll: starting teardown\n");
    // Close JSDOM window to prevent resource loading after tests
    dom.window.close();
  });
});
