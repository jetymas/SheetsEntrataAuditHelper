// Add passive flag to event listeners to address warnings
(function () {
  // Make all scroll event listeners passive
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (type === "wheel" || type === "touchstart" || type === "touchmove") {
      let newOptions;
      if (typeof options === "boolean") {
        newOptions = { capture: options, passive: true };
      } else if (typeof options === "object") {
        newOptions = { ...options, passive: true };
      } else {
        newOptions = { passive: true };
      }
      return originalAddEventListener.call(this, type, listener, newOptions);
    } else {
      return originalAddEventListener.call(this, type, listener, options);
    }
  };
})();

import { registerContentMessaging } from "./content-messaging.js";
import { filterRecordsForLeaseAudit } from "./content-helpers.js"; // Modular filtering
// Enhanced logging: content script loaded
console.log("[Entrata Audit][CONTENT] Content script loaded:", window.location.href);

// Handshake: notify background script that content is ready
if (!window.__entrataContentHandshakeSent) {
  chrome.runtime.sendMessage({ type: "contentReady" });
  window.__entrataContentHandshakeSent = true;
  console.log("[Entrata Audit][CONTENT] Handshake sent: contentReady");
} else {
  console.warn("[Entrata Audit][CONTENT] Handshake attempted again (should not happen).");
}
import { verifyField } from "./field-verification.js";

// Install global error listener to ignore cross-origin iframe load errors
window.addEventListener("error", (e) => {
  if (e.message?.includes("Could not load iframe")) {
    e.preventDefault();
  }
});

// Message handlers: delegate to field-verification and ping
const messageHandlers = {
  // setupAudit: filters and sorts residents for Lease Audit ("New" leases)
  async setupAudit(message, _sender, sendResponse) {
    console.log("[Entrata Audit][CONTENT] setupAudit handler invoked", message);
    // TODO: Replace mockRecords with actual resident data extraction logic
    const mockRecords = [
      { "Lease Type": "New", "First Name": "Alice", "Last Name": "Smith" },
      { "Lease Type": "Renewal", "First Name": "Bob", "Last Name": "Brown" },
      { "Lease Type": "New", "First Name": "Charlie", "Last Name": "Anderson" },
    ];
    const filtered = filterRecordsForLeaseAudit(mockRecords);
    console.log("[Entrata Audit][CONTENT] Filtered residents:", filtered);
    console.log("[Entrata Audit][CONTENT][DEBUG] setupAudit handler called with message:", message);
    setTimeout(() => {
      console.log("[Entrata Audit][CONTENT][DEBUG] setupAudit sending response:", { success: true, filteredCount: filtered.length, filtered });
      sendResponse({ success: true, filteredCount: filtered.length, filtered });
    }, 0);
    return true;
  },
  // START_AUDIT: async, uses sendResponse, returns true for Chrome messaging compliance
  async START_AUDIT(message, _sender, sendResponse) {
    chrome.runtime.sendMessage({
      type: "auditStatus",
      status: "in_progress",
      progress: 0,
      message: "Audit started in Entrata tab..."
    });
    setTimeout(() => {
      chrome.runtime.sendMessage({
        type: "auditStatus",
        status: "in_progress",
        progress: 50,
        message: "Audit halfway complete..."
      });
    }, 1000);
    setTimeout(() => {
      chrome.runtime.sendMessage({
        type: "auditStatus",
        status: "complete",
        progress: 100,
        message: "Audit complete!"
      });
    }, 2000);
    console.log("[Entrata Audit][CONTENT][DEBUG] START_AUDIT handler called with message:", message);
    setTimeout(() => {
      console.log("[Entrata Audit][CONTENT][DEBUG] START_AUDIT sending response:", { status: "started" });
      sendResponse({ status: "started" });
    }, 0);
    return true;
  },
  // verifyField: async, returns Promise, does not use sendResponse. Chrome messaging keeps port open until resolved.
  async verifyField(message) {
    return verifyField(
      message.column,
      message.module,
      message.expectedValue,
      message.sheetColumn
    );
  },
  // ping: sync, uses sendResponse synchronously, no return needed
  ping(message, _sender, sendResponse) {
    console.log("Ping received from background script");
    sendResponse({ status: "alive" });
  }
};

registerContentMessaging(messageHandlers);
