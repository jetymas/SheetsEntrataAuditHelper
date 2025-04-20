import { getCookie, setCookie } from "./cookieHelper.js";
import { registerBackgroundMessaging } from "./background-messaging.js";
import { startAudit, getAuditState } from "./background-controller.js";

registerBackgroundMessaging(getAuditState());
    });
  }
}

// Check if the content script is responsive
async function isContentScriptAlive(tabId) {
  try {
    return await new Promise((resolve) => {
      // Set a timeout for the ping response
      const timeout = setTimeout(() => {
        console.warn("Content script ping timed out");
        resolve(false);
      }, 5000);

      // Send a ping message
      chrome.tabs.sendMessage(tabId, { action: "ping" }, (response) => {
        clearTimeout(timeout);

        if (chrome.runtime.lastError) {
          console.warn("Content script ping error:", chrome.runtime.lastError);
          resolve(false);
        } else {
          console.log("Content script responded to ping:", response);
          resolve(true);
        }
      });
    });
  } catch (error) {
    console.error("Error pinging content script:", error);
    return false;
  }
}

// Main audit execution loop
async function runAudit() {
  try {
    const { auditEngine } = auditState;

    // Process records one by one
    while (auditState.status === "in_progress") {
      // Check if the content script is responsive before continuing
      if (!(await isContentScriptAlive(auditState.entrataTabId))) {
        // Content script not responding, try to reload the page
        updateStatus(
          "Content script not responding, attempting to recover...",
          auditState.progress,
          "in_progress",
          {
            error: "Tab not responding - attempting to recover",
          },
        );

        try {
          // Force reload the tab
          await new Promise((resolve) => {
            chrome.tabs.reload(auditState.entrataTabId, {}, resolve);
          });

          // Wait for reload
          await new Promise((resolve) => setTimeout(resolve, 5000));

          // Check if it's now responsive
          if (!(await isContentScriptAlive(auditState.entrataTabId))) {
            throw new Error(
              "Could not recover content script - tab still not responding",
            );
          }

          updateStatus(
            "Recovery successful, continuing audit",
            auditState.progress,
            "in_progress",
          );
        } catch (error) {
          console.error("Tab recovery failed:", error);
          throw new Error(
            "Could not recover from unresponsive content script: " +
              error.message,
          );
        }
      }

      // Find and open the next record
      let record;
      try {
        record = await Promise.race([
          auditEngine.findNext(),
          // Timeout after 60 seconds - prevent eternal waiting
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Timed out waiting for findNext")),
              60000,
            ),
          ),
        ]);
      } catch (error) {
        console.error("Error or timeout finding next resident:", error);

        // If it's a timeout, try to skip to the next record and continue
        if (error.message.includes("timed out")) {
          updateStatus(
            "Timeout finding resident. Skipping to next record...",
            auditState.progress,
            "in_progress",
            {
              error: "Timeout - skipping to next record",
            },
          );

          auditEngine.currentRecordIndex++;
          continue; // Skip to next iteration of the loop
        } else {
          throw error; // Re-throw other errors
        }
      }

      // If no more records, we're done
      if (!record) {
        updateStatus("Audit completed successfully", 100, "complete");
        auditState.status = "idle";
        return;
      }

      // Update progress based on current record index
      const progress = Math.floor(
        30 + (auditEngine.currentRecordIndex / auditEngine.records.length) * 70,
      );
      auditState.progress = progress;

      // Update the current record name for status tracking
      const currentRecordName = `${record["First Name"]} ${record["Last Name"]}`;
      auditState.currentRecordName = currentRecordName;

      updateStatus(
        `Processing record ${auditEngine.currentRecordIndex + 1} of ${auditEngine.records.length}: ${currentRecordName}`,
        progress,
        "in_progress",
        { currentRecord: currentRecordName },
      );

      // Add a record timeout mechanism for safety
      const recordStartTime = Date.now();
      const MAX_RECORD_TIME = 300000; // 5 minutes max per record

      // Process each field for the current record
      let fieldResult;
      try {
        while ((fieldResult = await auditEngine.nextField()) !== null) {
          // Check for record timeout
          if (Date.now() - recordStartTime > MAX_RECORD_TIME) {
            console.warn(
              `Record processing exceeded time limit of ${MAX_RECORD_TIME}ms, moving to next record`,
            );
            updateStatus(
              "Record processing took too long - moving to next record",
              progress,
              "in_progress",
              {
                currentRecord: currentRecordName,
                error: "Processing timeout - moving to next record",
              },
            );
            break; // Exit field processing loop
          }

          // Get the column module and process the field
          const { column, module, record } = fieldResult;

          // Update the current field name for status tracking
          auditState.currentFieldName = module.name;

          // Update status with field information
          updateStatus(
            `Verifying ${module.name} for ${currentRecordName}`,
            progress,
            "in_progress",
            {
              currentRecord: currentRecordName,
              currentField: module.name,
            },
          );

          // Get the result from the content script's verification
          let verificationResult;
          try {
            verificationResult = await Promise.race([
              processField(column, module, record),
              // Field processing timeout
              new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error("Field verification timed out")),
                  40000,
                ),
              ),
            ]);
          } catch (error) {
            console.error("Field verification error or timeout:", error);
            updateStatus(
              `Error verifying field ${module.name}: ${error.message}`,
              progress,
              "in_progress",
              {
                currentRecord: currentRecordName,
                currentField: module.name,
                error: error.message,
              },
            );
            continue; // Skip to next field
          }

          // Update the sheet based on verification result
          if (verificationResult) {
            await updateSheetWithResult(verificationResult, record);
          }
        }
      } catch (error) {
        console.error("Error processing fields for record:", error);
        updateStatus(
          `Error processing fields: ${error.message}. Moving to next record.`,
          progress,
          "in_progress",
          {
            currentRecord: currentRecordName,
            error: error.message,
          },
        );
        // Continue to next record despite error
      }

      // Move to next record after all fields are processed or on error
      auditEngine.currentRecordIndex++;
    }
  } catch (error) {
    console.error("Fatal error running audit:", error);
    auditState.lastError = error.message;
    updateStatus(
      `Fatal error: ${error.message}`,
      auditState.progress,
      "error",
      {
        currentRecord: auditState.currentRecordName,
        currentField: auditState.currentFieldName,
        error: error.message,
      },
    );
    auditState.status = "idle";
  }
}

