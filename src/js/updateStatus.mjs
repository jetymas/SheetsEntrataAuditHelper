// Helper to send status updates to the popup
/**
 * Send an audit status update to the popup UI.
 * @param {string} message - Main status message.
 * @param {number|null} [progress=null] - Progress percentage (0–100).
 * @param {string} [status="in_progress"] - Audit status: "in_progress", "complete", "error", "stopped".
 * @param {object} [details={}] - Additional details.
 * @param {string|null} details.currentRecord - Current record identifier.
 * @param {string|null} details.currentField - Current field name.
 * @param {string|null} details.error - Error message, if any.
 */
function updateStatus(
  message,
  progress = null,
  status = "in_progress",
  details = {},
) {
  chrome.runtime.sendMessage({
    type: "auditStatus",
    message: message,
    progress: progress,
    status: status,
    currentRecord: details.currentRecord || null,
    currentField: details.currentField || null,
    error: details.error || null,
  });
}

// Default export for runtime usage
export default updateStatus;
// Named export for Jest
export { updateStatus };
