// Inject this script into the background page to stub chrome.identity.getAuthToken for E2E tests
if (typeof chrome !== "undefined" && chrome.identity) {
  chrome.identity.getAuthToken = function (options, callback) {
    // Immediately return a fake token
    setTimeout(() => callback("fake-e2e-token"), 10);
  };
}
