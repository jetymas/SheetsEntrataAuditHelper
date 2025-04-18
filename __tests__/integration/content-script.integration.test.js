const fs = require('fs');
const path = require('path');
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
const { JSDOM, VirtualConsole } = require('jsdom');

describe('Content Script Integration', () => {
  let dom, window, document;
  let addListenerSpy;

  beforeAll(() => {
    // Suppress jsdom errors and disable external resource loading during tests
    const virtualConsole = new VirtualConsole();
    virtualConsole.on('jsdomError', () => {});
    virtualConsole.on('error', () => {});

    const htmlPath = path.resolve(__dirname, '../../reference/webpages/Entrata page 1 - start page/Entrata Start Page.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    dom = new JSDOM(html, {
      runScripts: 'outside-only',
      resources: 'skip',
      virtualConsole
    });
    window = dom.window;
    document = window.document;

    // Mock chrome.runtime.onMessage
    addListenerSpy = jest.fn();
    window.chrome = {
      runtime: { onMessage: { addListener: addListenerSpy } }
    };

    // Load content script into JSDOM
    const scriptCode = fs.readFileSync(
      path.resolve(__dirname, '../../src/js/content.js'),
      'utf8'
    );
    window.eval(scriptCode);
  });

  it('registers onMessage listener', () => {
    expect(addListenerSpy).toHaveBeenCalled();
  });

  it('responds to ping with alive status and debug info', () => {
    const listener = addListenerSpy.mock.calls[0][0];
    const sendResponse = jest.fn();
    listener({ action: 'ping' }, null, sendResponse);
    const allResponses = sendResponse.mock.calls.map(c => c[0]);
    const resp = allResponses.find(r => r.status === 'alive');
    expect(resp).toBeDefined();
    expect(resp.debug).toHaveProperty('url');
    expect(resp.debug).toHaveProperty('timestamp');
  });
});
