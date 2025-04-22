/**
 * LeaseAudit - Audit implementation for new leases
 * Handles verification of new lease records
 */
import BaseAuditType from "./base-audit.mjs";

class LeaseAudit extends BaseAuditType {
  constructor(spreadsheetId, sheetName = "Lease Audit") {
    super(spreadsheetId, sheetName);
    // Define the columns to check for this audit type
    // All columns from column_implementation.txt that require verification
    this.columns = [
      "G", // Floor Plan
      "J", // Lease Start Date in DN
      "L", // Lease End Date in DN
      "N", // Base Rate in DN
      "P", // Monthly Concessions in DN
      "R", // Total Rate in DN
      "T", // Total Contract Amount in DN
      "V", // Security Deposit in DN
      "AB", // One-Time Incentives (DN Matches Lease?)
      "AD", // Lease Signed by Resident
      "AE", // Lease Signed by Manager
      "AF", // Application Signed by Applicant/Guarantor
      "AG", // Guarantor Form Signed
      "AI", // Criminal Background Check
      "AJ", // Credit Check
      "AM", // Leap Declaration Page Uploaded
      "AN", // Leap - Correct "Student with Leap" Relationship Used
      "AO", // Proof of Employment/Rental History/International Docs Uploaded
    ];

    // Mapping of column letters to their checkbox/result columns
    this.columnResultMappings = {
      J: "K", // J (Lease Start Date) is verified in column K
      L: "M", // L (Lease End Date) is verified in column M
      N: "O", // N (Base Rate) is verified in column O
      P: "Q", // P (Monthly Concessions) is verified in column Q
      R: "S", // R (Total Rate) is verified in column S
      T: "U", // T (Total Contract Amount) is verified in column U
      V: "W", // V (Security Deposit) is verified in column W
    };
  }

  /**
   * Sets up the Entrata environment for the audit
   * Opens the residents page and ensures records are sorted correctly
   * @returns {Promise<{success: boolean, tabId: number}>} - Setup result with tab ID
   */
  async setUp() {
    try {
      // Print debug info to help diagnose the issue
      console.log("===== STARTING SETUP PROCESS =====");
      console.log("Browser Runtime ID:", chrome.runtime.id);
      console.log(
        "Current URL:",
        window.location?.href || "Not accessible from background script",
      );

      // Send status update
      chrome.runtime.sendMessage({
        type: "auditStatus",
        message: "Opening Entrata...",
        status: "in_progress",
      });

      console.log("Creating new Entrata tab...");

      // Always create a new Entrata tab for stability
      const activeTab = await chrome.tabs.create({
        url: "https://preiss.entrata.com/?module=customers_systemxxx",
      });

      console.log("New tab created with ID:", activeTab.id);

      // Force logging any errors that might occur during tab interaction
      const originalConsoleError = console.error;
      console.error = function (...args) {
        originalConsoleError.apply(console, args);
        // Log stack trace for errors
        if (args[0] instanceof Error) {
          originalConsoleError("Stack trace:", args[0].stack);
        } else {
          originalConsoleError("Stack trace:", new Error().stack);
        }
      };

      // Wait for user to log in if needed
      await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          type: "auditStatus",
          message: "Waiting for Entrata login...",
          status: "in_progress",
        });

