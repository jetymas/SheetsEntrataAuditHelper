// Import column modules for audit flow
import columnModules from "./column-modules/index.mjs";
// Import helpers for navigation and element interactions
import ColumnHelpers from "./column-modules/column-helpers.mjs";

// Initialize popup UI after DOM is ready
import {
  getPopupElements,
  updateStatusUI,
  showVerificationDialog,
  showError,
  hideError,
} from "./popup-ui.js";

function initPopup() {
  console.log("[Entrata Audit] Popup loaded");
  const elements = getPopupElements();

  // Listen for audit progress/status updates from content script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "auditStatus") {
      updateStatusUI(elements, {
        message: message.message,
        progress: message.progress,
        status: message.status,
        currentRecord: message.currentRecord,
        currentField: message.currentField,
        error: message.error,
      });
    }
  });
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

  // --- Service worker keep-alive port ---
  let keepAlivePort = null;

  // Add Start Audit button handler to message background script
  // Single audit launch per click: disable button immediately
  startAuditButton.addEventListener("click", async () => {
    console.log("[Entrata Audit] Attempting to start audit");
    startAuditButton.disabled = true;
    const spreadsheetUrl = spreadsheetUrlInput.value.trim();
    const auditType = document.getElementById("auditType")?.value || "";
    if (!spreadsheetUrl) {
      showError(elements, "Please enter a Google Sheet URL");
      startAuditButton.disabled = false;
      return;
    }
    // Extract the spreadsheet ID from the URL
    let spreadsheetId;
    try {
      const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
      const match = spreadsheetUrl.match(regex);
      spreadsheetId = match ? match[1] : null;
      if (!spreadsheetId) {
        if (/^[a-zA-Z0-9-_]+$/.test(spreadsheetUrl)) {
          spreadsheetId = spreadsheetUrl;
        } else {
          throw new Error("Invalid URL format");
        }
      }
      console.log("Extracted spreadsheet ID:", spreadsheetId);
    } catch (error) {
      console.error("Error extracting spreadsheet ID:", error);
      showError(elements, "Invalid Google Sheet URL. Please check and try again.");
      startAuditButton.disabled = false;
      return;
    }
    chrome.storage.local.set({ spreadsheetUrl: spreadsheetUrl });
    statusDiv.classList.remove("hidden");
    updateStatusUI(elements, { message: "Initializing audit..." });
    progressBar.style.width = "10%";
    recordInfo.textContent = "";
    fieldInfo.textContent = "";
    hideError(elements);
    currentAuditState = {
      status: "in_progress",
      currentRecordIndex: 0,
      recordCount: 0,
    };
    // --- Keep-alive port logic ---
    keepAlivePort = chrome.runtime.connect({ name: "keepAlive" });
    try {
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            type: "START_AUDIT",
            spreadsheetUrl,
            auditType,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              showError(elements, chrome.runtime.lastError.message);
              startAuditButton.disabled = false;
              if (keepAlivePort) keepAlivePort.disconnect();
              keepAlivePort = null;
              reject(chrome.runtime.lastError);
            } else if (response && response.status === "launched") {
              updateStatusUI(elements, { message: "Audit launched in Entrata tab..." });
              resolve();
            } else {
              showError(elements, "Failed to launch audit. Check Entrata tab.");
              startAuditButton.disabled = false;
              if (keepAlivePort) keepAlivePort.disconnect();
              keepAlivePort = null;
              reject(new Error("Failed to launch audit"));
            }
          }
        );
      });
    } catch {
      // Already handled
    }
  });

  // Listen for keepAlive port disconnect request from background
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "keepAliveRelease") {
      if (keepAlivePort) keepAlivePort.disconnect();
      keepAlivePort = null;
      port.disconnect();
    }
  });

  // Load saved spreadsheet URL if available
  chrome.storage.local.get(["spreadsheetUrl"], function (result) {
    if (result.spreadsheetUrl) {
      spreadsheetUrlInput.value = result.spreadsheetUrl;
    }
  });

  // Column modules are available via top-level import

  // Orchestrates audit flow by invoking each column module
  async function processAuditFlow() {
    console.log("[Entrata Audit] processAuditFlow called");
    const modules = Object.values(columnModules);
    console.log("[Entrata Audit] Loaded modules:", modules.map((m, i) => ({i, id: m?.id, hasRun: typeof m?.run === "function", type: typeof m})));
    let count = 0;
    for (const mod of modules) {
      if (!mod || typeof mod.run !== "function") {
        console.warn("[Entrata Audit] Skipping invalid module in columnModules:", mod, "Type:", typeof mod, "Keys:", Object.keys(mod || {}));
        continue;
      }
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
          const promptData = mod.displayData(null, null, {
            result,
            record: {},
          });
          await ColumnHelpers.navigateToPage("Documents");
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
      showError(
        elements,
        "Invalid Google Sheet URL. Please check and try again.",
      );
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
    const startAuditMsg = {
      type: "START_AUDIT",
      spreadsheetUrl: spreadsheetId,
      auditType: auditType,
    };
    console.log("[Entrata Audit][POPUP] Sending START_AUDIT message to background:", startAuditMsg);
    chrome.runtime.sendMessage(
      startAuditMsg,
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("[Entrata Audit][POPUP] Error from background:", chrome.runtime.lastError.message);
        } else {
          console.log("[Entrata Audit][POPUP] Received response from background:", response);
        }
      }
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
      status: "idle",
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
      status: currentAuditState.status,
    });
    showError(elements, "Manually skipped by user");
  });

  // Check audit status on popup opening
  chrome.runtime.sendMessage({ type: "getAuditState" }, function (response) {
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
