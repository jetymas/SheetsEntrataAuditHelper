// background-shared.mjs
// Shared logic and state for background scripts

// Example shared state (adjust as needed for your actual state)
export const auditState = {
  status: "idle",
  progress: 0,
  auditEngine: null,
  entrataTabId: null,
  currentRecordName: null,
  currentFieldName: null,
  lastError: null,
  // ...any other shared properties
};

// Example startAudit function (move your real logic here)
export function startAudit(_spreadsheetId, _auditType) {
  auditState.status = "in_progress";
  auditState.progress = 0;
  // ...initialize auditEngine and other logic here
  // (Move the actual logic from background-controller.js or background.mjs here)
}

// Example getAuditState function
export function getAuditState() {
  return auditState;
}
