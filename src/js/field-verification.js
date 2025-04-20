// field-verification.js
// Handles field verification and related business logic for Entrata Lease Audit Assistant

import { extractPdfText, findValueInPdf } from "./pdf-utils.js";
import { scrollToPdfText, createVerificationDialog } from "./content-ui.js";
import { normalizeValue } from "./content-helpers.js";

/**
 * Patch verifyField to use dynamic modules and handle user confirmation UI
 * @param {string} column
 * @param {object} module
 * @param {string} expectedValue
 * @param {string} sheetColumn
 */
import columnModules from "./column-modules/index.mjs";

export async function verifyField(column, module, expectedValue, sheetColumn) {
  // Patch verifyField to use dynamic modules and handle user confirmation UI
  contentState.currentModule = module;
  contentState.currentColumn = column;
  contentState.expectedValue = expectedValue;
  contentState.sheetColumn = sheetColumn;

  // Make sure we're on the PDF viewer page
  if (getCurrentPageType() !== "pdfViewer") {
    chrome.runtime.sendMessage({
      action: "fieldVerified",
      result: {
        action: "skip",
        comment: "Not on PDF viewer page",
        column,
        field: module,
        pdfValue: null,
        sheetValue: expectedValue,
      },
    });
    return;
  }

  // If PDF text wasn't extracted yet, do it now
  if (!contentState.pdfText) {
    contentState.pdfText = extractPdfText();
  }

  // --- Use the dynamically loaded column module ---
  let colMod = columnModules[column];
  if (!colMod) {
    // Fallback: use provided module (from background)
    colMod = module;
  }
  // Run the column's extraction/validation logic
  let result = {};
  if (colMod && typeof colMod.run === "function") {
    result = await colMod.run(null, column, {
      record: contentState.currentRecord,
    });
  } else {
    // Fallback to old logic
    const pdfValue = findValueInPdf(module.pdfSelector, contentState.pdfText);
    result = {
      pdfValue,
      expectedValue,
      match:
        pdfValue &&
        expectedValue &&
        normalizeValue(pdfValue) === normalizeValue(expectedValue),
      requiresUserConfirmation: false,
    };
  }
  contentState.pdfValue = result.pdfValue;

  // If user confirmation is required, show the dialog using displayData
  if (
    result.requiresUserConfirmation &&
    typeof colMod.displayData === "function"
  ) {
    const display = colMod.displayData(null, column, { result });
    createVerificationDialog(
      display.fieldName || module.name,
      display.pdfValue || result.pdfValue,
      display.expectedValue || expectedValue,
      display.match !== undefined ? display.match : result.match,
    );
    return;
  }

  // Otherwise, auto-complete verification and send result
  chrome.runtime.sendMessage({
    action: "fieldVerified",
    result: {
      action: result.match ? "confirm" : "flag",
      comment: "",
      column,
      field: module,
      pdfValue: result.pdfValue,
      sheetValue: expectedValue,
    },
  });
}


// Export any other business logic or value comparison helpers as needed
