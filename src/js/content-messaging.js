// content-messaging.js
// Handles all chrome.runtime messaging for Entrata Lease Audit Assistant content script

/**
 * Register listeners for chrome.runtime.onMessage events in the content script.
 * @param {object} handlers - Map of action -> handler function
 */
export function registerContentMessaging(handlers) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.action && handlers[message.action]) {
      // Call the handler and pass message, sender, sendResponse
      return handlers[message.action](message, sender, sendResponse);
    }
    // Return false to indicate no async response
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
