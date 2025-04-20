// background-utils.js
// Utility functions for Entrata Lease Audit Assistant background scripts.
// Extracted from background.mjs for modularity and testability.

/**
 * Logs a message with a timestamp.
 * @param {...any} args
 */
export function logWithTimestamp(...args) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}

/**
 * Handles and logs errors in a consistent way.
 * @param {Error} error
 * @param {string} context
 */
export function handleError(error, context = "") {
  if (context) {
    console.error(`[${context}]`, error);
  } else {
    console.error(error);
  }
}

/**
 * Sleep for a given number of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