// Process a single field
async function processField(column, module, record) {
  return new Promise((resolve) => {
    // Use the stored entrataTabId instead of querying for the active tab
    const { entrataTabId } = auditState;

    if (!entrataTabId) {
      console.error("No Entrata tab ID found");
      auditState.lastError = "No Entrata tab ID found";
      resolve(null);
      return;
    }

    // Ensure the tab still exists
    chrome.tabs.get(entrataTabId, (tab) => {
      if (chrome.runtime.lastError || !tab) {
        console.error("Entrata tab no longer exists", chrome.runtime.lastError);
        auditState.lastError = "Entrata tab no longer exists";
        resolve(null);
        return;
      }

      // Make sure the tab is active and focused
      chrome.tabs.update(entrataTabId, { active: true }, () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Could not activate Entrata tab",
            chrome.runtime.lastError,
          );
          resolve(null);
          return;
        }

        // Set up a one-time listener for the field verification result
        const listener = function (message, _sender, _sendResponse) {
          if (message.action === "fieldVerified" && message.result) {
            // Remove the listener once we get a response
            chrome.runtime.onMessage.removeListener(listener);

            // Check if the field requires user confirmation
            if (message.result.requiresUserConfirmation) {
              // Send a 'fieldVerificationPrompt' message to the popup
              chrome.runtime.sendMessage({
                type: "fieldVerificationPrompt",
                promptData: {
                  fieldName: module.name,
                  pdfValue: message.result.pdfValue,
                  expectedValue: record[module.sheetColumn],
                  message: message.result.message,
                  column: column,
                  ...message.result.displayData,
                },
              });
            }

            resolve(message.result);
          }
        };

        chrome.runtime.onMessage.addListener(listener);

        // Send message to content script to verify the field
        chrome.tabs.sendMessage(entrataTabId, {
          action: "verifyField",
          column,
          module: {
            id: module.id,
            name: module.name,
            pdfSelector: module.pdfSelector,
          },
          expectedValue: record[module.sheetColumn],
          sheetColumn: module.sheetColumn,
        });
      });
    });
  });
}

