// background-permissions.js
// Handles Chrome extension permissions logic for Entrata Lease Audit Assistant.
// Extracted from background.mjs for modularity and testability.

/**
 * Checks if the extension has the required permissions.
 * @param {object} permissions - Permissions object for chrome.permissions.contains.
 * @returns {Promise<boolean>} True if permissions are granted, false otherwise.
 */
export async function hasRequiredPermissions(permissions) {
  return new Promise((resolve) => {
    chrome.permissions.contains(permissions, (result) => {
      resolve(result);
    });
  });
}

/**
 * Requests the required permissions from the user.
 * @param {object} permissions - Permissions object for chrome.permissions.request.
 * @returns {Promise<boolean>} True if permissions are granted, false otherwise.
 */
export async function requestPermissions(permissions) {
  return new Promise((resolve) => {
    chrome.permissions.request(permissions, (granted) => {
      resolve(granted);
    });
  });
}
