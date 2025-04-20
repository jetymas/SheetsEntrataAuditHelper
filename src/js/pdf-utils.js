// pdf-utils.js
// Utilities for extracting and parsing PDF/text content in Entrata Lease Audit Assistant

/**
 * Extract text from Entrata's PDF viewer DOM.
 * Attempts to locate common PDF containers, falling back to document text if needed.
 * @returns {string} Extracted text content
 */
export function extractPdfText() {
  const pdfContent =
    document.querySelector(".pdf-content") ||
    document.querySelector(".pdf-viewer") ||
    document.querySelector("iframe.pdf-viewer")?.contentDocument?.body;

  if (pdfContent) {
    return pdfContent.innerText || pdfContent.textContent;
  }
  return document.body.innerText || document.body.textContent;
}

/**
 * Find a value in PDF text based on a label/selector.
 * @param {string} selector - The label or field name to search for
 * @param {string} pdfText - The full extracted PDF text
 * @returns {string|null} The found value, or null if not found
 */
export function findValueInPdf(selector, pdfText) {
  const regex = new RegExp(`${selector}[:\\s]+(.*?)(?=\\n|$)`, "i");
  const match = pdfText.match(regex);
  if (match && match[1]) {
    return match[1].trim();
  }
  const lines = pdfText.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(selector)) {
      const parts = lines[i].split(":");
      if (parts.length > 1) {
        return parts[1].trim();
      }
      if (i + 1 < lines.length) {
        return lines[i + 1].trim();
      }
    }
  }
  return null;
}