// Update the sheet based on verification result
async function updateSheetWithResult(result, record) {
  // First, verify the audit is still active - prevent unwanted changes if audit expires
  if (auditState.status !== "in_progress") {
    console.warn("Audit no longer active, skipping sheet update");
    return;
  }

  try {
    const { spreadsheetId, auditEngine } = auditState;

    // Verify we have valid data before proceeding
    if (!spreadsheetId) {
      console.error("No valid spreadsheet ID for update");
      return;
    }

    if (!auditEngine) {
      console.error("No audit engine available");
      return;
    }

    // Calculate the cell reference for the result
    const rowNumber = record._row;
    const column = result.column || result.field?.resultColumn;

    if (!column || !rowNumber) {
      console.error("Missing column or row information for update");
      return;
    }

    // Double check that the row number is valid
    if (isNaN(parseInt(rowNumber)) || parseInt(rowNumber) < 9) {
      // Header row is 8, so data starts at 9
      console.error(`Invalid row number: ${rowNumber}`);
      return;
    }

    // The checkbox column might be different from the data column
    // Use the mapping from the audit engine if available
    let checkboxColumn = result.checkboxColumn || column;
    if (
      auditEngine.getCheckboxColumn &&
      typeof auditEngine.getCheckboxColumn === "function"
    ) {
      checkboxColumn = auditEngine.getCheckboxColumn(column);
    }

    console.log(
      `Updating sheet cell ${checkboxColumn}${rowNumber} with action: ${result.action}`,
    );

    // Update the sheet based on verification result
    if (result.action === "confirm") {
      await updateSheetCell(
        spreadsheetId,
        "Lease Audit",
        `${checkboxColumn}${rowNumber}`,
        "TRUE",
      );
    } else if (result.action === "flag") {
      await updateSheetCell(
        spreadsheetId,
        "Lease Audit",
        `${checkboxColumn}${rowNumber}`,
        "FALSE",
      );
      if (result.comment) {
        await addSheetComment(
          spreadsheetId,
          "Lease Audit",
          `${checkboxColumn}${rowNumber}`,
          `Mismatch: Lease shows "${result.pdfValue}", sheet has "${result.sheetValue}". ${result.comment}`,
        );
      }
    } else if (result.action === "skip") {
      await updateSheetCell(
        spreadsheetId,
        "Lease Audit",
        `${checkboxColumn}${rowNumber}`,
        "FALSE",
      );
      if (result.comment) {
        await addSheetComment(
          spreadsheetId,
          "Lease Audit",
          `${checkboxColumn}${rowNumber}`,
          `Skipped: ${result.comment}`,
        );
      }
    } else {
      console.warn(`Unknown action: ${result.action}, not updating sheet`);
    }
  } catch (error) {
    console.error("Error updating sheet with result:", error);
    // Don't allow spreadsheet update errors to crash the audit
    auditState.lastError = `Spreadsheet update error: ${error.message}`;
    updateStatus(
      "Warning: Spreadsheet update failed, but continuing audit",
      auditState.progress,
      "in_progress",
      {
        currentRecord: auditState.currentRecordName,
        currentField: auditState.currentFieldName,
        error: `Spreadsheet update error: ${error.message}`,
      },
    );
  }
}

import { registerBackgroundMessaging } from "./background-messaging.js";
import { startAudit, getAuditState } from "./background-controller.js";
registerBackgroundMessaging(getAuditState());
