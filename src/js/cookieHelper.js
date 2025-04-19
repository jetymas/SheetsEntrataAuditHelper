// cookieHelper.js
// Utility functions for reading and writing cookies in Manifest V3

/**
 * Get the value of a cookie by name for a given URL.
 * @param {string} url - The URL associated with the cookie.
 * @param {string} name - The name of the cookie to retrieve.
 * @returns {Promise<string|null>} Resolves with the cookie value or null if not found.
 */
export function getCookie(url, name) {
  return new Promise((resolve, reject) => {
    chrome.cookies.get({ url, name }, (cookie) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else if (!cookie) {
        resolve(null);
      } else {
        resolve(cookie.value);
      }
    });
  });
}

/**
 * Set a cookie for a given URL with SameSite=None and Secure by default.
 * @param {Object} options - Cookie details.
 * @param {string} options.url - The URL to associate with the cookie.
 * @param {string} options.name - The cookie name.
 * @param {string} options.value - The cookie value.
 * @param {number} [options.expirationDate] - Optional UNIX timestamp in seconds for cookie expiration.
 * @returns {Promise<chrome.cookies.Cookie>} Resolves with the set cookie object.
 */
export function setCookie({ url, name, value, expirationDate }) {
  const details = {
    url,
    name,
    value,
    sameSite: 'no_restriction', // Equivalent to SameSite=None
    secure: true
  };
  if (expirationDate) {
    details.expirationDate = expirationDate;
  }

  return new Promise((resolve, reject) => {
    chrome.cookies.set(details, (cookie) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(cookie);
      }
    });
  });
}

