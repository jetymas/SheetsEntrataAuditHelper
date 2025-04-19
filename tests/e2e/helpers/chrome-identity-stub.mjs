// chrome-identity-stub.mjs
// Inject this into Puppeteer extension contexts to bypass Google login and automate OAuth flows.

if (!window.chrome) window.chrome = {};
if (!window.chrome.identity) window.chrome.identity = {};

window.chrome.identity.getAuthToken = function(details, callback) {
  // Simulate async callback with a fake token
  if (typeof details === 'function') {
    callback = details;
  }
  setTimeout(() => {
    callback && callback('fake-oauth-token-e2e');
  }, 10);
};

window.chrome.identity.getProfileUserInfo = function(callback) {
  setTimeout(() => {
    callback && callback({ email: 'testuser@example.com', id: 'e2e-user-id' });
  }, 10);
};

window.chrome.identity.getRedirectURL = function(path) {
  return 'https://test-redirect-url/' + (path || '');
};

window.chrome.identity.removeCachedAuthToken = function(details, callback) {
  setTimeout(() => {
    callback && callback();
  }, 10);
};

// For debugging
console.log('[E2E] chrome.identity stub injected');
