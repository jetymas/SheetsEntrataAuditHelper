// Background worker - minimal wrapper to load background.js
// This is needed because service workers require imports to be properly resolved
// and Chrome extension service workers have specific constraints

// Global variable to track if background.js has been loaded
let backgroundLoaded = false;

// Set up a message queue for messages received before background.js loads
const messageQueue = [];

// Import all modules dynamically
const importBackgroundJS = async () => {
  try {
    console.log("Background worker starting...");

    // Import main background.js with absolute path to ensure proper loading
    // Chrome extension imports need to be relative to the extension root
    await import("/src/js/background.js");

    console.log("Background modules loaded successfully");
    backgroundLoaded = true;

    // Process any queued messages
    processQueuedMessages();
  } catch (error) {
    console.error("Error loading background modules:", error);
    console.error("Stack trace:", error.stack);

    // Try again with relative path as fallback
    try {
      console.log("Trying fallback import path...");
      await import("./background.js");
      console.log("Fallback import successful");
      backgroundLoaded = true;
      processQueuedMessages();
    } catch (fallbackError) {
      console.error("Fallback import also failed:", fallbackError);
      console.error("Stack trace:", fallbackError.stack);
    }
  }
};

// Process any messages that were queued while background.js was loading
function processQueuedMessages() {
  console.log(`Processing ${messageQueue.length} queued messages`);
  while (messageQueue.length > 0) {
    const { message, sender: _sender, sendResponse } = messageQueue.shift();
    // Re-dispatch the message through the regular chrome.runtime.onMessage listeners
    // This will be caught by the handler in background.js
    try {
      console.log("Reprocessing queued message:", message.action);
      // This approach directly calls any listeners registered with chrome.runtime.onMessage
      chrome.runtime.sendMessage(message, sendResponse);
    } catch (error) {
      console.error("Error processing queued message:", error);
      sendResponse({
        status: "error",
        error: "Failed to process queued message",
      });
    }
  }
}

// Execute the import
importBackgroundJS().catch((error) => {
  console.error("Fatal error in background worker:", error);
  console.error("Stack trace:", error.stack);
});

// Listen for install events
chrome.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed or updated:", details.reason);

  if (details.reason === "install") {
    console.log("This is a first install");
  } else if (details.reason === "update") {
    console.log("Updated from version", details.previousVersion);
  }
});

// Ensure service worker stays active
chrome.runtime.onStartup.addListener(() => {
  console.log("Browser started, extension waking up");
});

// Simple keepAlive ping - critical for keeping the service worker alive
setInterval(() => {
  // This is just to keep the service worker alive
  const timestamp = new Date().toISOString();
  console.log(`Background worker keepalive: ${timestamp}`);
}, 25000);

// Make sure we handle messages even before modules are loaded
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Log all messages for debugging
  console.log("Received message in background worker:", message.action);

  // Handle ping messages directly
  if (message.action === "ping") {
    sendResponse({
      status: "background_worker_alive",
      backgroundLoaded: backgroundLoaded,
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  // If background.js is still loading, queue messages for later processing
  if (!backgroundLoaded) {
    console.log(
      `Background.js not loaded yet, queuing message: ${message.action}`,
    );

    // For certain critical messages, provide an immediate response
    if (message.action === "getAuditState" || message.action === "getStatus") {
      sendResponse({
        status: "loading",
        message:
          "Background script is still initializing, please try again in a moment",
      });
      return true;
    }

    // Queue the message for processing once background.js loads
    messageQueue.push({ message, sender, sendResponse });

    // Return true to keep the message channel open
    return true;
  }

  // If background.js is loaded, let it handle the message
  // We don't return true here because the main listener in background.js needs to handle it
  return false;
});
