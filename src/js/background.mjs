// background.mjs (service worker or background script for Entrata Lease Audit Assistant)
// Handles audit launches and tab management for Entrata

import { auditState } from "./background-shared.mjs";

// --- Service worker keep-alive port ---
let keepAlivePort = null;

// Listen for keep-alive port from popup
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "keepAlive") {
    keepAlivePort = port;
    port.onDisconnect.addListener(() => {
      keepAlivePort = null;
    });
  }
});

// Helper to release keep-alive port by notifying popup
function releaseKeepAlivePort() {
  if (keepAlivePort) {
    // Ask popup to disconnect its port
    try {
      const releasePort = chrome.runtime.connect({ name: "keepAliveRelease" });
      releasePort.disconnect();
    } catch {
      // Ignore
    }
    keepAlivePort.disconnect();
    keepAlivePort = null;
  }
}

// Listen for messages from the popup
let auditLaunching = false;

// Track tabs that have completed handshake
const readyTabs = new Set();

// Utility: Remove tab from readyTabs when closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (readyTabs.has(tabId)) {
    readyTabs.delete(tabId);
    console.log(`[Entrata Audit][BACKGROUND] Tab ${tabId} closed. Removed from readyTabs.`);
  }
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  // Handshake: mark tab as ready
  if (message.type === "contentReady" && sender.tab?.id) {
    readyTabs.add(sender.tab.id);
    console.log(`[Entrata Audit][BACKGROUND] Handshake received: content script ready in tab ${sender.tab.id}`);
    // Enhanced logging: show all readyTabs
    console.log("[Entrata Audit][DEBUG] readyTabs:", Array.from(readyTabs));
    return true;
  }
  console.log("[Entrata Audit][BACKGROUND] Received message:", message);
  if ((message.type === "START_AUDIT" || message.action === "START_AUDIT") && !auditLaunching) {
    auditLaunching = true;
    const { spreadsheetUrl, auditType } = message;
    let entrataTab = null;
    const urlPattern = "https://*.entrata.com/*";
    try {
      console.log("[Entrata Audit][START_AUDIT] Querying for Entrata tabs with pattern:", urlPattern);
      // Always open a new Entrata tab for each audit
      const tabs = [];
      if (chrome.runtime.lastError) {
        console.error("chrome.tabs.query error:", chrome.runtime.lastError);
        sendResponse({ status: "error", error: chrome.runtime.lastError.message });
        releaseKeepAlivePort();
        auditLaunching = false;
        return true;
      }
      if (tabs?.length > 0) {
        console.log("[Entrata Audit][START_AUDIT] Found existing Entrata tab(s):", tabs.map(t => t.id));
        entrataTab = tabs[0];
        try {
          console.log("[Entrata Audit][START_AUDIT] Updating and activating tabId:", entrataTab.id);
          await chrome.tabs.update(entrataTab.id, { active: true });
          if (chrome.runtime.lastError) {
            console.error("chrome.tabs.update error:", chrome.runtime.lastError);
            sendResponse({ status: "error", error: chrome.runtime.lastError.message });
            releaseKeepAlivePort();
            return true;
          }
          chrome.tabs.sendMessage(entrataTab.id, {
            type: "START_AUDIT",
            action: "START_AUDIT",
            spreadsheetUrl,
            auditType,
          }, (_response) => {
            if (chrome.runtime.lastError) {
              console.error("chrome.tabs.sendMessage error:", chrome.runtime.lastError);
            }
            releaseKeepAlivePort();
          });
          auditState.entrataTabId = entrataTab.id;
          sendResponse({ status: "launched", tabId: entrataTab.id });
          return true;
        } catch (err) {
          console.error("Exception in updating tab or sending message:", err);
          sendResponse({ status: "error", error: err.message });
          releaseKeepAlivePort();
          return true;
        }
      } else {
        try {
          console.log("[Entrata Audit][START_AUDIT] No Entrata tab found. Creating new Entrata tab...");
          entrataTab = await chrome.tabs.create({ url: "https://preiss.entrata.com/?module=customers_systemxxx", active: true });
          if (chrome.runtime.lastError) {
            console.error("chrome.tabs.create error:", chrome.runtime.lastError);
            sendResponse({ status: "error", error: chrome.runtime.lastError.message });
            releaseKeepAlivePort();
            return true;
          }
          auditState.entrataTabId = entrataTab.id;
          console.log("[Entrata Audit][START_AUDIT] Created Entrata tab with id:", entrataTab.id);
          // Add detailed logging for lifecycle and tab loading
          console.log("[Entrata Audit] onUpdated listener added for tabId:", entrataTab.id);
          const onUpdated = (tabId, info) => {
            console.log(`[Entrata Audit] onUpdated triggered for tabId: ${tabId}, status: ${info.status}`);
            if (tabId === entrataTab.id && info.status === "complete") {
              chrome.tabs.onUpdated.removeListener(onUpdated);
              console.log(`[Entrata Audit][DEBUG] onUpdated listener removed for tabId: ${tabId}`);
              // Wait for handshake (contentReady)
              const waitForReady = (retries = 20) => {
                if (readyTabs.has(entrataTab.id)) {
                  console.log(`[Entrata Audit][DEBUG] Entrata tab is ready. Sending START_AUDIT to tabId: ${entrataTab.id}`);
                  chrome.tabs.sendMessage(entrataTab.id, {
                    type: "START_AUDIT",
                    action: "START_AUDIT",
                    spreadsheetUrl,
                    auditType,
                  }, (_response) => {
                    if (chrome.runtime.lastError) {
                      console.error("chrome.tabs.sendMessage (new tab) error:", chrome.runtime.lastError);
                    }
                    releaseKeepAlivePort();
                  });
                } else if (retries > 0) {
                  console.log(`[Entrata Audit][DEBUG] Waiting for handshake from tabId: ${entrataTab.id}. Retries left: ${retries}`);
                  setTimeout(() => waitForReady(retries - 1), 200);
                } else {
                  chrome.tabs.get(entrataTab.id, (tab) => {
                    const url = tab?.url || "unknown";
                    console.error(`[Entrata Audit][ERROR] Timeout waiting for content script handshake in tab ${entrataTab.id} (URL: ${url})`);
                  });
                  releaseKeepAlivePort();
                }
              };
              waitForReady();
            }
          };
          chrome.tabs.onUpdated.addListener(onUpdated);
          sendResponse({ status: "launched", tabId: entrataTab.id });
          return true;
        } catch (err) {
          console.error("Exception in creating tab or setting up listener:", err);
          sendResponse({ status: "error", error: err.message });
          releaseKeepAlivePort();
          return true;
        }
      }
    } catch (err) {
      console.error("Exception in tabs query:", err);
      sendResponse({ status: "error", error: err.message });
      releaseKeepAlivePort();
      return true;
    }
  }

  // Gracefully handle duplicate START_AUDIT messages
  if (message.type === "START_AUDIT" && auditLaunching) {
    sendResponse({ status: "already_launching" });
    return true;
  }

  if (message.type === "auditStatus") {
    // Handle audit progress/status updates from content script
    console.log(`[Entrata Audit][BACKGROUND][auditStatus] Status: ${message.status}, Progress: ${message.progress}, Message: ${message.message}`);
    // Optionally, update UI or state here
    sendResponse({ status: "ok" });
    return true;
  }

  if (message.type === "stopAudit") {
    // Implement stop logic if needed
    sendResponse({ status: "stopped" });
    return true;
  }

  if (message.type === "skipRecord") {
    // Implement skip logic if needed
    sendResponse({ status: "skipped" });
    return true;
  }

  if (message.type === "getAuditState") {
    // Return the current audit state
    sendResponse({ status: "ok", state: auditState });
    return true;
  }

  // Fallback for unknown message types
  console.warn("[Entrata Audit][BACKGROUND] Unknown message type:", message);
  sendResponse({ status: "error", error: "Unknown message type" });
  return true;
});
