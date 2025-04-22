// content-messaging.js
// Handles all chrome.runtime messaging for Entrata Lease Audit Assistant content script

/**
 * Register listeners for chrome.runtime.onMessage events in the content script.
 * @param {object} handlers - Map of action -> handler function
 */
export function registerContentMessaging(handlers) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.action && handlers[message.action]) {
      const result = handlers[message.action](message, sender, sendResponse);
      // If the handler returns a Promise, handle async and keep port open
      if (result instanceof Promise) {
        result.then(res => sendResponse(res)).catch(err => sendResponse({ error: err?.message || String(err) }));
        return true;
      }
      // If the handler returns true (manual sendResponse), propagate to keep port open
      if (result === true) return true;
      // For synchronous handlers, return value as before (usually false)
      return false;
    }
    return false;
  });
}



/**
 * Send a message to the background script and return a promise for the response.
 * @param {object} message
 * @returns {Promise<any>}
 */
export function sendMessageToBackground(message) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}
