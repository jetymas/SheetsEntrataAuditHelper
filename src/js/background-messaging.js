// background-messaging.js
// Handles Chrome extension message routing for Entrata Lease Audit Assistant.
// Extracted from background.mjs for modularity and testability.

import { startAudit } from "./background.mjs";
import updateStatus from "./updateStatus";

// This function will be imported and called from background.mjs
export function registerBackgroundMessaging(auditState) {
  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === "startAudit") {
      startAudit(message.spreadsheetId, message.auditType);
      sendResponse({ status: "started" });
    } else if (message.action === "stopAudit") {
      // Reset audit state
      auditState.status = "idle";
      updateStatus("Audit stopped by user.", 0, "error");
      sendResponse({ status: "stopped" });
    } else if (message.action === "skipRecord") {
      // Manual intervention to skip the current record
      const { auditEngine } = auditState;
      if (auditState.status === "in_progress" && auditEngine) {
        updateStatus(
          `Manually skipping record ${auditEngine.currentRecordIndex + 1}`,
          auditState.progress,
          "in_progress",
          {
            currentRecord: auditState.currentRecordName,
            error: "Manually skipped by user",
          },
        );
        auditEngine.currentRecordIndex++;
        auditEngine.currentFieldIndex = 0;
        sendResponse({ status: "record_skipped" });
      } else {
        sendResponse({ status: "no_active_audit" });
      }
    } else if (message.action === "getAuditState") {
      // Return current audit state to popup
      const {
        status,
        progress,
        auditEngine,
        entrataTabId,
        currentRecordName,
        currentFieldName,
        lastError,
      } = auditState;
      let msg = "";
      if (status === "in_progress" && auditEngine) {
        msg = `Processing record ${auditEngine.currentRecordIndex + 1} of ${auditEngine.records.length}`;
        if (currentRecordName) msg += `: ${currentRecordName}`;
        if (currentFieldName) msg += ` - ${currentFieldName}`;
      }
      sendResponse({
        status,
        message: msg,
        progress,
        entrataTabId,
        currentRecord: currentRecordName,
        currentField: currentFieldName,
        error: lastError,
        recordCount: auditEngine?.records?.length || 0,
        currentRecordIndex: auditEngine?.currentRecordIndex || 0,
      });
    } else if (message.action === "fieldVerified") {
      // This is handled by the one-time listener in processField
      sendResponse({ status: "acknowledged" });
    }
    // Return true to indicate we'll respond asynchronously
    return true;
  });
}
