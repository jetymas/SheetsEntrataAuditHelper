// background-tabs.js
// Handles Entrata tab creation, validation, and content script/CSS injection for the Entrata Lease Audit Assistant extension.
// Extracted from background.mjs as part of modularization and complexity reduction.



/**
 * Ensures the Entrata content script and CSS are loaded in the given tab.
 * Handles ping, injection, and verification.
 * @param {number} tabId - The Chrome tab ID.
 * @returns {Promise<boolean>} True if content script is loaded, false otherwise.
 */
export async function ensureContentScriptLoaded(tabId) {
  try {
    // Try to ping the content script first
    const pingResult = await new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve({ loaded: false, error: "Ping timed out" });
      }, 2000);
      try {
        chrome.tabs.sendMessage(tabId, { action: "ping" }, (response) => {
          clearTimeout(timeoutId);
          if (chrome.runtime.lastError) {
            resolve({ loaded: false, error: chrome.runtime.lastError.message });
          } else if (!response) {
            resolve({ loaded: false, error: "No response" });
          } else {
            resolve({ loaded: true, debug: response.debug });
          }
        });
      } catch (error) {
        clearTimeout(timeoutId);
        resolve({ loaded: false, error: error.message });
      }
    });
    if (pingResult.loaded) {
      return true;
    }
    // Get the tab details
    const tab = await new Promise((resolve, reject) => {
      chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(tab);
        }
      });
    });
    if (!tab) throw new Error("Tab not found");
    if (!tab.url.includes("entrata.com")) throw new Error("Tab is not on Entrata website");
    // Inject content script manually
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["src/js/content.js"],
    });
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ["src/css/content.css"],
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Verify content script is now loaded
    const verifyResult = await new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve(false);
      }, 2000);
      chrome.tabs.sendMessage(tabId, { action: "ping" }, (response) => {
        clearTimeout(timeoutId);
        resolve(!!response);
      });
    });
    return !!verifyResult;
  } catch {
    return false;
  }
}

/**
 * Creates a new Entrata tab and returns its tab object.
 * @returns {Promise<chrome.tabs.Tab>} The created tab.
 */
export async function createEntrataTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.create(
      {
        url: "https://preiss.entrata.com/?module=customers_systemxxx",
        active: true,
      },
      (tab) => {
        if (chrome.runtime.lastError) {
          reject(
            new Error(
              "Failed to create tab: " + chrome.runtime.lastError.message
            )
          );
        } else if (!tab) {
          reject(new Error("No tab returned from create"));
        } else {
          resolve(tab);
        }
      }
    );
  });
}

/**
 * Checks if a tab is still valid (exists and is loaded).
 * @param {number} tabId
 * @returns {Promise<boolean>} True if valid, false otherwise.
 */
export async function isTabValid(tabId) {
  try {
    await new Promise((resolve, reject) => {
      chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (!tab) {
          reject(new Error("Tab not found"));
        } else {
          resolve(tab);
        }
      });
    });
    return true;
  } catch {
    return false;
  }
}