        // Alert user to log in if needed
        console.log("Prompting user to login if needed...");
        alert("Please log in to Entrata if prompted, then click OK");
        console.log("User confirmed alert dialog");
        resolve();
      });

      console.log("User confirmed login, waiting for page to load...");

      // Wait for Entrata to load - increased to 10 seconds
      await new Promise((resolve) => setTimeout(resolve, 10000));

      console.log("Wait complete, checking if tab is still valid...");

      // Verify the tab is still valid
      try {
        await new Promise((resolve, reject) => {
          chrome.tabs.get(activeTab.id, (tab) => {
            console.log(
              "Tab get result:",
              tab ? `Tab exists with URL: ${tab.url}` : "Tab not found",
            );

            if (chrome.runtime.lastError) {
              console.error(
                "Tab check chrome.runtime.lastError:",
                chrome.runtime.lastError,
              );
              reject(
                new Error(
                  "Tab no longer exists: " + chrome.runtime.lastError.message,
                ),
              );
            } else if (!tab) {
              reject(new Error("Tab not found"));
            } else {
              console.log("Tab status:", tab.status, "URL:", tab.url);
              resolve(tab);
            }
          });
        });
      } catch (error) {
        console.error("Tab check failed:", error);
        throw new Error(
          "Entrata tab is no longer accessible. Please try again.",
        );
      }

      console.log(
        "Tab is valid, sending setupAudit message to content script...",
      );

      // Send status update
      chrome.runtime.sendMessage({
        type: "auditStatus",
        message: "Setting up Entrata environment...",
        status: "in_progress",
      });

      // First, check if we can ping the content script
      console.log("Pinging content script to verify it loaded...");

      try {
        await new Promise((resolve, reject) => {
          const pingTimeoutId = setTimeout(() => {
            reject(
              new Error(
                "Content script ping timed out - script may not have loaded",
              ),
            );
          }, 5000);

          chrome.tabs.sendMessage(
            activeTab.id,
            { action: "ping" },
            (response) => {
              clearTimeout(pingTimeoutId);

              if (chrome.runtime.lastError) {
                console.error(
                  "Ping chrome.runtime.lastError:",
                  chrome.runtime.lastError,
                );
                reject(
                  new Error("Ping error: " + chrome.runtime.lastError.message),
                );
              } else if (!response) {
                console.error("Ping received no response");
                reject(new Error("Content script not responding to ping"));
              } else {
                console.log("Ping response:", response);
                resolve(response);
              }
            },
          );
        });
      } catch (error) {
        console.error("Content script ping failed:", error);
        throw new Error(
          "Content script not loaded. This usually means the extension's content scripts didn't load on the Entrata page. Please try refreshing the page or reinstalling the extension.",
        );
      }

      // Sort the residents by name (first name + last name)
      console.log("Sending setupAudit message...");

      const setupResult = await new Promise((resolve, reject) => {
        // Create a timeout to ensure we always get a response
        const timeoutId = setTimeout(() => {
          reject(
            new Error(
              "Timeout waiting for content script response - the page may not have loaded correctly",
            ),
          );
        }, 15000);

        try {
          chrome.tabs.sendMessage(
            activeTab.id,
            {
              action: "setupAudit",
              auditType: "new",
            },
            (response) => {
              clearTimeout(timeoutId);

              if (chrome.runtime.lastError) {
                console.error(
                  "setupAudit chrome.runtime.lastError:",
                  chrome.runtime.lastError,
                );
                reject(
                  new Error(
                    "Content script communication error: " +
                      chrome.runtime.lastError.message,
                  ),
                );
              } else if (!response) {
                console.error("setupAudit received no response");
                reject(
                  new Error(
                    "No response from content script - the page may not have loaded correctly",
                  ),
                );
              } else {
                console.log(
                  "Received setupAudit response:",
                  JSON.stringify(response),
                );
                resolve(response);
              }
            },
          );
        } catch (error) {
          clearTimeout(timeoutId);
          console.error("setupAudit try/catch error:", error);
          reject(error);
        }
      });

      if (!setupResult?.success) {
        console.error("Setup result unsuccessful:", setupResult);
        throw new Error(
          setupResult?.error || "Failed to set up Entrata environment",
        );
      }

      console.log("Entrata environment set up successfully");

      // Restore original console.error
      console.error = originalConsoleError;

      return {
        success: true,
        tabId: activeTab.id,
      };
    } catch (error) {
      console.error("Error setting up LeaseAudit:", error);
      console.error("Error stack trace:", error.stack);

      // Send a more detailed error message to the UI
      chrome.runtime.sendMessage({
        type: "auditStatus",
        message: `Setup failed: ${error.message}`,
        status: "error",
        error: error.message,
      });

      return {
        success: false,
        tabId: null,
      };
    }
  }

  /**
   * Locates and opens the next resident record in Entrata
   * @returns {Promise<Object|null>} - The resident record, or null if no more records
   */
  async findNext() {
    // Check if we're done with all records
    if (this.currentRecordIndex >= this.records.length) {
      return null;
    }

    const record = this.records[this.currentRecordIndex];

    try {
      // Use the stored tab ID from auditState
      let entrataTabId = null;

      // Get the tab ID from the background script
      const auditState = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "getAuditState" }, (response) => {
          resolve(response);
        });
      });

      if (auditState?.entrataTabId) {
        entrataTabId = auditState.entrataTabId;
      } else {
        // Fallback: query for the Entrata tab
        const tabs = await chrome.tabs.query({
          url: "https://*.entrata.com/*",
          active: true,
          currentWindow: true,
        });

        if (tabs.length === 0) {
          throw new Error("No active Entrata tab found");
        }

        entrataTabId = tabs[0].id;
      }

      // Send status update before processing resident
      chrome.runtime.sendMessage({
        type: "auditStatus",
        message: `Searching for resident ${this.currentRecordIndex + 1} of ${this.records.length}`,
        progress: Math.floor(
          30 + (this.currentRecordIndex / this.records.length) * 70,
        ),
        status: "in_progress",
        currentRecord: `${record["First Name"]} ${record["Last Name"]}`,
        currentField: "",
      });

      // Make sure tab is active before trying to work with it
      await new Promise((resolve, reject) => {
        chrome.tabs.update(entrataTabId, { active: true }, (_tab) => {
          if (chrome.runtime.lastError) {
            reject(
              new Error(
                "Failed to activate tab: " + chrome.runtime.lastError.message,
              ),
            );
          } else {
            // Give the tab a moment to properly activate
            setTimeout(resolve, 1000);
          }
        });
      });

      console.log(
        "Tab activated, sending processResident message to tab",
        entrataTabId,
      );

      // Add a direct DEBUG message to the popup to help diagnose
      chrome.runtime.sendMessage({
        type: "auditStatus",
        message: `DEBUG: Attempting to process ${record["First Name"]} ${record["Last Name"]}`,
        status: "in_progress",
        currentRecord: `${record["First Name"]} ${record["Last Name"]}`,
        currentField: "Searching...",
      });

      // Use a longer timeout and handle messaging errors
      const response = await Promise.race([
        new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(
            entrataTabId,
            {
              action: "processResident",
              resident: {
                firstName: record["First Name"],
                lastName: record["Last Name"],
                property: record["Property"],
              },
              record: record,
            },
            (result) => {
              if (chrome.runtime.lastError) {
                console.error("Message error:", chrome.runtime.lastError);
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                console.log("Received result from content script:", result);
                resolve(result);
              }
            },
          );
        }),
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(new Error("Timeout - no response from content script")),
            30000,
          ),
        ),
      ]);

      if (!response?.success) {
        // If resident not found, log detailed error
        console.error(
          "Failed to process resident:",
          response?.error || "Unknown error",
        );

        // Update status with the error before moving to next record
        chrome.runtime.sendMessage({
          type: "auditStatus",
          message: `Could not process ${record["First Name"]} ${record["Last Name"]}`,
          progress: Math.floor(
            30 + (this.currentRecordIndex / this.records.length) * 70,
          ),
          status: "in_progress",
          currentRecord: `${record["First Name"]} ${record["Last Name"]}`,
          error: response?.error || "Unknown error",
        });

        // Wait a moment to let user see the error
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Move to next record
        this.currentRecordIndex++;
        return this.findNext();
      }

      // Reset field index for the new record
      this.currentFieldIndex = 0;

      // Reset column status for this record
      this.columnStatus = {};

      return record;
    } catch (error) {
      console.error("Error finding next resident:", error);

      // Update status with the error
      chrome.runtime.sendMessage({
        type: "auditStatus",
        message: `Error processing ${record["First Name"]} ${record["Last Name"]}`,
        progress: Math.floor(
          30 + (this.currentRecordIndex / this.records.length) * 70,
        ),
        status: "in_progress",
        currentRecord: `${record["First Name"]} ${record["Last Name"]}`,
        error: error.message,
      });

      // Wait a moment to let user see the error
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Move to next record despite the error
      this.currentRecordIndex++;
      return this.findNext();
    }
  }

  /**
   * Filters records based on audit type
   * @param {Array} records - All records from the spreadsheet
   * @returns {Array} - Filtered records for this audit type
   */
  filterRecords(records) {
    return records
      .filter((record) => record["Lease Type"] === "New")
      .sort((a, b) => {
        const nameA = `${a["First Name"]} ${a["Last Name"]}`.toLowerCase();
        const nameB = `${b["First Name"]} ${b["Last Name"]}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
  }

  /**
   * Gets the appropriate checkbox column for a given data column
   * @param {string} dataColumn - The data column letter
   * @returns {string} - The checkbox column letter
   */
  getCheckboxColumn(dataColumn) {
    return this.columnResultMappings[dataColumn] || dataColumn;
  }
}

export default LeaseAudit;
