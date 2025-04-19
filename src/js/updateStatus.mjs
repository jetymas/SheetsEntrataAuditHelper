// Helper to send status updates to the popup
function updateStatus(message, progress = null, status = 'in_progress', details = {}) {
    chrome.runtime.sendMessage({
      type: 'auditStatus',
      message: message,
      progress: progress,
      status: status,
      currentRecord: details.currentRecord || null,
      currentField: details.currentField || null,
      error: details.error || null
    });
  }
  
  // Default export for runtime usage
  export default updateStatus;
  // Named export for Jest
  export { updateStatus };
  