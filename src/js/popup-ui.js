// popup-ui.js
// Handles all DOM querying, event binding, and UI updates for the Entrata Lease Audit Assistant popup

/**
 * Queries and returns all relevant DOM elements for the popup.
 */
export function getPopupElements() {
  return {
    startAuditButton: document.getElementById("startAudit"),
    stopAuditButton: document.getElementById("stopAudit"),
    skipRecordButton: document.getElementById("skipRecord"),
    spreadsheetUrlInput: document.getElementById("spreadsheetUrl"),
    statusDiv: document.getElementById("status"),
    progressBar: document.getElementById("progressBar"),
    statusText: document.getElementById("statusText"),
    recordInfo: document.getElementById("recordInfo"),
    fieldInfo: document.getElementById("fieldInfo"),
    errorInfo: document.getElementById("errorInfo"),
  };
}

/**
 * Updates the popup status UI.
 * @param {object} elements - DOM elements
 * @param {object} data - Status data
 */
export function updateStatusUI(elements, data) {
  const {
    statusText,
    recordInfo,
    fieldInfo,
    errorInfo,
    statusDiv,
    progressBar,
    startAuditButton,
    skipRecordButton,
  } = elements;
  // Main status message
  statusText.textContent = data.message || "Processing...";
  // Record info
  if (data.currentRecord) {
    recordInfo.textContent = `Record: ${data.currentRecord}`;
    recordInfo.style.display = "block";
  } else {
    recordInfo.style.display = "none";
  }
  // Field info
  if (data.currentField) {
    fieldInfo.textContent = `Field: ${data.currentField}`;
    fieldInfo.style.display = "block";
  } else {
    fieldInfo.style.display = "none";
  }
  // Error info
  if (data.error) {
    errorInfo.textContent = `Error: ${data.error}`;
    errorInfo.classList.remove("hidden");
  } else {
    errorInfo.classList.add("hidden");
  }
  // Progress bar
  if (data.progress !== null && data.progress !== undefined) {
    progressBar.style.width = `${data.progress}%`;
  }
  // Status styling
  if (data.status === "error") {
    statusDiv.classList.add("error");
  } else {
    statusDiv.classList.remove("error");
  }
  // Button state
  if (["complete", "error", "idle"].includes(data.status)) {
    startAuditButton.disabled = false;
    skipRecordButton.classList.add("hidden");
  } else {
    skipRecordButton.classList.remove("hidden");
  }
}

/**
 * Shows the user verification dialog for column module confirmation.
 * @param {object} promptData - Data to display in dialog
 */
export function showVerificationDialog(elements, promptData) {
  // Remove existing dialog if present
  const existing = document.getElementById("ea-popup-verification-dialog");
  if (existing) existing.remove();
  // Overlay
  const overlay = document.createElement("div");
  overlay.className = "ea-popup-overlay";
  overlay.id = "ea-popup-verification-overlay";
  Object.assign(overlay.style, {
    position: "fixed",
    left: 0,
    top: 0,
    width: "100vw",
    height: "100vh",
    zIndex: 10000,
    background: "rgba(0,0,0,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });
  // Dialog
  const dialog = document.createElement("div");
  dialog.className = "ea-popup-dialog";
  dialog.id = "ea-popup-verification-dialog";
  // Example: Add promptData to dialog (customize as needed)
  dialog.innerHTML = `<div><strong>Verification Required</strong></div><pre>${JSON.stringify(promptData, null, 2)}</pre>`;
  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.onclick = () => overlay.remove();
  dialog.appendChild(closeBtn);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}

/**
 * Shows an error message in the popup UI.
 * @param {object} elements - DOM elements
 * @param {string} message - Error message
 */
export function showError(elements, message) {
  elements.errorInfo.textContent = message;
  elements.errorInfo.classList.remove("hidden");
}

/**
 * Hides the error message in the popup UI.
 * @param {object} elements - DOM elements
 */
export function hideError(elements) {
  elements.errorInfo.textContent = "";
  elements.errorInfo.classList.add("hidden");
}
