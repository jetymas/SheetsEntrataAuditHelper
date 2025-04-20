import fetchMock from "jest-fetch-mock";
fetchMock.enableMocks();

// Mock window.find (not implemented in jsdom)
if (!window.find) {
  window.find = () => false;
}

// Mock scrollIntoView (not implemented in jsdom)
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function () {};
}

import { fn } from "jest-mock";

// Mock chrome.runtime for popup tests
global.chrome = {
  runtime: { onMessage: { addListener: fn() } },
};

import { TextEncoder, TextDecoder } from "util";
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
