// content-helpers.js
// General utility and helper functions for Entrata Lease Audit Assistant content script

/**
 * Wait for a specified number of milliseconds (async delay).
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper function to normalize values for comparison
 * @param {string} value
 * @returns {string}
 */
export function normalizeValue(value) {
  if (!value) return "";

  // Try to normalize date formats
  if (value.includes("/") || value.includes("-")) {
    try {
      // Remove any non-numeric/slash characters
      const cleanValue = value.replace(/[^\d\/\-]/g, "");

      // Try to parse as date
      const date = new Date(cleanValue);
      if (!isNaN(date.getTime())) {
        // Return MM/DD/YYYY format for consistency
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
      }
    } catch {
      // If date parsing fails, fall back to basic normalization
    }
  }

  // Basic normalization: lowercase, trim spaces, remove special chars
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Poll a test function until it returns true or a timeout is reached
 * @param {Function} testFn
 * @param {number} [timeout=8000]
 * @param {number} [interval=300]
 * @returns {Promise<boolean>}
 */
export async function poll(testFn, timeout = 8000, interval = 300) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await testFn()) return true;
    await wait(interval);
  }
  return false;
}

// Shared state for the content script
export const contentState = {
  currentResident: null,
  currentRecord: null,
  currentModule: null,
  currentColumn: null,
  expectedValue: null,
  sheetColumn: null,
  pdfText: null,
  pdfValue: null,
};

// Determine current page type (e.g. PDF viewer)
export function getCurrentPageType() {
  const url = window.location.href;
  const isPdfViewer =
    url.includes("pdf") ||
    document.querySelector(
      "iframe.pdf-viewer, .pdf-content, .pdf-container, [data-testid=\"pdf-viewer\"]"
    ) ||
    (document.querySelector("iframe") &&
      document.querySelector("iframe").src &&
      document.querySelector("iframe").src.includes("pdf")) ||
    document.querySelector("embed[type=\"application/pdf\"]") ||
    document.querySelector("object[type=\"application/pdf\"]");

  return isPdfViewer ? "pdfViewer" : "unknown";
}

// Re-export visual helpers for testing
import { extractPdfText, findValueInPdf } from "./pdf-utils.js";
import { scrollToPdfText, findAndClickResident, clickNextPageButton } from "./content-ui.js";

export { extractPdfText, findValueInPdf, scrollToPdfText, findAndClickResident, clickNextPageButton };
