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
import { verifyField } from "./field-verification.js";

// Install global error listener to ignore cross-origin iframe load errors
window.addEventListener("error", (e) => {
  if (e.message?.includes("Could not load iframe")) {
    e.preventDefault();
  }
});

// Message handlers: delegate to field-verification and ping
const messageHandlers = {
  async verifyField(message) {
    return verifyField(
      message.column,
      message.module,
      message.expectedValue,
      message.sheetColumn
    );
  },
  ping(message, _sender, sendResponse) {
    console.log("Ping received from background script");
    sendResponse({ status: "alive" });
  }
};

registerContentMessaging(messageHandlers);
