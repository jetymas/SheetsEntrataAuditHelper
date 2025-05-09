const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

// Mock window.find (not implemented in jsdom)
if (!window.find) {
  window.find = () => false;
}

// Mock scrollIntoView (not implemented in jsdom)
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function () {};
}

const { fn } = require("jest-mock");

// Mock chrome.runtime for popup tests
global.chrome = {
  runtime: { onMessage: { addListener: fn() } },
};

const { TextEncoder, TextDecoder } = require("util");
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

global.__dirname = __dirname;
global.__filename = __filename;
