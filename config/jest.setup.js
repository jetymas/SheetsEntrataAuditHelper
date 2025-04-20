import { jest } from "@jest/globals";
global.jest = jest;
import fetchMock from "jest-fetch-mock";
import { createRequire } from "module";
global.require = createRequire(import.meta.url);
import { TextEncoder, TextDecoder } from "util";
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
global.__dirname = __dirname;
fetchMock.enableMocks();

// Mock window.find (not implemented in jsdom)
if (!window.find) {
  window.find = () => false;
}

// Mock scrollIntoView (not implemented in jsdom)
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function () {};
}

// Mock chrome.runtime for popup tests
global.chrome = {
  runtime: { onMessage: { addListener: jest.fn() } },
};
