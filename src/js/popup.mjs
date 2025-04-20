// Import column modules for audit flow
import columnModules from "./column-modules/index.mjs";
// Import helpers for navigation and element interactions
import ColumnHelpers from "./column-modules/column-helpers.mjs";

// Initialize popup UI after DOM is ready
import { getPopupElements, updateStatusUI, showVerificationDialog, showError, hideError } from "./popup-ui.js";

function initPopup() {
  const elements = getPopupElements();
  const {
    startAuditButton,
    stopAuditButton,
    skipRecordButton,
    spreadsheetUrlInput,
    statusDiv,
    progressBar,
    recordInfo,
    fieldInfo,
  } = elements;

  // Track current audit state
  let currentAuditState = {
    status: "idle",
    currentRecordIndex: 0,
    recordCount: 0,
  };

  // Load saved spreadsheet URL if available
  chrome.storage.local.get(["spreadsheetUrl"], function (result) {
    if (result.spreadsheetUrl) {
      spreadsheetUrlInput.value = result.spreadsheetUrl;
    }
  });

  // Column modules are available via top-level import

  // Orchestrates audit flow by invoking each column module
  async function processAuditFlow() {
    const modules = Object.values(columnModules);
    let count = 0;
    for (const mod of modules) {
      // Call run on module; context could include record data (placeholder here)
      try {
        const result = await mod.run(null, null, { record: {} });
        // Update progress UI
        count++;
        updateStatusUI(elements, {
          message: result.message || `Processed ${mod.name}`,
          progress: Math.round((count / modules.length) * 100),
        });
        // Handle confirmation if needed
        if (result.requiresConfirmation) {
          // Prepare prompt data from module
          // 'row' and 'col' are not available in this context; pass null for interface consistency
          const promptData = mod.displayData(null, null, {
            result,
            record: {},
          });
          // Navigate to Documents tab for verification
          await ColumnHelpers.navigateToPage("Documents");
          // Show verification dialog with promptData
          showVerificationDialog(elements, promptData);
        }
      } catch (e) {
        console.error(`Module ${mod.id} error:`, e);
      }
    }
    // Finalize UI
    updateStatusUI(elements, {
      message: "Audit complete",
    });
    startAuditButton.disabled = false;
    skipRecordButton.classList.add("hidden");
  }

  // Start Audit button click handler
  startAuditButton.addEventListener("click", () => {
    const spreadsheetUrl = spreadsheetUrlInput.value.trim();
    // Safely get auditType value; default to empty if element missing
    const auditType = document.getElementById("auditType")?.value || "";

    if (!spreadsheetUrl) {
      // Show validation error in UI
      showError(elements, "Please enter a Google Sheet URL");
      return;
    }

    // Extract the spreadsheet ID from the URL
    let spreadsheetId;
    try {
      // Regex to extract the spreadsheet ID from various Google Sheet URL formats
      const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
      const match = spreadsheetUrl.match(regex);
      spreadsheetId = match ? match[1] : null;

      if (!spreadsheetId) {
        // If not in standard format, try if they just pasted the ID directly
        if (/^[a-zA-Z0-9-_]+$/.test(spreadsheetUrl)) {
          spreadsheetId = spreadsheetUrl;
        } else {
          throw new Error("Invalid URL format");
        }
      }

      console.log("Extracted spreadsheet ID:", spreadsheetId);
    } catch (error) {
      console.error("Error extracting spreadsheet ID:", error);
      // Show URL format error in UI
      showError(elements, "Invalid Google Sheet URL. Please check and try again.");
      return;
    }

    // Save the spreadsheet URL for future sessions
    chrome.storage.local.set({ spreadsheetUrl: spreadsheetUrl });

    // Update UI to show we're starting
    startAuditButton.disabled = true;
    statusDiv.classList.remove("hidden");
    updateStatusUI(elements, {
      message: "Initializing audit...",
    });
    progressBar.style.width = "10%";
    recordInfo.textContent = "";
    fieldInfo.textContent = "";
    hideError(elements);

    // Reset current state
    currentAuditState = {
      status: "in_progress",
      currentRecordIndex: 0,
      recordCount: 0,
    };

    // Notify background to start audit, include callback so tests can verify
    chrome.runtime.sendMessage(
      {
        action: "startAudit",
        spreadsheetId: spreadsheetId,
        auditType: auditType,
      },
      () => {},
    );

    // Kick off column modules processing flow asynchronously
    processAuditFlow(spreadsheetId, auditType);

    // Show skip button for manual intervention
    skipRecordButton.classList.remove("hidden");
  });

  // Stop Audit button click handler
  stopAuditButton.addEventListener("click", function () {
    chrome.runtime.sendMessage({
      action: "stopAudit",
    });

    updateStatusUI(elements, {
      message: "Audit stopped by user.",
      status: "idle"
    });
    hideError(elements);
    currentAuditState.status = "idle";
  });

  // Skip Record button click handler (for manual intervention when stuck)
  skipRecordButton.addEventListener("click", function () {
    if (currentAuditState.status !== "in_progress") {
      return;
    }

    chrome.runtime.sendMessage({
      action: "skipRecord",
    });

    // Update UI to show skipping
    updateStatusUI(elements, {
      message: "Skipping current record...",
      status: currentAuditState.status
    });
    showError(elements, "Manually skipped by user");
  });

  // Check audit status on popup opening
  chrome.runtime.sendMessage({ action: "getAuditState" }, function (response) {
    if (response) {
      currentAuditState = {
        status: response.status,
        currentRecordIndex: response.currentRecordIndex || 0,
        recordCount: response.recordCount || 0,
      };

      if (response.status === "in_progress") {
        startAuditButton.disabled = true;
        statusDiv.classList.remove("hidden");
        skipRecordButton.classList.remove("hidden");

        // Update UI with current state
        updateStatusUI(elements, response);
      }
    }
  });

  // Listen for status updates from the background script
  chrome.runtime.onMessage.addListener(function (message) {
    if (message.type === "auditStatus") {
      statusDiv.classList.remove("hidden");
      // Update the current audit state
      if (message.status) {
        currentAuditState.status = message.status;
      }
      if (message.currentRecordIndex !== undefined) {
        currentAuditState.currentRecordIndex = message.currentRecordIndex;
      }
      if (message.recordCount !== undefined) {
        currentAuditState.recordCount = message.recordCount;
      }
      // Update the UI
      updateStatusUI(elements, message);
      console.log("Status updated:", message.message);
    }
    // === User Confirmation Workflow ===
    if (message.type === "fieldVerificationPrompt") {
      showVerificationDialog(elements, message.promptData);
    }
  });
}

document.addEventListener("DOMContentLoaded", initPopup);
globalThis.initPopup = initPopup;
export default initPopup;
export { initPopup };
