// background-controller.js
// Encapsulates audit state and audit orchestration logic for Entrata Lease Audit Assistant.
// Extracted from background.mjs for modularity, maintainability, and testability.

import LeaseAudit from "./audit-types/lease-audit.js";
import RenewalAudit from "./audit-types/renewal-audit.js";
import updateStatus from "./updateStatus";
import { fetchSheetData } from "./sheets";
import { ensureContentScriptLoaded } from "./background-tabs.js";
import { hasRequiredPermissions } from "./background-permissions.js";

// Global audit state
let auditState = {
  status: "idle",
  spreadsheetId: null,
  auditEngine: null,
  progress: 0,
  entrataTabId: null,
  currentRecordName: "",
  currentFieldName: "",
  lastError: null,
};

export function getAuditState() {
  return auditState;
}

export function setAuditState(newState) {
  auditState = { ...auditState, ...newState };
}

export function resetAuditState() {
  auditState = {
    status: "idle",
    spreadsheetId: null,
    auditEngine: null,
    progress: 0,
    entrataTabId: null,
    currentRecordName: "",
    currentFieldName: "",
    lastError: null,
  };
}

// Start the audit process
export async function startAudit(spreadsheetId, auditType) {
  try {
    updateStatus("Starting audit...", 10);
    if (!spreadsheetId) throw new Error("Invalid spreadsheet ID");

    // Permissions
    const permissions = {
      permissions: ["tabs", "scripting"],
      origins: ["https://*.entrata.com/*"],
    };
    const hasPermissions = await hasRequiredPermissions(permissions);
    if (!hasPermissions) throw new Error("Missing required permissions");

    // Reset state
    resetAuditState();
    auditState.status = "in_progress";
    auditState.spreadsheetId = spreadsheetId;
    auditState.progress = 10;

    // Create audit engine
    let auditEngine;
    if (auditType === "new") {
      auditEngine = new LeaseAudit(spreadsheetId);
    } else if (auditType === "renewal") {
      auditEngine = new RenewalAudit(spreadsheetId);
    } else {
      throw new Error(`Unknown audit type: ${auditType}`);
    }
    auditState.auditEngine = auditEngine;

    // Fetch data
    updateStatus("Fetching audit data from Google Sheet...", 20);
    let records;
    try {
      const result = await fetchSheetData(spreadsheetId, "Lease Audit", 8);
      records = result.records;
    } catch (error) {
      throw new Error("Error fetching sheet data: " + error.message);
    }

    // Filter records
    const filteredRecords = auditEngine.filterRecords(records);
    if (filteredRecords.length === 0) {
      updateStatus(
        `No ${auditType === "new" ? "new" : "renewal"} leases found in the sheet`,
        100,
        "complete",
      );
      return;
    }
    auditEngine.records = filteredRecords;
    updateStatus(
      `Ready to audit ${filteredRecords.length} ${auditType === "new" ? "new" : "renewal"} leases`,
      30,
    );

    // Create Entrata tab
    let entrataTab;
    try {
      entrataTab = await new Promise((resolve, reject) => {
        chrome.tabs.create(
          {
            url: "https://preiss.entrata.com/?module=customers_systemxxx",
            active: true,
          },
          (tab) => {
            if (chrome.runtime.lastError) {
              reject(new Error("Failed to create tab: " + chrome.runtime.lastError.message));
            } else if (!tab) {
              reject(new Error("No tab returned from create"));
            } else {
              resolve(tab);
            }
          },
        );
      });
      auditState.entrataTabId = entrataTab.id;
    } catch (error) {
      throw new Error("Error creating Entrata tab: " + error.message);
    }

    // Ensure content script is loaded
    try {
      await ensureContentScriptLoaded(auditState.entrataTabId);
    } catch (error) {
      throw new Error("Error ensuring content script: " + error.message);
    }

    // TODO: Call runAudit() here (to be modularized next)
  } catch (error) {
    updateStatus(error.message, 100, "error");
    auditState.status = "error";
    auditState.lastError = error.message;
    throw error;
  }
}

// TODO: Move runAudit, processField, updateSheetWithResult, etc. here for full modularization.
