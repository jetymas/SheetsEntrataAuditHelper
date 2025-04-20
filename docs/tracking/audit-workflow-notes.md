# Entrata Lease Audit Assistant: Audit Workflow Documentation

## End-to-End Workflow (Popup-Driven)

1. **User Initiates Audit**
    - User clicks the "Start Audit" button in the popup UI (`popup.mjs`).
    - The handler gathers the selected audit type and spreadsheet ID.
    - Sends a message to the background script (`chrome.runtime.sendMessage`) for audit start.
    - Also calls `processAuditFlow()` locally for UI simulation.

2. **Audit Logic & Orchestration**
    - The main audit orchestration is handled in the popup and `AuditController` (not the background script).
    - `AuditController.start` manages fetching sheet data, instantiating the audit engine, and running the audit loop.
    - Audit engines (`LeaseAudit`, `RenewalAudit`, etc.) handle record iteration, tab management, and field verification.
    - Status updates are sent to the UI using `updateStatus`.

3. **Content Script Field Verification**
    - Modularized message handlers in `content-messaging.js` receive verification requests.
    - Field verification and business logic are handled in `field-verification.js`.
    - Results are sent back to the orchestrator.

4. **Status and Results Feedback**
    - Status updates are sent from the audit logic to the popup UI via `updateStatus` and `updateStatusUI`.
    - The user receives real-time feedback on progress, errors, and completion.

5. **Audit Completion or Stop**
    - When all records are processed, or the user clicks "Stop Audit", the audit state is reset and the UI is updated.

## Deprecated Logic
- `_runAudit()` in `background.mjs` has been removed. The audit process is now fully managed by the popup and `AuditController`.

---

# Method Inventory (Major Methods by File)

| File                            | Methods/Responsibilities                                                                 |
|----------------------------------|-----------------------------------------------------------------------------------------|
| popup.mjs                       | initPopup, processAuditFlow, UI event handlers, chrome.runtime.sendMessage              |
| background.mjs                  | processField                                                                            |
| AuditController.mjs             | start, stop, getState                                                                   |
| audit-types/lease-audit.mjs     | setUp, findNext, nextField                                                              |
| audit-types/renewal-audit.mjs   | setUp, findNext, nextField                                                              |
| content-messaging.js            | registerContentMessaging (all content message handlers)                                  |
| field-verification.js           | Field verification logic                                                                |
| updateStatus.mjs                | updateStatus (background → popup UI status updates)                                     |
| popup-ui.js                     | updateStatusUI, showError, hideError, showVerificationDialog (UI updates)               |

---

# Notes
- The workflow is now robust, modular, and easy to maintain.
- See `TODO.md` for remaining tasks and future improvements.
