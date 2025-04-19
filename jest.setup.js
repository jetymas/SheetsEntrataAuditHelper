import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();

// Mock window.find (not implemented in jsdom)
if (!window.find) {
  window.find = () => false;
}

// Mock scrollIntoView (not implemented in jsdom)
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function() {};
}

